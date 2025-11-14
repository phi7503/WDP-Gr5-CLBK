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

// Thay toàn bộ ảnh combo bằng ảnh Combo Gia Đình, giữ nguyên Pepsi
const replaceComboImages = async () => {
  try {
    await connectDB();

    const combosDir = path.join(__dirname, '../uploads/combos');
    
    // Tìm ảnh Combo Gia Đình (ảnh mới có 2 bắp rang)
    const files = fs.existsSync(combosDir) 
      ? fs.readdirSync(combosDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      : [];
    
    console.log(`\n📁 Tìm ảnh Combo Gia Đình trong thư mục...\n`);
    
    // Tìm ảnh Combo Gia Đình - ưu tiên file mới nhất hoặc file có tên liên quan
    // Bạn có thể chỉ định tên file cụ thể ở đây
    let comboGiaDinhImage = null;
    
    // Tìm file mới nhất (có thể là file bạn vừa thêm)
    if (files.length > 0) {
      // Sắp xếp theo thời gian modified, lấy file mới nhất
      const filesWithStats = files.map(file => ({
        name: file,
        path: path.join(combosDir, file),
        mtime: fs.statSync(path.join(combosDir, file)).mtime
      })).sort((a, b) => b.mtime - a.mtime);
      
      // Lấy file mới nhất (có thể là ảnh Combo Gia Đình bạn vừa thêm)
      comboGiaDinhImage = filesWithStats[0].name;
      console.log(`✅ Tìm thấy ảnh mới nhất: ${comboGiaDinhImage}`);
    }

    // Nếu không tìm thấy, yêu cầu người dùng chỉ định
    if (!comboGiaDinhImage) {
      console.log('❌ Không tìm thấy ảnh Combo Gia Đình');
      console.log('\n💡 Vui lòng:');
      console.log('   1. Đặt ảnh Combo Gia Đình vào: BE/uploads/combos/');
      console.log('   2. Chạy lại script này');
      process.exit(1);
    }

    // Lấy tất cả combo
    const combos = await Combo.find({});
    console.log(`\n📦 Tìm thấy ${combos.length} combo trong database\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const combo of combos) {
      // Giữ nguyên ảnh Pepsi
      if (combo.name.toLowerCase().includes('pepsi')) {
        console.log(`⏭️  Giữ nguyên ảnh cho "${combo.name}"`);
        skipCount++;
        continue;
      }

      // Thay tất cả combo khác bằng ảnh Combo Gia Đình
      const imagePath = `uploads/combos/${comboGiaDinhImage}`;
      const fullPath = path.join(combosDir, comboGiaDinhImage);
      
      if (fs.existsSync(fullPath)) {
        combo.image = imagePath;
        await combo.save();
        console.log(`✅ "${combo.name}" → ${comboGiaDinhImage}`);
        successCount++;
      } else {
        console.log(`❌ File không tồn tại: ${comboGiaDinhImage}`);
        skipCount++;
      }
    }

    console.log(`\n\n✨ Summary:`);
    console.log(`   ✅ Updated: ${successCount}`);
    console.log(`   ⏭️  Skipped (Pepsi): ${skipCount}`);
    console.log(`   📊 Total: ${combos.length}`);
    console.log(`\n📸 Ảnh đã sử dụng: ${comboGiaDinhImage}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Chạy script
replaceComboImages();



