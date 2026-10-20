import { useState, useEffect, useCallback, useRef } from 'react';
import { getInputDevices, getOutputDevices } from '../services/mockAudioService';

export const useAudioDevices = () => {
    const [inputDevices, setInputDevices] = useState([]);
    const [outputDevices, setOutputDevices] = useState([]);
    const [selectedInputId, setSelectedInputId] = useState(null);
    const [selectedOutputId, setSelectedOutputId] = useState(null);
    const [inputLevel, setInputLevel] = useState(0);
    const [isTestingMic, setIsTestingMic] = useState(false);
    const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);

    const micInterval = useRef(null);

    useEffect(() => {
        const loadDevices = async () => {
            const inputs = await getInputDevices();
            const outputs = await getOutputDevices();
            setInputDevices(inputs);
            setOutputDevices(outputs);
            if (inputs.length > 0) setSelectedInputId(inputs[0].id);
            if (outputs.length > 0) setSelectedOutputId(outputs[0].id);
        };
        loadDevices();
    }, []);

    const selectInput = (id) => setSelectedInputId(id);
    const selectOutput = (id) => setSelectedOutputId(id);

    const testMicrophone = useCallback(async () => {
        if (isTestingMic) return;
        setIsTestingMic(true);
        
        let audioContext = null;
        let micStream = null;
        let animFrameId = null;

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(micStream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const startTime = Date.now();
                const updateLevel = () => {
                    analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / dataArray.length;
                    setInputLevel(Math.min(average / 100, 1));

                    if (Date.now() - startTime < 4000) {
                        animFrameId = requestAnimationFrame(updateLevel);
                    } else {
                        cleanup();
                    }
                };
                updateLevel();
                return;
            }
        } catch (e) {
            console.warn('[useAudioDevices] Microphone permission denied or audio context failed:', e);
        }

        const cleanup = () => {
            if (animFrameId) cancelAnimationFrame(animFrameId);
            if (micStream) micStream.getTracks().forEach(t => t.stop());
            if (audioContext) audioContext.close().catch(() => {});
            setInputLevel(0);
            setIsTestingMic(false);
        };

        // Fallback simulation timer if getUserMedia fails
        let ticks = 0;
        micInterval.current = setInterval(() => {
            setInputLevel(Math.random() * 0.8 + 0.1);
            ticks++;
            if (ticks > 30) {
                clearInterval(micInterval.current);
                cleanup();
            }
        }, 100);
    }, [isTestingMic]);

    const testSpeaker = useCallback(() => {
        if (isTestingSpeaker) return;
        setIsTestingSpeaker(true);
        setTimeout(() => {
            setIsTestingSpeaker(false);
        }, 2000); // 2 seconds
    }, [isTestingSpeaker]);

    const selectedInput = inputDevices.find(d => d.id === selectedInputId) || inputDevices[0] || null;
    const selectedOutput = outputDevices.find(d => d.id === selectedOutputId) || outputDevices[0] || null;

    return {
        inputDevices,
        outputDevices,
        selectedInputId,
        selectedOutputId,
        selectedInput,
        selectedOutput,
        inputLevel,
        isTestingMic,
        isTestingSpeaker,
        selectInput,
        selectOutput,
        testMicrophone,
        testSpeaker
    };
};
