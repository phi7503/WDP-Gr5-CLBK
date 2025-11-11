// src/App.jsx
import React from "react";
import Header from "./components/Header";
import AuthLayout from "./components/AuthLayout";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import { useAuth } from "./context/app.context";

import EmployeeDashboardPage from "./components/pages/EmployeeDashboardPage";
import EmployeeBookTicket from "./components/pages/EmployeeBookTicket";
import EmployeeBookingsPage from "./components/pages/EmployeeBookingsPage";
import EmployeeProfilePage from "./components/pages/EmployeeProfilePage";
import EmployeeQRCheckinPage from "./components/pages/EmployeeQRCheckinPage";

import AdminUserManagementPage from "./components/pages/AdminUserManagementPage";
import UserProfilePage from "./components/pages/UserProfilePage";
import AdminDashboard from "./components/pages/AdminDashboard";
import { Toaster } from "react-hot-toast";
import EmployeeLayout from "./components/booking/EmployeeLayout";

// Admin feature pages
import AdminMovies from "./components/admin/movies/AdminMovies";
import AdminBranches from "./components/admin/branches/AdminBranches";
import ShowtimeManagement from "./components/admin/ShowtimeManagement";
import SeatLayoutManagement from "./components/admin/SeatLayoutManagement";

// ✅ AppRouter: toàn bộ QuickShow client
import AppRouter from "./router/AppRouter";

const StaffDashboard = () => <div className="p-6">Staff Dashboard</div>;
const Forbidden = () => <div className="p-6">403 — Forbidden</div>;

const roleHome = (role) => {
  switch (role) {
    case "admin":
      return "/admin";
    case "employee":
      return "/staff/dashboard";
    default:
      return "/";
  }
};

function GuestRoute() {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated) return <Navigate to={roleHome(role)} replace />;
  return <Outlet />;
}

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RoleRoute({ allow = [] }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to="/403" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Routes>
        {/* ✅ Toàn bộ site QuickShow cho user (Home, Movies, Showtimes, ...) */}
        {/* AppRouter tự lo Header + MainLayout + Routes bên trong */}
        <Route path="/*" element={<AppRouter />} />

        {/* Auth chỉ dành cho khách (chưa login) */}
        <Route element={<GuestRoute />}>
          <Route
            path="/login"
            element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout>
                <Register />
              </AuthLayout>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Protected chung (cần đăng nhập) */}
        <Route element={<ProtectedRoute />}>
          {/* Profile user – tuỳ bạn có muốn cho vào AppRouter hay không */}
          <Route path="/profile" element={<UserProfilePage />} />
        </Route>

        {/* Admin-only */}
        <Route element={<RoleRoute allow={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
          <Route path="/admin/movies" element={<AdminMovies />} />
          <Route path="/admin/branches" element={<AdminBranches />} />
          <Route path="/admin/showtimes" element={<ShowtimeManagement />} />
          <Route
            path="/admin/seat-layouts"
            element={<SeatLayoutManagement />}
          />
        </Route>

        {/* Employee hoặc Admin */}
        <Route element={<RoleRoute allow={["employee", "admin"]} />}>
          <Route element={<EmployeeLayout />}>
            <Route
              path="/staff/dashboard"
              element={<EmployeeDashboardPage />}
            />
            <Route path="/staff/bookings" element={<EmployeeBookingsPage />} />
            <Route path="/staff/book-ticket" element={<EmployeeBookTicket />} />
            <Route path="/staff/profile" element={<EmployeeProfilePage />} />
            <Route
              path="/staff/qr-checkin"
              element={<EmployeeQRCheckinPage />}
            />
          </Route>
        </Route>

        {/* Misc */}
        <Route path="/403" element={<Forbidden />} />
      </Routes>

      <Toaster />
    </div>
  );
}
