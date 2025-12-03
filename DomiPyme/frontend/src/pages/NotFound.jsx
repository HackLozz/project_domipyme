// src/pages/NotFound.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          nav('/', { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [nav]);

  return (
    <div style={styles.container} className={mounted ? 'page-enter' : ''}>
      <style>{`
        .page-enter { animation: pageEnter 320ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        
        .float-anim { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
      `}</style>

      <div style={styles.content}>
        <div style={styles.emoji} className="float-anim">🔍</div>
        <h1 style={styles.h1}>404</h1>
        <h2 style={styles.h2}>Página no encontrada</h2>
        <p style={styles.p}>La página que buscas no existe o fue movida.</p>

        <div style={styles.actions}>
          <Link to="/" style={styles.btnPrimary}>Ir al inicio</Link>
          <Link to="/catalog" style={styles.btnSecondary}>Ver catálogo</Link>
        </div>

        <div style={styles.countdown}>
          Redirigiendo al inicio en <strong>{countdown}</strong> segundos...
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 80px)',
    padding: 20,
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
  },
  content: {
    textAlign: 'center',
    maxWidth: 500,
    background: '#fff',
    padding: 40,
    borderRadius: 16,
    boxShadow: '0 10px 40px rgba(2,6,23,0.08)',
    border: '1px solid rgba(15,23,42,0.04)',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  h1: {
    fontSize: 72,
    fontWeight: 900,
    margin: 0,
    background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  h2: {
    fontSize: 24,
    fontWeight: 800,
    margin: '8px 0',
    color: '#374151',
  },
  p: {
    color: '#6b7280',
    margin: '12px 0 24px',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  btnPrimary: {
    padding: '10px 20px',
    background: '#111827',
    color: '#fff',
    borderRadius: 10,
    textDecoration: 'none',
    fontWeight: 700,
    boxShadow: '0 4px 14px rgba(17,24,39,0.15)',
    transition: 'transform 140ms ease, box-shadow 140ms ease',
  },
  btnSecondary: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid rgba(17,24,39,0.1)',
    color: '#111827',
    borderRadius: 10,
    textDecoration: 'none',
    fontWeight: 700,
    transition: 'transform 140ms ease, border-color 140ms ease',
  },
  countdown: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 12,
  },
};
