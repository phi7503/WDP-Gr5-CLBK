import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
  Mail,
  Phone,
  User,
  Shield,
} from "lucide-react";
import api from "../services/api";

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]); // ✅ danh sách rạp
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Lấy danh sách user từ BE 1 lần
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await api.get("/admin/users"); // axios
        const rawUsers = res.data.users || res.data;

        const mapped = rawUsers.map((u) => ({
          id: u._id,
          fullName: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role || "customer",
          createdAt: u.createdAt ? u.createdAt.slice(0, 10) : "",
          // ✅ cố gắng map branch từ nhiều kiểu khác nhau
          branchId: u.branchId || u.branch?._id || null,
          branchName: u.branchName || u.branch?.name || "",
        }));

        setUsers(mapped);
      } catch (err) {
        console.error(err);
        setLoadError(
          err.response?.data?.message || "Lỗi tải danh sách người dùng"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ✅ Lấy danh sách rạp cho dropdown (dùng trong popup)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get("/branches");
        // tuỳ BE trả về, tạm chuẩn hoá về {id, name}
        const raw = res.data.branches || res.data;
        const mapped = raw.map((b) => ({
          id: b._id,
          name: b.name || b.branchName || "Rạp không tên",
        }));
        setBranches(mapped);
      } catch (e) {
        console.error("Fetch branches error:", e);
      }
    };
    fetchBranches();
  }, []);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone || "").includes(searchQuery);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + usersPerPage
  );

  // Tạo user (gọi API)
  const handleCreateUser = async (newUser) => {
    try {
      const res = await api.post("/admin/users", {
        name: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password,
        role: newUser.role,
        // ✅ chỉ gửi branchId nếu là nhân viên
        branchId:
          newUser.role === "employee" && newUser.branchId
            ? newUser.branchId
            : undefined,
      });

      const data = res.data;

      const user = {
        id: data._id,
        fullName: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        createdAt: data.createdAt ? data.createdAt.slice(0, 10) : "",
        branchId: data.branchId || data.branch?._id || newUser.branchId || null,
        branchName:
          data.branchName ||
          data.branch?.name ||
          branches.find((b) => b.id === newUser.branchId)?.name ||
          "",
      };

      setUsers((prev) => [...prev, user]);
      setIsCreateModalOpen(false);
    } catch (err) {
      alert(
        err.response?.data?.message || "Tạo tài khoản thất bại (client side)"
      );
    }
  };

  // Cập nhật user (gọi API)
  const handleUpdateUser = async (updatedUser) => {
    try {
      const res = await api.put(`/admin/users/${updatedUser.id}`, {
        name: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        branchId:
          updatedUser.role === "employee" && updatedUser.branchId
            ? updatedUser.branchId
            : undefined,
      });

      const data = res.data;

      const mapped = {
        id: data._id,
        fullName: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        createdAt: data.createdAt
          ? data.createdAt.slice(0, 10)
          : updatedUser.createdAt,
        branchId: data.branchId || data.branch?._id || updatedUser.branchId,
        branchName:
          data.branchName ||
          data.branch?.name ||
          branches.find((b) => b.id === updatedUser.branchId)?.name ||
          updatedUser.branchName ||
          "",
      };

      setUsers((prev) => prev.map((u) => (u.id === mapped.id ? mapped : u)));
      setEditingUser(null);
    } catch (err) {
      alert(
        err.response?.data?.message || "Cập nhật tài khoản thất bại (client)"
      );
    }
  };

  // Xóa user (gọi API)
  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDeletingUser(null);
    } catch (err) {
      alert(
        err.response?.data?.message || "Xóa tài khoản thất bại (client side)"
      );
    }
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Quản Lý Người Dùng
          </h1>
          <p className="text-gray-400">
            Quản lý tất cả tài khoản trong hệ thống
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-11 pr-8 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="customer">Khách hàng</option>
                <option value="employee">Nhân viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Tạo tài khoản
            </button>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-gray-400 text-sm">
            {loading
              ? "Đang tải danh sách người dùng..."
              : loadError
              ? loadError
              : `Hiển thị ${filteredUsers.length} / ${users.length} tài khoản`}
          </div>
        </div>

        {/* User Table */}
        <UserTable
          users={paginatedUsers}
          onEdit={setEditingUser}
          onDelete={setDeletingUser}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Trước
            </button>
            <span className="text-gray-400">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Sau
            </button>
          </div>
        )}

        {/* Modals */}
        {isCreateModalOpen && (
          <CreateUserModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateUser}
            branches={branches} // ✅ truyền rạp vào popup tạo
          />
        )}

        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onUpdate={handleUpdateUser}
            branches={branches} // ✅ truyền rạp vào popup sửa
          />
        )}

        {deletingUser && (
          <DeleteUserModal
            user={deletingUser}
            onClose={() => setDeletingUser(null)}
            onDelete={handleDeleteUser}
          />
        )}
      </div>
    </div>
  );
}

function UserTable({ users, onEdit, onDelete }) {
  const getRoleBadge = (role) => {
    const styles = {
      admin: "bg-red-900/30 text-red-400 border-red-800",
      employee: "bg-blue-900/30 text-blue-400 border-blue-800",
      customer: "bg-gray-800 text-gray-400 border-gray-700",
      guest: "bg-gray-800 text-gray-400 border-gray-700",
    };
    const labels = {
      admin: "Quản trị viên",
      employee: "Nhân viên",
      customer: "Khách hàng",
      guest: "Khách",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          styles[role] || styles.customer
        }`}
      >
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Họ và tên
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Số điện thoại
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Vai trò
              </th>
              {/* ✅ thêm cột Rạp cho nhân viên */}
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Rạp
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {user.fullName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-400">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-400">{user.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-400">
                    {user.role === "employee"
                      ? user.branchName || "Chưa gán rạp"
                      : "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-400">{user.createdAt}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-all"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-all"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-6 text-center text-gray-500 text-sm"
                >
                  Không có tài khoản nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, onCreate, branches }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
    branchId: "", // ✅ thêm branchId
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
    if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email không hợp lệ";
    if (!formData.phone.trim())
      newErrors.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[0-9]{10}$/.test(formData.phone))
      newErrors.phone = "Số điện thoại phải có 10 chữ số";
    if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu";
    else if (formData.password.length < 6)
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";

    // ✅ nếu là nhân viên thì bắt buộc chọn rạp
    if (formData.role === "employee" && !formData.branchId) {
      newErrors.branchId = "Vui lòng chọn rạp làm việc";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length === 0) {
      onCreate(formData);
    } else {
      setErrors(newErrors);
    }
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
      // nếu đổi role từ employee sang khác thì clear branchId
      ...(key === "role" && value !== "employee" ? { branchId: "" } : {}),
    }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900">
          <h2 className="text-xl font-bold text-white">Tạo Tài Khoản Mới</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Họ và tên
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="Nhập họ và tên"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="0123456789"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Vai trò
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            >
              <option value="customer">Khách hàng</option>
              <option value="employee">Nhân viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          {/* ✅ Chọn rạp khi role = employee */}
          {formData.role === "employee" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rạp làm việc
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => handleChange("branchId", e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              >
                <option value="">-- Chọn rạp --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="mt-1 text-sm text-red-400">{errors.branchId}</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
            >
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onUpdate, branches }) {
  const [formData, setFormData] = useState({
    ...user,
    branchId: user.branchId || "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
    if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email không hợp lệ";
    if (!formData.phone.trim())
      newErrors.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[0-9]{10}$/.test(formData.phone))
      newErrors.phone = "Số điện thoại phải có 10 chữ số";

    if (formData.role === "employee" && !formData.branchId) {
      newErrors.branchId = "Vui lòng chọn rạp làm việc";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length === 0) {
      onUpdate(formData);
    } else {
      setErrors(newErrors);
    }
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "role" && value !== "employee" ? { branchId: "" } : {}),
    }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900">
          <h2 className="text-xl font-bold text-white">Chỉnh Sửa Tài Khoản</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Họ và tên
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Vai trò
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            >
              <option value="customer">Khách hàng</option>
              <option value="employee">Nhân viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          {/* ✅ chọn rạp cho nhân viên */}
          {formData.role === "employee" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rạp làm việc
              </label>
              <select
                value={formData.branchId || ""}
                onChange={(e) => handleChange("branchId", e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              >
                <option value="">-- Chọn rạp --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="mt-1 text-sm text-red-400">{errors.branchId}</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
            >
              Cập nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteUserModal({ user, onClose, onDelete }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Xác Nhận Xóa</h2>
        </div>

        <div className="p-6">
          <p className="text-gray-300 mb-4">
            Bạn có chắc chắn muốn xóa tài khoản{" "}
            <span className="font-semibold text-white">{user.fullName}</span>?
          </p>
          <p className="text-sm text-gray-400">
            Hành động này không thể hoàn tác.
          </p>
        </div>

        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
          >
            Hủy
          </button>
          <button
            onClick={() => onDelete(user.id)}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
