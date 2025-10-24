import React from "react";
import Header from "./components/header";
import AuthLayout from "./components/AuthLayout";
import { Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import EmployeeBookTicket from "./components/pages/EmployeeBookTicket";
import EmployeeDashboardPage from "./components/pages/EmployeeDashoboardPage";
import EmployeeBookingsPage from "./components/pages/EmployeeBookingsPage";
import CustomerBookingHistory from "./components/pages/CustomerBookingHistory";
import CustomerTicketDetails from "./components/pages/CustomerTicketDetails";

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
        <Route path="/employee/dashboard" element={<div className="">
      <Header/><EmployeeDashboardPage/></div>}> </Route>
        <Route path="/employee/book-ticket" element={<div className="">
      <Header/><EmployeeBookTicket/></div>}> </Route>
        <Route path="/employee/bookings" element={<div className="">
      <Header/><EmployeeBookingsPage/></div>}> </Route>
        <Route path="/customer/booking-history" element={<div className="">
      <Header/><CustomerBookingHistory/></div>}> </Route>
        <Route path="/customer/ticket-details/:id" element={<div className="">
      <Header/><CustomerTicketDetails/></div>}> </Route>
      </Routes>
    </div>
  );
}
