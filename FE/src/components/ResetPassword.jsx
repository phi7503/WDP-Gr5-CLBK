// src/components/ResetPassword.jsx
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, CheckCircle, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/app.context";
import test4 from "../assets/register.jpg";

const roleHome = (role) =>
  role === "admin" ? "/admin" : role === "employee" ? "/staff" : "/";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [newUser, setNewUser] = useState(null); // user sau khi reset (từ BE)

  const validate = () => {
    const newErr = {};

    if (!password) newErr.password = "Mật khẩu mới là bắt buộc";
    else if (password.length < 6)
      newErr.password = "Mật khẩu phải có ít nhất 6 ký tự";

    if (!confirmPassword)
      newErr.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
    else if (password !== confirmPassword)
      newErr.confirmPassword = "Mật khẩu không khớp";

    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!token) {
      toast.error("Liên kết đặt lại mật khẩu không hợp lệ");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // để nhận cookie access mới
          body: JSON.stringify({ password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Đặt lại mật khẩu thất bại");
      }
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setNewUser(data.user);
      }

      toast.success(data?.message || "Đặt lại mật khẩu thành công");
      setIsSubmitted(true);
    } catch (err) {
      setApiError(err.message || "Đặt lại mật khẩu thất bại");
      toast.error(err.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="flex w-full min-h-[32rem] max-w-[64rem] overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Left - Image */}
          <div className="hidden md:block md:w-1/2 relative">
            <img
              src={test4}
              alt="Cinema"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right - Success */}
          <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
                <CheckCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-red-600 mb-2">
                Đổi Mật Khẩu Thành Công
              </h1>
              <p className="text-gray-600">
                Bạn đã được đăng nhập với mật khẩu mới.
              </p>

              <button
                onClick={() =>
                  navigate("/login")
                }
                className="inline-flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📝 Form reset mật khẩu
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="flex w-full min-h-[32rem] max-w-[64rem] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Left side - Cinema Image */}
        <div className="hidden md:block md:w-1/2 relative">
          <img
            src={test4}
            alt="Cinema"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side - Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-red-600 mb-2">
              Đặt Lại Mật Khẩu
            </h1>
            <p className="text-gray-600">
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mật khẩu mới */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    placeholder="Mật khẩu mới"
                    className={`w-full pl-11 pr-12 py-3 bg-blue-50 border ${
                      errors.password ? "border-red-500" : "border-transparent"
                    } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
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
                  <p className="mt-1 text-sm text-red-500 text-left">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Xác nhận mật khẩu */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                    placeholder="Xác nhận mật khẩu mới"
                    className={`w-full pl-11 pr-12 py-3 bg-blue-50 border ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-transparent"
                    } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500 text-left">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* API error */}
              {apiError && (
                <p className="text-sm text-red-600 text-left">{apiError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? "Đang đặt lại..." : "Đổi mật khẩu"}
              </button>
            </form>

            <div className="pt-2">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
