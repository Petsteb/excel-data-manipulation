// Settings Configuration Schema
// This file defines the complete settings structure for the application

export const SETTINGS_SCHEMA = {
  // Application version for migration purposes
  version: '2.0.7',
  
  // Theme settings
  theme: 'professional',
  
  // Language settings
  language: 'en',
  
  // Excel processing settings
  excel: {
    commonLines: 1,
    columnNamesRow: 1,
    selectedDateColumns: [],
    dateColumnsWithTime: []
  },

  // Window settings (managed by main.js)
  windowSettings: {
    isFirstLaunch: true,
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    isMaximized: false,
    isFullScreen: false
  },

  // Menu states
  menuStates: {
    headerSettings: true,
    columnSettings: true,
    fileList: true,
    processingDetails: false
  },

  // UI Settings (comprehensive UI state)
  uiSettings: {
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
      homeScreen: null,
      secondaryScreens: [],
      currentScreen: 'home',
      tabPosition: 'left'
    },

    // Panel visibility and layout
    panels: {
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
      layoutMode: {
        enabled: false,
        onlyPanels: ['anaf-header-panel', 'anaf-date-panel', 'sums-panel'],
        showControlPanel: false
      }
    },

    // View and layout preferences
    view: {
      panOffset: { x: 0, y: 0 },
      zoom: 1,
      gridVisible: true,
      snapToGrid: true
    },

    // Application mode
    mode: {
      current: 'normal',
      screenMode: {
        step: 'idle',
        creatingScreenRect: null
      }
    },

    // UI interaction settings
    interaction: {
      dragSensitivity: 5,
      resizeHandleSize: 8,
      tooltipDelay: 500
    }
  },

  // Account mappings (conta to anaf relationships)
  accountMappings: {
    // Default mappings - structure: { contaAccount: [anafAccount1, anafAccount2, ...] }
    // This will be populated with actual account mappings from the application
  },

  // Sum formulas for each account type
  sumFormulas: {
    conta: {
      // Structure: { accountName: { formula: 'sum|subtract', sumValue: number, subtractValue: number } }
    },
    anaf: {
      // Structure: { accountName: { formula: 'sum|subtract', sumValue: number, subtractValue: number } }
    }
  },

  // ANAF header panel specific settings
  anafHeaderPanel: {
    commonLines: 1,
    columnNamesRow: 1,
    selectedDateColumns: [],
    dateColumnsWithTime: []
  },

  // Account selection and date interval settings
  accountSelection: {
    dateInterval: {
      startDate: null,
      endDate: null
    },
    selectedAccounts: [],
    selectedAnafAccounts: [],
    filterSettings: {
      // Filter configurations for account processing
    }
  },

  // Worksheet selection preferences
  worksheetSelection: {
    selectedWorksheets: {
      contaMergedData: true,
      anafMergedData: true,
      relationsSummary: true,
      contaAccountSums: true,
      anafAccountSums: true
    }
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
    },
    maxRecentFiles: 10
  },

  // Application preferences
  preferences: {
    autoSave: true,
    autoSaveInterval: 300000, // 5 minutes in milliseconds
    confirmBeforeExit: true,
    showTooltips: true,
    animationsEnabled: true,
    soundEnabled: false
  },

  // Advanced settings
  advanced: {
    debugMode: false,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    maxLogSize: 10485760, // 10MB in bytes
    performanceMonitoring: false,
    memoryUsageAlerts: false
  }
};

// Migration functions for handling settings updates between versions
export class SettingsMigrator {
  static migrate(settings, fromVersion, toVersion) {
    // Version-specific migrations
    let migratedSettings = { ...settings };

    // Add migration logic here when needed
    // Example:
    // if (fromVersion < '2.0.0' && toVersion >= '2.0.0') {
    //   migratedSettings = this.migrateToV2(migratedSettings);
    // }

    // Always ensure current version is set
    migratedSettings.version = toVersion;
    
    return migratedSettings;
  }

  static migrateToV2(settings) {
    // Example migration for version 2.0.0
    // Add any structural changes needed between versions
    return {
      ...settings,
      // Add new fields with defaults
      uiSettings: settings.uiSettings || SETTINGS_SCHEMA.uiSettings,
      preferences: settings.preferences || SETTINGS_SCHEMA.preferences,
      advanced: settings.advanced || SETTINGS_SCHEMA.advanced
    };
  }
}

// Settings validation functions
export class SettingsValidator {
  static validate(settings) {
    const errors = [];
    const warnings = [];

    // Validate theme
    if (settings.theme && typeof settings.theme !== 'string') {
      errors.push('Theme must be a string');
    }

    // Validate language
    if (settings.language && typeof settings.language !== 'string') {
      errors.push('Language must be a string');
    }

    // Validate panel positions
    if (settings.uiSettings && settings.uiSettings.panelPositions) {
      Object.entries(settings.uiSettings.panelPositions).forEach(([panelId, position]) => {
        if (!this.isValidPosition(position)) {
          errors.push(`Invalid position for panel ${panelId}`);
        }
      });
    }

    // Validate account mappings
    if (settings.accountMappings && typeof settings.accountMappings !== 'object') {
      errors.push('Account mappings must be an object');
    }

    // Validate date intervals
    if (settings.accountSelection && settings.accountSelection.dateInterval) {
      const { startDate, endDate } = settings.accountSelection.dateInterval;
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        warnings.push('Start date is after end date in account selection');
      }
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }

  static isValidPosition(position) {
    return position && 
           typeof position.x === 'number' && 
           typeof position.y === 'number' && 
           typeof position.width === 'number' && 
           typeof position.height === 'number' &&
           position.width > 0 && 
           position.height > 0;
  }
}

// Settings utility functions
export class SettingsUtils {
  static deepMerge(target, source) {
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

  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  static setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  static sanitizeSettings(settings) {
    // Remove any invalid or dangerous values
    const sanitized = { ...settings };
    
    // Remove any functions
    function removeFunctions(obj) {
      for (const key in obj) {
        if (typeof obj[key] === 'function') {
          delete obj[key];
        } else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          removeFunctions(obj[key]);
        }
      }
    }
    
    removeFunctions(sanitized);
    return sanitized;
  }
}

export default SETTINGS_SCHEMA;