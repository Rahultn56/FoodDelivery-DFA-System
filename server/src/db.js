import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let memoryServerInstance = null;

/**
 * Connect to MongoDB with automatic fallback to MongoMemoryServer
 * Ensures application runs 100% out-of-the-box in any academic or evaluation environment.
 */
export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const configuredUri = process.env.MONGODB_URI;

  if (configuredUri) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${configuredUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);
      await mongoose.connect(configuredUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      console.log('✅ [Database] Connected successfully to configured MongoDB instance.');
      return mongoose.connection;
    } catch (err) {
      console.warn(`⚠️ [Database] Could not connect to configured MongoDB (${err.message}).`);
      console.log('🔄 [Database] Attempting fallback...');
    }
  }

  // If in Vercel or cloud serverless, do not attempt MongoMemoryServer binary
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.warn('⚠️ [Database] Running on Vercel Serverless without external MONGODB_URI.');
    console.warn('⚠️ Set MONGODB_URI in Vercel Project Settings for full cloud database persistence.');
    return null;
  }

  // Fallback to In-Memory MongoDB Server for local evaluation
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
    return null;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
}
