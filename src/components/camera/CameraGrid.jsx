// src/components/camera/CameraGrid.jsx
import React from 'react';
import styles from './CameraGrid.module.css';
import { CameraOff } from 'lucide-react';

const CameraGrid = ({ cameras = [], activeCameraId, onSelect }) => {
  // Pad array to always have 4 cells for a 2x2 grid
  const cells = [...cameras];
  while (cells.length < 4) {
    cells.push(null);
  }
  const displayCells = cells.slice(0, 4);

  return (
    <div className={styles.gridContainer}>
      {displayCells.map((camera, index) => {
        if (!camera) {
          return (
            <div key={`empty-${index}`} className={styles.emptyCell}>
              <CameraOff size={32} className={styles.emptyIcon} />
              <span>No Camera</span>
            </div>
          );
        }

        return (
          <div 
            key={camera.id}
            className={`${styles.cell} ${activeCameraId === camera.id ? styles.active : ''}`}
            onClick={() => onSelect(camera.id)}
          >
            <div className={styles.previewPlaceholder}></div>
            <div className={styles.cellOverlay}>
              <span className={styles.cameraName}>{camera.name}</span>
              <div className={`${styles.statusDot} ${styles[camera.status.toLowerCase()] || ''}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CameraGrid;
