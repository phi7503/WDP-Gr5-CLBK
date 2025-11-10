import React from "react";
import { Link, NavLink } from "react-router-dom";
import SearchField from "./ui/SearchField";
import UserButton from "./ui/UserButton";
import {
  HomeIcon,
  Film,
  CalendarClock,
  MapPin,
  Ticket,
  Gift,
  Home,
} from "lucide-react";
export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-card shadow-sm">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-5 px-2 py-3">
        <div className="flex gap-5 items-center">
          <Link to="/" className="text-3xl font-bold text-blue-500">
            CLBK
          </Link>
          <SearchField />
        </div>
        <NavBar />
        <UserButton />
      </div>
    </header>
  );
}

export const NavBar = () => {
  return (
    <nav
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block"
      aria-label="Main navigation"
    >
      <ul className="flex items-center gap-4 md:gap-6">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              [
                "flex flex-col items-center gap-2 px-3 py-2 transition",
                "hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-blue-500",
                isActive ? "text-blue-500": "",
              ].join(" ")
            }
            aria-label={"Trang chủ"}
          >
            <Home className="size-7" />
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/film"
            className={({ isActive }) =>
              [
                "flex flex-col items-center gap-2 px-3 py-2 transition",
                "hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-blue-500",
                isActive ? "text-blue-500": "",
              ].join(" ")
            }
            aria-label={"Film"}
          >
            <Film className="size-7" />
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              [
                "flex flex-col items-center gap-2 px-3 py-2 transition",
                "hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-blue-500",
                isActive ? "text-blue-500": "",
              ].join(" ")
            }
            aria-label={"CalendarClock"}
          >
            <CalendarClock className="size-7" />
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/map"
            className={({ isActive }) =>
              [
                "flex flex-col items-center gap-2 px-3 py-2 transition",
                "hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-blue-500",
                isActive ? "text-blue-500": "",
              ].join(" ")
            }
            aria-label={"MapPin"}
          >
            <MapPin className="size-7" />
          </NavLink>
        </li>
       
      </ul>
    </nav>
  );
};
