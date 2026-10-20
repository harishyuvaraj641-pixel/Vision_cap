import React from 'react';
import { Video, Volume2, MessageSquare, Settings } from 'lucide-react';
import LanguageToggle from '../common/LanguageToggle';
import styles from './TopBar.module.css';

const TopBar = ({ activeSection, onNavigate, demoMode, systemStatus, onOpenSettings, language = 'en', onToggleLanguage }) => {
  const isReady = systemStatus?.state === 'ready' || systemStatus === 'ready';

  return (
    <header className={styles.topbar}>
      <div className={styles.logoSection} onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>
        <div className={styles.logo}>VISIONCAP</div>
        <div className={styles.subtitle}>VOICE-FIRST AI VISION</div>
      </div>
      
      <div className={styles.centerSection}>
        <div className={styles.statusIndicator}>
          <span className={`${styles.statusDot} ${isReady ? styles.ready : styles.offline}`}></span>
          <span className={styles.statusText}>
            {demoMode ? (language === 'ta' ? 'மாதிரி பயன்முறை' : 'DEMO MODE ACTIVE') : (language === 'ta' ? 'தயாராக உள்ளது' : 'SYSTEM READY')}
          </span>
        </div>
        {demoMode && <span className={styles.demoBadge}>{language === 'ta' ? 'மாதிரி' : 'DEMO'}</span>}
        <LanguageToggle language={language} onToggle={onToggleLanguage} />
      </div>

      <nav className={styles.navSection}>
        <button 
          className={`${styles.navBtn} ${activeSection === 'dashboard' ? styles.active : ''}`}
          onClick={() => onNavigate('dashboard')}
          title="Vision Workspace"
        >
          <Video size={20} />
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'devices' ? styles.active : ''}`}
          onClick={() => onNavigate('devices')}
          title="Device Manager"
        >
          <Volume2 size={20} />
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'conversation' ? styles.active : ''}`}
          onClick={() => onNavigate('dashboard')}
          title="Conversation"
        >
          <MessageSquare size={20} />
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'settings' ? styles.active : ''}`}
          onClick={() => onOpenSettings ? onOpenSettings() : onNavigate('settings')}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </nav>
    </header>
  );
};

export default TopBar;
