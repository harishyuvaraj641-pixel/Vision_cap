import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw, Cpu, Globe, Sparkles } from 'lucide-react';
import localStyles from './FormStyles.module.css';

const PRESETS = {
  openai: {
    label: 'OpenAI (Official)',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']
  },
  openrouter: {
    label: 'OpenRouter (Multi-Model)',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.0-flash-001',
    models: ['google/gemini-2.0-flash-001', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.2-11b-vision-instruct']
  },
  groq: {
    label: 'Groq (Ultra Fast)',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'qwen/qwen3.8-27b',
    models: ['qwen/qwen3.8-27b', 'llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview', 'llama-3.3-70b-versatile']
  },
  custom: {
    label: 'Custom / Local (Ollama/vLLM)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llava',
    models: ['llava', 'bakllava', 'custom']
  }
};

const AISettings = ({ settings = {}, onChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [providerPreset, setProviderPreset] = useState('openai');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-4o');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);

  // Status and feedback
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Fetch current backend configuration on mount
  useEffect(() => {
    fetch('/api/ai/config')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.base_url) setBaseUrl(data.base_url);
          if (data.model) {
            setModel(data.model);
            // Check if preset matches baseUrl
            const matched = Object.entries(PRESETS).find(([_, p]) => p.baseUrl === data.base_url);
            if (matched) {
              setProviderPreset(matched[0]);
            } else {
              setProviderPreset('custom');
            }
          }
          if (data.masked_key) {
            setMaskedKey(data.masked_key);
            setHasStoredKey(data.has_key);
          }
        }
      })
      .catch(err => console.warn('[AISettings] Failed to fetch current AI config:', err));
  }, []);

  const handlePresetChange = (presetKey) => {
    setProviderPreset(presetKey);
    const preset = PRESETS[presetKey];
    if (preset) {
      setBaseUrl(preset.baseUrl);
      setModel(preset.defaultModel);
      setIsCustomModel(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const activeModel = isCustomModel ? customModelName : model;
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey || undefined,
          base_url: baseUrl,
          model: activeModel
        })
      });
      const data = await res.json();
      if (data.valid) {
        setTestResult({ success: true, message: data.message || 'API Key is valid and model is reachable!' });
      } else {
        setTestResult({ success: false, message: data.message || 'Verification failed. Please check credentials.' });
      }
    } catch (e) {
      setTestResult({ success: false, message: `Network error connecting to backend: ${e.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const activeModel = isCustomModel ? customModelName : model;
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey.trim() ? apiKey.trim() : undefined,
          base_url: baseUrl.trim(),
          model: activeModel.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage('AI credentials saved and persisted to .env!');
        if (data.info?.masked_key) {
          setMaskedKey(data.info.masked_key);
          setHasStoredKey(data.info.has_key);
        }
        setApiKey(''); // Clear raw key from form input once saved
        if (onChange) {
          onChange({
            ...settings,
            aiConfigured: true,
            model: activeModel
          });
        }
      } else {
        setSaveMessage('Failed to save configuration.');
      }
    } catch (e) {
      setSaveMessage(`Error saving: ${e.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  const handleSettingChange = (key, value) => {
    if (onChange) onChange({ ...settings, [key]: value });
  };

  const currentModels = PRESETS[providerPreset]?.models || [];

  return (
    <div className={localStyles.container}>
      <h3 className={localStyles.sectionTitle}>AI VISION & API KEY CONFIGURATION</h3>

      {/* Security notice banner */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(0, 212, 255, 0.06)',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        borderRadius: '8px',
        fontSize: '0.82rem',
        color: '#94a3b8',
        lineHeight: 1.5
      }}>
        <strong style={{ color: '#00d4ff' }}>Local & Secure:</strong> Your API keys are stored exclusively in your local backend environment (<code style={{ color: '#fff' }}>backend/.env</code>) and sent directly to your chosen vision provider.
      </div>

      {/* Preset Selector */}
      <div className={localStyles.field}>
        <label className={localStyles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={15} style={{ color: '#00d4ff' }} /> AI Provider Preset
        </label>
        <select 
          className={localStyles.select}
          value={providerPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
        >
          {Object.entries(PRESETS).map(([k, p]) => (
            <option key={k} value={k}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* API Key Input */}
      <div className={localStyles.field}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className={localStyles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Key size={15} style={{ color: '#00d4ff' }} /> API Key
          </label>
          {hasStoredKey && (
            <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={12} /> Active ({maskedKey})
            </span>
          )}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input 
            type={showKey ? 'text' : 'password'}
            className={localStyles.input}
            style={{ width: '100%', paddingRight: '40px', fontFamily: 'monospace' }}
            placeholder={hasStoredKey ? `Current: ${maskedKey} (enter new key to replace)` : 'sk-... paste your API key here'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button 
            type="button"
            onClick={() => setShowKey(!showKey)}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: '4px'
            }}
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <span className={localStyles.description}>
          Required for OpenAI, OpenRouter, or Groq vision queries.
        </span>
      </div>

      {/* Base URL Input */}
      <div className={localStyles.field}>
        <label className={localStyles.label}>API Base URL</label>
        <input 
          type="text"
          className={localStyles.input}
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.openai.com/v1"
          style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
        />
      </div>

      {/* Model Selection */}
      <div className={localStyles.field}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className={localStyles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Cpu size={15} style={{ color: '#8b5cf6' }} /> Vision AI Model
          </label>
          <button
            type="button"
            onClick={() => setIsCustomModel(!isCustomModel)}
            style={{ background: 'none', border: 'none', color: '#00d4ff', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            {isCustomModel ? 'Pick Preset Model' : 'Custom Model Name'}
          </button>
        </div>

        {isCustomModel ? (
          <input 
            type="text"
            className={localStyles.input}
            value={customModelName}
            onChange={(e) => setCustomModelName(e.target.value)}
            placeholder="e.g. gpt-4o or meta-llama/llama-3.2-11b-vision-instruct"
            style={{ fontFamily: 'monospace' }}
          />
        ) : (
          <select 
            className={localStyles.select}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {currentModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
      </div>

      {/* Test & Save Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
        <button 
          type="button"
          onClick={handleTestConnection}
          disabled={isTesting}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            color: '#fff',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '0.75rem',
            cursor: isTesting ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          {isTesting ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} style={{ color: '#00d4ff' }} />}
          {isTesting ? 'VERIFYING...' : 'TEST KEY'}
        </button>

        <button 
          type="button"
          onClick={handleSaveConfig}
          disabled={isSaving}
          style={{
            flex: 1.5,
            padding: '10px 16px',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(139, 92, 246, 0.3))',
            border: '1px solid #00d4ff',
            borderRadius: '6px',
            color: '#fff',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '1px',
            cursor: isSaving ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)',
            transition: 'all 0.2s'
          }}
        >
          {isSaving ? <RefreshCw size={14} className="spin" /> : <CheckCircle size={14} />}
          {isSaving ? 'SAVING...' : 'SAVE & PERSIST'}
        </button>
      </div>

      {/* Test Feedback Notice */}
      {testResult && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
          color: testResult.success ? '#10b981' : '#ef4444'
        }}>
          {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Save Success Notice */}
      {saveMessage && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid #00d4ff',
          color: '#00d4ff'
        }}>
          <CheckCircle size={16} />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Additional Visual Parameters */}
      <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
        <h4 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', color: '#8899b4', marginBottom: 12 }}>
          VISION PREFERENCES
        </h4>

        <div className={localStyles.field}>
          <label className={localStyles.label}>Vision Analysis Detail</label>
          <select 
            className={localStyles.select}
            value={settings.visionMode || 'standard'}
            onChange={(e) => handleSettingChange('visionMode', e.target.value)}
          >
            <option value="fast">Fast (Low Latency / 640px)</option>
            <option value="standard">Standard (Recommended / 1080px)</option>
            <option value="detailed">High Definition (Thorough detail)</option>
          </select>
        </div>

        <div className={localStyles.fieldRow}>
          <div>
            <div className={localStyles.label}>Spatial Context Guidance</div>
            <div className={localStyles.description}>Instructs AI to provide relative clock & distance descriptions</div>
          </div>
          <label className={localStyles.switch}>
            <input 
              type="checkbox" 
              checked={settings.spatialContext !== false} 
              onChange={(e) => handleSettingChange('spatialContext', e.target.checked)}
            />
            <span className={localStyles.slider}></span>
          </label>
        </div>

        <div className={localStyles.fieldRow}>
          <div>
            <div className={localStyles.label}>Conversation Memory Retention</div>
            <div className={localStyles.description}>Retain previous scene context across consecutive questions</div>
          </div>
          <label className={localStyles.switch}>
            <input 
              type="checkbox" 
              checked={settings.memory !== false} 
              onChange={(e) => handleSettingChange('memory', e.target.checked)}
            />
            <span className={localStyles.slider}></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
