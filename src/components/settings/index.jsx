import React from 'react';
import SettingsPanel from './SettingsPanel';
import CameraSettings from './CameraSettings';
import AudioSettings from './AudioSettings';
import AISettings from './AISettings';
import AccessibilitySettings from './AccessibilitySettings';
import PrivacyPanel from './PrivacyPanel';
import localStyles from './FormStyles.module.css';

const GeneralSettings = () => (
  <div className={localStyles.container}>
    <h3 className={localStyles.sectionTitle}>GENERAL SYSTEM INFORMATION</h3>
    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.6 }}>
      <p><strong style={{ color: '#00d4ff' }}>VISIONCAP</strong> — Voice-First AI Vision Operating System</p>
      <p>Version: 1.0.0</p>
      <p>Optical Input: Multi-Camera WebRTC / MJPEG</p>
      <p>Audio Engine: Dual Channel (AirPods / System Audio)</p>
      <p>AI Engine: OpenAI-Compatible Vision Pipeline</p>
      <p style={{ marginTop: 16 }}>
        Select <strong>AI & API Keys</strong> in the sidebar to configure your vision model API credentials.
      </p>
    </div>
  </div>
);

const SettingsContainer = (props) => {
  const tab = (props.activeTab || 'General').toLowerCase();
  
  return (
    <SettingsPanel {...props}>
      {tab === 'general' && <GeneralSettings />}
      {tab === 'cameras' && <CameraSettings />}
      {tab === 'audio' && <AudioSettings />}
      {tab === 'ai' && <AISettings />}
      {tab === 'accessibility' && <AccessibilitySettings />}
      {tab === 'privacy' && <PrivacyPanel />}
    </SettingsPanel>
  );
};

export {
  SettingsPanel,
  CameraSettings,
  AudioSettings,
  AISettings,
  AccessibilitySettings,
  PrivacyPanel
};

export default SettingsContainer;
