# Configuration System Documentation

## Overview

The application now uses a **multi-file configuration system** with three separate JSON files, each managing specific aspects of the app state. This separation improves organization, performance, and maintainability.

## Configuration Files

### 1. `panels-config.json` - Panel-Specific Data

**Location:** `%APPDATA%/excel-file-merger/config/panels-config.json`

**Purpose:** Stores all panel-related data including positions, sizes, visibility, and panel-specific settings.

**Structure:**
```json
{
  "version": "1.0.0",
  "panels": {
    "panel-id": {
      "position": { "x": 20, "y": 20 },
      "size": { "width": 240, "height": 180 },
      "visible": true,
      "settings": {
        // Panel-specific settings
      }
    }
  },
  "buttons": {
    "button-id": {
      "position": { "x": 540, "y": 460 },
      "size": { "width": 240, "height": 80 },
      "visible": true
    }
  }
}
```

**Panels Included:**
- `contabilitate-upload-panel` - Conta file upload settings
- `anaf-upload-panel` - ANAF file upload settings
- `contabilitate-summary-panel` - Conta summary data
- `anaf-summary-panel` - ANAF summary data
- `anaf-header-panel` - ANAF header configuration (rows, columns)
- `anaf-date-panel` - ANAF date column settings
- `account-selection-panel` - Account selection and date interval
- `account-mapping-panel` - Account mappings between conta and ANAF
- `sums-panel` - Account sums display
- `worksheet-selection-panel` - Worksheet selection settings
- `final-summary-panel` - Final summary display

### 2. `app-config.json` - App-Level Settings

**Location:** `%APPDATA%/excel-file-merger/config/app-config.json`

**Purpose:** Stores application-wide settings like theme, language, screens, and UI state.

**Structure:**
```json
{
  "version": "1.0.0",
  "theme": {
    "current": "professional",
    "customThemes": []
  },
  "language": {
    "current": "en",
    "available": ["en", "ro", "de", "fr", "es"]
  },
  "layout": {
    "mode": "normal",
    "layoutMode": {
      "enabled": false,
      "onlyPanels": ["anaf-header-panel", "anaf-date-panel", "sums-panel"],
      "showControlPanel": false
    }
  },
  "screens": {
    "mode": { "enabled": false, "step": "idle" },
    "homeScreen": null,
    "secondaryScreens": [],
    "currentScreen": "home",
    "tabPosition": "left"
  },
  "view": {
    "panOffset": { "x": 0, "y": 0 },
    "normalModeScreenPosition": { "x": 0, "y": 0 },
    "zoom": 1,
    "gridVisible": true,
    "snapToGrid": true
  },
  "upperRightButtons": {
    // Button states
  },
  "ui": {
    // UI state (modals, dropdowns, etc.)
  }
}
```

**Key Settings:**
- **Theme:** Current theme and custom themes
- **Language:** Current language and available languages
- **Layout Mode:** Layout mode configuration
- **Screens:** Screen mode settings, home screen, secondary screens
- **View:** Pan offset, zoom, grid settings
- **Upper Right Buttons:** Button visibility and state
- **UI State:** Modals, dropdowns, context menus

### 3. `accounts-config.json` - Account Data

**Location:** `%APPDATA%/excel-file-merger/config/accounts-config.json`

**Purpose:** Stores all account-related data for both conta and ANAF.

**Structure:**
```json
{
  "version": "1.0.0",
  "conta": {
    "defaultAccounts": ["4423", "4424", ...],
    "availableAccounts": ["4423", "4424", ...],
    "customAccounts": [],
    "removedDefaultAccounts": [],
    "accountFiles": {},
    "sumFormulas": {},
    "headerSettings": {
      "commonLines": 1,
      "columnNamesRow": 1
    }
  },
  "anaf": {
    "defaultAccounts": ["1/4423", "1/4424", ...],
    "availableAccounts": ["1/4423", "1/4424", ...],
    "customAccounts": [],
    "removedDefaultAccounts": [],
    "accountFiles": {},
    "sumFormulas": {},
    "headerSettings": {
      "commonLines": 1,
      "columnNamesRow": 1
    }
  },
  "accountInput": {
    "showContaInput": false,
    "showAnafInput": false
  }
}
```

## Using the Config Manager

### Importing

```javascript
import { configManager } from './configManager';
```

### Loading All Configs on Startup

```javascript
useEffect(() => {
  const loadConfigs = async () => {
    try {
      const configs = await configManager.loadAll();

      // Apply panels config
      if (configs.panels) {
        setPanelPositions(/* extract positions */);
        // ... apply other panel settings
      }

      // Apply app config
      if (configs.app) {
        setCurrentTheme(configs.app.theme.current);
        setCurrentLanguage(configs.app.language.current);
        // ... apply other app settings
      }

      // Apply accounts config
      if (configs.accounts) {
        setAvailableAccounts(configs.accounts.conta.availableAccounts);
        // ... apply other account settings
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  };

  loadConfigs();
}, []);
```

### Saving Panel Changes

```javascript
// Update panel position
const handlePanelMove = async (panelId, newPosition) => {
  await configManager.updatePanelPosition(panelId, newPosition);
};

// Update panel size
const handlePanelResize = async (panelId, newSize) => {
  await configManager.updatePanelSize(panelId, newSize);
};

// Update panel settings
const handlePanelSettingsChange = async (panelId, newSettings) => {
  await configManager.updatePanelSettings(panelId, newSettings);
};
```

### Saving App-Level Changes

```javascript
// Update theme
const handleThemeChange = async (newTheme) => {
  setCurrentTheme(newTheme);
  await configManager.updateTheme(newTheme);
};

// Update language
const handleLanguageChange = async (newLanguage) => {
  setCurrentLanguage(newLanguage);
  await configManager.updateLanguage(newLanguage);
};

// Update layout mode
const handleLayoutModeToggle = async (enabled) => {
  setIsLayoutMode(enabled);
  await configManager.updateLayoutMode({ enabled });
};

// Update screens
const handleScreensUpdate = async (newScreens) => {
  setSecondaryScreens(newScreens);
  await configManager.updateScreens({ secondaryScreens: newScreens });
};
```

### Saving Account Changes

```javascript
// Update conta accounts
const handleContaAccountsChange = async (updates) => {
  await configManager.updateContaAccounts({
    availableAccounts: updates.availableAccounts,
    customAccounts: updates.customAccounts
  });
};

// Update anaf accounts
const handleAnafAccountsChange = async (updates) => {
  await configManager.updateAnafAccounts({
    availableAccounts: updates.availableAccounts,
    customAccounts: updates.customAccounts
  });
};
```

## Migration from Old Settings

The old `settings.json` file is still supported for backward compatibility. On first load with the new system, you should migrate existing settings to the new config files:

```javascript
const migrateOldSettings = async () => {
  const oldSettings = await window.electronAPI.loadSettings();

  // Migrate to panels config
  const panelsConfig = {
    version: "1.0.0",
    panels: { /* map old panelPositions */ }
  };
  await configManager.savePanelsConfig(panelsConfig);

  // Migrate to app config
  const appConfig = {
    version: "1.0.0",
    theme: { current: oldSettings.theme },
    language: { current: oldSettings.language },
    // ... other mappings
  };
  await configManager.saveAppConfig(appConfig);

  // Migrate to accounts config
  const accountsConfig = {
    version: "1.0.0",
    conta: { /* map old conta settings */ },
    anaf: { /* map old anaf settings */ }
  };
  await configManager.saveAccountsConfig(accountsConfig);
};
```

## Best Practices

1. **Always use ConfigManager** - Don't directly call `window.electronAPI` methods; use the ConfigManager utility.

2. **Batch Updates** - When updating multiple settings, use the appropriate update method to save them together.

3. **Error Handling** - Always wrap config operations in try-catch blocks.

4. **Debounce Frequent Updates** - For settings that change frequently (like panel positions during drag), debounce the save operations.

5. **Version Control** - Each config file has a version field. Use this for future migrations.

## Config File Locations

- **Development:** `%APPDATA%/Electron/config/`
- **Production:** `%APPDATA%/[app-name]/config/`

You can find the exact path by checking `app.getPath('userData')` in Electron.
