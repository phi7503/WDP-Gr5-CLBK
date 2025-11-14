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

// Map ảnh thủ công cho từng combo
const assignImages = async () => {
  try {
    await connectDB();

    const combosDir = path.join(__dirname, '../uploads/combos');
    
    // Danh sách file ảnh trong thư mục
    const files = fs.existsSync(combosDir) 
      ? fs.readdirSync(combosDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      : [];
    
    console.log(`\n📁 Ảnh có sẵn trong thư mục combos:\n`);
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });

    // Map ảnh cho từng combo dựa trên tên file hoặc bạn có thể chỉnh sửa mapping này
    const imageMapping = {
      // Bạn có thể đổi tên file ở đây để map đúng
      '2 Popcorn': files.find(f => 
        f.toLowerCase().includes('popcorn') || 
        f.toLowerCase().includes('bap') ||
        f.toLowerCase().includes('2')
      ) || null,
      
      'Pepsi 500mL': files.find(f => 
        f.toLowerCase().includes('pepsi')
      ) || null,
      
      'Coca Cola 500mL': files.find(f => 
        f.toLowerCase().includes('coca') || 
        f.toLowerCase().includes('cola')
      ) || null,
      
      'Combo Đôi': files.find(f => 
        f.toLowerCase().includes('doi') || 
        f.toLowerCase().includes('đôi')
      ) || null,
      
      'Combo Gia Đình': files.find(f => 
        f.toLowerCase().includes('gia-dinh') || 
        f.toLowerCase().includes('gia dinh') ||
        f.toLowerCase().includes('family')
      ) || null,
      
      'Bắp Rang Bơ Nhỏ': files.find(f => 
        f.toLowerCase().includes('nho') || 
        f.toLowerCase().includes('nhỏ') ||
        f.toLowerCase().includes('small')
      ) || null,
      
      'Combo Nhỏ': files.find(f => 
        f.toLowerCase().includes('nho') || 
        f.toLowerCase().includes('nhỏ')
      ) || null,
    };

    // Lấy tất cả combo
    const combos = await Combo.find({});
    console.log(`\n📦 Tìm thấy ${combos.length} combo trong database\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const combo of combos) {
      let imageFile = imageMapping[combo.name];
      
      // Nếu không tìm thấy trong mapping, thử tìm theo tên
      if (!imageFile) {
        const nameLower = combo.name.toLowerCase();
        if (nameLower.includes('pepsi')) {
          imageFile = files.find(f => f.toLowerCase().includes('pepsi'));
        } else if (nameLower.includes('coca') || nameLower.includes('cola')) {
          imageFile = files.find(f => f.toLowerCase().includes('coca') || f.toLowerCase().includes('cola'));
        } else if (nameLower.includes('popcorn') || nameLower.includes('bắp')) {
          imageFile = files.find(f => f.toLowerCase().includes('popcorn') || f.toLowerCase().includes('bap'));
        }
      }

      if (imageFile) {
        const imagePath = `uploads/combos/${imageFile}`;
        const fullPath = path.join(combosDir, imageFile);
        
        if (fs.existsSync(fullPath)) {
          combo.image = imagePath;
          await combo.save();
          console.log(`✅ "${combo.name}" → ${imageFile}`);
          successCount++;
        } else {
          console.log(`❌ File không tồn tại: ${imageFile}`);
          skipCount++;
        }
      } else {
        console.log(`⚠️  Không tìm thấy ảnh cho "${combo.name}"`);
        console.log(`   💡 Đặt ảnh vào BE/uploads/combos/ với tên chứa: ${combo.name.toLowerCase().replace(/\s+/g, '-')}`);
        skipCount++;
      }
    }

    console.log(`\n\n✨ Summary:`);
    console.log(`   ✅ Updated: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skipCount}`);
    console.log(`   📊 Total: ${combos.length}`);
    
    if (skipCount > 0) {
      console.log(`\n💡 Hướng dẫn:`);
      console.log(`   1. Đặt ảnh vào: BE/uploads/combos/`);
      console.log(`   2. Đặt tên file chứa từ khóa (ví dụ: pepsi-500ml.jpg, coca-cola.jpg)`);
      console.log(`   3. Chạy lại script này`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Chạy script
assignImages();



