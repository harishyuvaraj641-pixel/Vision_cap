import { useState, useCallback } from 'react';
import { DEMO_WORKFLOW } from '../data/mockData';

export const useDemoMode = () => {
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [isRunningDemo, setIsRunningDemo] = useState(false);

    const toggleDemoMode = useCallback(() => {
        setIsDemoMode(prev => !prev);
    }, []);

    const runDemo = useCallback(async (aiState, conversation) => {
        if (isRunningDemo) return;
        setIsRunningDemo(true);

        const setStatus = typeof aiState === 'function' ? aiState : (aiState?.setStatus || (() => {}));
        const addMsg = typeof conversation === 'function' ? conversation : (conversation?.addMessage || (() => {}));

        try {
            for (const step of DEMO_WORKFLOW) {
                if (step.delay) {
                    await new Promise(resolve => setTimeout(resolve, step.delay));
                }
                
                if (step.type === 'user' || step.type === 'assistant') {
                    addMsg(step.type, step.text, { 
                        isDemo: true,
                        frameId: step.type === 'assistant' ? 4291 : undefined,
                        cameraId: step.type === 'assistant' ? 'cam-001' : undefined
                    });
                } else if (step.type === 'ai_state') {
                    setStatus(step.state);
                }
            }
        } catch (err) {
            console.error('Error during demo run:', err);
        } finally {
            setIsRunningDemo(false);
            setStatus('idle');
        }
    }, [isRunningDemo]);

    return {
        isDemoMode,
        isRunningDemo,
        toggleDemoMode,
        runDemo
    };
};
