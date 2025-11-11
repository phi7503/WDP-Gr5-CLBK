// src/components/Login.jsx
import React, { useEffect, useState } from "react";
import test5 from "../assets/login.jpg";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "../context/app.context";
import { toast } from "react-hot-toast";

const roleHome = (role) =>
  role === "admin" ? "/admin" : role === "employee" ? "/staff/dashboard" : "/";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMeAndGo = async () => {
    const res = await fetch(`http://localhost:5000/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Không lấy được thông tin người dùng");
    const { user } = await res.json();
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));

    navigate(roleHome(user.role), { replace: true }); // customer -> "/"
  };

  // --- email/password submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const errs = {};
    if (!formData.email) errs.email = "Email là bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errs.email = "Email không hợp lệ";
    if (!formData.password) errs.password = "Mật khẩu là bắt buộc";
    else if (formData.password.length < 6)
      errs.password = "Mật khẩu phải có ít nhất 6 ký tự";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const r = await fetch(`http://localhost:5000/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || "Đăng nhập thất bại");
      if (data.token) localStorage.setItem("token", data.token);

      await fetchMeAndGo();
      toast.success("Đăng nhập thành công");
    } catch (err) {
      setApiError(err.message);
      toast.error(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    sessionStorage.setItem("googleLoginPending", "1");
    window.location.href = `http://localhost:5000/api/auth/google`;
  };

  // Xử lý sau khi Google redirect về
  useEffect(() => {
    const fromGoogle = sessionStorage.getItem("googleLoginPending") === "1";
    const hash = window.location.hash || "";

    // Nếu có #token=... thì lưu token rồi gọi /me
    const hasToken = hash.startsWith("#token=");

    if (!hasToken && !fromGoogle) return;

    const run = async () => {
      try {
        if (hasToken) {
          const token = decodeURIComponent(hash.slice(7));
          if (token) localStorage.setItem("token", token);

          // clean hash
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
        }

        await fetchMeAndGo();
        toast.success("Đăng nhập Google thành công");
      } catch (err) {
        console.error("Google login / fetchMeAndGo error:", err);
        toast.error("Đăng nhập Google thất bại");
      } finally {
        sessionStorage.removeItem("googleLoginPending");
      }
    };

    run();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="overflow-y-auto p-10 min-h-screen md:w-1/2 flex items-center justify-center px-4">
      <div className="flex w-full min-h-[32rem] max-w-[64rem] overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-red-600">Login to CLBK</h1>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Mail className="w-5 h-5 text-red-600" />
              <span>Đăng nhập bằng Google</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
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
                  <p className="mt-1 text-sm text-red-500 text-left">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={`w-full px-4 py-3 pr-12 bg-blue-50 border ${
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

              {/* API error inline */}
              {apiError && (
                <p className="text-sm text-red-600 text-left">{apiError}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg mt-2"
              >
                {loading ? "Đang đăng nhập..." : "Login"}
              </button>
            </form>

            <div className="pt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="pt-4">
              <Link
                to="/register"
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Don't have an account? Sign up
              </Link>
            </div>
          </div>
        </div>

        <img
          src={test5}
          alt=""
          className="hidden w-1/2 object-cover md:block h-full"
        />
      </div>
    </div>
  );
}
