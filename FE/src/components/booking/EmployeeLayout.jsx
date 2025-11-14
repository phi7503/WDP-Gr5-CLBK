import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Calendar,
  Ticket,
  QrCode,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/app.context";

export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout =  () => {
     logout();
    navigate("/");
    console.log("HẢ")
  };
  const navigation = [
    { name: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    { name: "Hồ sơ", href: "/staff/profile", icon: User },
    // { name: "Đặt vé", href: "/staff/book-ticket", icon: Ticket },
    // { name: "Lịch đặt vé", href: "/staff/bookings", icon: Calendar },
    { name: "QR Check-in", href: "/staff/qr-checkin", icon: QrCode },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 z-40 transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        w-64 lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold text-red-600">CLBK Cinema</h1>
            <p className="text-sm text-gray-400 mt-1">Nhân viên</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? "bg-red-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => handleLogout()}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        <Outlet />
      </main>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
