import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import styles from './BootSequence.module.css';

const BOOT_STAGES = [
  'INITIALIZING VISION CORE',
  'LOADING CAMERA INTERFACE',
  'LOADING AUDIO SYSTEM',
  'INITIALIZING AI CORE',
  'SYSTEM READY'
];

const BootSequence = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Hard fallback: never stay on boot screen for more than 2.5 seconds
    const hardTimeout = setTimeout(() => {
      if (onCompleteRef.current) onCompleteRef.current();
    }, 2500);

    const stageInterval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < BOOT_STAGES.length - 1) return prev + 1;
        clearInterval(stageInterval);
        setTimeout(() => {
          if (onCompleteRef.current) onCompleteRef.current();
        }, 400);
        return prev;
      });
    }, 450);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + (100 / (BOOT_STAGES.length * 4.5)), 100));
    }, 100);

    return () => {
      clearTimeout(hardTimeout);
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const handleSkip = () => {
    if (onCompleteRef.current) onCompleteRef.current();
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.logo}>VISIONCAP</h1>
        <p className={styles.tagline}>See the world. Ask anything. Hear the answer.</p>
        
        <div className={styles.stages}>
          {BOOT_STAGES.map((stage, index) => (
            <div 
              key={index} 
              className={`${styles.stage} ${index <= currentStage ? styles.visible : ''}`}
            >
              {index < currentStage ? (
                <Check size={16} className={styles.checkIcon} />
              ) : index === currentStage && index < BOOT_STAGES.length - 1 ? (
                <Loader2 size={16} className={styles.spinner} />
              ) : index === BOOT_STAGES.length - 1 && index === currentStage ? (
                <Check size={16} className={styles.checkIcon} />
              ) : (
                <span className={styles.placeholder} />
              )}
              <span className={index === BOOT_STAGES.length - 1 ? styles.readyText : ''}>
                {stage}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>

      <button 
        onClick={handleSkip}
        style={{
          marginTop: '32px',
          color: 'rgba(0, 212, 255, 0.8)',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '4px',
          background: 'rgba(0, 0, 0, 0.4)',
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        <span>ENTER DASHBOARD</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default BootSequence;
