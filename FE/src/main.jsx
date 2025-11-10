import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import "antd/dist/reset.css";
import "./style.css";
import "./app/cinema-theme.css"; // <-- thêm dòng này, file ở bước 2
import App from "./App.jsx";
import { AppProvider } from "./context/app.context.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
