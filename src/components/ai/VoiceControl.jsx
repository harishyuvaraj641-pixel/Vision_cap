import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import styles from './VoiceControl.module.css';

const AI_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  TRANSCRIBING: 'TRANSCRIBING',
  CAPTURED: 'CAPTURED',
  DECODING: 'DECODING',
  ANALYZING: 'ANALYZING',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING',
  ERROR: 'ERROR',
  OFFLINE: 'OFFLINE'
};

export default function VoiceControl({ status = 'idle', onToggle, disabled, language = 'en' }) {
  const currentStatus = (status || '').toLowerCase();
  const isListening = currentStatus === 'listening';
  const isTranscribing = currentStatus === 'transcribing';
  const isAnalyzing = currentStatus === 'analyzing' || currentStatus === 'thinking' || currentStatus === 'decoding' || currentStatus === 'captured';
  const isSpeaking = currentStatus === 'speaking';
  const isError = currentStatus === 'error';
  const isOffline = currentStatus === 'offline';
  const isDisabled = disabled || isOffline;
  const isTamil = language === 'ta';

  let labelText = '';
  if (isListening) labelText = isTamil ? 'கேட்கிறது... (பேசவும்)' : 'LISTENING... (SPEAK NOW)';
  if (isTranscribing) labelText = isTamil ? 'தமிழ் உரை மாற்றம்...' : 'TRANSCRIBING...';
  if (isAnalyzing) labelText = isTamil ? 'ஆராய்கிறது...' : 'ANALYZING...';
  if (isSpeaking) labelText = isTamil ? 'விஷன்கேப் பேசுகிறது (குறுக்கிட பேசவும்)' : 'SPEAKING (SPEAK TO INTERRUPT)';
  if (isError) labelText = isTamil ? 'ஒலிவாங்கி பிழை' : 'MIC ERROR';
  if (isOffline) labelText = isTamil ? 'இணைப்பில்லை' : 'OFFLINE';

  const buttonClasses = [
    styles.micButton,
    isListening ? styles.listening : '',
    isTranscribing ? styles.transcribing : '',
    isAnalyzing ? styles.analyzing : '',
    isSpeaking ? styles.speaking : '',
    isError ? styles.error : '',
    isDisabled ? styles.disabled : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.container}>
      {isListening && (
        <div className={styles.rippleContainer}>
          <div className={styles.ripple1}></div>
          <div className={styles.ripple2}></div>
          <div className={styles.ripple3}></div>
        </div>
      )}
      
      <button 
        className={buttonClasses} 
        onClick={onToggle}
        disabled={isDisabled}
        aria-label={isTamil ? "குரல் உரையாடல்" : "Toggle Voice Conversation"}
        title={isTamil ? "குரல் உரையாடலைத் தொடங்க / நிறுத்த (Spacebar)" : "Start / Stop Continuous Conversation (Spacebar)"}
      >
        {isOffline || isError ? <MicOff size={32} /> : <Mic size={32} />}
        
        {isListening && (
          <div className={styles.waveformContainer}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.waveformBar} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}
      </button>
      
      {labelText ? <div className={styles.label}>{labelText}</div> : null}
      {isTamil && (
        <div className={styles.tamilBadge}>
          தமிழ் குரல் உரைமாற்றி (Whisper AI)
        </div>
      )}
    </div>
  );
}
