import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  category: { type: String, required: true, trim: true },
  availability: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: true },
  rating: { type: Number, default: 4.8 },
  prepTimeMinutes: { type: Number, default: 20 }
}, { timestamps: true });

export default mongoose.model('FoodItem', foodItemSchema);
