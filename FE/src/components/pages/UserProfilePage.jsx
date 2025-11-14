"use client";

import { useState } from "react";
import {
  User,
  Lock,
  Ticket,
  Crown,
  Mail,
  Phone,
  Camera,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Star,
  Gift,
  TrendingUp,
  Check,
  Sparkles,
} from "lucide-react";
import avatarPlaceholder from "../../assets/avatar-placeholder.png";
import { useAuth } from "../../context/app.context";
import Header from "../Header";
import toast from "react-hot-toast";

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState("info");

  const tabs = [
    { id: "info", label: "Thông tin cá nhân", icon: User },
    { id: "password", label: "Đổi mật khẩu", icon: Lock },
    // { id: "membership", label: "Thành viên", icon: Crown },
    // { id: "history", label: "Lịch sử mua vé", icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Header className="mb-8" />
        <div className="mb-8 mt-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trang Cá Nhân</h1>
          <p className="text-gray-400">
            Quản lý thông tin và hoạt động của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? "bg-red-600 text-white shadow-lg"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "info" && <ProfileInfo />}
            {activeTab === "password" && <ChangePassword />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileInfo() {
  const { user, setUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(avatarPlaceholder);
  const [formData, setFormData] = useState({
    fullName: user.name || "Nguyễn Văn A",
    email: user.email || "nguyenvana@example.com",
    phone: user.phone || "0123456789",
  });
  const [errors, setErrors] = useState({});

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName || formData.fullName.length < 3) {
      newErrors.fullName = "Họ tên phải có ít nhất 3 ký tự";
    }

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.phone || !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại phải có 10 chữ số";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch(`http://localhost:5000/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        }),
      });
      const data = await res.json();
      if (!res.status !== 200) throw new Error(data?.message || "Cập nhật thất bại");
      setUser(data.user);
      setIsEditing(false);
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Thông Tin Cá Nhân</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex justify-center mb-8">
          <div className="relative">
            <img
              src={avatarPreview || "/placeholder.svg"}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-red-600"
            />
            {isEditing && (
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg"
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Họ và tên
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full pl-11 pr-4 py-3 bg-gray-800 border ${
                  errors.fullName ? "border-red-500" : "border-gray-700"
                } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all`}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full pl-11 pr-4 py-3 bg-gray-800 border ${
                  errors.email ? "border-red-500" : "border-gray-700"
                } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Số điện thoại
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full pl-11 pr-4 py-3 bg-gray-800 border ${
                  errors.phone ? "border-red-500" : "border-gray-700"
                } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all`}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold rounded-xl transition-all"
            >
              <Save className="w-5 h-5" />
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
            >
              Hủy
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function ChangePassword() {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };
  const { user } = useAuth();
  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.newPassword)
    ) {
      newErrors.newPassword = "Mật khẩu phải có chữ hoa, chữ thường và số";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/change-password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
        }
      );
      const data = await res.json();
      if (res.status !== 200) throw new Error(data?.message || "Đổi mật khẩu thất bại");
      if (data.token) localStorage.setItem("token", data.token);

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      alert("Đổi mật khẩu thành công!");
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err.message }));
      toast.error(`Đổi mật khẩu không thành công!:${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">Đổi Mật Khẩu</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPasswords.current ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`w-full pl-11 pr-12 py-3 bg-gray-800 border ${
                errors.currentPassword ? "border-red-500" : "border-gray-700"
              } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPasswords.current ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-400">
              {errors.currentPassword}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPasswords.new ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`w-full pl-11 pr-12 py-3 bg-gray-800 border ${
                errors.newPassword ? "border-red-500" : "border-gray-700"
              } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPasswords.new ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPasswords.confirm ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full pl-11 pr-12 py-3 bg-gray-800 border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-700"
              } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-400">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold rounded-xl transition-all"
        >
          <Save className="w-5 h-5" />
          {isLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
}

