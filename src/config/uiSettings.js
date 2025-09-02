// UI Settings Management System  
// This file manages all UI-related settings for the application

// Default UI settings structure
export const DEFAULT_UI_SETTINGS = {
  // Panel positions and sizes
  panelPositions: {
    'contabilitate-upload-panel': { x: 20, y: 20, width: 240, height: 180 },
    'anaf-upload-panel': { x: 800, y: 20, width: 240, height: 180 },
    'contabilitate-summary-panel': { x: 20, y: 240, width: 240, height: 180 },
    'anaf-summary-panel': { x: 800, y: 240, width: 240, height: 180 },
    'anaf-header-panel': { x: 800, y: 460, width: 240, height: 180 },
    'anaf-date-panel': { x: 800, y: 680, width: 240, height: 180 },
    'account-selection-panel': { x: 280, y: 20, width: 240, height: 180 },
    'account-mapping-panel': { x: 280, y: 240, width: 240, height: 180 },
    'sums-panel': { x: 540, y: 20, width: 240, height: 180 },
    'worksheet-selection-panel': { x: 540, y: 240, width: 240, height: 180 },
    'generate-summary-button': { x: 450, y: 240, width: 80, height: 80 },
    'final-summary-panel': { x: 300, y: 560, width: 300, height: 200 }
  },

  // Screen configurations
  screens: {
    homeScreen: null, // { x, y, width, height }
    secondaryScreens: [], // [{ id, name, x, y, width, height, color }]
    currentScreen: 'home',
    tabPosition: 'left' // 'left', 'right', 'top', 'bottom'
  },

  // Theme settings
  theme: {
    current: 'professional', // theme name
    customThemes: {} // custom user themes
  },

  // Language settings
  language: {
    current: 'en', // language code
    customTranslations: {} // custom user translations
  },

  // Panel visibility and layout
  panels: {
    // Which panels are visible
    visibility: {
      'contabilitate-upload-panel': true,
      'anaf-upload-panel': true,
      'contabilitate-summary-panel': true,
      'anaf-summary-panel': true,
      'anaf-header-panel': true,
      'anaf-date-panel': true,
      'account-selection-panel': true,
      'account-mapping-panel': true,
      'sums-panel': true,
      'worksheet-selection-panel': true,
      'final-summary-panel': true
    },
    // Layout mode specific settings
    layoutMode: {
      enabled: false,
      onlyPanels: ['anaf-header-panel', 'anaf-date-panel', 'sums-panel'],
      showControlPanel: false
    }
  },

  // Account mappings (conta to anaf)
  accountMappings: {
    // Default mappings will be loaded from the app's default configuration
    // Structure: { contaAccount: [anafAccount1, anafAccount2, ...] }
  },

  // Sum formulas for each account
  sumFormulas: {
    conta: {
      // Structure: { accountName: { formula: 'sum|subtract', sumValue: number, subtractValue: number } }
    },
    anaf: {
      // Structure: { accountName: { formula: 'sum|subtract', sumValue: number, subtractValue: number } }
    }
  },

  // ANAF header panel values
  anafHeaderPanel: {
    commonLines: 1,
    columnNamesRow: 1,
    selectedDateColumns: [],
    dateColumnsWithTime: []
  },

  // Date interval settings for account selection panel
  accountSelection: {
    dateInterval: {
      startDate: null,
      endDate: null
    },
    selectedAccounts: [],
    selectedAnafAccounts: [],
    filterSettings: {
      // Filter configurations
    }
  },

  // Worksheet selection
  worksheetSelection: {
    selectedWorksheets: {
      contaMergedData: true,
      anafMergedData: true,
      relationsSummary: true,
      contaAccountSums: true,
      anafAccountSums: true
    }
  },

  // View and layout preferences
  view: {
    panOffset: { x: 0, y: 0 }, // Pan offset for the workspace
    zoom: 1, // Zoom level
    gridVisible: true, // Grid visibility
    snapToGrid: true // Snap to grid enabled
  },

  // Application mode
  mode: {
    current: 'normal', // 'normal', 'layout', 'screen'
    screenMode: {
      step: 'idle', // 'idle', 'creating-home', 'creating-secondary', 'viewing-home', 'viewing-secondary'
      creatingScreenRect: null
    }
  },

  // UI interaction settings
  interaction: {
    dragSensitivity: 5,
    resizeHandleSize: 8,
    tooltipDelay: 500
  },

  // File handling settings
  files: {
    lastUsedPaths: {
      conta: null,
      anaf: null,
      output: null
    },
    recentFiles: {
      conta: [],
      anaf: []
    }
  }
};

// UI Settings Manager Class
export class UISettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_UI_SETTINGS };
    this.listeners = new Map(); // Event listeners
    this.saveTimeout = null; // Debounce save operations
  }

  // Load settings from storage
  async load() {
    try {
      const savedSettings = await window.electronAPI.loadSettings();
      if (savedSettings && savedSettings.uiSettings) {
        // Deep merge saved settings with defaults
        this.settings = this.deepMerge(DEFAULT_UI_SETTINGS, savedSettings.uiSettings);
      } else {
        // Initialize with defaults if no saved settings
        this.settings = { ...DEFAULT_UI_SETTINGS };
      }
      this.notifyListeners('settingsLoaded', this.settings);
      return this.settings;
    } catch (error) {
      console.error('Failed to load UI settings:', error);
      this.settings = { ...DEFAULT_UI_SETTINGS };
      return this.settings;
    }
  }

  // Save settings to storage with debouncing
  async save(immediate = false) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    const doSave = async () => {
      try {
        // Get current app settings
        const currentSettings = await window.electronAPI.loadSettings();
        
        // Update only the UI settings part
        const updatedSettings = {
          ...currentSettings,
          uiSettings: this.settings
        };

        await window.electronAPI.saveSettings(updatedSettings);
        this.notifyListeners('settingsSaved', this.settings);
        return true;
      } catch (error) {
        console.error('Failed to save UI settings:', error);
        this.notifyListeners('settingsSaveError', error);
        return false;
      }
    };

    if (immediate) {
      return await doSave();
    } else {
      // Debounce saves to avoid excessive file writes
      this.saveTimeout = setTimeout(doSave, 300);
    }
  }

  // Get a setting value by path (e.g., 'panels.visibility.anaf-header-panel')
  get(path) {
    return this.getNestedValue(this.settings, path);
  }

  // Set a setting value by path
  async set(path, value, saveImmediately = false) {
    this.setNestedValue(this.settings, path, value);
    this.notifyListeners('settingsChanged', { path, value });
    await this.save(saveImmediately);
  }

  // Update multiple settings at once
  async updateMultiple(updates, saveImmediately = false) {
    for (const [path, value] of Object.entries(updates)) {
      this.setNestedValue(this.settings, path, value);
    }
    this.notifyListeners('settingsChanged', updates);
    await this.save(saveImmediately);
  }

  // Panel position methods
  async updatePanelPosition(panelId, position, saveImmediately = false) {
    await this.set(`panelPositions.${panelId}`, position, saveImmediately);
  }

  getPanelPosition(panelId) {
    return this.get(`panelPositions.${panelId}`) || DEFAULT_UI_SETTINGS.panelPositions[panelId];
  }

  // Theme methods
  async setTheme(themeName, saveImmediately = true) {
    await this.set('theme.current', themeName, saveImmediately);
  }

  getTheme() {
    return this.get('theme.current');
  }

  // Language methods
  async setLanguage(languageCode, saveImmediately = true) {
    await this.set('language.current', languageCode, saveImmediately);
  }

  getLanguage() {
    return this.get('language.current');
  }

  // Screen methods
  async updateScreens(screenData, saveImmediately = true) {
    await this.updateMultiple({
      'screens.homeScreen': screenData.homeScreen,
      'screens.secondaryScreens': screenData.secondaryScreens,
      'screens.currentScreen': screenData.currentScreen,
      'screens.tabPosition': screenData.tabPosition
    }, saveImmediately);
  }

  // Account mapping methods
  async updateAccountMappings(mappings, saveImmediately = true) {
    await this.set('accountMappings', mappings, saveImmediately);
  }

  getAccountMappings() {
    return this.get('accountMappings') || {};
  }

  // Sum formula methods
  async updateSumFormulas(type, accountName, formula, saveImmediately = true) {
    await this.set(`sumFormulas.${type}.${accountName}`, formula, saveImmediately);
  }

  getSumFormulas(type) {
    return this.get(`sumFormulas.${type}`) || {};
  }

  // ANAF header panel methods
  async updateAnafHeaderPanel(values, saveImmediately = true) {
    await this.updateMultiple({
      'anafHeaderPanel.commonLines': values.commonLines,
      'anafHeaderPanel.columnNamesRow': values.columnNamesRow,
      'anafHeaderPanel.selectedDateColumns': values.selectedDateColumns,
      'anafHeaderPanel.dateColumnsWithTime': values.dateColumnsWithTime
    }, saveImmediately);
  }

  getAnafHeaderPanel() {
    return this.get('anafHeaderPanel');
  }

  // Date interval methods
  async updateDateInterval(startDate, endDate, saveImmediately = true) {
    await this.updateMultiple({
      'accountSelection.dateInterval.startDate': startDate,
      'accountSelection.dateInterval.endDate': endDate
    }, saveImmediately);
  }

  getDateInterval() {
    return this.get('accountSelection.dateInterval');
  }

  // Event listener methods
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in settings event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // Reset to defaults
  async resetToDefaults(saveImmediately = true) {
    this.settings = { ...DEFAULT_UI_SETTINGS };
    this.notifyListeners('settingsReset', this.settings);
    await this.save(saveImmediately);
  }

  // Export settings
  exportSettings() {
    return JSON.stringify(this.settings, null, 2);
  }

  // Import settings
  async importSettings(settingsJson, saveImmediately = true) {
    try {
      const importedSettings = JSON.parse(settingsJson);
      this.settings = this.deepMerge(DEFAULT_UI_SETTINGS, importedSettings);
      this.notifyListeners('settingsImported', this.settings);
      await this.save(saveImmediately);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }
}

// Singleton instance
let settingsManager = null;

export function getUISettingsManager() {
  if (!settingsManager) {
    settingsManager = new UISettingsManager();
  }
  return settingsManager;
}

// Hook for React components
import { useState, useEffect } from 'react';

export function useUISettings(path = null) {
  const [settings, setSettings] = useState(path ? null : {});
  const [loading, setLoading] = useState(true);
  const manager = getUISettingsManager();

  useEffect(() => {
    const handleSettingsChange = (data) => {
      if (path) {
        if (typeof data === 'object' && data.hasOwnProperty(path)) {
          setSettings(data[path]);
        }
      } else {
        setSettings(manager.settings);
      }
    };

    const handleSettingsLoaded = () => {
      setSettings(path ? manager.get(path) : manager.settings);
      setLoading(false);
    };

    // Add listeners
    manager.addEventListener('settingsChanged', handleSettingsChange);
    manager.addEventListener('settingsLoaded', handleSettingsLoaded);

    // Load initial settings
    manager.load().then(() => {
      setSettings(path ? manager.get(path) : manager.settings);
      setLoading(false);
    });

    return () => {
      manager.removeEventListener('settingsChanged', handleSettingsChange);
      manager.removeEventListener('settingsLoaded', handleSettingsLoaded);
    };
  }, [path, manager]);

  const updateSettings = async (newValue, saveImmediately = false) => {
    if (path) {
      await manager.set(path, newValue, saveImmediately);
    } else {
      console.warn('Cannot update entire settings object. Use specific path or updateMultiple method.');
    }
  };

  return { settings, updateSettings, loading, manager };
}