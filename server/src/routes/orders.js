import { Router } from 'express';
import Order from '../models/Order.js';
import FoodItem from '../models/FoodItem.js';
import { STATES, STATE_DESCRIPTIONS, transition, getValidActions, isFinalState } from '../dfa/orderDfa.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { broadcastNewOrder, broadcastOrderUpdate } from '../socket.js';

const router = Router();
router.use(authenticate);

/**
 * POST /api/orders
 * Places a new customer order.
 * Strictly initializes order in DFA state S0 (Order Created).
 */
router.post('/', async (req, res, next) => {
  try {
    const { items: requested, deliveryAddress, customerPhone, paymentMethod } = req.body;
    if (!Array.isArray(requested) || requested.length === 0) {
      return res.status(400).json({ message: 'Add at least one food item before placing your order.' });
    }

    const ids = [...new Set(requested.map((line) => line.foodId))];
    const foods = await FoodItem.find({ _id: { $in: ids }, availability: true });
    if (foods.length !== ids.length) {
      return res.status(400).json({ message: 'One or more selected items are currently unavailable. Please refresh the menu.' });
    }

    const byId = new Map(foods.map((food) => [food._id.toString(), food]));
    const items = requested.map((line) => {
      const food = byId.get(String(line.foodId));
      const quantity = Number(line.quantity);
      if (!food || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        throw Object.assign(new Error('Each item quantity must be a whole number between 1 and 50.'), { status: 400 });
      }
      return {
        foodId: food._id,
        name: food.name,
        price: food.price,
        quantity,
        image: food.image
      };
    });

    const totalAmount = Number(items.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2));

    const initialHistory = [{
      state: 'S0',
      action: 'created',
      label: STATES.S0,
      actor: req.user.name,
      actorRole: req.user.role,
      timestamp: new Date(),
      notes: 'Order created in initial state S0 by customer. Awaiting kitchen confirmation.'
    }];

    const order = await Order.create({
      userId: req.user._id,
      items,
      totalAmount,
      deliveryAddress: deliveryAddress?.trim() || req.user.address || '42 Baker Street, Apt 3B',
      customerPhone: customerPhone?.trim() || req.user.phone || '+91 98765 43210',
      paymentMethod: paymentMethod || 'Cash on Delivery (Demo)',
      currentState: 'S0',
      orderHistory: initialHistory
    });

    // Notify connected admin staff via WebSocket
    broadcastNewOrder(order);

    res.status(201).json({
      order,
      dfaState: {
        currentState: 'S0',
        label: STATES.S0,
        allowedActions: getValidActions('S0')
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/mine
 * List caller's past orders
 */
router.get('/mine', async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders
 * Admin: List all orders with optional state filter
 */
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const query = {};
    if (req.query.state && req.query.state !== 'ALL') {
      query.currentState = req.query.state;
    }
    const orders = await Order.find(query).populate('userId', 'name email phone').sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:id
 * Retrieve single order with DFA state context and valid next transitions
 */
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email phone address');
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (req.user.role !== 'admin' && order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view your own orders.' });
    }

    const validActions = getValidActions(order.currentState);
    const isTerminal = isFinalState(order.currentState);

    res.json({
      order,
      dfaContext: {
        currentState: order.currentState,
        label: STATES[order.currentState],
        description: STATE_DESCRIPTIONS[order.currentState],
        isTerminal,
        validNextActions: validActions
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/orders/:id/transition
 * Executes a DFA state transition on an order.
 * Validates transition using the FLAT DFA module.
 * Returns HTTP 422 with mathematical proof if transition is rejected.
 */
router.patch('/:id/transition', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // Authorization checks
    const isOwner = order.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied: You cannot alter this order.' });
    }

    // Customer can only request 'cancel', and only while order is unfulfilled (S0 or S1)
    if (!isAdmin) {
      if (req.body.action !== 'cancel') {
        return res.status(403).json({
          message: 'Customers can only cancel orders. Kitchen progression actions require restaurant staff privileges.'
        });
      }
      if (!['S0', 'S1'].includes(order.currentState)) {
        return res.status(422).json({
          message: `Cannot cancel order in state ${order.currentState} (${STATES[order.currentState]}). Cancellation is only permitted in S0 or S1 before food preparation starts.`,
          currentState: order.currentState,
          allowedActions: []
        });
      }
    }

    const { action, notes } = req.body;
    if (!action) {
      return res.status(400).json({ message: 'Missing "action" parameter in transition request body.' });
    }

    // Execute DFA Validation
    const dfaResult = transition(order.currentState, action);

    if (!dfaResult.valid) {
      return res.status(422).json({
        message: dfaResult.error,
        currentState: order.currentState,
        currentLabel: STATES[order.currentState],
        attemptedAction: action,
        allowedActions: dfaResult.allowedActions,
        formalExplanation: dfaResult.formalExplanation
      });
    }

    // Valid transition: mutate state and append to order history
    const previousState = order.currentState;
    order.currentState = dfaResult.nextState;

    order.orderHistory.push({
      state: dfaResult.nextState,
      action,
      label: dfaResult.label,
      actor: req.user.name,
      actorRole: req.user.role,
      timestamp: new Date(),
      notes: notes || dfaResult.description || `Transitioned from ${previousState} to ${dfaResult.nextState} via ${action}`
    });

    await order.save();

    // Broadcast live WebSocket update
    broadcastOrderUpdate(order, action);

    res.json({
      success: true,
      order,
      dfaTransition: {
        fromState: previousState,
        action,
        toState: dfaResult.nextState,
        label: dfaResult.label,
        formalExplanation: dfaResult.formalExplanation,
        isFinal: dfaResult.isFinal
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
