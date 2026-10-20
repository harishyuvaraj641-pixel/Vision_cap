import { useState, useEffect, useCallback } from 'react';
import { getCameras, addCamera as addCamService, removeCamera as rmCamService, updateCamera as upCamService } from '../services/mockCameraService';
import { useWebcam } from './useWebcam';

export const useCameraManager = () => {
    const [cameras, setCameras] = useState([]);
    const [activeCameraId, setActiveCameraId] = useState(null);
    const [primaryCameraId, setPrimaryCameraId] = useState(null);
    const [viewMode, setViewMode] = useState('primary'); // 'primary' | 'grid' | 'split'

    const webcam = useWebcam();

    const fetchCameras = useCallback(async () => {
        const fetchedCameras = await getCameras();
        setCameras(fetchedCameras);
        if (fetchedCameras.length > 0 && !primaryCameraId) {
            // Prioritize laptop camera by default so user gets live hardware feed immediately
            const laptopCam = fetchedCameras.find(c => c.type === 'laptop' || c.type === 'usb' || c.type === 'webcam');
            const defaultCam = laptopCam || fetchedCameras[0];
            setPrimaryCameraId(defaultCam.id);
            setActiveCameraId(defaultCam.id);
        }
    }, [primaryCameraId]);

    useEffect(() => {
        fetchCameras();
    }, [fetchCameras]);

    // When webcam stream activates or resolution changes, update any laptop/usb camera cards
    useEffect(() => {
        if (webcam.isStreaming && webcam.stream) {
            setCameras(prev => prev.map(c => {
                if (c.type === 'laptop' || c.type === 'usb') {
                    return {
                        ...c,
                        status: 'live',
                        resolution: webcam.resolution || c.resolution,
                        isDemo: false // real hardware stream
                    };
                }
                return c;
            }));
        } else if (webcam.permissionStatus === 'denied') {
            setCameras(prev => prev.map(c => {
                if (c.type === 'laptop' || c.type === 'usb') {
                    return {
                        ...c,
                        status: 'error'
                    };
                }
                return c;
            }));
        }
    }, [webcam.isStreaming, webcam.stream, webcam.resolution, webcam.permissionStatus]);

    const addCamera = async (data) => {
        const newCam = await addCamService(data);
        setCameras(prev => [...prev, newCam]);
    };

    const removeCamera = async (id) => {
        await rmCamService(id);
        setCameras(prev => prev.filter(c => c.id !== id));
        if (activeCameraId === id) setActiveCameraId(null);
        if (primaryCameraId === id) setPrimaryCameraId(null);
    };

    const updateCamera = async (id, data) => {
        const updated = await upCamService(id, data);
        setCameras(prev => prev.map(c => c.id === id ? updated : c));
    };

    const renameCameraAction = async (id, newName) => {
        await updateCamera(id, { name: newName });
    };

    return {
        cameras,
        activeCameraId,
        primaryCameraId,
        viewMode,
        webcam,
        requestCameraPermission: webcam.requestCameraPermission,
        setActiveCamera: setActiveCameraId,
        setPrimaryCamera: setPrimaryCameraId,
        setViewMode,
        addCamera,
        removeCamera,
        updateCamera,
        renameCamera: renameCameraAction,
        renameCameraAction
    };
};
