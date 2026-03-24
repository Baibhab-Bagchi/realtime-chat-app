import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './index.css'
import ReactDOM from "react-dom/client";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Chat from "./pages/Chat.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" 
         element={
    <ProtectedRoute>
      <Chat />
    </ProtectedRoute>
  } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);