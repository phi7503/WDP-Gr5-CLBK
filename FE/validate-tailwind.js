/**
 * Script để validate các file đang sử dụng Tailwind CSS
 * Đảm bảo các file đã dùng Tailwind vẫn tiếp tục dùng Tailwind
 * 
 * Chạy: node validate-tailwind.js
 * Hoặc: npm run validate:tailwind
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Danh sách file PHẢI dùng Tailwind CSS
const REQUIRED_TAILWIND_FILES = [
  'src/style.css',
  'src/App.jsx',
  'src/components/Login.jsx',
  'src/components/Register.jsx',
  'src/components/ForgotPassword.jsx',
  'src/components/ResetPassword.jsx',
  'src/components/AuthLayout.jsx',
  'src/components/ui/UserButton.jsx',
  'src/components/ui/SearchField.jsx',
  'src/components/pages/EmployeeBookTicket.jsx',
  'src/components/pages/EmployeeDashboardPage.jsx',
  'src/components/pages/EmployeeProfilePage.jsx',
  'src/components/pages/EmployeeBookingsPage.jsx',
  'src/components/pages/EmployeeQRCheckinPage.jsx',
  'src/components/pages/UserProfilePage.jsx',
  'src/components/pages/AdminDashboard.jsx',
  'src/components/pages/AdminUserManagementPage.jsx',
  'src/components/booking/EmployeeLayout.jsx',
];

// Common Tailwind classes patterns
const TAILWIND_PATTERNS = [
  /\b(flex|grid|block|inline|hidden)\b/,
  /\b(p|m|px|py|pt|pr|pb|pl|mx|my|mt|mr|mb|ml)-\d+/,
  /\b(bg|text|border)-\w+(-\d+)?/,
  /\b(w|h|max-w|min-h|max-h)-\w+/,
  /\b(text|font|leading|tracking)-\w+/,
  /\b(shadow|rounded|opacity)-\w+/,
  /\b(sm|md|lg|xl|2xl):\w+/,
  /\b(hover|focus|active|disabled):\w+/,
  /\b(gap|space)-\d+/,
  /\b(items|justify|content|self)-\w+/,
];

// Inline styles patterns (nên tránh nếu có thể dùng Tailwind)
const INLINE_STYLE_PATTERNS = [
  /style=\{\{[^}]*display:\s*['"]flex['"]/,
  /style=\{\{[^}]*padding:\s*['"]\d+px['"]/,
  /style=\{\{[^}]*margin:\s*['"]\d+px['"]/,
  /style=\{\{[^}]*gap:\s*['"]\d+px['"]/,
];

function checkFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    return {
      file: filePath,
      exists: false,
      hasTailwind: false,
      hasInlineStyles: false,
      status: 'NOT_FOUND',
    };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Kiểm tra có Tailwind classes không
  const hasTailwind = TAILWIND_PATTERNS.some(pattern => pattern.test(content));
  
  // Kiểm tra có inline styles không cần thiết không
  const hasInlineStyles = INLINE_STYLE_PATTERNS.some(pattern => pattern.test(content));
  
  // Kiểm tra import Tailwind
  const hasTailwindImport = /@import\s+['"]tailwindcss['"]/.test(content) ||
                           /@tailwind/.test(content);

  let status = 'OK';
  if (!hasTailwind && !hasTailwindImport) {
    status = 'MISSING_TAILWIND';
  } else if (hasInlineStyles && !hasTailwind) {
    status = 'INLINE_INSTEAD_OF_TAILWIND';
  } else if (hasInlineStyles) {
    status = 'HAS_INLINE_STYLES';
  }

  return {
    file: filePath,
    exists: true,
    hasTailwind,
    hasTailwindImport,
    hasInlineStyles,
    status,
  };
}

function main() {
  console.log('🔍 Đang kiểm tra các file Tailwind CSS...\n');
  
  const results = REQUIRED_TAILWIND_FILES.map(checkFile);
  
  const notFound = results.filter(r => !r.exists);
  const ok = results.filter(r => r.status === 'OK');
  const missing = results.filter(r => r.status === 'MISSING_TAILWIND');
  const inlineInstead = results.filter(r => r.status === 'INLINE_INSTEAD_OF_TAILWIND');
  const hasInline = results.filter(r => r.status === 'HAS_INLINE_STYLES');
  
  // Hiển thị kết quả
  console.log('📊 Kết quả kiểm tra:\n');
  console.log(`✅ OK: ${ok.length} files`);
  console.log(`❌ Không tìm thấy: ${notFound.length} files`);
  console.log(`⚠️  Thiếu Tailwind: ${missing.length} files`);
  console.log(`🔄 Dùng inline thay vì Tailwind: ${inlineInstead.length} files`);
  console.log(`⚠️  Có inline styles (cần review): ${hasInline.length} files\n`);
  
  // Chi tiết các file có vấn đề
  if (notFound.length > 0) {
    console.log('❌ Files không tìm thấy:');
    notFound.forEach(r => console.log(`   - ${r.file}`));
    console.log('');
  }
  
  if (missing.length > 0) {
    console.log('⚠️  Files thiếu Tailwind CSS:');
    missing.forEach(r => console.log(`   - ${r.file}`));
    console.log('');
  }
  
  if (inlineInstead.length > 0) {
    console.log('🔄 Files dùng inline styles thay vì Tailwind (nên fix):');
    inlineInstead.forEach(r => {
      console.log(`   - ${r.file}`);
      console.log(`     → Nên chuyển inline styles sang Tailwind classes`);
    });
    console.log('');
  }
  
  if (hasInline.length > 0) {
    console.log('⚠️  Files có inline styles (cần review):');
    hasInline.forEach(r => {
      console.log(`   - ${r.file}`);
      console.log(`     → Có inline styles, kiểm tra xem có thể dùng Tailwind không`);
    });
    console.log('');
  }
  
  // Tổng kết
  const hasIssues = notFound.length > 0 || missing.length > 0 || inlineInstead.length > 0;
  
  if (!hasIssues) {
    console.log('✅ Tất cả files đều OK! Tất cả đều đang dùng Tailwind CSS đúng cách.\n');
    if (hasInline.length > 0) {
      console.log('💡 Lưu ý: Một số files có inline styles, nhưng vẫn có Tailwind. Có thể review để tối ưu.\n');
    }
    process.exit(0);
  } else {
    console.log('❌ Có vấn đề cần fix! Vui lòng kiểm tra các files trên.\n');
    process.exit(1);
  }
}

main();


