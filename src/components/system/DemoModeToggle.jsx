import React from 'react';
import { Play, Square, Sparkles } from 'lucide-react';
import styles from './DemoModeToggle.module.css';

const DemoModeToggle = ({ isDemoMode, isRunning, onToggle, onRunDemo, language = 'en' }) => {
  const isTamil = language === 'ta';

  return (
    <div className={styles.container}>
      <button 
        className={`${styles.runBtn} ${isRunning ? styles.running : ''}`}
        onClick={onRunDemo}
        title={isRunning ? (isTamil ? "விஷன்கேப் இயக்கத்தை நிறுத்து" : "Stop VisionCap workflow") : (isTamil ? "விஷன்கேப் தானியங்கி பார்வை & குரல் இயக்கம்" : "Run VisionCap AI vision & speech workflow")}
      >
        {isRunning ? (
          <Square size={14} className={styles.iconPulse} />
        ) : (
          <Play size={14} className={styles.iconPlay} fill="#00d4ff" />
        )}
        <span className={styles.btnText}>
          {isRunning ? (isTamil ? 'நிறுத்து (STOP)' : 'STOP VISIONCAP') : (isTamil ? 'இயக்கு (RUN VISIONCAP)' : 'RUN VISIONCAP')}
        </span>
      </button>

      <div className={styles.toggleRow}>
        <div className={styles.labelGroup}>
          <Sparkles size={11} className={styles.sparkleIcon} />
          <span className={styles.label}>{isTamil ? 'மாதிரி பயன்முறை' : 'DEMO SIMULATION'}</span>
        </div>
        <label className={styles.switch} title="Toggle Demo Mode">
          <input type="checkbox" checked={isDemoMode} onChange={onToggle} />
          <span className={styles.slider}></span>
        </label>
      </div>
    </div>
  );
};

export default DemoModeToggle;
