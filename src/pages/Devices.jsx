import React from 'react';
import styles from './Devices.module.css';

const Devices = ({ cameraManager, audioDevices, onAddCamera, onOpenInputSelector, onOpenOutputSelector }) => {
  return (
    <div className={styles.devicesPage}>
      <header className={styles.header}>
        <h1 className={styles.title}>Device Management</h1>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Cameras</h2>
            <button className={styles.addButton} onClick={onAddCamera}>+ Add Camera</button>
          </div>
          <div className={styles.deviceGrid}>
            {cameraManager.cameras.map(cam => (
              <div key={cam.id} className={styles.deviceCard}>
                <div className={styles.deviceInfo}>
                  <div className={styles.deviceName}>{cam.name}</div>
                  <div className={styles.deviceType}>{cam.status}</div>
                </div>
                <div className={styles.deviceActions}>
                  {cameraManager.primaryCameraId !== cam.id && (
                    <button onClick={() => cameraManager.setPrimaryCamera(cam.id)} className={styles.actionButton}>Set Primary</button>
                  )}
                  <button onClick={() => cameraManager.removeCamera(cam.id)} className={styles.actionButtonDanger}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Audio Input</h2>
            <button className={styles.changeButton} onClick={onOpenInputSelector}>Change Input</button>
          </div>
          <div className={styles.deviceCard}>
            <div className={styles.deviceInfo}>
              <div className={styles.deviceName}>{audioDevices.selectedInput?.name || 'No Input Device Selected'}</div>
              <div className={styles.deviceType}>Microphone</div>
            </div>
            <div className={styles.deviceActions}>
              <button onClick={audioDevices.testMicrophone} className={styles.actionButton}>
                {audioDevices.isTestingMic ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Audio Output</h2>
            <button className={styles.changeButton} onClick={onOpenOutputSelector}>Change Output</button>
          </div>
          <div className={styles.deviceCard}>
            <div className={styles.deviceInfo}>
              <div className={styles.deviceName}>{audioDevices.selectedOutput?.name || 'No Output Device Selected'}</div>
              <div className={styles.deviceType}>Speaker</div>
            </div>
            <div className={styles.deviceActions}>
              <button onClick={audioDevices.testSpeaker} className={styles.actionButton}>
                {audioDevices.isTestingSpeaker ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Devices;
