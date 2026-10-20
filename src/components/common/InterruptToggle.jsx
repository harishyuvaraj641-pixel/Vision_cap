import React from 'react';
import { Zap, ZapOff } from 'lucide-react';
import styles from './InterruptToggle.module.css';

export default function InterruptToggle({ enabled = true, onToggle, language = 'en', className = '' }) {
  const isTamil = language === 'ta';

  return (
    <button
      className={`${styles.toggleBtn} ${enabled ? styles.active : styles.disabled} ${className}`}
      onClick={onToggle}
      title={
        enabled
          ? (isTamil ? 'குறுக்கீடு: ஆன் (செயலிழக்க கிளிக் செய்யவும் - Key: I)' : 'Speak-to-Interrupt: ON (Click to disable - Key: I)')
          : (isTamil ? 'குறுக்கீடு: ஆஃப் (செயலாக்க கிளிக் செய்யவும் - Key: I)' : 'Speak-to-Interrupt: OFF (Click to enable - Key: I)')
      }
      aria-label="Toggle Speak to Interrupt"
    >
      {enabled ? (
        <Zap size={13} className={styles.iconOn} />
      ) : (
        <ZapOff size={13} className={styles.iconOff} />
      )}
      <span className={styles.label}>
        {isTamil ? 'குறுக்கீடு' : 'INTERRUPT'}
      </span>
      <span className={`${styles.badge} ${enabled ? styles.badgeOn : styles.badgeOff}`}>
        {enabled ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
