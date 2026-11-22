import { Server as SocketIOServer } from 'socket.io';

let ioInstance = null;
let activeSocketCount = 0;
const networkMetrics = {
  totalHttpRequests: 0,
  totalWebSocketEvents: 0,
  connectedSockets: 0,
  serverStartTime: new Date()
};

export function setupSocketIO(httpServer, allowedOrigins = ['http://localhost:5173']) {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: false
    }
  });

  ioInstance.on('connection', (socket) => {
    activeSocketCount++;
    networkMetrics.connectedSockets = activeSocketCount;
    networkMetrics.totalWebSocketEvents++;

    console.log(`[CN:TCP/Socket] Client connected: ${socket.id} (Transport: ${socket.conn.transport.name}, Total: ${activeSocketCount})`);

    socket.emit('socket:connected', {
      socketId: socket.id,
      transport: socket.conn.transport.name,
      timestamp: new Date().toISOString(),
      message: 'Persistent full-duplex TCP WebSocket connection established.'
    });

    // Customer or admin joins an order room
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`[CN:Socket] Socket ${socket.id} subscribed to room "order:${orderId}"`);
    });

    // Admin joins the kitchen/dashboard room
    socket.on('join:admin', () => {
      socket.join('admin_orders');
      console.log(`[CN:Socket] Socket ${socket.id} subscribed to room "admin_orders"`);
    });

    socket.on('disconnect', (reason) => {
      activeSocketCount = Math.max(0, activeSocketCount - 1);
      networkMetrics.connectedSockets = activeSocketCount;
      console.log(`[CN:TCP/Socket] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

export function getNetworkMetrics() {
  return {
    ...networkMetrics,
    uptimeSeconds: Math.floor((Date.now() - networkMetrics.serverStartTime.getTime()) / 1000)
  };
}

export function incrementHttpRequestCount() {
  networkMetrics.totalHttpRequests++;
}

/**
 * Broadcast order updates to both the specific order room and the admin channel
 * @param {object} order Mongoose order document
 * @param {string} transitionAction Name of DFA action executed
 */
export function broadcastOrderUpdate(order, transitionAction = '') {
  if (!ioInstance) return;
  networkMetrics.totalWebSocketEvents++;

  const payload = {
    orderId: order._id,
    currentState: order.currentState,
    orderHistory: order.orderHistory,
    totalAmount: order.totalAmount,
    updatedAt: order.updatedAt,
    action: transitionAction,
    timestamp: new Date().toISOString()
  };

  // Emit to specific order subscriber room
  ioInstance.to(`order:${order._id}`).emit('order:state_changed', { order: payload });

  // Emit to admin dashboard
  ioInstance.to('admin_orders').emit('admin:order_updated', { order: payload });

  console.log(`[CN:WebSocket] Emitted "order:state_changed" for Order #${order._id.toString().slice(-6)} -> State: ${order.currentState}`);
}

/**
 * Broadcast new order placed to admin kitchen
 * @param {object} order
 */
export function broadcastNewOrder(order) {
  if (!ioInstance) return;
  networkMetrics.totalWebSocketEvents++;

  ioInstance.to('admin_orders').emit('admin:new_order', {
    orderId: order._id,
    userId: order.userId,
    items: order.items,
    totalAmount: order.totalAmount,
    currentState: order.currentState,
    createdAt: order.createdAt
  });

  console.log(`[CN:WebSocket] Emitted "admin:new_order" for Order #${order._id.toString().slice(-6)}`);
}
