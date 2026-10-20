import React from 'react';
import localStyles from './FormStyles.module.css';

const AudioSettings = ({ settings = {}, onChange }) => {
  const handleChange = (key, value) => {
    if (onChange) onChange({ ...settings, [key]: value });
  };

  return (
    <div className={localStyles.container}>
      <h3 className={localStyles.sectionTitle}>AUDIO & VOICE</h3>
      
      <div className={localStyles.field}>
        <label className={localStyles.label}>Microphone Input</label>
        <select className={localStyles.select} value="default" readOnly>
          <option value="default">System Default</option>
        </select>
      </div>

      <div className={localStyles.field}>
        <label className={localStyles.label}>Speaker Output</label>
        <select className={localStyles.select} value="default" readOnly>
          <option value="default">System Default</option>
        </select>
      </div>

      <div className={localStyles.field}>
        <label className={localStyles.label}>Microphone Sensitivity</label>
        <input 
          type="range" 
          className={localStyles.range}
          min="0" max="100" 
          value={settings.micSensitivity || 80}
          onChange={(e) => handleChange('micSensitivity', e.target.value)}
        />
      </div>

      <div className={localStyles.fieldRow}>
        <span className={localStyles.label}>Voice Activation (VAD)</span>
        <label className={localStyles.switch}>
          <input 
            type="checkbox" 
            checked={settings.vad !== false} 
            onChange={(e) => handleChange('vad', e.target.checked)}
          />
          <span className={localStyles.slider}></span>
        </label>
      </div>
      
      <div className={localStyles.fieldRow}>
        <span className={localStyles.label}>Wake Word Enabled</span>
        <label className={localStyles.switch}>
          <input 
            type="checkbox" 
            checked={settings.wakeWord || false} 
            onChange={(e) => handleChange('wakeWord', e.target.checked)}
          />
          <span className={localStyles.slider}></span>
        </label>
      </div>

      <div className={localStyles.field}>
        <label className={localStyles.label}>TTS Speaking Rate</label>
        <input 
          type="range" 
          className={localStyles.range}
          min="0.5" max="2.0" step="0.1"
          value={settings.ttsRate || 1.0}
          onChange={(e) => handleChange('ttsRate', e.target.value)}
        />
      </div>
    </div>
  );
};

export default AudioSettings;
