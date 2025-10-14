// front-end/src/main.jsx
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import "./style.css";
import "./animations.css";
import "./showtimes-colors.css";

// ✅ Eager loading cho trang chính (HomePage)
import HomePage from "./components/HomePage";

// 🚀 Lazy loading cho các trang khác (load khi cần)
const MoviesListPage = lazy(() => import("./components/MoviesListPage"));
const MovieDetail = lazy(() => import("./components/MovieDetail"));
const BookingPage = lazy(() => import("./components/BookingPage"));
const RealTimeBookingPage = lazy(() => import("./components/RealTimeBookingPage"));
const SocketTestPage = lazy(() => import("./components/SocketTestPage"));
const ShowtimesPage = lazy(() => import("./components/ShowtimesPage"));
const ShowtimesByChainPage = lazy(() => import("./components/ShowtimesByChainPage"));
const ShowtimesPageModern = lazy(() => import("./components/ShowtimesPageModern"));
const BranchListPage = lazy(() => import("./components/BranchListPage"));
const ComboPage = lazy(() => import("./components/ComboPage"));
const VoucherPage = lazy(() => import("./components/VoucherPage"));
const BookingDetailsPage = lazy(() => import("./components/BookingDetailsPage"));

// 🎬 Cinema Loading Component (Fallback khi lazy load)
const CinemaPageLoader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Background animated grain */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0.03,
      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
      animation: 'grain 0.5s steps(10) infinite'
    }} />

    {/* Film reel spinner */}
    <div style={{
      width: '100px',
      height: '100px',
      border: '5px solid transparent',
      borderImage: 'linear-gradient(135deg, #FFD700, #FF6B00) 1',
      borderRadius: '50%',
      position: 'relative',
      animation: 'filmReelSpin 2s linear infinite',
      boxShadow: '0 0 30px rgba(255, 107, 0, 0.5), inset 0 0 30px rgba(255, 215, 0, 0.3)'
    }}>
      {/* Center icon */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '50px',
        filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))',
        animation: 'iconPulse 2s ease-in-out infinite'
      }}>
        🎬
      </div>

      {/* Perforations */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 360) / 8;
        const radius = 35;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              background: 'linear-gradient(135deg, #FFD700, #FF6B00)',
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              boxShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
              animation: `perfBlink ${1 + i * 0.15}s ease-in-out infinite`
            }}
          />
        );
      })}

      {/* Motion blur effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: 'conic-gradient(from 0deg, transparent 0%, rgba(255, 215, 0, 0.3) 50%, transparent 100%)',
        animation: 'filmReelSpin 1.5s linear infinite',
        pointerEvents: 'none'
      }} />
    </div>

    {/* Loading text */}
    <div style={{
      marginTop: '40px',
      textAlign: 'center'
    }}>
      <p style={{
        color: '#FFD700',
        fontSize: '24px',
        fontWeight: '700',
        textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
        animation: 'textPulse 1.5s ease-in-out infinite',
        marginBottom: '10px',
        letterSpacing: '2px'
      }}>
        Loading Cinema Experience
      </p>
      <p style={{
        color: '#FF6B00',
        fontSize: '14px',
        fontFamily: 'monospace',
        opacity: 0.8,
        animation: 'dotsAnimation 1.5s ease-in-out infinite'
      }}>
        Please wait...
      </p>
    </div>

    {/* Scan lines effect */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
      pointerEvents: 'none'
    }} />

    {/* Animations */}
    <style>{`
      @keyframes filmReelSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes perfBlink {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
      }

      @keyframes textPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      @keyframes iconPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.1); }
      }

      @keyframes dotsAnimation {
        0%, 20% { content: '.'; }
        40% { content: '..'; }
        60%, 100% { content: '...'; }
      }

      @keyframes grain {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-5%, -10%); }
        30% { transform: translate(3%, -15%); }
        50% { transform: translate(-5%, 5%); }
        70% { transform: translate(15%, 0%); }
        90% { transform: translate(-10%, 15%); }
      }
    `}</style>
  </div>
);

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Suspense fallback={<CinemaPageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesListPage />} />
            <Route path="/showtimes" element={<ShowtimesPageModern />} />
            <Route path="/showtimes-old" element={<ShowtimesPage />} />
            <Route path="/showtimes-by-chain" element={<ShowtimesByChainPage />} />
            <Route path="/branches" element={<BranchListPage />} />
            <Route path="/combos" element={<ComboPage />} />
            <Route path="/vouchers" element={<VoucherPage />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/booking/:showtimeId" element={<BookingPage />} />
            <Route path="/realtime-booking/:showtimeId" element={<RealTimeBookingPage />} />
            <Route path="/socket-test" element={<SocketTestPage />} />
            <Route path="/booking-details/:bookingId" element={<BookingDetailsPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);
