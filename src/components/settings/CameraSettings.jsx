import React from 'react';
import styles from './SettingsPanel.module.css'; // Reuse common styles
import localStyles from './FormStyles.module.css';

const CameraSettings = ({ settings = {}, onChange }) => {
  const handleChange = (key, value) => {
    if (onChange) onChange({ ...settings, [key]: value });
  };

  return (
    <div className={localStyles.container}>
      <h3 className={localStyles.sectionTitle}>CAMERA CONFIGURATION</h3>
      
      <div className={localStyles.field}>
        <label className={localStyles.label}>Default View Mode</label>
        <select 
          className={localStyles.select}
          value={settings.viewMode || 'primary'}
          onChange={(e) => handleChange('viewMode', e.target.value)}
        >
          <option value="primary">Primary Only</option>
          <option value="split">Split Screen</option>
          <option value="grid">Grid View</option>
        </select>
      </div>

      <div className={localStyles.fieldRow}>
        <span className={localStyles.label}>Auto Reconnect</span>
        <label className={localStyles.switch}>
          <input 
            type="checkbox" 
            checked={settings.autoReconnect !== false} 
            onChange={(e) => handleChange('autoReconnect', e.target.checked)}
          />
          <span className={localStyles.slider}></span>
        </label>
      </div>

      <div className={localStyles.fieldRow}>
        <span className={localStyles.label}>Show HUD Overlays</span>
        <label className={localStyles.switch}>
          <input 
            type="checkbox" 
            checked={settings.showHUD !== false} 
            onChange={(e) => handleChange('showHUD', e.target.checked)}
          />
          <span className={localStyles.slider}></span>
        </label>
      </div>

      <div className={localStyles.fieldRow}>
        <span className={localStyles.label}>Show FPS counter</span>
        <label className={localStyles.switch}>
          <input 
            type="checkbox" 
            checked={settings.showFPS || false} 
            onChange={(e) => handleChange('showFPS', e.target.checked)}
          />
          <span className={localStyles.slider}></span>
        </label>
      </div>
      
      <div className={localStyles.fieldRow}>
        <span className={localStyles.label}>Show Timestamp</span>
        <label className={localStyles.switch}>
          <input 
            type="checkbox" 
            checked={settings.showTimestamp !== false} 
            onChange={(e) => handleChange('showTimestamp', e.target.checked)}
          />
          <span className={localStyles.slider}></span>
        </label>
      </div>
    </div>
  );
};

export default CameraSettings;
