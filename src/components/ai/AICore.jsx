import React, { useRef, useMemo, useState, Component } from 'react';
import { Maximize2, Minimize2, X, Sparkles } from 'lucide-react';
import HolographicParticleCore from './HolographicParticleCore';
import styles from './AICore.module.css';

// Error boundary to gracefully catch WebGL context crashes or unsupported devices
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.warn('[AICore] WebGL Canvas initialization issue, falling back to CSS animation:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Visual simulation modes — Swarm Core (Bio-Capsid) is the primary default replacing the classic orb
const MODES = [
  { id: 'capsid', label: 'SWARM CORE', icon: '🧬', tooltip: 'Bio-Macromolecular Particle Swarm & Genomic Core' },
  { id: 'brain', label: 'BRAIN', icon: '🧠', tooltip: 'VEXIS Neural Firing Brain (Synaptic Awareness)' },
  { id: 'quantum', label: 'QUANTUM', icon: '⚛️', tooltip: 'Quantum Tesseract (Toroidal Knot & Stardust)' },
  { id: 'singularity', label: 'SINGULARITY', icon: '🌀', tooltip: 'Black Hole Singularity (Accretion Disk)' },
];

const getOrbHexColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'error') return '#ef4444';
  if (s === 'thinking' || s === 'analyzing' || s === 'decoding' || s === 'processing') return '#8b5cf6';
  if (s === 'speaking' || s === 'responding') return '#f59e0b';
  if (s === 'offline') return '#4b5563';
  return '#00d4ff';
};

// Fallback CSS animation if WebGL is unavailable
function CSSOrbFallback({ status, color }) {
  return (
    <div style={{
      width: '180px',
      height: '180px',
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${color} 50%, #030508 100%)`,
      boxShadow: `0 0 30px ${color}, 0 0 60px ${color}66`,
      animation: 'vc-breathe 3s ease-in-out infinite',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        border: `1px solid ${color}66`,
        animation: 'vc-rotate 8s linear infinite'
      }} />
      <div style={{
        position: 'absolute',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        border: `1px dashed ${color}44`,
        animation: 'vc-rotate-reverse 12s linear infinite'
      }} />
    </div>
  );
}

export default function AICore({ status = 'idle', size = 480 }) {
  const pixelSize = typeof size === 'number' ? size : 480;
  const color = getOrbHexColor(status);

  // Default to 'capsid' (the user's Particle Swarm element) instead of the old orb
  const [visualMode, setVisualMode] = useState(() => {
    try {
      const saved = localStorage.getItem('visioncap_ai_visual_mode');
      if (saved && saved !== 'orb') return saved;
      return 'capsid';
    } catch (e) {
      return 'capsid';
    }
  });

  const handleModeChange = (newMode) => {
    setVisualMode(newMode);
    try {
      localStorage.setItem('visioncap_ai_visual_mode', newMode);
    } catch (e) {}
  };

  const currentModeObj = MODES.find(m => m.id === visualMode) || MODES[0];

  return (
    <div className={styles.container} style={{ width: '100%', maxWidth: '100%' }}>
      {/* Visual Mode Selector Bar */}
      <div className={styles.modeBar}>
        {MODES.map(m => (
          <button
            key={m.id}
            className={`${styles.modeBtn} ${visualMode === m.id ? styles.activeModeBtn : ''}`}
            onClick={() => handleModeChange(m.id)}
            title={m.tooltip}
          >
            <span>{m.icon}</span>
            <span className={styles.modeLabel}>{m.label}</span>
          </button>
        ))}
      </div>

      <div style={{ width: '100%', height: pixelSize, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.glowBg} style={{ backgroundColor: color }} />
        
        <div className={styles.canvasContainer}>
          <WebGLErrorBoundary fallback={<CSSOrbFallback status={status} color={color} />}>
            <HolographicParticleCore 
              mode={visualMode} 
              status={status} 
              count={6500} 
            />
          </WebGLErrorBoundary>
        </div>
      </div>
    </div>
  );
}
