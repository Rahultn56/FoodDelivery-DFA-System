import mongoose from 'mongoose';
import { STATES } from '../dfa/orderDfa.js';

const historySchema = new mongoose.Schema({
  state: { type: String, enum: Object.keys(STATES), required: true },
  action: { type: String, default: 'created' },
  label: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actor: { type: String, default: 'System' },
  actorRole: { type: String, default: 'system' },
  notes: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [{
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  deliveryAddress: { type: String, default: '42 Baker Street, Apt 3B' },
  customerPhone: { type: String, default: '+91 98765 43210' },
  paymentMethod: { type: String, default: 'Cash on Delivery (Demo)' },
  currentState: { type: String, enum: Object.keys(STATES), default: 'S0', required: true },
  orderHistory: { type: [historySchema], default: [] }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
