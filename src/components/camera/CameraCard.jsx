// src/components/camera/CameraCard.jsx
import React, { useState } from 'react';
import styles from './CameraCard.module.css';
import { Camera, MoreVertical, Edit2, Settings, Trash2, Star } from 'lucide-react';

const CameraCard = ({ camera, isActive, onSelect, onRemove, onRename, onSetPrimary }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const getStatusClass = (status) => {
    switch (status) {
      case 'LIVE': return styles.statusLive;
      case 'READY': return styles.statusReady;
      case 'DISCONNECTED': return styles.statusDisconnected;
      case 'CONNECTING': return styles.statusConnecting;
      default: return '';
    }
  };

  return (
    <div className={`${styles.card} ${isActive ? styles.active : ''}`}>
      <div className={styles.previewArea} onClick={() => onSelect(camera.id)}>
        <Camera size={32} className={styles.previewIcon} />
        {camera.isDemo && <div className={styles.demoBadge}>DEMO</div>}
        {camera.isPrimary && <div className={styles.primaryBadge}>PRIMARY</div>}
      </div>
      
      <div className={styles.infoArea}>
        <div className={styles.headerRow}>
          <h3 className={styles.name}>{camera.name}</h3>
          <div className={styles.menuContainer}>
            <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                <button onClick={() => { onRename(camera.id); setMenuOpen(false); }}><Edit2 size={14}/> Rename</button>
                <button onClick={() => { onSetPrimary(camera.id); setMenuOpen(false); }}><Star size={14}/> Set Primary</button>
                <button onClick={() => { setMenuOpen(false); }}><Settings size={14}/> Configure</button>
                <button onClick={() => { onRemove(camera.id); setMenuOpen(false); }} className={styles.danger}><Trash2 size={14}/> Remove</button>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.label}>{camera.label}</div>
        
        <div className={styles.footerRow}>
          <div className={`${styles.statusBadge} ${getStatusClass(camera.status)}`}>
            {camera.status}
          </div>
          <div className={styles.resolution}>{camera.resolution}</div>
        </div>
      </div>
    </div>
  );
};

export default CameraCard;
