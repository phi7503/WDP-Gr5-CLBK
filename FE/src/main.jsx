import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import "./app/cinema-theme.css";
// ✅ style.css đã import cả antd/dist/reset.css và tailwindcss
import App from "./App.jsx";
import { AppProvider } from "./context/app.context.jsx";
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
import { message } from "antd";
import "./style.css";
import "./animations.css";
import "./showtimes-colors.css";
import "./styles/message.css";
import "./styles/notification.css";
import { AuthProvider } from "./contexts/AuthContext";

// ✅ Cấu hình Ant Design Message
message.config({
  top: 80,
  duration: 4,
  maxCount: 3,
  rtl: false,
  prefixCls: 'ant-message',
  getContainer: () => document.body,
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
    <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AppProvider>
    </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
