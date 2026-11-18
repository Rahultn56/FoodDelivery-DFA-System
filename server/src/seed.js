import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import FoodItem from './models/FoodItem.js';
import { connectDatabase, disconnectDatabase } from './db.js';

export const SAMPLE_FOODS = [
  {
    name: 'Smash House Double Burger',
    description: 'Double seared patties, aged cheddar cheese, crunchy pickles, caramelized onions, and secret house paprika mayo.',
    price: 289,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
    isVeg: false,
    rating: 4.9,
    prepTimeMinutes: 15,
    availability: true
  },
  {
    name: 'Truffle Mushroom & Swiss Burger',
    description: 'Crisp plant patty with sauteed garlic wild mushrooms, melted Swiss cheese, baby arugula, and black truffle aioli.',
    price: 299,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85',
    isVeg: true,
    rating: 4.8,
    prepTimeMinutes: 15,
    availability: true
  },
  {
    name: 'Classic Margherita Basil Pizza',
    description: 'San Marzano tomato sauce, fresh artisan mozzarella, fresh Genovese basil leaves, and a drizzle of extra virgin olive oil.',
    price: 349,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85',
    isVeg: true,
    rating: 4.9,
    prepTimeMinutes: 20,
    availability: true
  },
  {
    name: 'Spicy Pepperoni Rustica Pizza',
    description: 'Stone-baked thin crust topped with savory pepperoni slices, hot honey glaze, chili flakes, and whole milk mozzarella.',
    price: 399,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=85',
    isVeg: false,
    rating: 4.9,
    prepTimeMinutes: 20,
    availability: true
  },
  {
    name: 'Truffle Parmesan Fettuccine',
    description: 'Handcrafted silky pasta strands tossed in slow-cooked creamy parmesan cream, wild mushrooms, and shaved Italian truffle.',
    price: 379,
    category: 'Pasta',
    image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85',
    isVeg: true,
    rating: 4.7,
    prepTimeMinutes: 18,
    availability: true
  },
  {
    name: 'Smoked Chicken Alfredo Penne',
    description: 'Flame-grilled smoked chicken strips, penne pasta tossed in rich garlic parmesan sauce with cracked black pepper.',
    price: 389,
    category: 'Pasta',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=900&q=85',
    isVeg: false,
    rating: 4.8,
    prepTimeMinutes: 18,
    availability: true
  },
  {
    name: 'Teriyaki Crispy Chicken Bowl',
    description: 'Crisp chicken bites glazed in sweet teriyaki sauce served over jasmine rice, edamame, shaved carrots, and sesame greens.',
    price: 329,
    category: 'Bowls',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85',
    isVeg: false,
    rating: 4.8,
    prepTimeMinutes: 15,
    availability: true
  },
  {
    name: 'Avocado Quinoa Fiesta Bowl',
    description: 'Nutrient-rich organic quinoa, sliced Hass avocado, charred corn salsa, black beans, pico de gallo, and zesty cilantro lime crema.',
    price: 309,
    category: 'Bowls',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85',
    isVeg: true,
    rating: 4.9,
    prepTimeMinutes: 12,
    availability: true
  },
  {
    name: 'Loaded Peri-Peri Fries',
    description: 'Golden double-fried hand-cut potatoes tossed in spicy African peri-peri seasoning and drizzled with warm cheese sauce.',
    price: 149,
    category: 'Sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85',
    isVeg: true,
    rating: 4.7,
    prepTimeMinutes: 10,
    availability: true
  },
  {
    name: 'Garlic Parmesan Cheesy Knots',
    description: 'Oven-fresh hand-tied dough knots brushed with roasted garlic herb butter, grated parmesan, and warm marinara dip.',
    price: 169,
    category: 'Sides',
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=85',
    isVeg: true,
    rating: 4.8,
    prepTimeMinutes: 12,
    availability: true
  },
  {
    name: 'New York Berry Cheesecake',
    description: 'Classic dense and velvety baked New York style cheesecake topped with fresh wild strawberry and blueberry compote.',
    price: 199,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=85',
    isVeg: true,
    rating: 4.9,
    prepTimeMinutes: 5,
    availability: true
  },
  {
    name: 'Belgian Dark Chocolate Lava Cake',
    description: 'Warm individual Belgian chocolate cake with a molten chocolate center, served with a dusting of powdered sugar.',
    price: 219,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85',
    isVeg: true,
    rating: 4.9,
    prepTimeMinutes: 8,
    availability: true
  }
];

export async function seedData() {
  console.log('🌱 [Seeder] Checking database contents...');

  // 1. Seed / verify Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dfafood.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Restaurant Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      address: 'Central Restaurant Kitchen, Suite 101, Tech Park'
    });
    console.log(`✅ [Seeder] Created default Admin account: ${adminEmail}`);
  } else {
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
    }
    console.log(`ℹ️ [Seeder] Verified Admin account: ${adminEmail}`);
  }

  // 2. Seed / verify Customer User
  const customerEmail = process.env.DEMO_CUSTOMER_EMAIL || 'customer@dfafood.com';
  const customerPassword = process.env.DEMO_CUSTOMER_PASSWORD || 'Customer@123';
  let customer = await User.findOne({ email: customerEmail });
  if (!customer) {
    customer = await User.create({
      name: 'Alex Morgan',
      email: customerEmail,
      password: customerPassword,
      role: 'customer',
      address: '42 Baker Street, Apt 3B, Cyber City',
      phone: '+91 98765 43210'
    });
    console.log(`✅ [Seeder] Created demo Customer account: ${customerEmail}`);
  } else {
    console.log(`ℹ️ [Seeder] Verified Customer account: ${customerEmail}`);
  }

  // 3. Seed Food Items
  let insertedCount = 0;
  for (const item of SAMPLE_FOODS) {
    const existing = await FoodItem.findOne({ name: item.name });
    if (!existing) {
      await FoodItem.create(item);
      insertedCount++;
    }
  }

  if (insertedCount > 0) {
    console.log(`✅ [Seeder] Seeded ${insertedCount} new food items into the menu.`);
  } else {
    console.log('ℹ️ [Seeder] Menu items already present.');
  }

  const totalFoods = await FoodItem.countDocuments();
  console.log(`🎉 [Seeder] Database ready! Total food items on menu: ${totalFoods}`);
}

// Standalone execution check
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('seed.js')) {
  try {
    await connectDatabase();
    await seedData();
    await disconnectDatabase();
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Seed execution error:', error);
    process.exit(1);
  }
}
