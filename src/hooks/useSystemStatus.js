import { useMemo } from 'react';

export const useSystemStatus = (cameraManager, audioDevices, aiState) => {
    const status = useMemo(() => {
        const cameras = cameraManager?.cameras || [];
        const camerasCount = cameras.length;
        const liveCameras = cameras.filter(c => 
            c.status === 'live' || c.status === 'ready' || c.status === 'online'
        ).length;

        const micConnected = !!audioDevices?.selectedInputId;
        const speakerConnected = !!audioDevices?.selectedOutputId;

        const micName = audioDevices?.inputDevices?.find(d => d.id === audioDevices.selectedInputId)?.name || 
                        audioDevices?.inputDevices?.find(d => d.id === audioDevices.selectedInputId)?.label || 'None';
        const speakerName = audioDevices?.outputDevices?.find(d => d.id === audioDevices.selectedOutputId)?.name || 
                            audioDevices?.outputDevices?.find(d => d.id === audioDevices.selectedOutputId)?.label || 'None';

        const aiStateStatus = aiState?.status?.toLowerCase() || 'idle';
        const aiDisplayStatus = (aiStateStatus === 'error') ? 'ERROR' : 
                                (aiStateStatus === 'offline') ? 'OFFLINE' : 'READY';

        return {
            state: 'ready',
            cameras: {
                count: camerasCount,
                online: liveCameras,
                status: liveCameras > 0 ? 'ONLINE' : (camerasCount > 0 ? 'READY' : 'OFFLINE'),
            },
            microphone: {
                connected: micConnected,
                name: micName,
                status: micConnected ? 'CONNECTED' : 'DISCONNECTED',
            },
            audioOutput: {
                connected: speakerConnected,
                name: speakerName,
                status: speakerConnected ? 'CONNECTED' : 'DISCONNECTED',
            },
            ai: {
                status: aiDisplayStatus,
            },
            network: {
                status: 'ONLINE',
            }
        };
    }, [
        cameraManager?.cameras, 
        audioDevices?.selectedInputId, 
        audioDevices?.selectedOutputId, 
        audioDevices?.inputDevices, 
        audioDevices?.outputDevices, 
        aiState?.status
    ]);

    return status;
};
