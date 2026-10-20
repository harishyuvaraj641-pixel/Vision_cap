import { MOCK_CAMERAS } from '../data/mockData';

let cameras = [...MOCK_CAMERAS];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getCameras = async () => {
    await delay(100);
    return [...cameras];
};

export const getCameraStatus = async (id) => {
    await delay(50);
    const camera = cameras.find(c => c.id === id);
    return camera ? { status: camera.status } : null;
};

export const getStream = async (id) => {
    await delay(50);
    return `mock-stream-url-${id}`;
};

export const addCamera = async (data) => {
    await delay(200);
    const newCamera = {
        ...data,
        id: `cam_${Date.now()}`,
        status: 'offline' // default status
    };
    cameras.push(newCamera);
    return newCamera;
};

export const removeCamera = async (id) => {
    await delay(150);
    cameras = cameras.filter(c => c.id !== id);
    return { success: true };
};

export const updateCamera = async (id, data) => {
    await delay(100);
    const index = cameras.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Camera not found');
    
    cameras[index] = { ...cameras[index], ...data };
    return cameras[index];
};
