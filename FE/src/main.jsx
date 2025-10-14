// front-end/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import "./style.css";
import "./animations.css";
import "./showtimes-colors.css";
import HomePage from "./components/HomePage";
import MoviesListPage from "./components/MoviesListPage";
import MovieDetail from "./components/MovieDetail";
import BookingPage from "./components/BookingPage";
import RealTimeBookingPage from "./components/RealTimeBookingPage";
import SocketTestPage from "./components/SocketTestPage";
import ShowtimesPage from "./components/ShowtimesPage";
import ShowtimesByChainPage from "./components/ShowtimesByChainPage";
import ShowtimesPageModern from "./components/ShowtimesPageModern";
import BranchListPage from "./components/BranchListPage";
import ComboPage from "./components/ComboPage";
import VoucherPage from "./components/VoucherPage";
import BookingDetailsPage from "./components/BookingDetailsPage";

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  </React.StrictMode>
);
