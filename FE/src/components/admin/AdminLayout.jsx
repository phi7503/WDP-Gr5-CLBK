import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Film,
  MapPin,
  Calendar,
  Grid3x3,
  Building2,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/app.context";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
    console.log("HẢ");
  };
  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Quản lý người dùng", href: "/admin/users", icon: Users },
    { name: "Quản lý phim", href: "/admin/movies", icon: Film },
    { name: "Quản lý chi nhánh", href: "/admin/branches", icon: MapPin },
    { name: "Quản lý suất chiếu", href: "/admin/showtimes", icon: Calendar },
    { name: "Quản lý sơ đồ ghế", href: "/admin/seat-layouts", icon: Grid3x3 },
    { name: "Quản lý phòng chiếu", href: "/admin/theaters", icon: Building2 },
  ];

  const isActive = (href) => {
    if (href === "/admin") {
      return (
        location.pathname === "/admin" ||
        location.pathname === "/admin/dashboard"
      );
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-40 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold text-red-600">CLBK Admin</h1>
            <p className="text-sm text-gray-400 mt-1">Quản trị viên</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? "bg-red-600 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => handleLogout()}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
}
