// front-end/src/main.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { AppProvider } from "./context/app.context.jsx";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Khởi tạo 1 queryClient (tắt refetch khi focus để đỡ giật UI)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 phút
    },
  },
});
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
