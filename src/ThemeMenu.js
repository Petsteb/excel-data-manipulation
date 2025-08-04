import React, { useState, useRef, useEffect } from 'react';
import './ThemeMenu.css';

const themes = {
  purple: {
    name: 'Purple',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryLight: '#a78bfa',
    accent: '#c084fc',
    background: 'linear-gradient(135deg, #ffeef8 0%, #f0f8ff 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)'
  },
  blue: {
    name: 'Ocean Blue',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryLight: '#60a5fa',
    accent: '#93c5fd',
    background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)'
  },
  green: {
    name: 'Forest Green',
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#34d399',
    accent: '#6ee7b7',
    background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)'
  },
  pink: {
    name: 'Rose Pink',
    primary: '#ec4899',
    primaryHover: '#db2777',
    primaryLight: '#f472b6',
    accent: '#f9a8d4',
    background: 'linear-gradient(135deg, #fdf2f8 0%, #fef7ff 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)'
  },
  orange: {
    name: 'Sunset Orange',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    primaryLight: '#fbbf24',
    accent: '#fcd34d',
    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)'
  },
  teal: {
    name: 'Teal',
    primary: '#14b8a6',
    primaryHover: '#0d9488',
    primaryLight: '#2dd4bf',
    accent: '#5eead4',
    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)'
  }
};

function ThemeMenu({ currentTheme, onThemeChange }) {
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

  const handleThemeSelect = (themeKey) => {
    onThemeChange(themeKey);
    setIsOpen(false);
  };

  return (
    <div className="theme-menu" ref={menuRef}>
      <button 
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        🎨
      </button>
      
      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-dropdown-header">
            <h3>Choose Theme</h3>
          </div>
          <div className="theme-options">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                onClick={() => handleThemeSelect(key)}
                style={{
                  '--theme-primary': theme.primary,
                  '--theme-accent': theme.accent
                }}
              >
                <div className="theme-preview">
                  <div 
                    className="theme-color-primary" 
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div 
                    className="theme-color-accent" 
                    style={{ backgroundColor: theme.accent }}
                  />
                </div>
                <span className="theme-name">{theme.name}</span>
                {currentTheme === key && <span className="theme-checkmark">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { themes };
export default ThemeMenu;