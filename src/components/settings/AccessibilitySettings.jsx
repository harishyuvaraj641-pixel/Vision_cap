import React from 'react';
import localStyles from './FormStyles.module.css';

const AccessibilitySettings = ({ settings = {}, onChange }) => {
  const handleChange = (key, value) => {
    if (onChange) onChange({ ...settings, [key]: value });
  };

  const ToggleWithDesc = ({ label, desc, settingKey, defaultVal }) => (
    <div className={localStyles.fieldRow} style={{ alignItems: 'flex-start', padding: '12px 0' }}>
      <div>
        <div className={localStyles.label}>{label}</div>
        <div className={localStyles.description}>{desc}</div>
      </div>
      <label className={localStyles.switch}>
        <input 
          type="checkbox" 
          checked={settings[settingKey] !== undefined ? settings[settingKey] : defaultVal} 
          onChange={(e) => handleChange(settingKey, e.target.checked)}
        />
        <span className={localStyles.slider}></span>
      </label>
    </div>
  );

  return (
    <div className={localStyles.container}>
      <h3 className={localStyles.sectionTitle}>ACCESSIBILITY</h3>
      
      <ToggleWithDesc 
        label="Large Text" 
        desc="Increases base font size across the interface."
        settingKey="largeText" 
        defaultVal={false} 
      />
      <ToggleWithDesc 
        label="High Contrast" 
        desc="Increases contrast of text and interface elements."
        settingKey="highContrast" 
        defaultVal={false} 
      />
      <ToggleWithDesc 
        label="Reduced Motion" 
        desc="Disables animations like boot sequence and smooth scrolling."
        settingKey="reducedMotion" 
        defaultVal={false} 
      />
      <ToggleWithDesc 
        label="Voice Status Announcements" 
        desc="Screen reader reads out system status changes."
        settingKey="voiceAnnouncements" 
        defaultVal={true} 
      />
      <ToggleWithDesc 
        label="Simplified Interface" 
        desc="Hides technical stats and focuses on conversation."
        settingKey="simplifiedUI" 
        defaultVal={false} 
      />
      <ToggleWithDesc 
        label="Screen Reader Labels" 
        desc="Ensures all visual elements have descriptive ARIA labels."
        settingKey="ariaLabels" 
        defaultVal={true} 
      />
      <ToggleWithDesc 
        label="Keyboard Navigation" 
        desc="Enhances focus trapping and hotkey support."
        settingKey="keyboardNav" 
        defaultVal={true} 
      />
      <ToggleWithDesc 
        label="Focus Indicators" 
        desc="Shows clear borders around focused elements."
        settingKey="focusIndicators" 
        defaultVal={true} 
      />
    </div>
  );
};

export default AccessibilitySettings;
