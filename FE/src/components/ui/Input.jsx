import { cn } from "../../lib/utils";

export default function Input({ className, type = "text", ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "block w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2",
        "text-base md:text-sm text-gray-900 placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  );
}
