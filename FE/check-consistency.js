/**
 * Script để kiểm tra tính nhất quán - không trùng lặp, không xung đột
 * 
 * Chạy: node check-consistency.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files có thể trùng lặp
const POTENTIAL_DUPLICATES = {
  auth: [
    { file: 'src/components/LoginRegisterPage.jsx', used: true, library: 'antd' },
    { file: 'src/components/Login.jsx', used: false, library: 'tailwind' },
    { file: 'src/components/Register.jsx', used: false, library: 'tailwind' },
    { file: 'src/components/AuthPage.jsx', used: false, library: 'antd' },
  ],
};

// Files trong router (đang được sử dụng)
const ROUTER_FILES = [
  'LoginRegisterPage',
  'HomePage',
  'MoviesListPage',
  'MovieDetail',
  'ShowtimesPageModern',
  'ShowtimesPage',
  'ShowtimesByChainPage',
  'BranchListPage',
  'ComboPage',
  'VoucherPage',
  'BookingDetailsPage',
  'BookingHistoryPage',
  'RealTimeBookingPage',
  'ConfirmationPage',
  'PaymentSuccessPage',
  'PaymentCancelPage',
];

function checkFileExists(filePath) {
  const fullPath = path.join(__dirname, filePath);
  return fs.existsSync(fullPath);
}

function checkRouterUsage(componentName) {
  const routerPath = path.join(__dirname, 'src/router/AppRouter.jsx');
  if (!fs.existsSync(routerPath)) return false;
  
  const routerContent = fs.readFileSync(routerPath, 'utf-8');
  return routerContent.includes(componentName);
}

function checkImports(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return { antd: false, tailwind: false };
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  const hasAntd = /import.*from\s+['"]antd['"]/.test(content) ||
                  /import.*from\s+['"]@ant-design\/icons['"]/.test(content);
  
  const hasTailwind = /\b(flex|grid|bg-|text-|p-|m-|rounded|shadow|hover:|md:|lg:)\b/.test(content) ||
                      /@import\s+['"]tailwindcss['"]/.test(content);
  
  return { antd: hasAntd, tailwind: hasTailwind };
}

function main() {
  console.log('🔍 Đang kiểm tra tính nhất quán...\n');
  
  const issues = [];
  const warnings = [];
  
  // Kiểm tra files trùng lặp
  console.log('📋 Kiểm tra files trùng lặp:\n');
  
  POTENTIAL_DUPLICATES.auth.forEach(({ file, used, library }) => {
    const exists = checkFileExists(file);
    const inRouter = checkRouterUsage(file.split('/').pop().replace('.jsx', ''));
    const imports = checkImports(file);
    
    if (!exists) {
      warnings.push(`⚠️  ${file} - Không tồn tại`);
      return;
    }
    
    const status = used || inRouter ? '✅ ĐANG DÙNG' : '❌ KHÔNG DÙNG';
    const libraryMatch = (library === 'antd' && imports.antd) || 
                        (library === 'tailwind' && imports.tailwind);
    
    console.log(`  ${status} - ${file}`);
    console.log(`    Library: ${library} ${libraryMatch ? '✅' : '⚠️'}`);
    console.log(`    In Router: ${inRouter ? '✅' : '❌'}`);
    
    if (!used && !inRouter) {
      warnings.push(`⚠️  ${file} - Không được sử dụng, có thể xóa hoặc backup`);
    }
    
    if (!libraryMatch) {
      issues.push(`❌ ${file} - Library không khớp với khai báo`);
    }
    
    console.log('');
  });
  
  // Kiểm tra xung đột CSS
  console.log('🎨 Kiểm tra xung đột CSS:\n');
  
  const styleCssPath = path.join(__dirname, 'src/style.css');
  if (fs.existsSync(styleCssPath)) {
    const styleContent = fs.readFileSync(styleCssPath, 'utf-8');
    const hasAntdImport = /@import\s+['"]antd/.test(styleContent);
    const hasTailwindImport = /@import\s+['"]tailwindcss['"]/.test(styleContent);
    
    if (hasAntdImport && hasTailwindImport) {
      const antdIndex = styleContent.indexOf('@import');
      const tailwindIndex = styleContent.indexOf('tailwindcss');
      
      if (antdIndex < tailwindIndex) {
        console.log('  ✅ CSS import order đúng: Ant Design trước, Tailwind sau\n');
      } else {
        issues.push('❌ CSS import order sai: Nên import Ant Design trước Tailwind');
      }
    }
  }
  
  // Kiểm tra utils helper
  console.log('🛠️  Kiểm tra utility helpers:\n');
  
  const utilsPath = path.join(__dirname, 'src/lib/utils.js');
  if (fs.existsSync(utilsPath)) {
    const utilsContent = fs.readFileSync(utilsPath, 'utf-8');
    const hasCn = /export\s+function\s+cn/.test(utilsContent);
    const hasTailwindMerge = /tailwind-merge/.test(utilsContent);
    
    if (hasCn && hasTailwindMerge) {
      console.log('  ✅ Có cn() helper để merge classes\n');
    } else {
      issues.push('❌ Thiếu cn() helper hoặc tailwind-merge');
    }
  }
  
  // Tổng kết
  console.log('📊 Tổng kết:\n');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ Tất cả đều OK! Không có vấn đề.\n');
    process.exit(0);
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Cảnh báo:');
    warnings.forEach(w => console.log(`  ${w}`));
    console.log('');
  }
  
  if (issues.length > 0) {
    console.log('❌ Vấn đề cần fix:');
    issues.forEach(i => console.log(`  ${i}`));
    console.log('');
    process.exit(1);
  }
  
  process.exit(0);
}

main();


