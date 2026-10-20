import React from 'react';
import { Volume2, CheckCircle2, Circle } from 'lucide-react';
import styles from './Selector.module.css';

export default function OutputSelector({ devices = [], selectedId, onSelect, onTest, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>OUTPUT DEVICES</h2>
        </div>
        
        <div className={styles.list}>
          {devices.map(device => {
            const isSelected = selectedId === device.id;
            const statusClass = device.status?.toLowerCase() === 'available' 
              ? styles.statusAvailable 
              : device.status?.toLowerCase() === 'disconnected' 
                ? styles.statusDisconnected 
                : styles.statusConnected;

            return (
              <div 
                key={device.id} 
                className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                onClick={() => onSelect(device.id)}
              >
                <div className={styles.iconWrapper}>
                  <Volume2 className={isSelected ? styles.iconActive : styles.iconNormal} size={18} />
                </div>
                
                <div className={styles.details}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{device.name}</span>
                    {device.isDemo && <span className={styles.badge}>DEMO</span>}
                  </div>
                  <div className={styles.meta}>
                    <span className={`${styles.statusDot} ${statusClass}`} />
                    <span className={styles.statusText}>{device.status || 'CONNECTED'}</span>
                  </div>
                </div>
                
                <div className={styles.check}>
                  {isSelected ? (
                    <CheckCircle2 size={18} className={styles.checkIcon} />
                  ) : (
                    <Circle size={18} className={styles.uncheckIcon} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className={styles.footer}>
          <button className={styles.testBtn} onClick={onTest}>Test Audio</button>
          <button className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
