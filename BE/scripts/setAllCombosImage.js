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

// Set ảnh cho tất cả combo (trừ Pepsi)
const setAllCombosImage = async (imageFileName) => {
  try {
    await connectDB();

    const combosDir = path.join(__dirname, '../uploads/combos');
    const imagePath = path.join(combosDir, imageFileName);
    const relativePath = `uploads/combos/${imageFileName}`;

    // Kiểm tra file tồn tại
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ File không tồn tại: ${imagePath}`);
      console.log(`\n📁 Danh sách file trong thư mục:`);
      if (fs.existsSync(combosDir)) {
        const files = fs.readdirSync(combosDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
        files.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file}`);
        });
      }
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

      // Set ảnh mới cho combo khác
      combo.image = relativePath;
      await combo.save();
      console.log(`✅ "${combo.name}" → ${imageFileName}`);
      successCount++;
    }

    console.log(`\n\n✨ Summary:`);
    console.log(`   ✅ Updated: ${successCount}`);
    console.log(`   ⏭️  Skipped (Pepsi): ${skipCount}`);
    console.log(`   📊 Total: ${combos.length}`);
    console.log(`\n📸 Ảnh đã sử dụng: ${imageFileName}`);
    console.log(`   URL: http://localhost:5000/${relativePath}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Lấy tham số từ command line
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('📖 Cách sử dụng:');
  console.log('   node setAllCombosImage.js "<Tên File Ảnh>"');
  console.log('\n📝 Ví dụ:');
  console.log('   node setAllCombosImage.js "combo-gia-dinh.jpg"');
  console.log('   node setAllCombosImage.js "combo-1763040630159-212210217.jpg"');
  console.log('\n💡 Lưu ý:');
  console.log('   - Đặt ảnh vào: BE/uploads/combos/');
  console.log('   - Ảnh Pepsi sẽ được giữ nguyên');
  console.log('   - Tất cả combo khác sẽ dùng ảnh này');
  
  // Hiển thị danh sách file có sẵn
  const combosDir = path.join(__dirname, '../uploads/combos');
  if (fs.existsSync(combosDir)) {
    const files = fs.readdirSync(combosDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    if (files.length > 0) {
      console.log('\n📁 File có sẵn trong thư mục:');
      files.slice(0, 10).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      if (files.length > 10) {
        console.log(`   ... và ${files.length - 10} file khác`);
      }
    }
  }
  
  process.exit(1);
}

const imageFileName = args[0];
setAllCombosImage(imageFileName);



