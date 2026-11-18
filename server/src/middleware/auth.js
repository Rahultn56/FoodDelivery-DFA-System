import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please sign in to continue.' });
    }

    const secret = process.env.JWT_SECRET || 'online-food-delivery-tracking-dfa-secret-key-2026';
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select('_id name email role address phone');
    if (!user) {
      return res.status(401).json({ message: 'Your account could not be found. Please sign in again.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired or invalid. Please sign in again.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      message: 'Restaurant admin privileges required. This action is restricted to restaurant staff.'
    });
  }
  next();
}
