import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import styles from './DecodingAnimation.module.css';

const DEFAULT_STAGES = [
  { id: 'img_proc', label: 'IMAGE PROCESSING', description: 'Enhancing contrast & edges' },
  { id: 'ocr', label: 'OPTICAL CHAR RECOGNITION', description: 'Extracting text data' },
  { id: 'semantic', label: 'SEMANTIC ANALYSIS', description: 'Mapping context' },
  { id: 'llm_sync', label: 'LLM SYNCHRONIZATION', description: 'Querying neural engine' }
];

export default function DecodingAnimation({ isActive, currentStageIndex = 0, stages = DEFAULT_STAGES }) {
  if (!isActive) return null;

  const totalProgress = (currentStageIndex / Math.max(stages.length - 1, 1)) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>SYSTEM DECODING</span>
        <span className={styles.percent}>{Math.round(totalProgress)}%</span>
      </div>
      
      <div className={styles.mainProgressContainer}>
        <div className={styles.mainProgressBar} style={{ width: `${totalProgress}%` }} />
      </div>

      <div className={styles.stages}>
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isUpcoming = index > currentStageIndex;

          return (
            <div 
              key={stage.id} 
              className={`${styles.stage} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''} ${isUpcoming ? styles.upcoming : ''}`}
            >
              <div className={styles.iconContainer}>
                {isCompleted ? (
                  <CheckCircle2 size={16} className={styles.completedIcon} />
                ) : isCurrent ? (
                  <Loader2 size={16} className={styles.currentIcon} />
                ) : (
                  <Circle size={16} className={styles.upcomingIcon} />
                )}
                {index < stages.length - 1 && <div className={styles.line} />}
              </div>
              
              <div className={styles.content}>
                <div className={styles.stageHeader}>
                  <span className={styles.stageLabel}>{stage.label}</span>
                </div>
                <div className={styles.stageDesc}>{stage.description}</div>
                {isCurrent && (
                  <div className={styles.stageProgress}>
                    <div className={styles.stageProgressBar} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
