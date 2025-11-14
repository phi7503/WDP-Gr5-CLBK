import mongoose from 'mongoose';
import Combo from '../models/comboModel.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/OCBS');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Download ảnh từ URL với axios (hỗ trợ redirect tốt hơn)
const downloadImage = async (url, filepath) => {
  try {
    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        writer.close();
        resolve(filepath);
      });
      writer.on('error', reject);
      response.data.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
};

// Ảnh combo thật - sử dụng Pexels với từ khóa cụ thể về combo rạp chiếu phim
const comboImages = {
  // Bắp rang - ảnh bắp rang thật từ rạp chiếu phim
  'popcorn': [
    'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop', // Popcorn bucket thật
    'https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop', // Popcorn thật
    'https://images.pexels.com/photos/1300976/pexels-photo-1300976.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop', // Popcorn box thật
    'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'  // Multiple popcorn
  ],
  // Nước ngọt - Pepsi thật
  'pepsi': [
    'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop', // Pepsi/Coke bottle thật
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'  // Soft drink thật
  ],
  // Coca Cola thật
  'coca': [
    'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop', // Coca Cola bottle thật
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'  // Cola drink thật
  ],
  // Nước ngọt chung
  'drinks': [
    'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop', // Soft drinks thật
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'  // Drinks thật
  ],
  // Combo đôi - 1 bắp + 2 nước (ảnh combo thật)
  'combo-doi': [
    'https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop', // Combo bắp + nước thật
    'https://images.pexels.com/photos/1300976/pexels-photo-1300976.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'  // Movie combo thật
  ],
  // Combo gia đình - 2 bắp + 2 nước + snack (ảnh combo lớn thật)
  'combo-gia-dinh': [
    'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop', // Combo lớn thật
    'https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'   // Family combo thật
  ],
  // Combo nhỏ - 1 bắp + 1 nước
  'combo-nho': [
    'https://images.pexels.com/photos/1300976/pexels-photo-1300976.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop', // Combo nhỏ thật
    'https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'  // Small combo thật
  ],
  // Snacks - đồ ăn vặt
  'snacks': [
    'https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop', // Snacks thật
    'https://images.pexels.com/photos/1300976/pexels-photo-1300976.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'     // Cinema snacks thật
  ]
};

// Tìm ảnh phù hợp dựa trên tên combo, mô tả và category
const findImageForCombo = (comboName, description, category) => {
  const nameLower = comboName.toLowerCase();
  const descLower = (description || '').toLowerCase();
  
  // Pepsi cụ thể
  if (nameLower.includes('pepsi')) {
    const images = comboImages['pepsi'];
    return images[0]; // Pepsi bottle
  }
  
  // Coca Cola cụ thể
  if (nameLower.includes('coca') || nameLower.includes('cola')) {
    const images = comboImages['coca'];
    return images[0]; // Coca Cola bottle
  }
  
  // Combo Đôi - 1 bắp + 2 nước (kiểm tra TRƯỚC nước ngọt để không bị nhầm)
  if (nameLower.includes('đôi') || nameLower.includes('doi') || (descLower.includes('1 bắp') && descLower.includes('2 nước'))) {
    const images = comboImages['combo-doi'];
    return images[0]; // Combo đôi
  }
  
  // Combo Gia Đình - 2 bắp + 2 nước + snack (kiểm tra TRƯỚC)
  if (nameLower.includes('gia đình') || nameLower.includes('gia dinh') || (descLower.includes('2 bắp') && descLower.includes('2 nước'))) {
    const images = comboImages['combo-gia-dinh'];
    return images[0]; // Family combo
  }
  
  // Combo nhỏ - 1 bắp + 1 nước (kiểm tra TRƯỚC)
  if ((nameLower.includes('nhỏ') || nameLower.includes('nho')) && descLower.includes('1 bắp') && descLower.includes('1 nước')) {
    const images = comboImages['combo-nho'];
    return images[0]; // Small combo
  }
  
  // Nước ngọt chung (chỉ khi KHÔNG phải combo)
  if (category === 'drinks' || (nameLower.includes('nước') && !descLower.includes('bắp'))) {
    const images = comboImages['drinks'];
    return images[0]; // Soft drinks
  }
  
  // Bắp rang - kiểm tra kỹ
  if (category === 'popcorn' || nameLower.includes('bắp rang') || nameLower.includes('popcorn') || descLower.includes('bắp')) {
    const images = comboImages['popcorn'];
    // Nếu là "2 Popcorn" hoặc nhiều bắp, chọn ảnh có nhiều bắp
    if (nameLower.includes('2') || descLower.includes('2 bắp')) {
      return images[3]; // Popcorn box - nhiều hơn
    }
    return images[0]; // Popcorn bucket
  }
  
  // Snacks
  if (category === 'snacks' || nameLower.includes('snack') || descLower.includes('snack')) {
    const images = comboImages['snacks'];
    return images[0]; // Snacks
  }
  
  // Default: bắp rang
  const images = comboImages['popcorn'];
  return images[0];
};

// Update ảnh cho combo
const updateComboImage = async (combo, imageUrl) => {
  try {
    // Tạo thư mục uploads/combos nếu chưa có
    const combosDir = path.join(__dirname, '../uploads/combos');
    if (!fs.existsSync(combosDir)) {
      fs.mkdirSync(combosDir, { recursive: true });
    }

    // Tạo tên file
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const extension = '.jpg';
    const filename = `combo-${timestamp}-${randomSuffix}${extension}`;
    const filepath = path.join(combosDir, filename);

    // Download ảnh
    console.log(`📥 Downloading image for "${combo.name}"...`);
    await downloadImage(imageUrl, filepath);
    console.log(`✅ Downloaded: ${filename}`);

    // Update combo với đường dẫn ảnh mới
    combo.image = `uploads/combos/${filename}`;
    await combo.save();
    console.log(`✅ Updated combo "${combo.name}" with image: ${combo.image}`);

    return combo;
  } catch (error) {
    console.error(`❌ Error updating combo "${combo.name}":`, error.message);
    return null;
  }
};

// Main function
const updateAllComboImages = async () => {
  try {
    await connectDB();

    // Lấy tất cả combo
    const combos = await Combo.find({});
    console.log(`\n📦 Found ${combos.length} combos\n`);

    if (combos.length === 0) {
      console.log('⚠️  No combos found in database');
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    for (const combo of combos) {
      console.log(`\n🔄 Processing: ${combo.name} (${combo.category})`);
      console.log(`   Description: ${combo.description || 'N/A'}`);
      
      // Tìm ảnh phù hợp dựa trên tên, mô tả và category
      const imageUrl = findImageForCombo(combo.name, combo.description, combo.category);
      console.log(`   Image URL: ${imageUrl}`);

      // Update ảnh
      const updated = await updateComboImage(combo, imageUrl);
      if (updated) {
        successCount++;
      } else {
        failCount++;
      }

      // Delay để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n\n✨ Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📊 Total: ${combos.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Chạy script
updateAllComboImages();

