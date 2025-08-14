import React, { useState, useRef, useEffect } from 'react';
import './LanguageMenu.css';

const languages = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    code: 'en'
  },
  ro: {
    name: 'Română',
    flag: '🇷🇴',
    code: 'ro'
  },
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    code: 'fr'
  },
  de: {
    name: 'Deutsch',
    flag: '🇩🇪',
    code: 'de'
  },
  es: {
    name: 'Español',
    flag: '🇪🇸',
    code: 'es'
  }
};

function LanguageMenu({ currentLanguage, onLanguageChange, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageSelect = (languageKey) => {
    onLanguageChange(languageKey);
    setIsOpen(false);
  };

  return (
    <div className="language-menu" ref={menuRef}>
      <button 
        className="language-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={t ? t('changeLanguage') : "Change Language"}
      >
        <img 
          src={require('./language.png')}
          alt="Language" 
          className="language-icon" 
        />
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          <div className="language-dropdown-header">
            <h3>{t ? t('chooseLanguage') : 'Choose Language'}</h3>
          </div>
          
          <div className="language-options">
            {Object.entries(languages)
              .sort(([, a], [, b]) => a.name.localeCompare(b.name))
              .map(([key, language]) => (
              <button
                key={key}
                className={`language-option ${currentLanguage === key ? 'active' : ''}`}
                onClick={() => handleLanguageSelect(key)}
                title={language.name}
              >
                <span className="language-flag">{language.flag}</span>
                <span className="language-name">{language.name}</span>
                {currentLanguage === key && <span className="language-checkmark">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { languages };
export default LanguageMenu;