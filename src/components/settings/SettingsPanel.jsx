import React from 'react';
import { X } from 'lucide-react';
import styles from './SettingsPanel.module.css';

const TABS = ['General', 'Cameras', 'Audio', 'AI', 'Accessibility', 'Privacy'];

const SettingsPanel = ({ isOpen, onClose, activeTab = 'General', onTabChange, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>SETTINGS</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.layout}>
          <div className={styles.sidebar}>
            {TABS.map(tab => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => onTabChange(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div className={styles.contentArea}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
