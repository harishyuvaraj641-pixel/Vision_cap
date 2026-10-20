// src/components/camera/AddCameraModal.jsx
import React, { useState } from 'react';
import styles from './AddCameraModal.module.css';
import { X } from 'lucide-react';

const CAMERA_TYPES = [
  { value: 'webcam', label: 'USB Web Camera' },
  { value: 'esp32cam', label: 'ESP32-CAM Module' },
  { value: 'network', label: 'Network/IP Camera' },
  { value: 'demo', label: 'Demo Source (Simulated)' }
];

const AddCameraModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'webcam',
    url: '',
    streamPath: '/stream',
    capturePath: '/capture'
  });

  if (!isOpen) return null;

  const showPaths = formData.type === 'esp32cam' || formData.type === 'network';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      id: `cam-${Date.now()}`,
      status: 'CONNECTING',
      isDemo: formData.type === 'demo',
      label: CAMERA_TYPES.find(t => t.value === formData.type)?.label
    });
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>ADD CAMERA SOURCE</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Camera Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g., Front Door Cam"
              required 
            />
          </div>

          <div className={styles.field}>
            <label>Camera Type</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              {CAMERA_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {(formData.type !== 'webcam' && formData.type !== 'demo') && (
            <div className={styles.field}>
              <label>Connection URL</label>
              <input 
                type="text" 
                name="url" 
                value={formData.url} 
                onChange={handleChange} 
                placeholder="http://192.168.1.100"
                required={showPaths}
              />
              {formData.type === 'esp32cam' && (
                <span className={styles.helperText}>e.g., http://192.168.1.100</span>
              )}
            </div>
          )}

          {showPaths && (
            <div className={styles.pathRow}>
              <div className={styles.field}>
                <label>Stream Path</label>
                <input 
                  type="text" 
                  name="streamPath" 
                  value={formData.streamPath} 
                  onChange={handleChange} 
                />
              </div>
              <div className={styles.field}>
                <label>Capture Path</label>
                <input 
                  type="text" 
                  name="capturePath" 
                  value={formData.capturePath} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          )}

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Add Camera</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCameraModal;
