import React from "react";
import { Layout } from "antd";
import Header from "./Header";

const { Content } = Layout;

export default function MainLayout({ children }) {
  return (
    <Layout style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <Header />
      <Content style={{ paddingTop: 64 }}>
        {/* paddingTop để chừa chỗ cho header fixed */}
        {children}
      </Content>
    </Layout>
  );
}
