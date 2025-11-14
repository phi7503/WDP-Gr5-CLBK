/**
 * Script để validate các file đang sử dụng Ant Design và Tailwind CSS
 * Đảm bảo các file đã dùng Ant Design/Tailwind vẫn tiếp tục dùng
 * 
 * Chạy: npm run validate:antd
 * Hoặc: npm run validate:tailwind
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Danh sách file PHẢI dùng Ant Design (từ ANT_DESIGN_FILES.md)
const REQUIRED_ANT_FILES = [
  'src/main.jsx',
  'src/utils/errorHandler.js',
  'src/services/notificationService.js',
  'src/components/MainLayout.jsx',
  'src/components/Header.jsx',
  'src/components/Footer.jsx',
  'src/components/HomePage.jsx',
  'src/components/AuthPage.jsx',
  'src/components/LoginRegisterPage.jsx',
  'src/components/MovieDetail.jsx',
  'src/components/MoviesListPage.jsx',
  'src/components/MovieCard.jsx',
  'src/components/SearchPage.jsx',
  'src/components/ShowtimesPage.jsx',
  'src/components/ShowtimesPageModern.jsx',
  'src/components/ShowtimesByChainPage.jsx',
  'src/components/BranchListPage.jsx',
  'src/components/ComboPage.jsx',
  'src/components/VoucherPage.jsx',
  'src/components/ProfilePage.jsx',
  'src/components/BookingPageModern.jsx',
  'src/components/BookingDetailsPage.jsx',
  'src/components/BookingHistoryPage.jsx',
  'src/components/RealTimeBookingPage.jsx',
  'src/components/ConfirmationPage.jsx',
  'src/components/PaymentPage.jsx',
  'src/components/PaymentModal.jsx',
  'src/components/PaymentSuccessPage.jsx',
  'src/components/PaymentCancelPage.jsx',
  'src/components/admin/movies/MovieForm.jsx',
  'src/components/admin/movies/AdminMovies.jsx',
  'src/components/admin/branches/BranchForm.jsx',
  'src/components/admin/branches/AdminBranches.jsx',
  'src/components/admin/ShowtimeManagement.jsx',
  'src/components/admin/ShowtimeForm.jsx',
  'src/components/admin/SeatLayoutManagement.jsx',
  'src/components/admin/SeatLayoutEditor.jsx',
  'src/components/TrailerModal.jsx',
  'src/components/ChatBot.jsx',
  'src/components/SocketTestPage.jsx',
  'src/components/NotificationProvider.jsx',
  'src/components/pages/EmployeeBookTicket.jsx',
];

// Các thư viện UI khác không được dùng trong file Ant Design
const FORBIDDEN_IMPORTS = [
  '@mui/material',
  '@mui/icons-material',
  'material-ui',
  'react-bootstrap',
  'reactstrap',
];

function checkFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    return {
      file: filePath,
      exists: false,
      hasAntd: false,
      hasForbidden: false,
      status: 'NOT_FOUND',
    };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Kiểm tra import từ antd
  const hasAntd = /import.*from\s+['"]antd['"]/.test(content) || 
                  /import.*from\s+['"]@ant-design\/icons['"]/.test(content);
  
  // Kiểm tra import từ các thư viện bị cấm
  const hasForbidden = FORBIDDEN_IMPORTS.some(forbidden => 
    new RegExp(`import.*from\\s+['"]${forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(content)
  );

  let status = 'OK';
  if (!hasAntd && hasForbidden) {
    status = 'REPLACED';
  } else if (!hasAntd) {
    status = 'MISSING_ANTD';
  } else if (hasForbidden) {
    status = 'MIXED';
  }

  return {
    file: filePath,
    exists: true,
    hasAntd,
    hasForbidden,
    status,
  };
}

function main() {
  console.log('🔍 Đang kiểm tra các file Ant Design...\n');
  
  const results = REQUIRED_ANT_FILES.map(checkFile);
  
  const notFound = results.filter(r => !r.exists);
  const ok = results.filter(r => r.status === 'OK');
  const missing = results.filter(r => r.status === 'MISSING_ANTD');
  const replaced = results.filter(r => r.status === 'REPLACED');
  const mixed = results.filter(r => r.status === 'MIXED');
  
  // Hiển thị kết quả
  console.log('📊 Kết quả kiểm tra:\n');
  console.log(`✅ OK: ${ok.length} files`);
  console.log(`❌ Không tìm thấy: ${notFound.length} files`);
  console.log(`⚠️  Thiếu Ant Design: ${missing.length} files`);
  console.log(`🔄 Đã thay thế: ${replaced.length} files`);
  console.log(`⚠️  Trộn lẫn: ${mixed.length} files\n`);
  
  // Chi tiết các file có vấn đề
  if (notFound.length > 0) {
    console.log('❌ Files không tìm thấy:');
    notFound.forEach(r => console.log(`   - ${r.file}`));
    console.log('');
  }
  
  if (missing.length > 0) {
    console.log('⚠️  Files thiếu Ant Design:');
    missing.forEach(r => console.log(`   - ${r.file}`));
    console.log('');
  }
  
  if (replaced.length > 0) {
    console.log('🔄 Files đã bị thay thế (cần fix):');
    replaced.forEach(r => {
      console.log(`   - ${r.file}`);
      console.log(`     → Đang dùng thư viện khác thay vì Ant Design!`);
    });
    console.log('');
  }
  
  if (mixed.length > 0) {
    console.log('⚠️  Files trộn lẫn Ant Design với thư viện khác:');
    mixed.forEach(r => {
      console.log(`   - ${r.file}`);
      console.log(`     → Cần kiểm tra và đảm bảo dùng Ant Design chính`);
    });
    console.log('');
  }
  
  // Tổng kết
  const hasIssues = notFound.length > 0 || missing.length > 0 || replaced.length > 0 || mixed.length > 0;
  
  if (!hasIssues) {
    console.log('✅ Tất cả files đều OK! Tất cả đều đang dùng Ant Design đúng cách.\n');
    process.exit(0);
  } else {
    console.log('❌ Có vấn đề cần fix! Vui lòng kiểm tra các files trên.\n');
    process.exit(1);
  }
}

main();

