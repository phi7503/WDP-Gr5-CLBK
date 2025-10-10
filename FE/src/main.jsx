// front-end/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./style.css";
import HomePage from "./components/HomePage";
import MoviesListPage from "./components/MoviesListPage";
import MovieDetail from "./components/MovieDetail";
import BookingPage from "./components/BookingPage";
import ShowtimesPage from "./components/ShowtimesPage";
import BranchListPage from "./components/BranchListPage";
import ComboPage from "./components/ComboPage";
import VoucherPage from "./components/VoucherPage";
import BookingDetailsPage from "./components/BookingDetailsPage";

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesListPage />} />
        <Route path="/showtimes" element={<ShowtimesPage />} />
        <Route path="/branches" element={<BranchListPage />} />
        <Route path="/combos" element={<ComboPage />} />
        <Route path="/vouchers" element={<VoucherPage />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/booking/:showtimeId" element={<BookingPage />} />
        <Route path="/booking-details/:bookingId" element={<BookingDetailsPage />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
