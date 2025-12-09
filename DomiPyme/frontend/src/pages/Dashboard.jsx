// src/pages/Dashboard.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import CustomerDashboard from './CustomerDashboard';
import './Dashboard.css';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return <div className="customer-dashboard-loading"><div className="customer-dashboard-spinner"></div><p className="customer-dashboard-loading-text">Cargando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'merchant') return <Navigate to="/merchant" replace />;

  return <CustomerDashboard />;
}
