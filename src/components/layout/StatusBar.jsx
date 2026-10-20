import React from 'react';
import styles from './StatusBar.module.css';

const StatusItem = ({ label, status, count, colorClass }) => (
  <div className={styles.statusItem}>
    <span className={`${styles.dot} ${styles[colorClass]}`} />
    <span className={styles.label}>{label}</span>
    {count !== undefined && <span className={styles.count}>{count}</span>}
    <span className={styles.statusText}>{status}</span>
  </div>
);

const StatusBar = ({ cameraStatus, micStatus, outputStatus, aiStatus, networkStatus }) => {
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'online': case 'ready': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <footer className={styles.statusbar}>
      <div className={styles.leftGroup}>
        <StatusItem 
          label="CAMERAS" 
          count={cameraStatus?.count || 0} 
          status={cameraStatus?.status || 'OFFLINE'} 
          colorClass={getStatusColor(cameraStatus?.status)}
        />
        <StatusItem 
          label="MIC" 
          status={micStatus?.status || 'OFFLINE'} 
          colorClass={getStatusColor(micStatus?.status)}
        />
        <StatusItem 
          label="OUTPUT" 
          status={outputStatus?.status || 'OFFLINE'} 
          colorClass={getStatusColor(outputStatus?.status)}
        />
        <StatusItem 
          label="AI" 
          status={aiStatus?.status || 'OFFLINE'} 
          colorClass={getStatusColor(aiStatus?.status)}
        />
        <StatusItem 
          label="NETWORK" 
          status={networkStatus?.status || 'OFFLINE'} 
          colorClass={getStatusColor(networkStatus?.status)}
        />
      </div>
      <div className={styles.rightGroup}>
        <span className={styles.version}>VISIONCAP v1.0.0</span>
      </div>
    </footer>
  );
};

export default StatusBar;
