import React from "react";
import Header from "./components/Header";
import AuthLayout from "./components/AuthLayout";
import { Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import BranchForm from "./components/admin/BranchForm";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Routes>
        <Route path="/login" element={<div className="">
      <AuthLayout><Login></Login></AuthLayout></div>}> </Route>
        <Route path="/register" element={<div className="">
      <AuthLayout><Register></Register></AuthLayout></div>}> </Route>
        <Route path="/" element={<div className="">
      <Header/></div>}> </Route>
      
       
       
      Hello world
      </Routes>
    </div>
  );
}
