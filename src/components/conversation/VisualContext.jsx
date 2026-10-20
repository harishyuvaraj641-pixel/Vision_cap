import React from 'react';
import { Eye } from 'lucide-react';
import styles from './VisualContext.module.css';

const VisualContext = ({ cameraId, frameId }) => {
  return (
    <div className={styles.badge}>
      <Eye size={12} className={styles.icon} />
      <span className={styles.text}>
        {cameraId} &middot; FRAME {frameId}
      </span>
    </div>
  );
};

export default VisualContext;
