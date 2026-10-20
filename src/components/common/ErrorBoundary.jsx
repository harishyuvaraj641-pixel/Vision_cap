import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[VISIONCAP ErrorBoundary] Caught exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    try {
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#060a10',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          zIndex: 99999
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)'
          }}>
            <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            
            <h1 style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '1.25rem',
              color: '#ef4444',
              marginBottom: '12px',
              letterSpacing: '0.1em'
            }}>
              SYSTEM DIAGNOSTIC FAULT
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '20px' }}>
              VISIONCAP encountered an unexpected rendering error:
            </p>

            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '12px 16px',
              borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
              color: '#fca5a5',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 212, 255, 0.15)',
                  border: '1px solid #00d4ff',
                  color: '#00d4ff',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <Home size={16} />
                <span>RESUME</span>
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} />
                <span>RELOAD SYSTEM</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
