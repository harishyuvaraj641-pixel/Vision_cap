import React from 'react';
import { Mic, Volume2 } from 'lucide-react';
import styles from './AudioPanel.module.css';

export default function AudioPanel({ selectedInput, selectedOutput, onChangeInput, onChangeOutput }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>AUDIO DEVICES</div>
      <div className={styles.section}>
        <div className={styles.info}>
          <div className={styles.iconBox}>
            <Mic className={styles.icon} size={16} />
          </div>
          <div className={styles.details}>
            <div className={styles.deviceName}>
              {selectedInput?.name || 'System Default Microphone'}
              {selectedInput?.isDemo && <span className={styles.demoBadge}>DEMO</span>}
            </div>
            <div className={styles.status}>
              <div className={`${styles.dot} ${selectedInput ? styles.connected : styles.disconnected}`} />
              <span>{selectedInput ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
          </div>
        </div>
        <button className={styles.changeBtn} onClick={onChangeInput}>Change</button>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <div className={styles.info}>
          <div className={styles.iconBox}>
            <Volume2 className={styles.icon} size={16} />
          </div>
          <div className={styles.details}>
            <div className={styles.deviceName}>
              {selectedOutput?.name || 'System Default Speakers'}
              {selectedOutput?.isDemo && <span className={styles.demoBadge}>DEMO</span>}
            </div>
            <div className={styles.status}>
              <div className={`${styles.dot} ${selectedOutput ? styles.connected : styles.disconnected}`} />
              <span>{selectedOutput ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
          </div>
        </div>
        <button className={styles.changeBtn} onClick={onChangeOutput}>Change</button>
      </div>
    </div>
  );
}
