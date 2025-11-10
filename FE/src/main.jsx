// front-end/src/main.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { AppProvider } from "./context/app.context.jsx";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>
);
