/**
 * Script to download backdrop images from URLs and save them to uploads/backdrops/
 * Usage: node scripts/downloadBackdrops.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo thư mục uploads/backdrops nếu chưa có
const backdropsDir = path.join(__dirname, '../uploads/backdrops');
if (!fs.existsSync(backdropsDir)) {
  fs.mkdirSync(backdropsDir, { recursive: true });
  console.log('✅ Created uploads/backdrops directory');
}

// Danh sách backdrop cần tải
const backdrops = [
  {
    name: 'dune-2021',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&q=80',
    extension: '.jpg'
  },
  {
    name: 'avengers-endgame',
    url: 'https://image.tmdb.org/t/p/w1920/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    extension: '.jpg'
  },
  {
    name: 'inception',
    url: 'https://image.tmdb.org/t/p/w1920/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    extension: '.jpg'
  },
  {
    name: 'interstellar',
    url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&q=80',
    extension: '.jpg'
  },
  {
    name: 'dark-knight',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
    extension: '.jpg'
  }
];

// Function để tải ảnh từ URL
const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {}); // Xóa file nếu có lỗi
          reject(err);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Redirect
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Main function
const downloadAllBackdrops = async () => {
  console.log('\n📥 Starting backdrop download...\n');
  
  let successCount = 0;
  let failedCount = 0;
  
  for (const backdrop of backdrops) {
    try {
      const filename = `${backdrop.name}${backdrop.extension}`;
      const filepath = path.join(backdropsDir, filename);
      
      // Kiểm tra nếu file đã tồn tại
      if (fs.existsSync(filepath)) {
        console.log(`⏭️  Skipped: ${filename} (already exists)`);
        continue;
      }
      
      console.log(`⬇️  Downloading: ${backdrop.name}...`);
      await downloadImage(backdrop.url, filepath);
      console.log(`✅ Downloaded: ${filename}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to download ${backdrop.name}:`, error.message);
      failedCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Success: ${successCount} backdrops`);
  console.log(`   ❌ Failed: ${failedCount} backdrops`);
  console.log(`   📁 Location: ${backdropsDir}`);
  console.log('\n💡 Usage in code:');
  console.log('   Backend URL: http://localhost:5000/uploads/backdrops/[filename]');
  console.log('   Example: http://localhost:5000/uploads/backdrops/dune-2021.jpg');
  console.log('\n🎉 Done!');
};

// Run script
downloadAllBackdrops().catch(console.error);





