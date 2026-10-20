import React from 'react';
import styles from './AudioMeter.module.css';

export default function AudioMeter({ level = 0, isActive = false, label = 'MIC LEVEL' }) {
  const bars = 12;
  
  return (
    <div className={styles.container}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.meter}>
        {Array.from({ length: bars }).map((_, i) => {
          const threshold = i / bars;
          // When active, some natural jitter is added based on level, else gray and low
          const barHeight = isActive ? Math.max(15, (level * 100) * (1 - Math.random() * 0.3)) : 15;
          const isActiveThreshold = isActive && level > threshold;
          
          let colorClass = styles.green;
          if (i >= bars * 0.6) colorClass = styles.yellow;
          if (i >= bars * 0.85) colorClass = styles.red;

          return (
            <div 
              key={i} 
              className={styles.barWrapper}
            >
              <div
                className={`${styles.bar} ${isActiveThreshold ? colorClass : styles.inactive}`} 
                style={{ 
                  height: isActiveThreshold ? `${barHeight}%` : '15%',
                  transition: 'height 0.1s ease-out'
                }} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
