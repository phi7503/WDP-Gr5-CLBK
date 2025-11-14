import mongoose from 'mongoose';
import Combo from '../models/comboModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Map ảnh dựa trên tên file hoặc tên combo
const mapImagesToCombos = async () => {
  try {
    await connectDB();

    const combosDir = path.join(__dirname, '../uploads/combos');
    if (!fs.existsSync(combosDir)) {
      console.log('❌ Thư mục combos không tồn tại');
      process.exit(1);
    }

    // Lấy tất cả file trong thư mục combos
    const files = fs.readdirSync(combosDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|webp)$/i.test(file)
    );

    console.log(`\n📁 Tìm thấy ${imageFiles.length} ảnh trong thư mục combos:\n`);
    imageFiles.forEach(file => {
      console.log(`   - ${file}`);
    });

    // Lấy tất cả combo
    const combos = await Combo.find({});
    console.log(`\n📦 Tìm thấy ${combos.length} combo trong database:\n`);

    // Map ảnh vào combo dựa trên tên file hoặc tên combo
    const imageMap = {
      // Map theo tên file chứa từ khóa
      'popcorn': imageFiles.find(f => 
        f.toLowerCase().includes('popcorn') || 
        f.toLowerCase().includes('bap') ||
        f.toLowerCase().includes('2')
      ),
      'pepsi': imageFiles.find(f => 
        f.toLowerCase().includes('pepsi')
      ),
      'coca': imageFiles.find(f => 
        f.toLowerCase().includes('coca') || 
        f.toLowerCase().includes('cola')
      ),
      'combo-doi': imageFiles.find(f => 
        f.toLowerCase().includes('doi') || 
        f.toLowerCase().includes('đôi')
      ),
      'combo-gia-dinh': imageFiles.find(f => 
        f.toLowerCase().includes('gia-dinh') || 
        f.toLowerCase().includes('gia dinh') ||
        f.toLowerCase().includes('family')
      ),
      'combo-nho': imageFiles.find(f => 
        f.toLowerCase().includes('nho') || 
        f.toLowerCase().includes('nhỏ') ||
        f.toLowerCase().includes('small')
      ),
    };

    // Map combo với ảnh
    let successCount = 0;
    let skipCount = 0;

    for (const combo of combos) {
      const nameLower = combo.name.toLowerCase();
      const descLower = (combo.description || '').toLowerCase();
      
      let imageFile = null;

      // Tìm ảnh phù hợp
      if (nameLower.includes('pepsi')) {
        imageFile = imageMap['pepsi'];
      } else if (nameLower.includes('coca') || nameLower.includes('cola')) {
        imageFile = imageMap['coca'];
      } else if (nameLower.includes('đôi') || nameLower.includes('doi')) {
        imageFile = imageMap['combo-doi'];
      } else if (nameLower.includes('gia đình') || nameLower.includes('gia dinh')) {
        imageFile = imageMap['combo-gia-dinh'];
      } else if (nameLower.includes('nhỏ') || nameLower.includes('nho')) {
        imageFile = imageMap['combo-nho'];
      } else if (nameLower.includes('popcorn') || nameLower.includes('bắp') || combo.category === 'popcorn') {
        imageFile = imageMap['popcorn'];
      }

      if (imageFile) {
        const imagePath = `uploads/combos/${imageFile}`;
        combo.image = imagePath;
        await combo.save();
        console.log(`✅ Updated "${combo.name}" → ${imageFile}`);
        successCount++;
      } else {
        console.log(`⚠️  Không tìm thấy ảnh cho "${combo.name}"`);
        skipCount++;
      }
    }

    console.log(`\n\n✨ Summary:`);
    console.log(`   ✅ Updated: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skipCount}`);
    console.log(`   📊 Total: ${combos.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Chạy script
mapImagesToCombos();



