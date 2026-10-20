import { useState, useCallback } from 'react';
import { AI_STATES, DECODING_STAGES } from '../data/mockData';

export const useAIState = () => {
    const [status, setStatus] = useState(AI_STATES.IDLE);
    const [stage, setStage] = useState(null);
    const [currentTranscription, setCurrentTranscription] = useState('');
    const [currentResponse, setCurrentResponse] = useState('');
    const [decodingStageIndex, setDecodingStageIndex] = useState(-1);

    const startListening = useCallback(() => {
        setStatus(AI_STATES.LISTENING);
        setCurrentTranscription('');
    }, []);

    const stopListening = useCallback(() => {
        setStatus(AI_STATES.IDLE);
    }, []);

    const simulateDecoding = useCallback(async () => {
        setStatus(AI_STATES.PROCESSING);
        
        for (let i = 0; i < DECODING_STAGES.length; i++) {
            setDecodingStageIndex(i);
            setStage(DECODING_STAGES[i].text);
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        }
        
        setStatus(AI_STATES.RESPONDING);
        setDecodingStageIndex(-1);
        setStage(null);
    }, []);

    const reset = useCallback(() => {
        setStatus(AI_STATES.IDLE);
        setStage(null);
        setCurrentTranscription('');
        setCurrentResponse('');
        setDecodingStageIndex(-1);
    }, []);

    return {
        status,
        stage,
        currentTranscription,
        currentResponse,
        decodingStageIndex,
        setStatus,
        startListening,
        stopListening,
        simulateDecoding,
        reset,
        setCurrentTranscription,
        setCurrentResponse
    };
};
