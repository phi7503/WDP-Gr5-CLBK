import React from "react";

export default function AuthLayout({children}) {
  return (
    <main className="flex h-screen items-center justify-center p-5">
      
        {children}
     
    </main>
  );
}
