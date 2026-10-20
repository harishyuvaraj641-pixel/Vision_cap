import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * High-fidelity Tamil & multilingual voice transcription hook.
 * Uses browser MediaRecorder to capture clean mic audio and stream it
 * directly to the Deepgram Nova-3 backend (/api/voice/transcribe).
 * 
 * Features:
 * - Direct Deepgram Nova-3 Tamil acoustic modeling (language=ta)
 * - Safe audio constraints (avoids hardware OverconstrainedError on Windows)
 * - Intelligent VAD / silence auto-stop after speech finishes
 * - 15-second safety duration ceiling
 * - Real-time volume level meter for UI waveform animations
 */
export function useVoiceTranscriber({
  onTranscriptionComplete,
  onStatusChange,
  onSpeechStart,
  language = 'ta',
  autoStopOnSilence = true
} = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const cleanStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const silenceTimerRef = useRef(null);
  const maxRecordingTimerRef = useRef(null);
  const speechDetectedRef = useRef(false);
  const recordStartTimeRef = useRef(null);
  const lastSpeechTimeRef = useRef(null);
  const hasStoppedRef = useRef(false);
  const isProcessingStopRef = useRef(false);
  const noiseFloorRef = useRef(0.015);

  // Stop media stream tracks and AudioContext cleanly
  const cleanupStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (maxRecordingTimerRef.current) {
      clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (cleanStreamRef.current) {
      try {
        cleanStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      cleanStreamRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    noiseFloorRef.current = 0.015;
    setAudioLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  // Real-time Web Audio DSP noise reduction & Voice Activity Detection (VAD)
  const setupAudioDSP = useCallback((rawStream, onSilenceDetected) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('[VoiceTranscriber] AudioContext not available');
        return rawStream;
      }

      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioCtx();
        audioContextRef.current = ctx;
      } else if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const source = ctx.createMediaStreamSource(rawStream);

      // 1. High-Pass Filter: Cuts out HVAC rumble, desk thumps, 50/60Hz mains hum (<85Hz)
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(85, ctx.currentTime);
      highpass.Q.setValueAtTime(0.707, ctx.currentTime);

      // 2. Low-Pass Filter: Eliminates high-frequency mic hiss, coil whine (>7500Hz)
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(7500, ctx.currentTime);
      lowpass.Q.setValueAtTime(0.707, ctx.currentTime);

      // 3. Speech Peaking Filter: Boosts vocal clarity & Tamil phonetic formants (~1800Hz)
      const voiceBooster = ctx.createBiquadFilter();
      voiceBooster.type = 'peaking';
      voiceBooster.frequency.setValueAtTime(1800, ctx.currentTime);
      voiceBooster.Q.setValueAtTime(1.0, ctx.currentTime);
      voiceBooster.gain.setValueAtTime(3.0, ctx.currentTime);

      // 4. Dynamics Compressor: Squashes background floor noise and evens vocal dynamics
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-38, ctx.currentTime);
      compressor.knee.setValueAtTime(6, ctx.currentTime);
      compressor.ratio.setValueAtTime(4, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.2, ctx.currentTime);

      // 5. AnalyserNode for fast Voice Activity Detection (VAD)
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128; // 64 frequency bins for vocal spectrum resolution
      analyser.smoothingTimeConstant = 0.25;
      analyserRef.current = analyser;

      // Connect filter chain
      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(voiceBooster);
      voiceBooster.connect(compressor);
      compressor.connect(analyser);

      // 6. MediaStreamDestination: Feeds clean, noise-reduced audio directly into MediaRecorder
      let cleanStream = rawStream;
      try {
        const destination = ctx.createMediaStreamDestination();
        compressor.connect(destination);
        cleanStream = destination.stream;
        cleanStreamRef.current = cleanStream;
      } catch (destErr) {
        console.warn('[VoiceTranscriber] MediaStreamDestination fallback to rawStream:', destErr);
      }

      // Real-time VAD Volume Loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudio = () => {
        if (!analyserRef.current || hasStoppedRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Vocal spectrum energy: bins 1 to 10 (~200Hz - ~3700Hz, core human voice range)
        let speechSum = 0;
        let speechBins = 0;
        for (let i = 1; i <= Math.min(10, dataArray.length - 1); i++) {
          speechSum += dataArray[i];
          speechBins++;
        }
        const speechAvg = speechBins > 0 ? speechSum / speechBins : 0;
        const normalizedLevel = Math.min(1, speechAvg / 80);
        setAudioLevel(normalizedLevel);

        const now = Date.now();
        const isAISpeaking = typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking;

        // Continuous Adaptive Noise Floor Tracking (Exponential Moving Average)
        // Tracks background room noise (fans, AC, traffic) when user is not actively speaking
        if (!speechDetectedRef.current) {
          noiseFloorRef.current = noiseFloorRef.current * 0.95 + normalizedLevel * 0.05;
        }

        // Dynamic Speech Detection Threshold:
        // Automatically rises in noisy rooms so room noise never gets confused for speech!
        const dynamicThreshold = Math.max(0.042, noiseFloorRef.current * 2.2 + 0.025);
        const speechThreshold = isAISpeaking ? Math.max(0.08, dynamicThreshold * 1.5) : dynamicThreshold;

        // Speech Activity Detection
        if (normalizedLevel > speechThreshold) {
          if (!speechDetectedRef.current || isAISpeaking) {
            speechDetectedRef.current = true;
            if (isAISpeaking) {
              console.log('[VoiceTranscriber] User voice detected during AI speech! Discarding AI audio chunks.');
              audioChunksRef.current = [];
              recordStartTimeRef.current = now;
            }
            if (onSpeechStart) {
              onSpeechStart({ isInterruption: isAISpeaking });
            }
          }
          lastSpeechTimeRef.current = now;
        }

        // Fast Conversational Turn-Taking: Auto-stop on silence
        if (autoStopOnSilence && speechDetectedRef.current && lastSpeechTimeRef.current) {
          const recordingDuration = now - (recordStartTimeRef.current || now);
          const silenceDuration = now - lastSpeechTimeRef.current;

          // Rapid 550ms turn-taking pause (min 350ms speech duration)
          // Enables immediate submission to Deepgram/Whisper
          if (recordingDuration >= 350 && silenceDuration >= 550) {
            if (!hasStoppedRef.current && onSilenceDetected) {
              onSilenceDetected();
              return;
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(checkAudio);
      };

      checkAudio();
      return cleanStream;
    } catch (err) {
      console.warn('[VoiceTranscriber] Audio DSP setup error, fallback to raw:', err);
      return rawStream;
    }
  }, [autoStopOnSilence, onSpeechStart]);

  const stopRecording = useCallback(async (customLanguage) => {
    if (hasStoppedRef.current || isProcessingStopRef.current) {
      return null;
    }
    hasStoppedRef.current = true;
    isProcessingStopRef.current = true;

    const activeLang = customLanguage || language || 'ta';
    console.log(`[VoiceTranscriber] Stopping recording, preparing transcription for: ${activeLang}`);

    setIsRecording(false);
    setIsTranscribing(true);
    if (onStatusChange) onStatusChange('transcribing');

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === 'inactive') {
        cleanupStream();
        setIsTranscribing(false);
        isProcessingStopRef.current = false;
        if (onStatusChange) onStatusChange('idle');
        resolve(null);
        return;
      }

      recorder.onstop = async () => {
        cleanupStream();

        try {
          const mimeType = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          audioChunksRef.current = [];

          if (audioBlob.size < 500) {
            console.warn('[VoiceTranscriber] Recorded audio blob too small (silent), ignoring.');
            setIsTranscribing(false);
            isProcessingStopRef.current = false;
            if (onStatusChange) onStatusChange('idle');
            resolve(null);
            return;
          }

          const formData = new FormData();
          const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
          formData.append('file', audioBlob, `voice_query_${Date.now()}.${ext}`);
          formData.append('language', activeLang);

          console.log(`[VoiceTranscriber] Transmitting ${audioBlob.size} bytes (${mimeType}) to /api/voice/transcribe...`);

          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData
          });

          if (!res.ok) {
            throw new Error(`Server returned HTTP ${res.status}`);
          }

          const data = await res.json();
          console.log('[VoiceTranscriber] Backend transcription response:', data);

          setIsTranscribing(false);
          isProcessingStopRef.current = false;

          if (data && data.text) {
            if (onTranscriptionComplete) {
              onTranscriptionComplete(data);
            }
          } else {
            if (onStatusChange) onStatusChange('idle');
          }

          resolve(data);
        } catch (err) {
          console.error('[VoiceTranscriber] Transcription error:', err);
          setIsTranscribing(false);
          isProcessingStopRef.current = false;
          setError(
            activeLang === 'ta'
              ? 'குரல் உரைமாற்றம் தோல்வியடைந்தது. மீண்டும் பேசவும்.'
              : 'Voice transcription failed. Please try again.'
          );
          if (onStatusChange) onStatusChange('idle');
          resolve(null);
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        console.warn('[VoiceTranscriber] recorder.stop() exception:', err);
        cleanupStream();
        setIsTranscribing(false);
        isProcessingStopRef.current = false;
        if (onStatusChange) onStatusChange('idle');
        resolve(null);
      }
    });
  }, [cleanupStream, language, onStatusChange, onTranscriptionComplete]);

  const resetBufferForTurn = useCallback(() => {
    audioChunksRef.current = [];
    speechDetectedRef.current = false;
    recordStartTimeRef.current = Date.now();
    lastSpeechTimeRef.current = null;
    hasStoppedRef.current = false;
    isProcessingStopRef.current = false;
    noiseFloorRef.current = 0.015;
  }, []);

  const startRecording = useCallback(async (customLanguage) => {
    setError(null);
    hasStoppedRef.current = false;
    isProcessingStopRef.current = false;
    speechDetectedRef.current = false;
    audioChunksRef.current = [];
    recordStartTimeRef.current = Date.now();
    lastSpeechTimeRef.current = null;
    noiseFloorRef.current = 0.015;

    const activeLang = customLanguage || language || 'ta';

    // If media recorder is already active and recording, reuse the active stream and reset the buffer
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setIsRecording(true);
      if (onStatusChange) onStatusChange('listening');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      const errMsg = activeLang === 'ta'
        ? 'இந்த உலாவியில் மைக்ரோஃபோன் பதிவு ஆதரிக்கப்படவில்லை.'
        : 'Audio recording is not supported in this browser.';
      setError(errMsg);
      if (onStatusChange) onStatusChange('error');
      return;
    }

    try {
      // Use standard, hardware-safe audio constraints with noise suppression
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          }
        });
      } catch (advancedErr) {
        console.warn('[VoiceTranscriber] Advanced audio constraints failed, using basic mic stream:', advancedErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;
      recordStartTimeRef.current = Date.now();
      lastSpeechTimeRef.current = null;

      // Real-time Web Audio DSP noise reduction pipeline
      const cleanStream = setupAudioDSP(stream, () => {
        console.log('[VoiceTranscriber] Speech silence detected, auto-submitting audio...');
        stopRecording(activeLang);
      });

      // Select optimal audio format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : '';
      }

      // Record the clean, noise-reduced stream!
      const recorder = mimeType 
        ? new MediaRecorder(cleanStream || stream, { mimeType }) 
        : new MediaRecorder(cleanStream || stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (e) => {
        console.error('[VoiceTranscriber] MediaRecorder runtime error:', e);
        stopRecording(activeLang);
      };

      recorder.start(100); // 100ms slices for responsive buffering
      setIsRecording(true);
      if (onStatusChange) onStatusChange('listening');

      // Safety limit: auto-stop after 12 seconds max
      maxRecordingTimerRef.current = setTimeout(() => {
        console.log('[VoiceTranscriber] Max recording limit reached (12s), stopping...');
        stopRecording(activeLang);
      }, 12000);

    } catch (err) {
      console.error('[VoiceTranscriber] getUserMedia failed:', err);
      const errMsg = activeLang === 'ta'
        ? 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. உலாவியில் அனுமதியை சரிபார்க்கவும்.'
        : 'Microphone access denied. Please grant permission in your browser.';
      setError(errMsg);
      if (onStatusChange) onStatusChange('error');
    }
  }, [language, setupAudioDSP, onStatusChange, stopRecording]);

  const cancelRecording = useCallback(() => {
    hasStoppedRef.current = true;
    isProcessingStopRef.current = false;
    cleanupStream();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    audioChunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
    setAudioLevel(0);
    if (onStatusChange) onStatusChange('idle');
  }, [cleanupStream, onStatusChange]);

  return {
    isRecording,
    isTranscribing,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    resetBufferForTurn
  };
}
