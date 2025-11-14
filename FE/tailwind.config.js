module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {},
  },
  plugins: [],
  // ✅ Đảm bảo Tailwind không conflict với Ant Design
  // Ant Design sử dụng prefix 'ant-' nên không bị ảnh hưởng
  corePlugins: {
    // Giữ nguyên tất cả core plugins
    preflight: true, // Tailwind reset - nhưng Ant Design đã có reset riêng
  },
  // ✅ Important: false để không dùng !important (tránh override Ant Design)
  important: false,
};
