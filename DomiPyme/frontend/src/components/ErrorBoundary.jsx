// src/components/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('ErrorBoundary caught', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2 style={{ color: '#b91c1c' }}>Ha ocurrido un error en la aplicación</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background:'#fff', padding:12, borderRadius:8 }}>
            {String(this.state.error && (this.state.error.message || this.state.error))}
          </pre>
          <div style={{ marginTop: 12 }}>
            Abre la consola del navegador (F12) para ver la traza completa.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
