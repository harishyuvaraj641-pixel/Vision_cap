import React, { useState } from 'react';
import styles from './Settings.module.css';
import {
  AISettings,
  CameraSettings,
  AudioSettings,
  AccessibilitySettings,
  PrivacyPanel
} from '../components/settings/index.jsx';

const GeneralSettingsView = () => (
  <div style={{ color: '#fff', padding: '16px 0', lineHeight: 1.6 }}>
    <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', marginBottom: 12 }}>
      VISIONCAP SYSTEM CONFIGURATION
    </h3>
    <p style={{ color: '#8899b4', marginBottom: 16 }}>
      Voice-First AI Vision Assistant designed for intuitive environmental understanding.
    </p>
    <div style={{ display: 'grid', gap: '8px', maxWidth: 400, fontSize: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ color: '#8899b4' }}>Engine Version</span>
        <span style={{ color: '#fff', fontFamily: 'monospace' }}>1.0.0</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ color: '#8899b4' }}>Active Ports</span>
        <span style={{ color: '#00d4ff', fontFamily: 'monospace' }}>Frontend: 3000 / API: 8080</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ color: '#8899b4' }}>AI Provider</span>
        <span style={{ color: '#8b5cf6', fontFamily: 'monospace' }}>OpenAI / OpenRouter / Groq</span>
      </div>
    </div>
  </div>
);

const Settings = () => {
  const [activeTab, setActiveTab] = useState('ai'); // Default to AI settings for quick API key configuration

  const tabs = [
    { id: 'ai', label: 'AI & API Keys' },
    { id: 'camera', label: 'Camera Settings' },
    { id: 'audio', label: 'Audio Settings' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'privacy', label: 'Privacy & Storage' },
    { id: 'general', label: 'System Info' }
  ];

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return <AISettings />;
      case 'camera':
        return <CameraSettings />;
      case 'audio':
        return <AudioSettings />;
      case 'accessibility':
        return <AccessibilitySettings />;
      case 'privacy':
        return <PrivacyPanel />;
      case 'general':
      default:
        return <GeneralSettingsView />;
    }
  };

  return (
    <div className={styles.settingsPage}>
      <header className={styles.header}>
        <h1 className={styles.title}>System Settings</h1>
      </header>
      
      <div className={styles.content}>
        <div className={styles.sidebar}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className={styles.mainArea}>
          <div className={styles.settingsCard}>
             <div className={styles.cardContent}>
                {renderActiveTabContent()}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
