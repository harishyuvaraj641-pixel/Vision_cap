// src/components/camera/CameraHUD.jsx
import React, { useState, useEffect } from 'react';
import styles from './CameraHUD.module.css';
import { Video, Activity } from 'lucide-react';

const CameraHUD = ({ cameraName = 'CAM-01', status = 'LIVE', resolution = '1920x1080', isDemo = true }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
      if (status === 'LIVE') {
        setFrameCount(prev => (prev + Math.floor(Math.random() * 3) + 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  return (
    <div className={styles.hudContainer}>
      <div className={styles.scanLine}></div>
      <div className={styles.gridOverlay}></div>
      
      {/* Corner Brackets */}
      <div className={`${styles.bracket} ${styles.topLeft}`}></div>
      <div className={`${styles.bracket} ${styles.topRight}`}></div>
      <div className={`${styles.bracket} ${styles.bottomLeft}`}></div>
      <div className={`${styles.bracket} ${styles.bottomRight}`}></div>

      {/* Top Left Area */}
      <div className={styles.topLeftPanel}>
        <h2 className={styles.cameraName}>{cameraName}</h2>
        <div className={styles.statusIndicator}>
          <div className={`${styles.statusDot} ${status === 'LIVE' ? styles.live : ''}`}></div>
          <span className={styles.statusText}>{status}</span>
        </div>
      </div>

      {/* Top Right Area */}
      <div className={styles.topRightPanel}>
        <div className={styles.timestamp}>{time}</div>
        {isDemo && <div className={styles.demoBadge}>UI PREVIEW (DEMO)</div>}
      </div>

      {/* Bottom Left Area */}
      <div className={styles.bottomLeftPanel}>
        <div className={styles.resolution}>
          <Video size={14} className={styles.icon} />
          {resolution}
        </div>
      </div>

      {/* Bottom Right Area */}
      <div className={styles.bottomRightPanel}>
        <div className={styles.frameCounter}>
          <Activity size={14} className={styles.icon} />
          FRM: {frameCount.toString().padStart(6, '0')}
        </div>
      </div>
    </div>
  );
};

export default CameraHUD;
