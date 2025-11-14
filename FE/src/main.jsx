import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme as antdTheme, App as AntApp } from "antd";
import "./app/cinema-theme.css";
// ✅ Ant Design CSS được import trong style.css để đảm bảo thứ tự đúng
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
import "./style.css";
import "./animations.css";
import "./showtimes-colors.css";
import "./styles/message.css";
import "./styles/notification.css";
import { AuthProvider } from "./contexts/AuthContext";

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
        <AntApp>
          <AuthProvider>
            <AppProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AppProvider>
          </AuthProvider>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
