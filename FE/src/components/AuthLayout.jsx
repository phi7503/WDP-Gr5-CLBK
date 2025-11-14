import React from "react";

export default function AuthLayout({children}) {
  return (
    <main 
      className="tailwind-isolated flex bg-gray-100 h-screen items-center justify-center p-5"
      style={{ 
        backgroundColor: '#f3f4f6',
        isolation: 'isolate' // Đảm bảo styles không bị override
      }}
    >
        {children}
    </main>
  );
}
