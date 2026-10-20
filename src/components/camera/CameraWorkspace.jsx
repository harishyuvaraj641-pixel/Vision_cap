// src/components/camera/CameraWorkspace.jsx
import React, { useState, useRef, useEffect } from 'react';
import styles from './CameraWorkspace.module.css';
import CameraHUD from './CameraHUD';
import CameraSelector from './CameraSelector';
import CameraGrid from './CameraGrid';
import AddCameraModal from './AddCameraModal';
import { LayoutGrid, Maximize, SplitSquareHorizontal, Video, AlertCircle, RefreshCw, Radio } from 'lucide-react';

const CameraWorkspace = ({ 
  cameras = [], 
  activeCameraId, 
  primaryCameraId, 
  viewMode = 'primary', 
  webcam,
  onSelectCamera, 
  onSetPrimary, 
  onAddCamera, 
  onRemoveCamera, 
  onRenameCamera, 
  onSetViewMode 
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const videoRef = useRef(null);
  const splitVideoRef = useRef(null);

  const activeCamera = cameras.find(c => c.id === activeCameraId) || cameras[0] || {};
  const primaryCamera = cameras.find(c => c.id === primaryCameraId) || cameras[0] || {};

  const isLocalWebcam = activeCamera.type === 'laptop' || activeCamera.type === 'usb' || activeCamera.type === 'webcam';

  // Automatically attach media stream to the video element whenever stream changes
  useEffect(() => {
    if (videoRef.current && webcam?.stream) {
      videoRef.current.srcObject = webcam.stream;
      videoRef.current.play().catch(e => console.warn('[CameraWorkspace] Video play warning:', e));
    }
    if (splitVideoRef.current && webcam?.stream) {
      splitVideoRef.current.srcObject = webcam.stream;
      splitVideoRef.current.play().catch(e => console.warn('[CameraWorkspace] Split video play warning:', e));
    }
  }, [webcam?.stream, isLocalWebcam, viewMode]);

  // If user explicitly selects a laptop/usb camera, automatically prompt for permission if not already active
  useEffect(() => {
    if (isLocalWebcam && webcam && !webcam.isStreaming && webcam.permissionStatus !== 'denied') {
      webcam.requestCameraPermission().catch(e => console.warn('[CameraWorkspace] Auto-prompt caught:', e));
    }
  }, [activeCamera.id, isLocalWebcam]);

  const handleAddCamera = (camData) => {
    onAddCamera(camData);
    setIsAddModalOpen(false);
  };

  const switchToLaptopCamera = () => {
    const laptopCam = cameras.find(c => c.type === 'laptop' || c.type === 'usb');
    if (laptopCam) {
      onSelectCamera(laptopCam.id);
    }
    if (webcam && !webcam.isStreaming) {
      webcam.requestCameraPermission();
    }
  };

  const renderActiveViewport = (isSplit = false) => {
    const cam = activeCamera.name ? activeCamera : primaryCamera;
    const isWebcamType = cam.type === 'laptop' || cam.type === 'usb' || cam.type === 'webcam';

    return (
      <div className={styles.viewPort}>
        {/* Real Live Hardware Video Element */}
        {isWebcamType && webcam?.isStreaming && (
          <video 
            ref={isSplit ? splitVideoRef : videoRef} 
            className={styles.videoStream} 
            autoPlay 
            playsInline 
            muted 
          />
        )}

        {/* Permission Request Card for Webcams */}
        {isWebcamType && (!webcam?.isStreaming || webcam?.permissionStatus === 'denied') && (
          <div className={styles.permissionPrompt}>
            {webcam?.permissionStatus === 'denied' ? (
              <>
                <AlertCircle size={44} style={{ color: 'var(--vc-error, #ef4444)', marginBottom: 12 }} />
                <h3 className={styles.permissionTitle}>CAMERA PERMISSION DENIED</h3>
                <p className={styles.permissionText}>
                  Your browser blocked access to the webcam. Please click the camera/lock icon in your browser address bar, set Camera to <strong>Allow</strong>, and retry.
                </p>
                <button 
                  className={styles.allowPermissionBtn}
                  onClick={() => webcam?.requestCameraPermission()}
                >
                  <RefreshCw size={16} /> RETRY CAMERA ACCESS
                </button>
              </>
            ) : (
              <>
                <Video size={44} className={styles.permissionIcon} />
                <h3 className={styles.permissionTitle}>HARDWARE CAMERA INPUT</h3>
                <p className={styles.permissionText}>
                  Click the button below to allow VISIONCAP to access your laptop or USB webcam feed.
                </p>
                <button 
                  className={styles.allowPermissionBtn}
                  onClick={() => webcam?.requestCameraPermission()}
                >
                  <Video size={16} /> ALLOW CAMERA PERMISSION
                </button>
              </>
            )}
          </div>
        )}

        {/* Offline Card for ESP32-CAM / External streams when not connected */}
        {!isWebcamType && (
          <div className={styles.permissionPrompt}>
            <Radio size={44} className={styles.permissionIcon} />
            <h3 className={styles.permissionTitle}>{cam.name || 'ESP32-CAM'} WAITING FOR FEED</h3>
            <p className={styles.permissionText}>
              Hardware node at <code>{cam.url || 'http://192.168.1.100'}</code> is currently offline. You can test VISIONCAP right now using your laptop webcam.
            </p>
            <button 
              className={styles.allowPermissionBtn}
              onClick={switchToLaptopCamera}
            >
              <Video size={16} /> SWITCH TO LAPTOP WEBCAM
            </button>
          </div>
        )}

        {/* HUD Overlay with live telemetry */}
        <CameraHUD 
          cameraName={cam.name || 'CAM-01'} 
          status={isWebcamType ? (webcam?.isStreaming ? 'LIVE' : (webcam?.permissionStatus === 'denied' ? 'ERROR' : 'READY')) : (cam.status || 'LIVE')} 
          resolution={isWebcamType && webcam?.isStreaming ? webcam.resolution : (cam.resolution || '1280×720')}
          isDemo={isWebcamType ? !webcam?.isStreaming : cam.isDemo}
        />

        {/* Quick switch helper if currently on ESP32-CAM */}
        {!isWebcamType && (
          <div className={styles.switchWebcamBar}>
            <span>Testing with laptop webcam?</span>
            <button className={styles.switchWebcamBtn} onClick={switchToLaptopCamera}>
              Switch to Laptop Camera
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderView = () => {
    switch (viewMode) {
      case 'grid':
        return (
          <div className={styles.mainArea}>
            <CameraGrid cameras={cameras} activeCameraId={activeCameraId} onSelect={onSelectCamera} />
          </div>
        );
      case 'split':
        const secondaryCameras = cameras.filter(c => c.id !== (activeCamera?.id || primaryCamera?.id));
        return (
          <div className={styles.splitView}>
            <div className={styles.primarySplit}>
              {renderActiveViewport(true)}
            </div>
            <div className={styles.secondarySplit}>
              {secondaryCameras.slice(0, 3).map(cam => (
                <div key={cam.id} className={styles.smallViewport} onClick={() => onSelectCamera(cam.id)}>
                   <span className={styles.smallLabel}>{cam.name}</span>
                </div>
              ))}
              {secondaryCameras.length === 0 && (
                <div className={styles.emptySmallViewport}>No secondary cameras</div>
              )}
            </div>
          </div>
        );
      case 'primary':
      default:
        return (
          <div className={styles.primaryView}>
            {cameras.length > 0 ? (
              renderActiveViewport(false)
            ) : (
              <div className={styles.viewPort}>
                <div className={styles.noCameraMessage}>NO CAMERAS CONNECTED</div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={styles.workspace}>
      <div className={styles.sidebar}>
        <CameraSelector 
          cameras={cameras} 
          activeCameraId={activeCameraId} 
          primaryCameraId={primaryCameraId}
          onSelect={onSelectCamera}
          onAdd={() => setIsAddModalOpen(true)}
        />
      </div>
      
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className={styles.switchWebcamBtn}
              onClick={() => {
                if (!isLocalWebcam) {
                  switchToLaptopCamera();
                } else {
                  webcam?.requestCameraPermission();
                }
              }}
              title="Request browser camera permission"
            >
              <Video size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {webcam?.isStreaming ? 'Webcam Live' : 'Request Camera Permission'}
            </button>
          </div>

          <div className={styles.viewToggles}>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'primary' ? styles.activeToggle : ''}`}
              onClick={() => onSetViewMode('primary')}
              title="Primary View"
            >
              <Maximize size={18} />
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.activeToggle : ''}`}
              onClick={() => onSetViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'split' ? styles.activeToggle : ''}`}
              onClick={() => onSetViewMode('split')}
              title="Split View"
            >
              <SplitSquareHorizontal size={18} />
            </button>
          </div>
        </div>
        
        <div className={styles.viewContainer}>
          {renderView()}
        </div>
      </div>

      <AddCameraModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddCamera} 
      />
    </div>
  );
};

export default CameraWorkspace;
