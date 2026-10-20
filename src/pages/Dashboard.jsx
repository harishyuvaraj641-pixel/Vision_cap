import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Dashboard.module.css';

import CameraWorkspace from '../components/camera/CameraWorkspace';
import AICore from '../components/ai/AICore';
import AIState from '../components/ai/AIState';
import VoiceControl from '../components/ai/VoiceControl';
import AudioPanel from '../components/audio/AudioPanel';
import DecodingAnimation from '../components/ai/DecodingAnimation';
import ConversationPanel from '../components/conversation/ConversationPanel';
import LanguageToggle from '../components/common/LanguageToggle';
import InterruptToggle from '../components/common/InterruptToggle';

import { useVoiceTranscriber } from '../hooks/useVoiceTranscriber';
import { detectLanguage, getQueryIntentContext } from '../utils/tamilDetector';
import { DECODING_STAGES } from '../data/mockData';

const TAMIL_QUICK_ACTIONS = [
  { label: 'முன்னால் என்ன?', query: 'என் முன்னால் என்ன இருக்கிறது?' },
  { label: 'காட்சி விவரம்', query: 'முழு காட்சியை விரிவாக விவரிக்கவும்.' },
  { label: 'தடங்கல் உள்ளதா?', query: 'என் பாதையில் ஏதாவது தடங்கல்கள் அல்லது ஆபத்துக்கள் உள்ளதா?' },
  { label: 'படிக்கட்டுகள்?', query: 'அருகில் படிக்கட்டுகள் அல்லது மேடு பள்ளங்கள் உள்ளதா?' }
];

const Dashboard = ({
  cameraManager,
  audioDevices,
  aiState,
  conversation,
  demoMode,
  onOpenInputSelector,
  onOpenOutputSelector,
  language = 'ta',
  setLanguage,
  onToggleLanguage
}) => {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const isLiveActiveRef = useRef(false);

  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  const [detectedBadge, setDetectedBadge] = useState(null);

  const navIntervalRef = useRef(null);
  const isNavProcessingRef = useRef(false);

  const isTamil = language === 'ta';
  const isTamilRef = useRef(isTamil);
  const languageRef = useRef(language);

  const [isInterruptEnabled, setIsInterruptEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('visioncap_interrupt_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });
  const isInterruptEnabledRef = useRef(isInterruptEnabled);

  const toggleInterrupt = useCallback(() => {
    setIsInterruptEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('visioncap_interrupt_enabled', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const isInterruptedRef = useRef(false);
  const transcriberRef = useRef(null);

  useEffect(() => {
    isInterruptEnabledRef.current = isInterruptEnabled;
  }, [isInterruptEnabled]);

  useEffect(() => {
    isTamilRef.current = isTamil;
    languageRef.current = language;
  }, [isTamil, language]);

  useEffect(() => {
    isLiveActiveRef.current = isLiveActive;
  }, [isLiveActive]);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  // Clean speech synthesis with completion callback & active barge-in monitoring
  const speakText = useCallback((text, onComplete) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isInterruptedRef.current = false;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const detectedTamil = isTamilRef.current || /[\u0B80-\u0BFF]/.test(text || '');
      if (detectedTamil) {
        utterance.lang = 'ta-IN';
        try {
          const voices = window.speechSynthesis.getVoices();
          const tamilVoice = voices.find(v => 
            (v.lang && v.lang.includes('ta')) || 
            (v.name && v.name.toLowerCase().includes('tamil'))
          );
          if (tamilVoice) {
            utterance.voice = tamilVoice;
          }
        } catch (e) {}
      } else {
        utterance.lang = 'en-US';
      }

      let finished = false;

      // Start listening in full-duplex mode during speech synthesis if speak-to-interrupt is enabled!
      utterance.onstart = () => {
        if (isLiveActiveRef.current && isInterruptEnabledRef.current) {
          transcriberRef.current?.startRecording(languageRef.current);
        }
      };

      const handleDone = (isInterrupted = false) => {
        if (finished) return;
        finished = true;

        if (isInterruptedRef.current || isInterrupted) {
          console.log('[Dashboard] TTS playback interrupted by user voice.');
          isInterruptedRef.current = false;
          return;
        }

        setIsProcessing(false);
        isProcessingRef.current = false;

        // If not interrupted and in Live session, reset turn buffer and keep listening
        if (isLiveActiveRef.current && !isNavigatingRef.current) {
          transcriberRef.current?.resetBufferForTurn?.();
          transcriberRef.current?.startRecording(languageRef.current);
          aiState.setStatus('listening');
        }

        if (onComplete) onComplete();
      };

      utterance.onend = () => handleDone(false);
      utterance.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') {
          handleDone(true);
        } else {
          handleDone(false);
        }
      };

      window.speechSynthesis.speak(utterance);

      // Pre-arm microphone immediately if speak-to-interrupt is enabled
      if (isLiveActiveRef.current && isInterruptEnabledRef.current) {
        transcriberRef.current?.startRecording(languageRef.current);
      }
    } else {
      setTimeout(() => {
        setIsProcessing(false);
        isProcessingRef.current = false;
        if (onComplete) onComplete();
      }, 2500);
    }
  }, [aiState]);

  // Navigation mode intent matchers (English, Tamil, Tanglish)
  const isNavigationStart = (text) => {
    const t = (text || '').toLowerCase().trim();
    const navPatterns = [
      /help\s+me\s+navigate/i,
      /\bnavigate\b/i,
      /start\s+navigation/i,
      /navigation\s+mode/i,
      /guide\s+me/i,
      /வழிகாட்ட/,
      /வழி\s*காட்டு/,
      /பாதை\s*காட்டு/,
      /vazhi\s*kaattu/i,
      /valikaattu/i,
      /vazhikaattu/i
    ];
    return navPatterns.some(p => p.test(t));
  };

  const isNavigationStop = (text) => {
    const t = (text || '').toLowerCase().trim();
    const stopPatterns = [
      /stop\s+navigation/i,
      /exit\s+navigation/i,
      /cancel\s+navigation/i,
      /end\s+navigation/i,
      /\bstop\b/i,
      /நிறுத்து/,
      /போதும்/,
      /வழிகாட்டுதலை\s*நிறுத்து/,
      /niruthu/i,
      /podhum/i
    ];
    return stopPatterns.some(p => p.test(t));
  };

  // 4-Second Continuous Navigation Cycle
  const runNavigationCycle = useCallback(async () => {
    if (!isNavigatingRef.current) return;
    if (isNavProcessingRef.current) return;
    if (window.speechSynthesis && window.speechSynthesis.speaking) return;

    isNavProcessingRef.current = true;
    aiState.setStatus('analyzing');

    try {
      let frameBase64 = null;
      if (cameraManager.webcam && cameraManager.webcam.isStreaming && cameraManager.webcam.captureFrameBase64) {
        try {
          frameBase64 = await cameraManager.webcam.captureFrameBase64();
        } catch (e) {
          console.warn('[Dashboard] Navigation frame capture error:', e);
        }
      }

      if (!frameBase64 || !isNavigatingRef.current) {
        isNavProcessingRef.current = false;
        return;
      }

      const currentLang = isTamilRef.current ? 'ta' : 'en';
      const navPrompt = isTamilRef.current
        ? 'வழிகாட்டுதல் பயன்முறை: என் முன்னால் உள்ள தரை, பாதை, தடங்கல்கள், படிகள், கதவுகள், ஆபத்துக்கள் மற்றும் மனிதர்களைக் கவனித்து 1-2 வரிகளில் மிக சுருக்கமாக வழிகாட்டவும்.'
        : 'Navigation mode: Look directly ahead. In 1 or 2 concise sentences, describe clear walking path, obstacles, steps, doors, or hazards.';

      aiState.setStatus('thinking');

      const res = await fetch('/api/vision/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: navPrompt,
          camera_id: cameraManager.activeCameraId || 'laptop_webcam',
          image_base64: frameBase64,
          language: currentLang
        })
      });

      if (!res.ok) {
        throw new Error(`Navigation API error: ${res.status}`);
      }

      const data = await res.json();
      const answerText = data.answer || data.text;

      if (answerText && isNavigatingRef.current) {
        conversation.addMessage('assistant', answerText, {
          frameId: data.frame_id,
          latency_ms: data.latency_ms,
          isDemo: data.is_demo,
          isNavigation: true
        });

        aiState.setStatus('speaking');
        speakText(answerText, () => {
          isNavProcessingRef.current = false;
          if (isNavigatingRef.current) {
            aiState.setStatus('listening');
          }
        });
      } else {
        isNavProcessingRef.current = false;
        if (isNavigatingRef.current) {
          aiState.setStatus('listening');
        }
      }
    } catch (err) {
      console.warn('[Dashboard] Navigation cycle failed:', err);
      isNavProcessingRef.current = false;
      if (isNavigatingRef.current) {
        aiState.setStatus('listening');
      }
    }
  }, [aiState, cameraManager, conversation, speakText]);

  // Activate continuous navigation (every 4 seconds)
  const startNavigationMode = useCallback(() => {
    if (navIntervalRef.current) clearInterval(navIntervalRef.current);

    isNavigatingRef.current = true;
    setIsNavigating(true);
    isNavProcessingRef.current = false;

    const startMsg = isTamilRef.current
      ? 'வழிகாட்டுதல் பயன்முறை தொடங்கப்பட்டது. ஒவ்வொரு 4 விநாடிக்கும் உங்கள் பாதையை கவனித்து வழிகாட்டுகிறேன்.'
      : 'Navigation mode activated. Analyzing your path every 4 seconds.';

    conversation.addMessage('assistant', startMsg, { isNavigation: true });
    aiState.setStatus('speaking');

    speakText(startMsg, () => {
      if (isNavigatingRef.current) {
        aiState.setStatus('listening');
        runNavigationCycle();
        navIntervalRef.current = setInterval(runNavigationCycle, 4000);
      }
    });
  }, [aiState, conversation, runNavigationCycle, speakText]);

  // Stop continuous navigation
  const stopNavigationMode = useCallback((announce = true) => {
    if (navIntervalRef.current) {
      clearInterval(navIntervalRef.current);
      navIntervalRef.current = null;
    }
    isNavigatingRef.current = false;
    setIsNavigating(false);
    isNavProcessingRef.current = false;

    if (announce) {
      const stopMsg = isTamilRef.current
        ? 'வழிகாட்டுதல் பயன்முறை நிறுத்தப்பட்டது.'
        : 'Navigation mode stopped.';

      conversation.addMessage('assistant', stopMsg);
      aiState.setStatus('speaking');

      speakText(stopMsg, () => {
        if (isLiveActiveRef.current) {
          aiState.setStatus('listening');
          transcriberRef.current?.startRecording(languageRef.current);
        } else {
          aiState.setStatus('idle');
        }
      });
    }
  }, [aiState, conversation, speakText]);

  // Gemini Live conversational turn: Only takes image snapshot when user finishes speaking
  const handleAskQuestion = useCallback(async (questionText, overrideLanguage) => {
    if (!questionText || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    conversation.addMessage('user', questionText);

    // SNAPSHOT CAMERA FRAME ONLY WHEN USER SPEAKS
    aiState.setStatus('captured');
    let frameBase64 = null;
    if (cameraManager.webcam && cameraManager.webcam.isStreaming && cameraManager.webcam.captureFrameBase64) {
      try {
        frameBase64 = await cameraManager.webcam.captureFrameBase64();
      } catch (e) {
        console.warn('[Dashboard] Webcam capture warning:', e);
      }
    }

    aiState.setStatus('decoding');
    const activeLang = overrideLanguage || (isTamilRef.current ? 'ta' : 'en');

    // Start vision AI inference immediately in parallel with visual animations
    const apiPromise = fetch('/api/vision/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: questionText,
        camera_id: cameraManager.activeCameraId || 'laptop_webcam',
        image_base64: frameBase64,
        language: activeLang
      })
    });

    // Sleek, rapid visual cadence without holding back the network response
    setTimeout(() => {
      if (isProcessingRef.current) aiState.setStatus('analyzing');
    }, 40);
    setTimeout(() => {
      if (isProcessingRef.current) aiState.setStatus('thinking');
    }, 90);

    try {
      const res = await apiPromise;

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'API error' }));
        throw new Error(errData.detail || `Server error (${res.status})`);
      }

      const data = await res.json();
      const answerText = data.answer || data.text || (isTamilRef.current ? 'நடப்பு காட்சி பகுப்பாய்வு செய்யப்பட்டது.' : 'I have analyzed the current scene.');

      conversation.addMessage('assistant', answerText, {
        frameId: data.frame_id,
        latency_ms: data.latency_ms,
        isDemo: data.is_demo
      });

      aiState.setStatus('speaking');
      speakText(answerText, () => {
        // GEMINI LIVE CONVERSATIONAL LOOP:
        // Automatically listen for next question if in Live session!
        if (isLiveActiveRef.current && !isNavigatingRef.current) {
          aiState.setStatus('listening');
          transcriberRef.current?.startRecording(languageRef.current);
        } else if (!isNavigatingRef.current) {
          aiState.setStatus('idle');
        }
      });
    } catch (err) {
      console.warn('[Dashboard] Vision API error, falling back to mock:', err);
      try {
        const { askVisionQuestion } = await import('../services/mockAIService');
        const mockRes = await askVisionQuestion(questionText, cameraManager.activeCameraId, frameBase64, isTamilRef.current ? 'ta' : 'en');
        const answerText = mockRes.answer || mockRes.text;

        conversation.addMessage('assistant', answerText, {
          frameId: mockRes.frame_id,
          isDemo: true
        });

        aiState.setStatus('speaking');
        speakText(answerText, () => {
          if (isLiveActiveRef.current && !isNavigatingRef.current) {
            aiState.setStatus('listening');
            transcriberRef.current?.startRecording(languageRef.current);
          } else if (!isNavigatingRef.current) {
            aiState.setStatus('idle');
          }
        });
      } catch (fallbackErr) {
        aiState.setStatus('error');
        const errorMsg = isTamilRef.current
          ? `பார்வை பகுப்பாய்வை முடிக்க முடியவில்லை: ${err.message}`
          : `Could not complete vision analysis: ${err.message}`;
        conversation.addMessage('assistant', errorMsg);

        speakText(errorMsg, () => {
          if (isLiveActiveRef.current && !isNavigatingRef.current) {
            aiState.setStatus('listening');
            transcriberRef.current?.startRecording(languageRef.current);
          } else {
            aiState.setStatus('idle');
          }
        });
      }
    }
  }, [aiState, cameraManager, conversation, speakText]);

  // Groq Whisper Voice Transcriber with Gemini Live Duplex Turn-Taking
  const transcriber = useVoiceTranscriber({
    language,
    autoStopOnSilence: true,
    interruptEnabled: isInterruptEnabled,
    onSpeechStart: ({ isInterruption }) => {
      // If interrupt is disabled, ignore barge-in
      if (!isInterruptEnabledRef.current) return;

      // Gemini Live Barge-in: If user speaks while AI is speaking, interrupt immediately!
      const isSpeaking = ('speechSynthesis' in window && window.speechSynthesis.speaking) || aiState.status === 'speaking';
      if (isInterruption || isSpeaking) {
        console.log('[Dashboard] Gemini Live barge-in: User interrupted AI speech! Cancelling playback immediately...');
        isInterruptedRef.current = true;
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        aiState.setStatus('listening');
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    onStatusChange: (newStatus) => {
      if (newStatus === 'listening') {
        aiState.setStatus('listening');
      } else if (newStatus === 'transcribing') {
        aiState.setStatus('transcribing');
      } else if (newStatus === 'idle' && !['captured', 'decoding', 'analyzing', 'thinking', 'speaking'].includes(aiState.status)) {
        if (isLiveActiveRef.current && !isNavigatingRef.current) {
          aiState.setStatus('listening');
          transcriberRef.current?.startRecording(languageRef.current);
        } else if (!isNavigatingRef.current) {
          aiState.setStatus('idle');
          setIsProcessing(false);
          isProcessingRef.current = false;
        }
      } else if (newStatus === 'error') {
        aiState.setStatus('error');
      }
    },
    onTranscriptionComplete: (result) => {
      const text = result?.text?.trim();

      // If speech was empty, smoothly resume listening in Live session
      if (!text) {
        if (isLiveActiveRef.current && !isNavigatingRef.current) {
          aiState.setStatus('listening');
          transcriberRef.current?.startRecording(languageRef.current);
        } else if (!isNavigatingRef.current) {
          aiState.setStatus('idle');
          setIsProcessing(false);
          isProcessingRef.current = false;
        }
        return;
      }

      console.log('[Dashboard] Transcribed speech:', text, 'metadata:', result);

      // Automatic Language & Intent Detection:
      const isTamilDetected = result?.is_tamil || result?.detected_language === 'ta' || detectLanguage(text) === 'ta';
      const detectedLang = isTamilDetected ? 'ta' : 'en';

      if (setLanguage && detectedLang !== languageRef.current) {
        console.log(`[Dashboard] Auto-detected language switch to: ${detectedLang}`);
        setLanguage(detectedLang);
      }

      setDetectedBadge(detectedLang);
      setTimeout(() => setDetectedBadge(null), 4500);

      // Check for navigation mode triggers
      if (isNavigationStart(text)) {
        startNavigationMode();
        return;
      }

      if (isNavigationStop(text)) {
        stopNavigationMode(true);
        return;
      }

      // Normal Gemini Live turn (snapshot camera frame only when speech ends)
      handleAskQuestion(text, detectedLang);
    }
  });

  useEffect(() => {
    transcriberRef.current = transcriber;
  }, [transcriber]);

  // Single Button Handler: Toggle Gemini Live conversation mode
  const handleVoiceToggle = useCallback(async () => {
    // If not active -> Start Gemini Live session
    if (!isLiveActiveRef.current && !isNavigatingRef.current) {
      isLiveActiveRef.current = true;
      setIsLiveActive(true);
      aiState.setStatus('listening');
      await transcriberRef.current?.startRecording(language);
    } else {
      // If active -> Stop Live session & navigation
      if (isNavigatingRef.current) {
        stopNavigationMode(false);
      }
      isLiveActiveRef.current = false;
      setIsLiveActive(false);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      transcriberRef.current?.cancelRecording();
      aiState.setStatus('idle');
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [aiState, conversation, demoMode, language, stopNavigationMode]);

  // Accessibility keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputActive = activeTag === 'input' || activeTag === 'textarea';

      if (e.code === 'Space' && !isInputActive && !e.repeat) {
        e.preventDefault();
        handleVoiceToggle();
      } else if ((e.code === 'KeyT' || e.key === 't' || e.key === 'T') && !isInputActive && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (onToggleLanguage) onToggleLanguage();
      } else if ((e.code === 'KeyI' || e.key === 'i' || e.key === 'I') && !isInputActive && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        toggleInterrupt();
      } else if (e.code === 'Escape') {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (isNavigatingRef.current) {
          stopNavigationMode(false);
        }
        isLiveActiveRef.current = false;
        setIsLiveActive(false);
        transcriberRef.current?.cancelRecording();
        aiState.setStatus('idle');
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleVoiceToggle, onToggleLanguage, stopNavigationMode, toggleInterrupt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (navIntervalRef.current) {
        clearInterval(navIntervalRef.current);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleRunDemo = () => {
    demoMode.runDemo(aiState, conversation);
  };

  const isDecoding = ['processing', 'decoding', 'analyzing', 'thinking'].includes(aiState.status);

  return (
    <div className={styles.dashboard}>
      <div className={styles.topSection}>
        <div className={styles.cameraWorkspaceContainer}>
          <CameraWorkspace
            cameras={cameraManager.cameras}
            activeCameraId={cameraManager.activeCameraId}
            primaryCameraId={cameraManager.primaryCameraId}
            viewMode={cameraManager.viewMode}
            webcam={cameraManager.webcam}
            onSelectCamera={cameraManager.setActiveCamera}
            onSetPrimary={cameraManager.setPrimaryCamera}
            onAddCamera={() => {}}
            onRemoveCamera={cameraManager.removeCamera}
            onRenameCamera={cameraManager.renameCamera}
            onSetViewMode={cameraManager.setViewMode}
          />
        </div>

        <div className={styles.aiSidebar}>
          <div className={styles.aiCoreContainer}>
            <AICore status={aiState.status} size={480} />
          </div>
          
          <div className={styles.aiStateWrapper}>
            <AIState status={aiState.status} language={language} />
          </div>

          {/* Quick Tamil actions bar */}
          {isTamil && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              justifyContent: 'center',
              margin: '8px 0',
              padding: '6px',
              background: 'rgba(0, 212, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 212, 255, 0.15)'
            }}>
              {TAMIL_QUICK_ACTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskQuestion(item.query)}
                  disabled={isProcessing}
                  style={{
                    background: 'rgba(0, 212, 255, 0.12)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    color: '#00d4ff',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title={item.query}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          
          {/* Auto-detected language notification */}
          {detectedBadge && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              margin: '6px 0',
              padding: '6px 14px',
              background: detectedBadge === 'ta' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
              border: `1px solid ${detectedBadge === 'ta' ? 'rgba(0, 212, 255, 0.45)' : 'rgba(139, 92, 246, 0.45)'}`,
              borderRadius: '20px',
              color: detectedBadge === 'ta' ? '#00d4ff' : '#c084fc',
              fontSize: '0.78rem',
              fontWeight: 600,
              fontFamily: 'Orbitron, sans-serif',
              boxShadow: `0 0 12px ${detectedBadge === 'ta' ? 'rgba(0, 212, 255, 0.25)' : 'rgba(139, 92, 246, 0.25)'}`
            }}>
              <span>🗣️</span>
              <span>
                {detectedBadge === 'ta' ? 'தமிழ் கண்டறியப்பட்டது (TAMIL DETECTED)' : 'ENGLISH DETECTED'}
              </span>
            </div>
          )}

          <div className={styles.controlsSection}>
            <VoiceControl 
              status={aiState.status} 
              onToggle={handleVoiceToggle} 
              language={language}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <LanguageToggle language={language} onToggle={onToggleLanguage} />
              <InterruptToggle enabled={isInterruptEnabled} onToggle={toggleInterrupt} language={language} />
            </div>
          </div>

          <div className={styles.audioPanelContainer}>
             <AudioPanel 
               selectedInput={audioDevices.selectedInput}
               selectedOutput={audioDevices.selectedOutput}
               onChangeInput={onOpenInputSelector}
               onChangeOutput={onOpenOutputSelector}
             />
          </div>

          {isDecoding && (
            <div className={styles.decodingContainer}>
              <DecodingAnimation 
                isActive={isDecoding}
                currentStageIndex={aiState.decodingStageIndex || 0}
                stages={DECODING_STAGES}
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottomSection}>
        <ConversationPanel 
          messages={conversation.messages} 
          onClear={conversation.clearHistory} 
          onAskQuestion={handleAskQuestion}
          isThinking={isDecoding || isProcessing}
          language={language}
        />
      </div>
    </div>
  );
};

export default Dashboard;
