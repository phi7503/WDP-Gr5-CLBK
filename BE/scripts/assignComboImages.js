import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import Combo from '../models/comboModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script để assign ảnh từ thư mục uploads/combos vào các combo trong database
const assignComboImages = async () => {
  try {
    await connectDB();

    // Lấy danh sách tất cả combos
    const combos = await Combo.find({});
    console.log(`\n📦 Tìm thấy ${combos.length} combos trong database`);

    // Lấy danh sách ảnh trong thư mục uploads/combos
    const combosDir = path.join(__dirname, '../uploads/combos');
    if (!fs.existsSync(combosDir)) {
      console.error(`❌ Thư mục ${combosDir} không tồn tại!`);
      process.exit(1);
    }

    const imageFiles = fs.readdirSync(combosDir).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    });

    console.log(`\n🖼️  Tìm thấy ${imageFiles.length} ảnh trong thư mục uploads/combos:`);
    imageFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });

    // Assign ảnh lần lượt vào các combo
    console.log(`\n🔄 Đang assign ảnh vào combos...\n`);
    
    let assignedCount = 0;
    for (let i = 0; i < combos.length && i < imageFiles.length; i++) {
      const combo = combos[i];
      const imageFile = imageFiles[i];
      const imagePath = `uploads/combos/${imageFile}`;

      // Chỉ update nếu combo chưa có ảnh hoặc ảnh hiện tại khác với ảnh mới
      if (!combo.image || combo.image !== imagePath) {
        combo.image = imagePath;
        await combo.save();
        console.log(`✅ [${i + 1}] ${combo.name} → ${imageFile}`);
        assignedCount++;
      } else {
        console.log(`⏭️  [${i + 1}] ${combo.name} đã có ảnh: ${combo.image}`);
      }
    }

    if (combos.length > imageFiles.length) {
      console.log(`\n⚠️  Cảnh báo: Có ${combos.length - imageFiles.length} combo không có ảnh (không đủ ảnh)`);
    }

    console.log(`\n✨ Hoàn thành! Đã assign ${assignedCount} ảnh vào combos.\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

// Chạy script
assignComboImages();

