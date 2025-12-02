// src/pages/NotFound.jsx
import React from 'react';
import '../components/ui/Design.css';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <div className="section">
        <h2 className="title">Página no encontrada</h2>
        <p className="muted">La ruta solicitada no existe o ha cambiado.</p>
        <div style={{ marginTop: 12 }}>
          <Link to="/" className="btn">Volver al inicio</Link>
          <Link to="/catalog" className="btn" style={{ marginLeft: 8 }}>Ir al catálogo</Link>
        </div>
      </div>
    </div>
  );
}
