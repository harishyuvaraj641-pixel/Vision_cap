// src/components/camera/CameraSelector.jsx
import React from 'react';
import styles from './CameraSelector.module.css';
import { Plus, Camera as CameraIcon } from 'lucide-react';

const CameraSelector = ({ cameras = [], activeCameraId, primaryCameraId, onSelect, onAdd }) => {
  return (
    <div className={styles.selectorContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>CAMERA SOURCES</h2>
        <button className={styles.addBtn} onClick={onAdd} title="Add Camera">
          <Plus size={16} />
        </button>
      </div>

      <div className={styles.list}>
        {cameras.map(camera => (
          <div 
            key={camera.id}
            className={`${styles.compactCard} ${activeCameraId === camera.id ? styles.active : ''}`}
            onClick={() => onSelect(camera.id)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <CameraIcon size={14} />
              </div>
              <span className={styles.name}>{camera.name}</span>
              {primaryCameraId === camera.id && (
                <span className={styles.primaryDot} title="Primary Camera">P</span>
              )}
            </div>
            <div className={styles.cardDetails}>
              <span className={styles.label}>{camera.label}</span>
              <div className={styles.statusIndicator}>
                <div className={`${styles.statusDot} ${styles[camera.status.toLowerCase()] || ''}`} />
              </div>
            </div>
          </div>
        ))}
        {cameras.length === 0 && (
          <div className={styles.emptyState}>No cameras available</div>
        )}
      </div>
    </div>
  );
};

export default CameraSelector;
