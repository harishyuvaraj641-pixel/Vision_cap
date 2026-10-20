import React from 'react';
import { Eye, Mic, Brain, Activity, MessageSquare, AlertTriangle, WifiOff, Terminal, Loader, Zap } from 'lucide-react';
import { AI_STATE_LABELS } from '../../data/mockData';
import styles from './AIState.module.css';

const getStateConfig = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'idle': return { icon: Eye, color: '#00d4ff' };
    case 'listening': return { icon: Mic, color: '#00d4ff' };
    case 'transcribing': return { icon: Terminal, color: '#00d4ff' };
    case 'captured': return { icon: Zap, color: '#00d4ff' };
    case 'decoding': return { icon: Loader, color: '#8b5cf6' };
    case 'analyzing': return { icon: Activity, color: '#8b5cf6' };
    case 'thinking': return { icon: Brain, color: '#8b5cf6' };
    case 'speaking': return { icon: MessageSquare, color: '#f59e0b' };
    case 'error': return { icon: AlertTriangle, color: '#ef4444' };
    case 'offline': return { icon: WifiOff, color: '#4b5563' };
    default: return { icon: Eye, color: '#00d4ff' };
  }
};

const TAMIL_STATE_LABELS = {
  idle: 'விஷன்கேப் தயார்',
  listening: 'கேட்கிறது...',
  transcribing: 'எழுத்துருவாக்கம்...',
  captured: 'படம் எடுக்கப்பட்டது',
  decoding: 'குறிமுறையிறக்கம்...',
  analyzing: 'ஆராய்கிறது...',
  thinking: 'சிந்திக்கிறது...',
  speaking: 'பேசுகிறது...',
  error: 'பிழை ஏற்பட்டது',
  offline: 'இணைப்பில்லை'
};

export default function AIState({ status = 'idle', className = '', language = 'en' }) {
  const s = (status || '').toLowerCase();
  const { icon: Icon, color } = getStateConfig(status);
  const isTamil = language === 'ta';
  
  const label = isTamil
    ? (TAMIL_STATE_LABELS[s] || TAMIL_STATE_LABELS[status] || 'விஷன்கேப் தயார்')
    : (AI_STATE_LABELS[s] || AI_STATE_LABELS[status] || (status || '').toUpperCase() || 'VISIONCAP READY');

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.dot} style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
      <Icon className={`${styles.icon} ${s === 'decoding' || s === 'analyzing' ? styles.spin : ''}`} style={{ color }} size={16} />
      <span className={styles.label} style={{ textShadow: `0 0 8px ${color}80` }}>
        {label}
      </span>
    </div>
  );
}
