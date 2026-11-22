import { Router } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const publicUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  address: user.address,
  phone: user.phone
});

const tokenFor = (user) => {
  const secret = process.env.JWT_SECRET || 'online-food-delivery-tracking-dfa-secret-key-2026';
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, name: user.name, email: user.email },
    secret,
    { expiresIn: '7d' }
  );
};

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, address, phone } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    if (mongoose.connection.readyState !== 1) {
      const demoUser = {
        _id: 'user-' + Date.now(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'customer',
        address: address?.trim() || '42 Baker Street, Apt 3B',
        phone: phone?.trim() || '+91 98765 43210'
      };
      return res.status(201).json({ token: tokenFor(demoUser), user: demoUser });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'customer',
      address: address?.trim() || '42 Baker Street, Apt 3B',
      phone: phone?.trim() || '+91 98765 43210'
    });

    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Support fallback for serverless preview when DB is not yet connected
    if (mongoose.connection.readyState !== 1) {
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@dfafood.com').toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      const customerEmail = (process.env.DEMO_CUSTOMER_EMAIL || 'customer@dfafood.com').toLowerCase();
      const customerPassword = process.env.DEMO_CUSTOMER_PASSWORD || 'Customer@123';

      if (cleanEmail === adminEmail && password === adminPassword) {
        const adminUser = {
          _id: 'admin-001',
          name: process.env.ADMIN_NAME || 'Restaurant Admin',
          email: adminEmail,
          role: 'admin',
          address: 'Central Restaurant Kitchen, Suite 101, Tech Park',
          phone: '+91 98765 00000'
        };
        return res.json({ token: tokenFor(adminUser), user: adminUser });
      }

      if (cleanEmail === customerEmail && password === customerPassword) {
        const custUser = {
          _id: 'cust-001',
          name: 'Alex Morgan',
          email: customerEmail,
          role: 'customer',
          address: '42 Baker Street, Apt 3B, Cyber City',
          phone: '+91 98765 43210'
        };
        return res.json({ token: tokenFor(custUser), user: custUser });
      }

      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.get('/demo-credentials', (req, res) => {
  res.json({
    admin: {
      email: process.env.ADMIN_EMAIL || 'admin@dfafood.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      label: 'Restaurant Kitchen Admin'
    },
    customer: {
      email: process.env.DEMO_CUSTOMER_EMAIL || 'customer@dfafood.com',
      password: process.env.DEMO_CUSTOMER_PASSWORD || 'Customer@123',
      role: 'customer',
      label: 'Standard Customer'
    }
  });
});

export default router;
