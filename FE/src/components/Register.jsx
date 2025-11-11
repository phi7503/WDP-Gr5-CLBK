// src/components/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    province: "",
    city: "",
    gender: "",
    dob: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Họ tên là bắt buộc";

    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    if (!formData.phone) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!formData.province) newErrors.province = "Tỉnh/Thành phố là bắt buộc";
    if (!formData.city) newErrors.city = "Quận/Huyện là bắt buộc";
    if (!formData.gender) newErrors.gender = "Giới tính là bắt buộc";
    if (!formData.dob) newErrors.dob = "Ngày sinh là bắt buộc";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Đăng ký tài khoản thường
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // BE có set cookie thì vẫn chạy, nhưng FE mình sẽ không auto login
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          province: formData.province,
          city: formData.city,
          gender: formData.gender,
          dob: formData.dob, // "YYYY-MM-DD" -> BE đã xử lý
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Đăng ký thất bại");
      }

      // ✅ Đăng ký thành công -> toast + chuyển sang /login
      toast.success(data?.message || "Đăng ký thành công, vui lòng đăng nhập");
      navigate("/login", { replace: true });
    } catch (err) {
      // ❌ Lỗi -> toast error
      toast.error(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Google Register: thực ra là login bằng Google, xử lý tiếp ở Login.jsx
  const handleGoogleRegister = () => {
    // Đánh dấu là flow Google (dùng chung với Login)
    sessionStorage.setItem("googleLoginPending", "1");
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-10">
        <div className="text-center space-y-6 mb-8">
          <h1 className="text-3xl font-bold text-red-600">Sign up to CLBK</h1>

          <button
            onClick={handleGoogleRegister}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Mail className="w-5 h-5 text-red-600" />
            <span>Đăng ký bằng Google</span>
          </button>

          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Hoặc</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name Input */}
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Họ và tên"
                className={`w-full px-4 py-3 bg-blue-50 border ${
                  errors.name ? "border-red-500" : "border-transparent"
                } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={`w-full px-4 py-3 bg-blue-50 border ${
                  errors.email ? "border-red-500" : "border-transparent"
                } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mật khẩu"
                  className={`w-full px-4 py-3 pr-12 bg-blue-50 border ${
                    errors.password ? "border-red-500" : "border-transparent"
                  } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Xác nhận mật khẩu"
                  className={`w-full px-4 py-3 pr-12 bg-blue-50 border ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-transparent"
                  } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Phone Input */}
            <div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Số điện thoại"
                className={`w-full px-4 py-3 bg-blue-50 border ${
                  errors.phone ? "border-red-500" : "border-transparent"
                } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Date of Birth Input */}
            <div>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                placeholder="Ngày sinh"
                className={`w-full px-4 py-3 bg-blue-50 border ${
                  errors.dob ? "border-red-500" : "border-transparent"
                } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
              />
              {errors.dob && (
                <p className="mt-1 text-sm text-red-500">{errors.dob}</p>
              )}
            </div>

            {/* Gender Select */}
            <div>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-blue-50 border ${
                  errors.gender ? "border-red-500" : "border-transparent"
                } rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
              )}
            </div>

            {/* Province Input */}
            <div>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="Tỉnh/Thành phố"
                className={`w-full px-4 py-3 bg-blue-50 border ${
                  errors.province ? "border-red-500" : "border-transparent"
                } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
              />
              {errors.province && (
                <p className="mt-1 text-sm text-red-500">{errors.province}</p>
              )}
            </div>

            {/* City Input */}
            <div>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Quận/Huyện"
                className={`w-full px-4 py-3 bg-blue-50 border ${
                  errors.city ? "border-red-500" : "border-transparent"
                } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-500">{errors.city}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? "Đang đăng ký..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center space-y-3 mt-6">
          <div>
            <Link
              to="/forgot-password"
              className="text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <div>
            <Link
              to="/login"
              className="text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
