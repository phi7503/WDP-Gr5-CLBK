import React from "react";

export default function AuthLayout({children}) {
  return (
    <main className="flex bg-gray-100 h-screen items-center justify-center p-5">
        {children}
    </main>
  );
}
