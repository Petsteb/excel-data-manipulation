import React, { useState, useRef, useEffect } from 'react';
import './ThemeMenu.css';

const themes = {
  // Light Themes - Professional & Corporate
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
    borderColor: '#e2e8f0',
    deletable: false
  },

  // Complementary Color Combinations
  redAqua: {
    name: 'Red & Aqua',
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    primaryLight: '#EF4444',
    accent: '#00FFF0',
    background: '#fef2f2',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(220, 38, 38, 0.1), 0 1px 2px 0 rgba(220, 38, 38, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(220, 38, 38, 0.1), 0 2px 4px -1px rgba(220, 38, 38, 0.06)',
    borderColor: '#fecaca',
    deletable: true
  },
  
  blueOrange: {
    name: 'Blue & Orange',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryLight: '#3B82F6',
    accent: '#EA580C',
    background: '#eff6ff',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(37, 99, 235, 0.1), 0 1px 2px 0 rgba(37, 99, 235, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)',
    borderColor: '#dbeafe',
    deletable: true
  },

  purpleYellow: {
    name: 'Purple & Yellow',
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    primaryLight: '#8B5CF6',
    accent: '#FBBF24',
    background: '#faf5ff',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(124, 58, 237, 0.1), 0 1px 2px 0 rgba(124, 58, 237, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(124, 58, 237, 0.1), 0 2px 4px -1px rgba(124, 58, 237, 0.06)',
    borderColor: '#e9d5ff',
    deletable: true
  },

  // Monochromatic Combinations
  oceanBlues: {
    name: 'Ocean Blues',
    primary: '#0EA5E9',
    primaryHover: '#0284C7',
    primaryLight: '#38BDF8',
    accent: '#075985',
    background: '#f0f9ff',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(14, 165, 233, 0.1), 0 1px 2px 0 rgba(14, 165, 233, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -1px rgba(14, 165, 233, 0.06)',
    borderColor: '#bae6fd',
    deletable: true
  },

  forestGreens: {
    name: 'Forest Greens',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#10B981',
    accent: '#065F46',
    background: '#ecfdf5',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(5, 150, 105, 0.1), 0 1px 2px 0 rgba(5, 150, 105, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(5, 150, 105, 0.1), 0 2px 4px -1px rgba(5, 150, 105, 0.06)',
    borderColor: '#a7f3d0',
    deletable: true
  },

  // Analogous Combinations
  sunsetWarm: {
    name: 'Sunset Warm',
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    primaryLight: '#EF4444',
    accent: '#F59E0B',
    background: '#fef7ed',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(220, 38, 38, 0.1), 0 1px 2px 0 rgba(220, 38, 38, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(220, 38, 38, 0.1), 0 2px 4px -1px rgba(220, 38, 38, 0.06)',
    borderColor: '#fed7aa',
    deletable: true
  },

  springFresh: {
    name: 'Spring Fresh',
    primary: '#10B981',
    primaryHover: '#059669',
    primaryLight: '#34D399',
    accent: '#06B6D4',
    background: '#f0fdfa',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(16, 185, 129, 0.1), 0 1px 2px 0 rgba(16, 185, 129, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.06)',
    borderColor: '#a7f3d0',
    deletable: true
  },

  // Triadic Combinations
  vibrantTriad: {
    name: 'Vibrant Triad',
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    primaryLight: '#EF4444',
    accent: '#0891B2',
    background: '#fef2f2',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(220, 38, 38, 0.1), 0 1px 2px 0 rgba(220, 38, 38, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(220, 38, 38, 0.1), 0 2px 4px -1px rgba(220, 38, 38, 0.06)',
    borderColor: '#fecaca',
    deletable: true
  },

  pastelTriad: {
    name: 'Pastel Triad',
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryLight: '#A78BFA',
    accent: '#F472B6',
    background: '#faf5ff',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(139, 92, 246, 0.1), 0 1px 2px 0 rgba(139, 92, 246, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(139, 92, 246, 0.1), 0 2px 4px -1px rgba(139, 92, 246, 0.06)',
    borderColor: '#e9d5ff',
    deletable: true
  },

  // Earth Tones
  earthyNaturals: {
    name: 'Earthy Naturals',
    primary: '#92400E',
    primaryHover: '#78350F',
    primaryLight: '#B45309',
    accent: '#065F46',
    background: '#fef7ed',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(146, 64, 14, 0.1), 0 1px 2px 0 rgba(146, 64, 14, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(146, 64, 14, 0.1), 0 2px 4px -1px rgba(146, 64, 14, 0.06)',
    borderColor: '#fed7aa',
    deletable: true
  },

  // Corporate/Business
  corporateBlue: {
    name: 'Corporate Blue',
    primary: '#1E40AF',
    primaryHover: '#1E3A8A',
    primaryLight: '#3B82F6',
    accent: '#059669',
    background: '#f8fafc',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(30, 64, 175, 0.1), 0 1px 2px 0 rgba(30, 64, 175, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(30, 64, 175, 0.1), 0 2px 4px -1px rgba(30, 64, 175, 0.06)',
    borderColor: '#e2e8f0',
    deletable: true
  },

  mintCorporate: {
    name: 'Mint Corporate',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#10B981',
    accent: '#6366F1',
    background: '#f9fafb',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(5, 150, 105, 0.1), 0 1px 2px 0 rgba(5, 150, 105, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(5, 150, 105, 0.1), 0 2px 4px -1px rgba(5, 150, 105, 0.06)',
    borderColor: '#e5e7eb',
    deletable: true
  },
  purple: {
    name: 'Purple',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryLight: '#a78bfa',
    accent: '#c084fc',
    background: 'linear-gradient(135deg, #ffeef8 0%, #f0f8ff 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    deletable: true
  },
  blue: {
    name: 'Ocean Blue',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryLight: '#60a5fa',
    accent: '#93c5fd',
    background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    deletable: true
  },
  green: {
    name: 'Forest Green',
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#34d399',
    accent: '#6ee7b7',
    background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    deletable: true
  },
  pink: {
    name: 'Rose Pink',
    primary: '#ec4899',
    primaryHover: '#db2777',
    primaryLight: '#f472b6',
    accent: '#f9a8d4',
    background: 'linear-gradient(135deg, #fdf2f8 0%, #fef7ff 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    deletable: true
  },
  orange: {
    name: 'Sunset Orange',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    primaryLight: '#fbbf24',
    accent: '#fcd34d',
    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    deletable: true
  },
  teal: {
    name: 'Teal',
    primary: '#14b8a6',
    primaryHover: '#0d9488',
    primaryLight: '#2dd4bf',
    accent: '#5eead4',
    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    deletable: true
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
    isDark: true,
    deletable: true
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
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [themesToDelete, setThemesToDelete] = useState([]);
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
    if (isDeveloperMode && themesToDelete.includes(themeKey)) {
      return; // Don't select themes that are marked for deletion
    }
    onThemeChange(themeKey);
    // Don't close the panel, let it stay open for multiple selections
  };

  const toggleDeveloperMode = () => {
    setIsDeveloperMode(!isDeveloperMode);
    setThemesToDelete([]); // Clear deletion list when toggling
  };

  const toggleThemeForDeletion = (themeKey) => {
    if (themes[themeKey]?.deletable === false) return; // Can't delete non-deletable themes
    
    setThemesToDelete(prev => 
      prev.includes(themeKey) 
        ? prev.filter(key => key !== themeKey)
        : [...prev, themeKey]
    );
  };

  const confirmDeleteThemes = () => {
    if (themesToDelete.length === 0) return;
    
    // Create new themes object without deleted themes
    const newThemes = { ...themes };
    themesToDelete.forEach(themeKey => {
      delete newThemes[themeKey];
    });
    
    // If current theme is being deleted, switch to professional
    if (themesToDelete.includes(currentTheme)) {
      onThemeChange('professional');
    }
    
    // Update the themes object (in a real app, this would update the state/storage)
    Object.keys(themes).forEach(key => {
      if (themesToDelete.includes(key)) {
        delete themes[key];
      }
    });
    
    setThemesToDelete([]);
    alert(`Deleted ${themesToDelete.length} theme(s)`);
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
            <div className="developer-controls">
              <button 
                className={`dev-mode-toggle ${isDeveloperMode ? 'active' : ''}`}
                onClick={toggleDeveloperMode}
                title="Toggle Developer Mode"
              >
                🔧 Dev Mode
              </button>
              {isDeveloperMode && themesToDelete.length > 0 && (
                <button 
                  className="delete-themes-btn"
                  onClick={confirmDeleteThemes}
                  title={`Delete ${themesToDelete.length} theme(s)`}
                >
                  🗑️ Delete ({themesToDelete.length})
                </button>
              )}
            </div>
          </div>
          
          {/* Light Themes */}
          <div className="theme-section">
            <h4 className="theme-section-title">☀️ Light Themes</h4>
            <div className="theme-options">
              {Object.entries(themes)
                .filter(([key, theme]) => !theme.isDark)
                .map(([key, theme]) => (
                <div key={key} className="theme-option-container">
                  <button
                    className={`theme-option ${currentTheme === key ? 'active' : ''} ${isDeveloperMode && themesToDelete.includes(key) ? 'marked-for-deletion' : ''}`}
                    onClick={() => isDeveloperMode ? toggleThemeForDeletion(key) : handleThemeSelect(key)}
                    style={{
                      '--theme-primary': theme.primary,
                      '--theme-accent': theme.accent
                    }}
                    title={isDeveloperMode ? (theme.deletable === false ? 'Cannot delete this theme' : `Click to ${themesToDelete.includes(key) ? 'unmark' : 'mark'} for deletion`) : theme.name}
                    disabled={isDeveloperMode && theme.deletable === false}
                  >
                    <div 
                      className="theme-preview-circle" 
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary} 50%, ${theme.accent} 50%, ${theme.accent} 100%)`
                      }}
                    >
                      {currentTheme === key && !isDeveloperMode && <span className="theme-checkmark">✓</span>}
                      {isDeveloperMode && themesToDelete.includes(key) && <span className="delete-mark">✗</span>}
                      {isDeveloperMode && theme.deletable === false && <span className="protected-mark">🔒</span>}
                    </div>
                  </button>
                  {!isDeveloperMode && (
                    <div className="theme-name-label">{theme.name}</div>
                  )}
                </div>
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
                <div key={key} className="theme-option-container">
                  <button
                    className={`theme-option ${currentTheme === key ? 'active' : ''} ${isDeveloperMode && themesToDelete.includes(key) ? 'marked-for-deletion' : ''}`}
                    onClick={() => isDeveloperMode ? toggleThemeForDeletion(key) : handleThemeSelect(key)}
                    style={{
                      '--theme-primary': theme.primary,
                      '--theme-accent': theme.accent
                    }}
                    title={isDeveloperMode ? (theme.deletable === false ? 'Cannot delete this theme' : `Click to ${themesToDelete.includes(key) ? 'unmark' : 'mark'} for deletion`) : theme.name}
                    disabled={isDeveloperMode && theme.deletable === false}
                  >
                    <div 
                      className="theme-preview-circle" 
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary} 50%, ${theme.accent} 50%, ${theme.accent} 100%)`
                      }}
                    >
                      {currentTheme === key && !isDeveloperMode && <span className="theme-checkmark">✓</span>}
                      {isDeveloperMode && themesToDelete.includes(key) && <span className="delete-mark">✗</span>}
                      {isDeveloperMode && theme.deletable === false && <span className="protected-mark">🔒</span>}
                    </div>
                  </button>
                  {!isDeveloperMode && (
                    <div className="theme-name-label">{theme.name}</div>
                  )}
                </div>
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