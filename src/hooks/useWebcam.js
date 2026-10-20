import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useWebcam — Real browser camera streaming and permission management.
 * Calls navigator.mediaDevices.getUserMedia({ video: true }) to trigger browser permission dialog.
 */
export const useWebcam = () => {
  const [stream, setStream] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'idle' | 'prompt' | 'prompting' | 'granted' | 'denied' | 'unsupported'
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [resolution, setResolution] = useState('1280×720');
  const streamRef = useRef(null);

  // Check initial permission status if available
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('unsupported');
      setError('Webcam access is not supported by this browser.');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' })
        .then((permission) => {
          if (permission.state === 'granted') {
            setPermissionStatus('granted');
          } else if (permission.state === 'denied') {
            setPermissionStatus('denied');
          } else {
            setPermissionStatus('prompt');
          }

          permission.onchange = () => {
            if (permission.state === 'granted') {
              setPermissionStatus('granted');
            } else if (permission.state === 'denied') {
              setPermissionStatus('denied');
              stopCamera();
            } else {
              setPermissionStatus('prompt');
            }
          };
        })
        .catch(() => {
          // Some browsers throw on 'camera' query name; fallback to default prompt state
          setPermissionStatus('prompt');
        });
    }
  }, []);

  // Enumerate connected camera devices
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('[useWebcam] Failed to enumerate devices:', e);
    }
  }, [selectedDeviceId]);

  // Request Camera Permission & Start Video Stream
  const requestCameraPermission = useCallback(async (deviceId = null) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('unsupported');
      setError('Camera access is not supported in this browser.');
      return null;
    }

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setPermissionStatus('prompting');
    setError(null);

    const targetDeviceId = deviceId || selectedDeviceId;
    const constraints = {
      video: targetDeviceId
        ? { deviceId: { exact: targetDeviceId } }
        : {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
      audio: false
    };

    try {
      console.info('[useWebcam] Calling navigator.mediaDevices.getUserMedia...');
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsStreaming(true);
      setPermissionStatus('granted');
      setError(null);

      // Detect resolution from active track
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
        if (settings.width && settings.height) {
          setResolution(`${settings.width}×${settings.height}`);
        }
      }

      // Enumerate devices now that permission is granted (reveals hardware device labels)
      await refreshDevices();

      return mediaStream;
    } catch (err) {
      console.warn('[useWebcam] getUserMedia error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setError('Camera permission was denied. Please allow camera access in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionStatus('denied');
        setError('No webcam device found on your system.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setPermissionStatus('denied');
        setError('Webcam is already in use by another application.');
      } else {
        setPermissionStatus('denied');
        setError(`Camera error: ${err.message || err.name}`);
      }
      setIsStreaming(false);
      return null;
    }
  }, [selectedDeviceId, refreshDevices]);

  // Capture current live frame as base64 JPEG
  const captureFrameBase64 = useCallback(async () => {
    if (!streamRef.current) return null;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track || track.readyState !== 'live') return null;

    try {
      if (window.ImageCapture) {
        const imageCapture = new window.ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (err) {
      console.warn('[useWebcam] ImageCapture grab failed, trying video fallback:', err);
    }

    try {
      const videoEl = document.querySelector('video');
      if (videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (e) {
      console.warn('[useWebcam] Canvas capture fallback failed:', e);
    }

    return null;
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsStreaming(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    stream,
    permissionStatus,
    isStreaming,
    error,
    videoDevices,
    selectedDeviceId,
    resolution,
    requestCameraPermission,
    captureFrameBase64,
    stopCamera,
    setSelectedDeviceId
  };
};
