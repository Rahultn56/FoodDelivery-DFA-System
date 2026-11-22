import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDatabase } from './db.js';
import { seedData } from './seed.js';
import { setupSocketIO } from './socket.js';

const port = Number(process.env.PORT || 4000);

async function startServer() {
  try {
    // 1. Connect database (uses MONGODB_URI or in-memory fallback automatically)
    await connectDatabase();

    // 2. Auto-seed initial admin and menu items if needed
    try {
      await seedData();
    } catch (seedErr) {
      console.warn('⚠️ [Server] Auto-seed warning:', seedErr.message);
    }

    // 3. Create HTTP server & wrap with Socket.io
    const httpServer = http.createServer(app);
    setupSocketIO(httpServer);

    // 4. Listen on TCP port
    httpServer.listen(port, () => {
      console.log(`================================================================`);
      console.log(`🚀 Online Food Delivery Tracking System (DFA Engine)`);
      console.log(`📡 CN Layer: Express HTTP REST & Socket.io WebSocket on port ${port}`);
      console.log(`🔗 API Base: http://localhost:${port}/api`);
      console.log(`🩺 Health:   http://localhost:${port}/api/health`);
      console.log(`⚙️ FLAT DFA: http://localhost:${port}/api/dfa/info`);
      console.log(`================================================================`);
    });
  } catch (error) {
    console.error('❌ Fatal server startup error:', error.message);
    process.exit(1);
  }
}

startServer();
