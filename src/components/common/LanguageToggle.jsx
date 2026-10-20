import React from 'react';
import { Languages } from 'lucide-react';
import styles from './LanguageToggle.module.css';

export default function LanguageToggle({ language = 'en', onToggle, className = '' }) {
  const isTamil = language === 'ta';

  return (
    <button
      className={`${styles.toggleBtn} ${isTamil ? styles.activeTamil : ''} ${className}`}
      onClick={onToggle}
      title={isTamil ? "Switch to English (Key: T)" : "தமிழ் குரல் பயன்முறைக்கு மாறவும் (Switch to Tamil, Key: T)"}
      aria-label="Toggle Language"
    >
      <Languages size={14} className={styles.globeIcon} />
      <span className={styles.langText}>
        {isTamil ? 'தமிழ்' : 'ENGLISH'}
      </span>
      <span className={styles.badge}>
        {isTamil ? 'TA' : 'EN'}
      </span>
    </button>
  );
}
