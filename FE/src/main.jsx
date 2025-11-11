import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import "antd/dist/reset.css";
import "./style.css";
import "./app/cinema-theme.css"; // <-- thêm dòng này, file ở bước 2
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
      <ConfigProvider
        theme={{
          algorithm: antdTheme.darkAlgorithm,
          token: {
            colorPrimary: "#ff4d4f",
            colorBgBase: "#0a0a0a",
            colorBgContainer: "#1a1a1a",
            colorTextBase: "#ffffff",
            borderRadius: 12,
          },
          components: {
            Button: { controlHeight: 40 },
            Table: { headerBg: "#141414", headerColor: "#d4d4d4" },
          },
        }}
      >
        <AppProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AppProvider>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
