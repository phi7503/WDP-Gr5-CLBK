import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import AuthLayout from "./components/AuthLayout";

// dùng component trong components:
import AdminMovies from "./components/admin/movies/AdminMovies";
import AdminBranches from "./components/admin/branches/AdminBranches";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Routes>
        {/* Public */}
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

        {/* Home */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-semibold">Home</h1>
                <p className="text-neutral-300 mt-2">
                  Chọn menu hoặc truy cập /admin/movies để quản lý phim.
                </p>
              </main>
            </>
          }
        />

        {/* Admin: Movies (screen trong components) */}
        <Route path="/admin/movies" element={<AdminMovies />} />
        <Route path="/admin/branches" element={<AdminBranches />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
