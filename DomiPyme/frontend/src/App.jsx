// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword'; // <-- nueva página de reset
import Navbar from './components/Navbar';
import RequireAuth from './RequireAuth'; // <-- usa el RequireAuth que usa useAuth()
import Catalog from './pages/Catalog';
import ShopCreate from './pages/ShopCreate';
import ShopPage from './pages/ShopPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminPanel from './pages/AdminPanel'; // panel admin básico

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* ResetPassword espera ?uid=...&token=... en la query string */}
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/catalog" element={<Catalog />} />

        {/* Crear tienda - requiere estar autenticado */}
        <Route path="/shop/create" element={<RequireAuth><ShopCreate /></RequireAuth>} />

        {/* Página pública de tienda — ahora recibe slug obligatorio */}
        <Route path="/shop/:slug" element={<ShopPage />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />

        {/* Panel admin — protegido por autenticación; el componente internamente valida is_staff */}
        <Route path="/admin-panel" element={<RequireAuth><AdminPanel /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
