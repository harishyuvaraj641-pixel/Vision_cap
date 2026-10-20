import React from 'react';
import { Shield, Info, AlertTriangle } from 'lucide-react';
import localStyles from './FormStyles.module.css';
import styles from './PrivacyPanel.module.css';

const PrivacyPanel = () => {
  return (
    <div className={localStyles.container}>
      <h3 className={localStyles.sectionTitle}>PRIVACY & DATA</h3>
      
      <div className={styles.warningBox}>
        <AlertTriangle size={20} className={styles.warningIcon} />
        <div>
          <strong>PLANNED SYSTEM BEHAVIOR</strong>
          <p>These policies describe intended system behavior. Backend implementation is pending.</p>
        </div>
      </div>

      <div className={styles.policyCard}>
        <div className={styles.cardHeader}>
          <Shield size={16} className={styles.shieldIcon} />
          <span>CAMERA PROCESSING</span>
          <Info size={14} className={styles.infoIcon} />
        </div>
        <p className={styles.cardText}>
          Camera frames are intended to remain temporary and should only be sent for requested visual analysis.
        </p>
      </div>

      <div className={styles.policyCard}>
        <div className={styles.cardHeader}>
          <Shield size={16} className={styles.shieldIcon} />
          <span>LOCAL FRAME BUFFER</span>
          <Info size={14} className={styles.infoIcon} />
        </div>
        <p className={styles.cardText}>
          Only the latest camera frame is held in memory.
        </p>
      </div>

      <div className={styles.policyCard}>
        <div className={styles.cardHeader}>
          <Shield size={16} className={styles.shieldIcon} />
          <span>VOICE DATA</span>
          <Info size={14} className={styles.infoIcon} />
        </div>
        <p className={styles.cardText}>
          Voice input is processed for transcription and not permanently stored.
        </p>
      </div>

      <div className={styles.policyCard}>
        <div className={styles.cardHeader}>
          <Shield size={16} className={styles.shieldIcon} />
          <span>AI PROCESSING</span>
          <Info size={14} className={styles.infoIcon} />
        </div>
        <p className={styles.cardText}>
          Visual and text data is sent to the configured AI provider for analysis.
        </p>
      </div>

      <div className={styles.policyCard}>
        <div className={styles.cardHeader}>
          <Shield size={16} className={styles.shieldIcon} />
          <span>DATA RETENTION</span>
          <Info size={14} className={styles.infoIcon} />
        </div>
        <p className={styles.cardText}>
          Conversation history is stored locally during the session.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPanel;
