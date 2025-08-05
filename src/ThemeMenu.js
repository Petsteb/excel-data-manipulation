import React, { useState, useRef, useEffect } from 'react';
import './ThemeMenu.css';

const themes = {
  // Light Themes
  professional: {
    name: 'Professional',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: '#6366f1',
    accent: '#10b981',
    background: '#f8fafc',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    borderColor: '#e2e8f0'
  },
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
  },
  
  // Dark Themes
  purpleDark: {
    name: 'Purple Dark',
    primary: '#a78bfa',
    primaryHover: '#8b5cf6',
    primaryLight: '#c4b5fd',
    accent: '#d8b4fe',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    cardBg: 'rgba(30, 27, 75, 0.85)',
    isDark: true
  },
  blueDark: {
    name: 'Ocean Blue Dark',
    primary: '#60a5fa',
    primaryHover: '#3b82f6',
    primaryLight: '#93c5fd',
    accent: '#bfdbfe',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    cardBg: 'rgba(15, 23, 42, 0.85)',
    isDark: true
  },
  greenDark: {
    name: 'Forest Green Dark',
    primary: '#34d399',
    primaryHover: '#10b981',
    primaryLight: '#6ee7b7',
    accent: '#a7f3d0',
    background: 'linear-gradient(135deg, #064e3b 0%, #134e4a 100%)',
    cardBg: 'rgba(6, 78, 59, 0.85)',
    isDark: true
  },
  pinkDark: {
    name: 'Rose Pink Dark',
    primary: '#f472b6',
    primaryHover: '#ec4899',
    primaryLight: '#f9a8d4',
    accent: '#fbcfe8',
    background: 'linear-gradient(135deg, #4a044e 0%, #701a75 100%)',
    cardBg: 'rgba(74, 4, 78, 0.85)',
    isDark: true
  },
  orangeDark: {
    name: 'Sunset Orange Dark',
    primary: '#fbbf24',
    primaryHover: '#f59e0b',
    primaryLight: '#fcd34d',
    accent: '#fde68a',
    background: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)',
    cardBg: 'rgba(69, 26, 3, 0.85)',
    isDark: true
  },
  tealDark: {
    name: 'Teal Dark',
    primary: '#2dd4bf',
    primaryHover: '#14b8a6',
    primaryLight: '#5eead4',
    accent: '#99f6e4',
    background: 'linear-gradient(135deg, #042f2e 0%, #134e4a 100%)',
    cardBg: 'rgba(4, 47, 46, 0.85)',
    isDark: true
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
    // Don't close the panel, let it stay open for multiple selections
  };

  return (
    <div className="theme-menu" ref={menuRef}>
      <button 
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        <img 
          src={themes[currentTheme]?.isDark ? "light-mode-icon.png" : "dark-mode-icon.png"} 
          alt={themes[currentTheme]?.isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} 
          className="theme-icon" 
        />
      </button>
      
      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-dropdown-header">
            <h3>Choose Theme</h3>
          </div>
          
          {/* Light Themes */}
          <div className="theme-section">
            <h4 className="theme-section-title">☀️ Light Themes</h4>
            <div className="theme-options">
              {Object.entries(themes)
                .filter(([key, theme]) => !theme.isDark)
                .map(([key, theme]) => (
                <button
                  key={key}
                  className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                  onClick={() => handleThemeSelect(key)}
                  style={{
                    '--theme-primary': theme.primary,
                    '--theme-accent': theme.accent
                  }}
                >
                  <div 
                    className="theme-preview-circle" 
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary} 50%, ${theme.accent} 50%, ${theme.accent} 100%)`
                    }}
                  >
                    {currentTheme === key && <span className="theme-checkmark">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Dark Themes */}
          <div className="theme-section">
            <h4 className="theme-section-title">🌙 Dark Themes</h4>
            <div className="theme-options">
              {Object.entries(themes)
                .filter(([key, theme]) => theme.isDark)
                .map(([key, theme]) => (
                <button
                  key={key}
                  className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                  onClick={() => handleThemeSelect(key)}
                  style={{
                    '--theme-primary': theme.primary,
                    '--theme-accent': theme.accent
                  }}
                >
                  <div 
                    className="theme-preview-circle" 
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary} 50%, ${theme.accent} 50%, ${theme.accent} 100%)`
                    }}
                  >
                    {currentTheme === key && <span className="theme-checkmark">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { themes };
export default ThemeMenu;