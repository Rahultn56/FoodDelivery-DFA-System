import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let memoryServerInstance = null;

/**
 * Connect to MongoDB with automatic fallback to MongoMemoryServer
 * Ensures application runs 100% out-of-the-box in any academic or evaluation environment.
 */
export async function connectDatabase() {
  const configuredUri = process.env.MONGODB_URI;

  if (configuredUri) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${configuredUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);
      await mongoose.connect(configuredUri, {
        serverSelectionTimeoutMS: 2500, // Quick timeout if local mongod is not running
        connectTimeoutMS: 3000
      });
      console.log('✅ [Database] Connected successfully to configured MongoDB instance.');
      return mongoose.connection;
    } catch (err) {
      console.warn(`⚠️ [Database] Could not connect to configured MongoDB (${err.message}).`);
      console.log('🔄 [Database] Starting In-Memory MongoDB Server fallback...');
    }
  }

  // Fallback to In-Memory MongoDB Server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
    const memoryUri = memoryServerInstance.getUri();
    console.log(`[Database] In-Memory MongoDB started at: ${memoryUri}`);
    await mongoose.connect(memoryUri);
    console.log('✅ [Database] Connected successfully to In-Memory MongoDB server.');
    return mongoose.connection;
  } catch (memErr) {
    console.error('❌ [Database] Failed to start in-memory database:', memErr.message);
    throw memErr;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
}
