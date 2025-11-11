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

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState("info");

  const tabs = [
    { id: "info", label: "Thông tin cá nhân", icon: User },
    { id: "password", label: "Đổi mật khẩu", icon: Lock },
    { id: "membership", label: "Thành viên", icon: Crown },
    { id: "history", label: "Lịch sử mua vé", icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
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
            {activeTab === "membership" && <Membership />}
            {activeTab === "history" && <TicketHistory />}
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
      if (!res.ok) throw new Error(data?.message || "Cập nhật thất bại");

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
      if (!res.ok) throw new Error(data?.message || "Đổi mật khẩu thất bại");

      // (tuỳ chọn) lưu token mới nếu BE re-issue
      if (data.token) localStorage.setItem("token", data.token);

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      alert("Đổi mật khẩu thành công!");
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

function Membership() {
  const userData = {
    tier: "silver",
    points: 3500,
    nextTierPoints: 5000,
    discount: 10,
    totalSpent: 2500000,
    memberSince: "01/2024",
  };

  const tiers = [
    {
      id: "bronze",
      name: "Đồng",
      icon: Crown,
      color: "from-amber-700 to-amber-900",
      borderColor: "border-amber-700",
      bgColor: "bg-amber-900/20",
      textColor: "text-amber-500",
      pointsRequired: 0,
      discount: 5,
      benefits: [
        "Giảm giá 5% cho vé xem phim",
        "Tích điểm mỗi lần mua vé",
        "Thông báo phim mới sớm nhất",
      ],
    },
    {
      id: "silver",
      name: "Bạc",
      icon: Star,
      color: "from-gray-400 to-gray-600",
      borderColor: "border-gray-400",
      bgColor: "bg-gray-600/20",
      textColor: "text-gray-300",
      pointsRequired: 2000,
      discount: 10,
      benefits: [
        "Giảm giá 10% cho vé xem phim",
        "Giảm giá 5% cho combo đồ ăn",
        "Tích điểm x1.5 mỗi lần mua",
        "Ưu tiên đặt vé trước 24h",
      ],
    },
    {
      id: "gold",
      name: "Vàng",
      icon: Sparkles,
      color: "from-yellow-400 to-yellow-600",
      borderColor: "border-yellow-400",
      bgColor: "bg-yellow-600/20",
      textColor: "text-yellow-400",
      pointsRequired: 5000,
      discount: 15,
      benefits: [
        "Giảm giá 15% cho vé xem phim",
        "Giảm giá 10% cho combo đồ ăn",
        "Tích điểm x2 mỗi lần mua",
        "Ưu tiên đặt vé trước 48h",
        "1 vé miễn phí mỗi tháng",
      ],
    },
    {
      id: "platinum",
      name: "Bạch Kim",
      icon: Crown,
      color: "from-purple-400 to-pink-600",
      borderColor: "border-purple-400",
      bgColor: "bg-purple-600/20",
      textColor: "text-purple-400",
      pointsRequired: 10000,
      discount: 20,
      benefits: [
        "Giảm giá 20% cho vé xem phim",
        "Giảm giá 15% cho combo đồ ăn",
        "Tích điểm x3 mỗi lần mua",
        "Ưu tiên đặt vé trước 72h",
        "2 vé miễn phí mỗi tháng",
        "Phòng VIP miễn phí",
      ],
    },
  ];

  const currentTierData = tiers.find((t) => t.id === userData.tier);
  const nextTierData =
    tiers[tiers.findIndex((t) => t.id === userData.tier) + 1];
  const progress = nextTierData
    ? (userData.points / nextTierData.pointsRequired) * 100
    : 100;

  return (
    <div className="space-y-6">
      <div
        className={`bg-gradient-to-br ${currentTierData.color} rounded-2xl p-6 border ${currentTierData.borderColor} shadow-2xl`}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <currentTierData.icon className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-bold text-white">
                Hạng {currentTierData.name}
              </h2>
            </div>
            <p className="text-white/80">
              Thành viên từ {userData.memberSince}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Giảm giá hiện tại</p>
            <p className="text-4xl font-bold text-white">
              {userData.discount}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white/70 text-sm mb-1">Điểm tích lũy</p>
            <p className="text-2xl font-bold text-white">
              {userData.points.toLocaleString()}
            </p>
          </div>
          <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white/70 text-sm mb-1">Tổng chi tiêu</p>
            <p className="text-2xl font-bold text-white">
              {(userData.totalSpent / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        {nextTierData && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-white/90 text-sm font-medium">
                Tiến độ lên hạng {nextTierData.name}
              </p>
              <p className="text-white/90 text-sm font-medium">
                {userData.points}/{nextTierData.pointsRequired}
              </p>
            </div>
            <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/70 text-xs mt-2">
              Còn {nextTierData.pointsRequired - userData.points} điểm nữa để
              lên hạng
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Gift className="w-6 h-6 text-red-500" />
          Các Hạng Thành Viên
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrentTier = tier.id === userData.tier;
            const isLocked = tier.pointsRequired > userData.points;

            return (
              <div
                key={tier.id}
                className={`bg-gray-900 rounded-xl p-6 border-2 transition-all ${
                  isCurrentTier
                    ? `${tier.borderColor} shadow-lg`
                    : isLocked
                    ? "border-gray-800 opacity-60"
                    : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`${tier.bgColor} p-3 rounded-xl`}>
                      <Icon className={`w-6 h-6 ${tier.textColor}`} />
                    </div>
                    <div>
                      <h4 className={`text-lg font-bold ${tier.textColor}`}>
                        Hạng {tier.name}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {tier.pointsRequired === 0
                          ? "Mặc định"
                          : `${tier.pointsRequired.toLocaleString()} điểm`}
                      </p>
                    </div>
                  </div>
                  {isCurrentTier && (
                    <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Hiện tại
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div
                    className={`inline-block ${tier.bgColor} px-4 py-2 rounded-lg`}
                  >
                    <p className={`text-2xl font-bold ${tier.textColor}`}>
                      Giảm {tier.discount}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {tier.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.textColor}`}
                      />
                      <p className="text-gray-300 text-sm">{benefit}</p>
                    </div>
                  ))}
                </div>

                {isLocked && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Cần thêm{" "}
                      {(
                        tier.pointsRequired - userData.points
                      ).toLocaleString()}{" "}
                      điểm
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-6 h-6 text-red-500" />
          Cách Tích Điểm
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="bg-red-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
              <Ticket className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="text-white font-semibold mb-2">Mua Vé Xem Phim</h4>
            <p className="text-gray-400 text-sm">1.000đ = 1 điểm</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="bg-red-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
              <Gift className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="text-white font-semibold mb-2">Mua Combo Đồ Ăn</h4>
            <p className="text-gray-400 text-sm">1.000đ = 0.5 điểm</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="bg-red-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="text-white font-semibold mb-2">Sự Kiện Đặc Biệt</h4>
            <p className="text-gray-400 text-sm">Điểm thưởng x2-x3</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketHistory() {
  const [expandedId, setExpandedId] = useState(null);
  const [tickets] = useState([
    {
      id: 1,
      movieTitle: "Avatar: The Way of Water",
      poster: "/generic-sci-fi-poster.png",
      cinema: "CGV Vincom Center",
      date: "15/10/2025",
      time: "19:30",
      seats: ["A5", "A6"],
      totalPrice: 200000,
      status: "completed",
    },
    {
      id: 2,
      movieTitle: "Avengers: Endgame",
      poster: "/avengers-endgame-poster.jpg",
      cinema: "Lotte Cinema Đà Nẵng",
      date: "20/10/2025",
      time: "21:00",
      seats: ["B7", "B8", "B9"],
      totalPrice: 300000,
      status: "upcoming",
    },
    {
      id: 3,
      movieTitle: "Inception",
      poster: "/inception-movie-poster.png",
      cinema: "Galaxy Cinema Nguyễn Du",
      date: "05/10/2025",
      time: "18:00",
      seats: ["C10"],
      totalPrice: 100000,
      status: "cancelled",
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Đã xem";
      case "upcoming":
        return "Sắp chiếu";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <Ticket className="w-6 h-6 text-red-500" />
        <h2 className="text-2xl font-bold text-white">Lịch Sử Mua Vé</h2>
        <span className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full">
          {tickets.length}
        </span>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <Ticket className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Bạn chưa mua vé nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-red-500 transition-all"
            >
              <div className="p-4">
                <div className="flex gap-4">
                  <img
                    src={ticket.poster || "/placeholder.svg"}
                    alt={ticket.movieTitle}
                    className="w-20 h-28 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-semibold text-lg">
                        {ticket.movieTitle}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {getStatusText(ticket.status)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{ticket.cinema}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{ticket.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{ticket.time}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(ticket.id)}
                      className="mt-3 flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      {expandedId === ticket.id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Xem chi tiết
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {expandedId === ticket.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Ghế ngồi</p>
                        <div className="flex gap-2">
                          {ticket.seats.map((seat) => (
                            <span
                              key={seat}
                              className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-lg"
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Tổng tiền</p>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-500" />
                          <span className="text-white text-lg font-bold">
                            {ticket.totalPrice.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
