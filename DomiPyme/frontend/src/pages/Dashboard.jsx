// src/pages/Dashboard.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import CustomerDashboard from './CustomerDashboard';
import './Dashboard.css';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="customer-dashboard-loading app-bg page-content responsive-grid"
        role="status"
        aria-live="polite"
        aria-busy="true"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}
      >
        <div className="customer-dashboard-spinner" aria-hidden="true"></div>
        <p className="customer-dashboard-loading-text" style={{ color: '#222', fontWeight: 500, marginTop: 12 }}>
          Cargando, por favor espera...
        </p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'merchant') return <Navigate to="/merchant" replace />;

  return <CustomerDashboard />;
}
