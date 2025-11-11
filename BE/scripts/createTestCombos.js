/**
 * Script to create combos for testing payment
 * Usage: node scripts/createTestCombos.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Combo from '../models/comboModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const createTestCombos = async () => {
  try {
    console.log('\n🍿 Creating simple combos...\n');

    // ✅ Tạo 7 combo bỏng nước đa dạng với ảnh từ Unsplash
    const combos = [
      {
        name: '2 Popcorn',
        description: '2 bắp rang lớn cho 2 người',
        price: 80000,
        category: 'popcorn',
        image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80',
        items: [
          { name: 'Bắp rang lớn', quantity: 2 }
        ],
        isActive: true,
      },
      {
        name: 'Pepsi 500mL',
        description: 'Pepsi 500ml',
        price: 25000,
        category: 'drinks',
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80',
        items: [
          { name: 'Pepsi 500mL', quantity: 1 }
        ],
        isActive: true,
      },
      {
        name: 'Combo Đôi',
        description: '1 bắp rang lớn + 2 nước ngọt',
        price: 95000,
        category: 'combo',
        image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80',
        items: [
          { name: 'Bắp rang lớn', quantity: 1 },
          { name: 'Nước ngọt', quantity: 2 }
        ],
        isActive: true,
      },
      {
        name: 'Combo Gia Đình',
        description: '2 bắp rang lớn + 2 nước ngọt + 1 snack',
        price: 150000,
        category: 'combo',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80',
        items: [
          { name: 'Bắp rang lớn', quantity: 2 },
          { name: 'Nước ngọt', quantity: 2 },
          { name: 'Snack', quantity: 1 }
        ],
        isActive: true,
      },
      {
        name: 'Bắp Rang Bơ Nhỏ',
        description: '1 bắp rang bơ nhỏ',
        price: 45000,
        category: 'popcorn',
        image: 'https://images.unsplash.com/photo-1532939624-3af1308db9b5?w=800&q=80',
        items: [
          { name: 'Bắp rang bơ nhỏ', quantity: 1 }
        ],
        isActive: true,
      },
      {
        name: 'Coca Cola 500mL',
        description: 'Coca Cola 500ml',
        price: 25000,
        category: 'drinks',
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80',
        items: [
          { name: 'Coca Cola 500mL', quantity: 1 }
        ],
        isActive: true,
      },
      {
        name: 'Combo Nhỏ',
        description: '1 bắp rang nhỏ + 1 nước ngọt',
        price: 60000,
        category: 'combo',
        image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80',
        items: [
          { name: 'Bắp rang nhỏ', quantity: 1 },
          { name: 'Nước ngọt', quantity: 1 }
        ],
        isActive: true,
      },
    ];

    // ✅ Xóa tất cả combo cũ để tạo lại từ đầu
    console.log('🗑️  Deleting existing combos...');
    const deleteResult = await Combo.deleteMany({});
    console.log(`   ✅ Deleted ${deleteResult.deletedCount} existing combos`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const comboData of combos) {
      // Check if combo already exists
      const existing = await Combo.findOne({ name: comboData.name });
      
      if (existing) {
        console.log(`⏭️  Skipped: ${comboData.name} (already exists)`);
        skippedCount++;
        continue;
      }

      const combo = await Combo.create(comboData);
      console.log(`✅ Created: ${combo.name} - ${combo.price.toLocaleString('vi-VN')} VND`);
      createdCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${createdCount} combos`);
    console.log(`   ⏭️  Skipped: ${skippedCount} combos (already exist)`);
    console.log('\n💰 Combo prices:');
    combos.forEach(combo => {
      console.log(`   - ${combo.name}: ${combo.price.toLocaleString('vi-VN')}₫`);
    });
    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error creating combos:', error);
  }
};

// Main execution
(async () => {
  await connectDB();
  await createTestCombos();
  await mongoose.connection.close();
  process.exit(0);
})();

