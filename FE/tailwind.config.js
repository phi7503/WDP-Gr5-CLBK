module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {},
  },
  plugins: [],
  // ✅ Tắt preflight để không override Ant Design reset
  // Ant Design đã có reset riêng, không cần Tailwind reset
  corePlugins: {
    preflight: false, // Tắt Tailwind reset để không conflict với Ant Design
  },
  // ✅ Important: false để không dùng !important (tránh override Ant Design)
  important: false,
};
