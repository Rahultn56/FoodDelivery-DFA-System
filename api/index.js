import app from '../backend/src/app.js';
import { connectDatabase } from '../backend/src/db.js';
import { seedData } from '../backend/src/seed.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  // Normalize URL prefix if stripped by Vercel rewrite
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/favicon')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  // Attempt database connection and initial seeding if MONGODB_URI is provided
  if (!isDbInitialized) {
    try {
      const conn = await connectDatabase();
      if (conn && conn.readyState === 1) {
        await seedData();
      }
    } catch (err) {
      console.warn('[Vercel Handler] Initial DB connection notice:', err.message);
    }
    isDbInitialized = true;
  }

  return app(req, res);
}
