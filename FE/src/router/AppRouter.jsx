// src/router/AppRouter.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../components/MainLayout";

// Eager load cho Home
import HomePage from "../components/HomePage";

// Lazy load các page khác
const MoviesListPage = lazy(() => import("../components/MoviesListPage"));
const MovieDetail = lazy(() => import("../components/MovieDetail"));
const RealTimeBookingPage = lazy(() =>
  import("../components/RealTimeBookingPage")
);
const ShowtimesPage = lazy(() => import("../components/ShowtimesPage"));
const ShowtimesByChainPage = lazy(() =>
  import("../components/ShowtimesByChainPage")
);
const ShowtimesPageModern = lazy(() =>
  import("../components/ShowtimesPageModern")
);
const BranchListPage = lazy(() => import("../components/BranchListPage"));
const ComboPage = lazy(() => import("../components/ComboPage"));
const VoucherPage = lazy(() => import("../components/VoucherPage"));
const BookingDetailsPage = lazy(() =>
  import("../components/BookingDetailsPage")
);
const BookingHistoryPage = lazy(() =>
  import("../components/BookingHistoryPage")
);
const PaymentSuccessPage = lazy(() =>
  import("../components/PaymentSuccessPage")
);
const PaymentCancelPage = lazy(() =>
  import("../components/PaymentCancelPage")
);
const ConfirmationPage = lazy(() =>
  import("../components/ConfirmationPage")
);
const LoginRegisterPage = lazy(() =>
  import("../components/LoginRegisterPage")
);

// Loader (có thể move qua file riêng cho UI team sửa)
const CinemaPageLoader = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Reel */}
    <div
      style={{
        width: "100px",
        height: "100px",
        border: "5px solid transparent",
        borderImage: "linear-gradient(135deg, #FFD700, #FF6B00) 1",
        borderRadius: "50%",
        position: "relative",
        animation: "filmReelSpin 2s linear infinite",
        boxShadow:
          "0 0 30px rgba(255, 107, 0, 0.5), inset 0 0 30px rgba(255, 215, 0, 0.3)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "50px",
          filter: "drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))",
          animation: "iconPulse 2s ease-in-out infinite",
        }}
      >
        🎬
      </div>
    </div>

    <p
      style={{
        marginTop: "40px",
        color: "#FFD700",
        fontSize: "24px",
        fontWeight: "700",
      }}
    >
      Loading Cinema Experience
    </p>
  </div>
);

export default function AppRouter() {
  return (
    <MainLayout>
      <Suspense fallback={<CinemaPageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<MoviesListPage />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/movies/:id" element={<MovieDetail />} />

          <Route path="/showtimes" element={<ShowtimesPageModern />} />
          <Route path="/showtimes-old" element={<ShowtimesPage />} />
          <Route
            path="/showtimes-by-chain"
            element={<ShowtimesByChainPage />}
          />

          <Route path="/branches" element={<BranchListPage />} />
          <Route path="/combos" element={<ComboPage />} />
          <Route path="/vouchers" element={<VoucherPage />} />

          <Route
            path="/booking/:showtimeId"
            element={<RealTimeBookingPage />}
          />
          <Route
            path="/realtime-booking/:showtimeId"
            element={<RealTimeBookingPage />}
          />

          <Route
            path="/booking-details/:bookingId"
            element={<BookingDetailsPage />}
          />

          <Route path="/bookings" element={<BookingHistoryPage />} />
          <Route path="/login" element={<LoginRegisterPage />} />
          <Route path="/register" element={<LoginRegisterPage />} />

          <Route path="/confirmation" element={<ConfirmationPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-cancel" element={<PaymentCancelPage />} />

          {/* TODO: 404 page */}
        </Routes>
      </Suspense>
    </MainLayout>
  );
}
