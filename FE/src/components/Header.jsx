import React from "react";
import { Link, NavLink } from "react-router-dom";
import SearchField from "./ui/SearchField";
import UserButton from "./ui/UserButton";
import {
  Home,
  Film,
  CalendarClock,
  MapPin,
  Ticket,
  Gift,
} from "lucide-react";
import { useAuth } from "../context/app.context";
import "../cinema-brand.css";

export default function Header() {
  const { user, reset } = useAuth();

  return (
    <header className="cinema-brand-header sticky top-0 z-20 shadow-sm">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-5 px-4 py-3">
        {/* Logo + Search */}
        <div className="flex items-center gap-5">
          <Link to="/" className="cinema-logo">
            <span style={{ color: "var(--primary-red)" }}>Quick</span>Show
          </Link>

          {/* Search (ẩn trên mobile cho gọn) */}
          <div className="hidden md:block w-[260px]">
            <div className="cinema-search-bar px-3 py-1">
              <SearchField />
            </div>
          </div>
        </div>

        {/* Nav center */}
        <NavBar />

        {/* User (profile, tên, logout) */}
        <UserButton user={user} onLogout={reset} />
      </div>
    </header>
  );
}

export const NavBar = () => {
  const base =
    "flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors duration-200";
  const hover =
    "hover:bg-gray-100/10 dark:hover:bg-neutral-800 hover:text-[var(--primary-red)]";

  const linkClass = ({ isActive }) =>
    [
      base,
      hover,
      isActive
        ? "text-[var(--primary-red)]"
        : "text-[var(--text-secondary)]",
    ].join(" ");

  return (
    <nav
      className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
      aria-label="Main navigation"
    >
      <ul className="flex items-center gap-4 md:gap-6">
        {/* Home */}
        <li>
          <NavLink to="/" className={linkClass} aria-label="Trang chủ">
            <Home className="size-6" />
          </NavLink>
        </li>

        {/* Movies */}
        <li>
          <NavLink
            to="/movies"
            className={linkClass}
            aria-label="Phim"
          >
            <Film className="size-6" />
          </NavLink>
        </li>

        {/* Showtimes */}
        <li>
          <NavLink
            to="/showtimes"
            className={linkClass}
            aria-label="Lịch chiếu"
          >
            <CalendarClock className="size-6" />
          </NavLink>
        </li>

        {/* Branches */}
        <li>
          <NavLink
            to="/branches"
            className={linkClass}
            aria-label="Chi nhánh"
          >
            <MapPin className="size-6" />
          </NavLink>
        </li>

        {/* Combos */}
        <li>
          <NavLink
            to="/combos"
            className={linkClass}
            aria-label="Combo"
          >
            <Ticket className="size-6" />
          </NavLink>
        </li>

        {/* Vouchers */}
        <li>
          <NavLink
            to="/vouchers"
            className={linkClass}
            aria-label="Voucher"
          >
            <Gift className="size-6" />
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};
