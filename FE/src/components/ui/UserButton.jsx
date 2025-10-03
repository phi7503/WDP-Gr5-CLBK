import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { User as UserIcon, LogOutIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import avatarPlaceholder from "../../assets/avatar-placeholder.png";
export default function UserButton({
  className,
  user = { username: "user", avatarUrl: "" },
  onLogout,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-block text-left"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
      onBlur={(e) => {
        // Nếu focus chuyển ra ngoài container => đóng
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "flex-none rounded-full ring-1 ring-gray-200 dark:ring-neutral-700",
          className
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
      >
        <UserAvatar avatarUrl={user?.avatarUrl} size={40} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-gray-200 bg-white p-1 shadow-lg",
            "dark:border-neutral-800 dark:bg-neutral-900"
          )}
        >
          <div className="px-3 py-2 text-sm font-semibold">
            @{user?.username}
          </div>

          <div className="my-1 h-px bg-gray-200 dark:bg-neutral-800" />

          <Link
            to={`/users/${user?.username}`}
            role="menuitem"
            className="block focus:outline-none"
          >
            <div className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700">
              <UserIcon className="size-4" />
              Profile
            </div>
          </Link>

          <div className="my-1 h-px bg-gray-200 dark:bg-neutral-800" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700",
              "text-red-600 hover:text-red-700 dark:text-red-400"
            )}
          >
            <LogOutIcon className="size-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
export function UserAvatar({ avatarUrl, size = 48, className }) {
  return (
    <img
      src={avatarUrl || avatarPlaceholder}
      alt="User avatar"
      width={size}
      height={size}
      className={cn(
        "aspect-square h-fit flex-none rounded-full bg-gray-200 object-cover",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
