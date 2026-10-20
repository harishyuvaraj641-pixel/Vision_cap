import React, { useRef, useEffect, useState } from 'react';
import { Trash2, Send, Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import Message from './Message';
import { useVoiceTranscriber } from '../../hooks/useVoiceTranscriber';
import styles from './ConversationPanel.module.css';

const QUICK_PROMPTS_EN = [
  'What is in front of me?',
  'Describe the scene in detail',
  'Are there any obstacles or hazards?',
  'Read any visible text',
  'What colors do you see?'
];

const QUICK_PROMPTS_TA = [
  'என் முன்னால் என்ன இருக்கிறது?',
  'முழு காட்சியை விவரிக்கவும்',
  'ஏதாவது தடங்கல்கள் அல்லது ஆபத்து உள்ளதா?',
  'தெரியும் உரையை படிக்கவும்',
  'என்ன வண்ணங்கள் தெரிகின்றன?'
];

const ConversationPanel = ({ messages = [], onClear, onAskQuestion, isThinking = false, language = 'ta' }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);
  const isTamil = language === 'ta';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // High-accuracy Deepgram Nova-3 Transcriber for Tamil & English
  const transcriber = useVoiceTranscriber({
    language,
    autoStopOnSilence: true,
    onTranscriptionComplete: (result) => {
      if (result && result.text) {
        setInputText(result.text);
        if (onAskQuestion) {
          onAskQuestion(result.text);
          setInputText('');
        }
      }
    }
  });

  const isListening = transcriber.isRecording;
  const isTranscribing = transcriber.isTranscribing;

  const handleToggleMic = async () => {
    if (isListening) {
      await transcriber.stopRecording(language);
    } else {
      await transcriber.startRecording(language);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    if (onAskQuestion) {
      onAskQuestion(inputText.trim());
    }
    setInputText('');
  };

  const handlePromptClick = (promptText) => {
    if (isThinking) return;
    if (onAskQuestion) {
      onAskQuestion(promptText);
    }
  };

  const quickPrompts = isTamil ? QUICK_PROMPTS_TA : QUICK_PROMPTS_EN;

  const placeholderText = isTranscribing
    ? (isTamil ? 'தமிழ் உரை மாற்றம் செய்யப்படுகிறது...' : 'Transcribing speech...')
    : isListening
    ? (isTamil ? 'கேட்கிறது... (பேசவும்)' : 'Listening to your voice...')
    : (isTamil ? 'பார்வை அல்லது காட்சியைப் பற்றி கேட்கவும்...' : 'Ask VISIONCAP anything about what is visible...');

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} style={{ color: '#00d4ff' }} />
          <h2 className={styles.title}>
            {isTamil ? 'உரையாடல் வரலாறு' : 'CONVERSATION HISTORY'}
          </h2>
          {isTamil && (
            <span style={{
              fontSize: '0.65rem',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#00d4ff',
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.25)',
              padding: '1px 6px',
              borderRadius: '4px'
            }}>
              தமிழ் ஒலிபெயர்ப்பி (Deepgram Nova-3)
            </span>
          )}
        </div>
        <button className={styles.clearBtn} onClick={onClear} title={isTamil ? 'உரையாடலை அழிக்கவும்' : 'Clear Conversation'}>
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className={styles.messagesArea} ref={scrollRef}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            {isTamil
              ? 'இன்னும் கேள்விகள் இல்லை. உங்கள் சுற்றுப்புறத்தைப் பற்றி VISIONCAP-யிடம் கேட்க கீழே பேசவும் அல்லது தட்டச்சு செய்யவும்.'
              : 'No queries yet. Speak or type below to ask VISIONCAP about your surroundings.'}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <Message key={idx} message={msg} />
          ))
        )}

        {(isThinking || isTranscribing) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isTranscribing ? '#00d4ff' : '#8b5cf6',
            fontSize: '0.85rem',
            fontFamily: 'Orbitron, sans-serif',
            padding: '8px'
          }}>
            <Loader2 size={16} className="spin" />
            <span>
              {isTranscribing
                ? (isTamil ? 'தமிழ் பேச்சை உரைவடிவாக்குகிறது...' : 'TRANSCRIBING SPEECH...')
                : (isTamil ? 'விஷன்கேப் காட்சியை ஆராய்கிறது...' : 'VISIONCAP IS ANALYZING SCENE...')}
            </span>
          </div>
        )}
      </div>

      {/* Input & Quick Chips Area */}
      <div className={styles.footerArea}>
        <div className={styles.chipsRow}>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              className={styles.chipBtn}
              onClick={() => handlePromptClick(prompt)}
              disabled={isThinking || isTranscribing}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form className={styles.inputRow} onSubmit={handleSubmit}>
          <input 
            type="text"
            className={styles.inputField}
            placeholder={placeholderText}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isThinking || isTranscribing}
          />

          <button 
            type="button"
            className={`${styles.actionBtn} ${isListening ? styles.micActive : ''}`}
            onClick={handleToggleMic}
            title={isListening ? (isTamil ? 'கேட்பதை நிறுத்தவும்' : 'Stop listening') : (isTamil ? 'தமிழில் பேசவும்' : 'Speak question')}
            disabled={isThinking || isTranscribing}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <button 
            type="submit"
            className={styles.actionBtn}
            disabled={!inputText.trim() || isThinking || isTranscribing}
            title={isTamil ? 'அனுப்பவும்' : 'Send query'}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConversationPanel;
