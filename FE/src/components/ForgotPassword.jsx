import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import test4 from "../assets/register.jpg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validate FE
    if (!email) {
      setError("Email là bắt buộc");
      return;
    }

    if (!validateEmail(email)) {
      setError("Email không hợp lệ");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // có cũng không sao, cho đồng bộ
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Gửi email đặt lại mật khẩu thất bại");
      }

      // ✅ success
      toast.success(
        data?.message || "Đã gửi email đặt lại mật khẩu, vui lòng kiểm tra hộp thư"
      );
      setIsSubmitted(true);
    } catch (err) {
      // ❌ error
      toast.error(err.message || "Gửi email đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  if (isSubmitted) {
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

          {/* Right side - Success Message */}
          <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
                <CheckCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-red-600 mb-2">
                Email Đã Gửi!
              </h1>
              <p className="text-gray-600">Vui lòng kiểm tra hộp thư của bạn</p>

              <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                <p className="text-gray-700">
                  Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email:
                </p>
                <p className="text-red-600 font-semibold text-lg">{email}</p>
                <p className="text-sm text-gray-600">
                  Nếu bạn không nhận được email trong vài phút, vui lòng kiểm
                  tra thư mục spam.
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form mode
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
              Quên Mật Khẩu
            </h1>
            <p className="text-gray-600">Nhập email để đặt lại mật khẩu</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 bg-blue-50 border ${
                      error ? "border-red-500" : "border-transparent"
                    } rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
                    placeholder="example@email.com"
                  />
                </div>
                {error && (
                  <p className="mt-1 text-sm text-red-500 text-left">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? "Đang gửi..." : "Gửi Email Đặt Lại"}
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
