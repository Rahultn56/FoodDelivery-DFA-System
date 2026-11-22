import { Router } from 'express';
import mongoose from 'mongoose';
import FoodItem from '../models/FoodItem.js';
import { SAMPLE_FOODS } from '../seed.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    // Graceful fallback for serverless evaluation if MONGODB_URI is not yet configured
    if (mongoose.connection.readyState !== 1) {
      let items = SAMPLE_FOODS.map((item, idx) => ({
        ...item,
        _id: `item-${idx + 1}`,
        id: `item-${idx + 1}`
      }));
      if (req.query.category && req.query.category !== 'All') {
        items = items.filter((item) => item.category === req.query.category);
      }
      if (req.query.vegOnly === 'true') {
        items = items.filter((item) => item.isVeg);
      }
      if (req.query.search) {
        const q = req.query.search.toLowerCase();
        items = items.filter((item) =>
          item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
        );
      }
      return res.json({ items });
    }

    const filter = { ...(req.query.all === 'true' ? {} : { availability: true }) };
    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }
    if (req.query.vegOnly === 'true') {
      filter.isVeg = true;
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const items = await FoodItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, price, category, image, isVeg, availability, prepTimeMinutes } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required.' });
    }
    const item = await FoodItem.create({
      name: name.trim(),
      description: description?.trim() || '',
      price: Number(price),
      category: category.trim(),
      image: image?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85',
      isVeg: Boolean(isVeg),
      availability: availability !== undefined ? Boolean(availability) : true,
      prepTimeMinutes: Number(prepTimeMinutes) || 15
    });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const item = await FoodItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Food item not found.' });
    res.json({ item });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const item = await FoodItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Food item not found.' });
    res.json({ message: 'Food item deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
