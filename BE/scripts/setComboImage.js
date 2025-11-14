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

// Set ảnh cho combo cụ thể
const setComboImage = async (comboName, imageFileName) => {
  try {
    await connectDB();

    const combosDir = path.join(__dirname, '../uploads/combos');
    const imagePath = path.join(combosDir, imageFileName);
    const relativePath = `uploads/combos/${imageFileName}`;

    // Kiểm tra file tồn tại
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ File không tồn tại: ${imagePath}`);
      console.log(`💡 Đặt ảnh vào: ${combosDir}`);
      process.exit(1);
    }

    // Tìm combo
    const combo = await Combo.findOne({ name: comboName });
    if (!combo) {
      console.log(`❌ Không tìm thấy combo: ${comboName}`);
      console.log(`\n📦 Danh sách combo có sẵn:`);
      const allCombos = await Combo.find({});
      allCombos.forEach(c => console.log(`   - ${c.name}`));
      process.exit(1);
    }

    // Update ảnh
    combo.image = relativePath;
    await combo.save();

    console.log(`✅ Đã set ảnh cho "${comboName}"`);
    console.log(`   Ảnh: ${imageFileName}`);
    console.log(`   Path: ${relativePath}`);
    console.log(`   URL: http://localhost:5000/${relativePath}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Lấy tham số từ command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('📖 Cách sử dụng:');
  console.log('   node setComboImage.js "<Tên Combo>" "<Tên File Ảnh>"');
  console.log('\n📝 Ví dụ:');
  console.log('   node setComboImage.js "Pepsi 500mL" "pepsi-500ml.jpg"');
  console.log('   node setComboImage.js "2 Popcorn" "popcorn-2.jpg"');
  console.log('\n💡 Lưu ý:');
  console.log('   - Đặt ảnh vào: BE/uploads/combos/');
  console.log('   - Tên combo phải khớp chính xác với database');
  process.exit(1);
}

const [comboName, imageFileName] = args;
setComboImage(comboName, imageFileName);



