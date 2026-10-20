import * as mockCameraService from './mockCameraService';
import * as mockAudioService from './mockAudioService';
import * as mockAIService from './mockAIService';
import * as mockConversationService from './mockConversationService';

export const createApiService = (useMock = true) => {
    if (useMock) {
        return {
            cameraService: mockCameraService,
            audioService: mockAudioService,
            aiService: mockAIService,
            conversationService: mockConversationService,
            systemService: {
                getStatus: () => Promise.resolve({ status: 'ok', mock: true })
            }
        };
    }

    // Real API placeholders
    return {
        cameraService: {
            getCameras: () => fetch('/api/cameras').then(res => res.json()),
            getCameraStatus: (id) => fetch(`/api/cameras/${id}/status`).then(res => res.json()),
            getStream: (id) => `/api/cameras/${id}/stream`,
            addCamera: (data) => fetch('/api/cameras', { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
            removeCamera: (id) => fetch(`/api/cameras/${id}`, { method: 'DELETE' }).then(res => res.json()),
            updateCamera: (id, data) => fetch(`/api/cameras/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(res => res.json()),
        },
        audioService: {
            getInputDevices: () => navigator.mediaDevices.enumerateDevices().then(devices => devices.filter(d => d.kind === 'audioinput')),
            getOutputDevices: () => navigator.mediaDevices.enumerateDevices().then(devices => devices.filter(d => d.kind === 'audiooutput'))
        },
        aiService: {
            askVisionQuestion: (question, cameraId = null, imageBase64 = null) =>
                fetch('/api/vision/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question,
                        camera_id: cameraId,
                        image_base64: imageBase64
                    })
                }).then(async res => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({ detail: res.statusText }));
                        throw new Error(err.detail || `Server error ${res.status}`);
                    }
                    return res.json();
                })
        },
        conversationService: {
            getHistory: () => fetch('/api/conversation').then(res => res.json()),
            clearHistory: () => fetch('/api/conversation', { method: 'DELETE' }).then(res => res.json())
        },
        systemService: {
            getStatus: () => fetch('/api/system/status').then(res => res.json())
        }
    };
};

export default createApiService;
