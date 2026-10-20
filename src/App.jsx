import React, { useState, useCallback } from 'react';
import styles from './App.module.css';

import TopBar from './components/layout/TopBar';
import StatusBar from './components/layout/StatusBar';
import BootSequence from './components/layout/BootSequence';

import SettingsContainer from './components/settings';
import AddCameraModal from './components/camera/AddCameraModal';
import InputSelector from './components/audio/InputSelector';
import OutputSelector from './components/audio/OutputSelector';

import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Settings from './pages/Settings';

import { useCameraManager } from './hooks/useCameraManager';
import { useAudioDevices } from './hooks/useAudioDevices';
import { useAIState } from './hooks/useAIState';
import { useConversation } from './hooks/useConversation';
import { useSystemStatus } from './hooks/useSystemStatus';
import { useDemoMode } from './hooks/useDemoMode';

const App = () => {
  const [booted, setBooted] = useState(() => {
    try {
      return sessionStorage.getItem('visioncap_booted') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleBootComplete = useCallback(() => {
    try {
      sessionStorage.setItem('visioncap_booted', 'true');
    } catch (e) {}
    setBooted(true);
  }, []);

  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('visioncap_language_mode') || 'ta';
    } catch (e) {
      return 'ta';
    }
  });

  const handleSetLanguage = useCallback((newLang) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('visioncap_language_mode', newLang);
    } catch (e) {}
  }, []);

  const handleToggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === 'en' ? 'ta' : 'en';
      try {
        localStorage.setItem('visioncap_language_mode', next);
      } catch (e) {}
      return next;
    });
  }, []);

  const [activeSection, setActiveSection] = useState('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  const [addCameraOpen, setAddCameraOpen] = useState(false);
  const [inputSelectorOpen, setInputSelectorOpen] = useState(false);
  const [outputSelectorOpen, setOutputSelectorOpen] = useState(false);

  const cameraManager = useCameraManager();
  const audioDevices = useAudioDevices();
  const aiState = useAIState();
  const conversation = useConversation();
  const systemStatus = useSystemStatus(cameraManager, audioDevices, aiState);
  const demoMode = useDemoMode();

  if (!booted) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <Dashboard
            cameraManager={cameraManager}
            audioDevices={audioDevices}
            aiState={aiState}
            conversation={conversation}
            demoMode={demoMode}
            language={language}
            setLanguage={handleSetLanguage}
            onToggleLanguage={handleToggleLanguage}
            onOpenInputSelector={() => setInputSelectorOpen(true)}
            onOpenOutputSelector={() => setOutputSelectorOpen(true)}
          />
        );
      case 'devices':
        return (
          <Devices
            cameraManager={cameraManager}
            audioDevices={audioDevices}
            onAddCamera={() => setAddCameraOpen(true)}
            onOpenInputSelector={() => setInputSelectorOpen(true)}
            onOpenOutputSelector={() => setOutputSelectorOpen(true)}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return (
          <Dashboard
            cameraManager={cameraManager}
            audioDevices={audioDevices}
            aiState={aiState}
            conversation={conversation}
            demoMode={demoMode}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            onOpenInputSelector={() => setInputSelectorOpen(true)}
            onOpenOutputSelector={() => setOutputSelectorOpen(true)}
          />
        );
    }
  };

  return (
    <div className={styles.appContainer}>
      <TopBar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        demoMode={demoMode.isDemoMode}
        systemStatus={systemStatus}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className={styles.mainContent}>
        {renderContent()}
      </main>

      <StatusBar
        cameraStatus={systemStatus.cameras}
        micStatus={systemStatus.microphone}
        outputStatus={systemStatus.audioOutput}
        aiStatus={systemStatus.ai}
        networkStatus={systemStatus.network}
      />

      <SettingsContainer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
      />

      <AddCameraModal
        isOpen={addCameraOpen}
        onClose={() => setAddCameraOpen(false)}
        onAdd={cameraManager.addCamera}
      />

      <InputSelector
        devices={audioDevices.inputDevices}
        selectedId={audioDevices.selectedInputId}
        onSelect={audioDevices.selectInput}
        onTest={audioDevices.testMicrophone}
        isOpen={inputSelectorOpen}
        onClose={() => setInputSelectorOpen(false)}
      />

      <OutputSelector
        devices={audioDevices.outputDevices}
        selectedId={audioDevices.selectedOutputId}
        onSelect={audioDevices.selectOutput}
        onTest={audioDevices.testSpeaker}
        isOpen={outputSelectorOpen}
        onClose={() => setOutputSelectorOpen(false)}
      />
    </div>
  );
};

export default App;
