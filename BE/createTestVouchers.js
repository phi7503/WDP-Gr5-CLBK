#!/usr/bin/env node

/**
 * Script to create test vouchers
 * Usage: node createTestVouchers.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import Voucher from './models/voucherModel.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestVouchers = async () => {
  try {
    console.log('🎫 Creating test vouchers...\n');
    
    // Xóa voucher cũ nếu có
    await Voucher.deleteMany({ code: { $in: ['WELCOME10', 'SAVE20K', 'MEGA50', 'VIP100K', 'FREESHIP'] } });
    
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    const vouchers = [
      {
        code: 'WELCOME10',
        description: 'Giảm 10% cho khách hàng mới - Áp dụng cho tất cả phim',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 0,
        maxDiscount: 50000, // Giảm tối đa 50k
        startDate: today,
        endDate: nextMonth,
        isActive: true,
        applicableMovies: [],
        applicableBranches: [],
      },
      {
        code: 'SAVE20K',
        description: 'Giảm 20,000đ cho đơn hàng từ 100,000đ',
        discountType: 'fixed',
        discountValue: 20000,
        minPurchase: 100000,
        maxDiscount: 0,
        startDate: today,
        endDate: nextMonth,
        isActive: true,
        applicableMovies: [],
        applicableBranches: [],
      },
      {
        code: 'MEGA50',
        description: 'MEGA SALE - Giảm 50% tối đa 200,000đ',
        discountType: 'percentage',
        discountValue: 50,
        minPurchase: 200000,
        maxDiscount: 200000,
        startDate: today,
        endDate: nextMonth,
        isActive: true,
        applicableMovies: [],
        applicableBranches: [],
      },
      {
        code: 'VIP100K',
        description: 'VIP - Giảm 100,000đ cho đơn hàng từ 500,000đ',
        discountType: 'fixed',
        discountValue: 100000,
        minPurchase: 500000,
        maxDiscount: 0,
        startDate: today,
        endDate: nextMonth,
        isActive: true,
        applicableMovies: [],
        applicableBranches: [],
      },
      {
        code: 'FREESHIP',
        description: 'Miễn phí - Giảm 5% không giới hạn',
        discountType: 'percentage',
        discountValue: 5,
        minPurchase: 0,
        maxDiscount: 0, // Không giới hạn
        startDate: today,
        endDate: nextMonth,
        isActive: true,
        applicableMovies: [],
        applicableBranches: [],
      },
    ];
    
    const createdVouchers = await Voucher.insertMany(vouchers);
    
    console.log('✅ Created test vouchers:\n');
    createdVouchers.forEach(voucher => {
      console.log(`📌 Code: ${voucher.code}`);
      console.log(`   Description: ${voucher.description}`);
      console.log(`   Type: ${voucher.discountType}`);
      console.log(`   Value: ${voucher.discountValue}${voucher.discountType === 'percentage' ? '%' : 'đ'}`);
      console.log(`   Min Purchase: ${voucher.minPurchase.toLocaleString('vi-VN')}đ`);
      if (voucher.maxDiscount > 0) {
        console.log(`   Max Discount: ${voucher.maxDiscount.toLocaleString('vi-VN')}đ`);
      }
      console.log(`   Valid: ${voucher.startDate.toLocaleDateString('vi-VN')} - ${voucher.endDate.toLocaleDateString('vi-VN')}`);
      console.log('');
    });
    
    console.log('🎉 All test vouchers created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Total vouchers: ${createdVouchers.length}`);
    console.log(`   - Active vouchers: ${createdVouchers.filter(v => v.isActive).length}`);
    
  } catch (error) {
    console.error('❌ Error creating vouchers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

connectDB().then(() => {
  createTestVouchers();
});
