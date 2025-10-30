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
    console.log('\n🍿 Creating test combos for payment testing...\n');

    // ✅ Giảm số combo xuống chỉ còn 4 combo phổ biến
    const combos = [
      {
        name: 'Combo Nhỏ',
        description: '1 bắp rang bơ nhỏ + 1 nước ngọt nhỏ',
        price: 50000,
        category: 'combo',
        items: [
          { name: 'Bắp rang bơ nhỏ', quantity: 1 },
          { name: 'Nước ngọt nhỏ', quantity: 1 }
        ],
        isActive: true,
      },
      {
        name: 'Combo Vừa',
        description: '1 bắp rang bơ vừa + 1 nước ngọt vừa',
        price: 80000,
        category: 'combo',
        items: [
          { name: 'Bắp rang bơ vừa', quantity: 1 },
          { name: 'Nước ngọt vừa', quantity: 1 }
        ],
        isActive: true,
      },
      {
        name: 'Combo Lớn',
        description: '1 bắp rang bơ lớn + 1 nước ngọt lớn',
        price: 120000,
        category: 'combo',
        items: [
          { name: 'Bắp rang bơ lớn', quantity: 1 },
          { name: 'Nước ngọt lớn', quantity: 1 }
        ],
        isActive: true,
      },
      {
        name: 'Combo Đôi',
        description: '1 bắp lớn + 2 nước ngọt lớn',
        price: 150000,
        category: 'combo',
        items: [
          { name: 'Bắp rang bơ lớn', quantity: 1 },
          { name: 'Nước ngọt lớn', quantity: 2 }
        ],
        isActive: true,
      },
    ];

    // Delete existing test combos (optional - comment out if you want to keep existing ones)
    // await Combo.deleteMany({ name: { $regex: /^(Combo|Bắp|Nước|Snack)/ } });

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
    console.log('\n💰 Price ranges for testing:');
    console.log('   - Low: 40,000 - 60,000 VND (single items)');
    console.log('   - Medium: 80,000 - 150,000 VND (small combos)');
    console.log('   - High: 250,000+ VND (family combos)');
    console.log('\n🎯 Test scenarios:');
    console.log('   1. Single seat (50,000) + Combo 1 (50,000) = 100,000 VND');
    console.log('   2. 2 seats (100,000) + Combo 2 (80,000) = 180,000 VND');
    console.log('   3. 3 seats (150,000) + Combo 3 (120,000) = 270,000 VND');
    console.log('   4. 4 seats (200,000) + Combo 4 (250,000) = 450,000 VND');
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

