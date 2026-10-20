import React from 'react';
import styles from './SystemIndicator.module.css';

const SystemIndicator = ({ label, status, statusText }) => {
  const getStatusColor = (s) => {
    switch(s?.toLowerCase()) {
      case 'online': case 'connected': return 'green';
      case 'ready': return 'cyan';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const colorClass = getStatusColor(status);

  return (
    <div className={styles.indicator}>
      <div className={`${styles.dot} ${styles[colorClass]}`}></div>
      <span className={styles.label}>{label}</span>
      <span className={styles.statusText}>{statusText || status}</span>
    </div>
  );
};

export default SystemIndicator;
