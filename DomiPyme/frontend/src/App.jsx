// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Navbar from './components/Navbar';
import RequireAuth from './RequireAuth';
import Catalog from './pages/Catalog';
import ShopCreate from './pages/ShopCreate';
import ShopPage from './pages/ShopPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminPanel from './pages/AdminPanel';
import MerchantPanel from './pages/MerchantPanel';
import CustomerDashboard from './pages/CustomerDashboard';

// Merchant subpages
import MerchantCreateShop from './pages/merchant/CreateShop';
import MerchantEditShop from './pages/merchant/EditShop';
import MerchantProducts from './pages/merchant/MerchantProducts';
import MerchantCreateProduct from './pages/merchant/CreateProduct';
import MerchantEditProduct from './pages/merchant/EditProduct';

import { useAuth } from './context/AuthProvider';

/**
 * PrivateRoute component: protege rutas, opcionalmente valida rol.
 * role: 'admin'|'merchant'|'customer' | undefined -> solo requiere autenticación.
 */
function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <div />; // o spinner

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    // si el rol no coincide redirigimos al home o al dashboard correspondiente
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'merchant') return <Navigate to="/merchant" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public catalog and shop pages */}
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/shop/create" element={<RequireAuth><ShopCreate /></RequireAuth>} />
        <Route path="/shop/:slug" element={<ShopPage />} />

        {/* Cart & checkout */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />

        {/* Dashboards & panels */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute role="customer">
              <CustomerDashboard />
            </PrivateRoute>
          }
        />

        {/* Admin panel accessible via /admin and /admin-panel */}
        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <AdminPanel />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin-panel"
          element={
            <PrivateRoute role="admin">
              <AdminPanel />
            </PrivateRoute>
          }
        />

        {/* Merchant area */}
        <Route
          path="/merchant"
          element={
            <PrivateRoute role="merchant">
              <MerchantPanel />
            </PrivateRoute>
          }
        />

        {/* Merchant: manage shop */}
        <Route
          path="/merchant/shop/create"
          element={
            <PrivateRoute role="merchant">
              <MerchantCreateShop />
            </PrivateRoute>
          }
        />
        <Route
          path="/merchant/shop/edit"
          element={
            <PrivateRoute role="merchant">
              <MerchantEditShop />
            </PrivateRoute>
          }
        />

        {/* Merchant: products CRUD */}
        <Route
          path="/merchant/products"
          element={
            <PrivateRoute role="merchant">
              <MerchantProducts />
            </PrivateRoute>
          }
        />
        <Route
          path="/merchant/products/create"
          element={
            <PrivateRoute role="merchant">
              <MerchantCreateProduct />
            </PrivateRoute>
          }
        />
        <Route
          path="/merchant/products/:id/edit"
          element={
            <PrivateRoute role="merchant">
              <MerchantEditProduct />
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
