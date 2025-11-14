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

// Set ảnh Combo Gia Đình cho tất cả combo (trừ Pepsi)
const setComboGiaDinhImage = async () => {
  try {
    await connectDB();

    const combosDir = path.join(__dirname, '../uploads/combos');
    
    if (!fs.existsSync(combosDir)) {
      console.log('❌ Thư mục combos không tồn tại');
      process.exit(1);
    }

    // Lấy tất cả file ảnh
    const files = fs.readdirSync(combosDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .map(file => ({
        name: file,
        path: path.join(combosDir, file),
        mtime: fs.statSync(path.join(combosDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // Sắp xếp theo thời gian mới nhất

    if (files.length === 0) {
      console.log('❌ Không tìm thấy ảnh nào trong thư mục');
      process.exit(1);
    }

    // Lấy ảnh mới nhất (có thể là ảnh Combo Gia Đình bạn vừa thêm)
    const comboGiaDinhImage = files[0].name;
    
    console.log(`\n📸 Sử dụng ảnh: ${comboGiaDinhImage}`);
    console.log(`   (File mới nhất trong thư mục)\n`);

    const imagePath = `uploads/combos/${comboGiaDinhImage}`;
    const fullPath = path.join(combosDir, comboGiaDinhImage);

    // Lấy tất cả combo
    const combos = await Combo.find({});
    console.log(`📦 Tìm thấy ${combos.length} combo trong database\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const combo of combos) {
      // Giữ nguyên ảnh Pepsi
      if (combo.name.toLowerCase().includes('pepsi')) {
        console.log(`⏭️  Giữ nguyên ảnh cho "${combo.name}"`);
        skipCount++;
        continue;
      }

      // Set ảnh Combo Gia Đình cho combo khác
      combo.image = imagePath;
      await combo.save();
      console.log(`✅ "${combo.name}" → ${comboGiaDinhImage}`);
      successCount++;
    }

    console.log(`\n\n✨ Summary:`);
    console.log(`   ✅ Updated: ${successCount}`);
    console.log(`   ⏭️  Skipped (Pepsi): ${skipCount}`);
    console.log(`   📊 Total: ${combos.length}`);
    console.log(`\n📸 Ảnh đã sử dụng: ${comboGiaDinhImage}`);
    console.log(`   URL: http://localhost:5000/${imagePath}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Chạy script
setComboGiaDinhImage();



