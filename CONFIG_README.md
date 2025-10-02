# App Configuration System

## Overview

This application uses a **multi-file configuration system** that organizes app state into three separate JSON files. This provides better organization, performance, and maintainability compared to a single settings file.

## 📁 Configuration Files

### 1. **panels-config.json** - Panel Data
Stores all panel-related information:
- Panel positions (x, y coordinates)
- Panel sizes (width, height)
- Panel visibility states
- Panel-specific settings (header rows, date columns, account mappings, etc.)

### 2. **app-config.json** - App Settings
Stores application-wide settings:
- Theme and language preferences
- Layout mode configuration
- Screen mode settings (home screen, secondary screens)
- View settings (pan offset, zoom, grid)
- Button states
- UI state (modals, dropdowns, menus)
- Window settings

### 3. **accounts-config.json** - Account Data
Stores account-related information:
- Available conta and ANAF accounts
- Custom accounts
- Removed default accounts
- Account file mappings
- Sum formulas
- Header settings for both systems

## 📂 File Locations

**Config Directory:** `%APPDATA%/[app-name]/config/`

The config files are stored in:
- `config/panels-config.json`
- `config/app-config.json`
- `config/accounts-config.json`

**Template Directory:** `./config-templates/`

Template files with default structures are located in the project root.

## 🚀 Quick Start

### Step 1: Import the Config Manager

```javascript
import { configManager } from './configManager';
```

### Step 2: Load All Configs on App Startup

```javascript
useEffect(() => {
  const loadConfigs = async () => {
    const configs = await configManager.loadAll();
    // Apply configs to your state
  };
  loadConfigs();
}, []);
```

### Step 3: Save Changes Automatically

```javascript
// Save panel position
await configManager.updatePanelPosition('panel-id', { x: 100, y: 200 });

// Save theme
await configManager.updateTheme('dark');

// Save account changes
await configManager.updateContaAccounts({ customAccounts: [...] });
```

## 📚 Documentation Files

1. **CONFIG_SYSTEM.md** - Detailed documentation of the config system
2. **INTEGRATION_EXAMPLE.md** - Step-by-step integration guide with code examples
3. **CONFIG_README.md** - This file, overview and quick reference

## 🔧 Key Features

### Automatic Persistence
Every change is automatically saved to the appropriate config file:
- Panel moves/resizes → `panels-config.json`
- Theme/language changes → `app-config.json`
- Account modifications → `accounts-config.json`

### Deep Merging
Config files are deep-merged with defaults, ensuring backward compatibility when new fields are added.

### Debouncing
Frequent updates (like panel dragging) can be debounced to reduce file writes.

### Migration Support
Automatic migration from old `settings.json` to new multi-file system.

## 📋 Panel-Specific Settings

Each panel stores its specific configuration:

| Panel | Settings Stored |
|-------|----------------|
| **anaf-header-panel** | Common lines, column names row, date columns |
| **account-selection-panel** | Date interval, selected accounts, account configs |
| **account-mapping-panel** | Account mappings (conta → anaf) |
| **sums-panel** | Account sums, monthly analysis |
| **worksheet-selection-panel** | Selected worksheets, end-of-year transactions |

## 🔄 Migration from Old Settings

### Automatic Migration

```javascript
import { migrateOldSettingsToNewConfig, checkMigrationNeeded } from './configMigration';

// On app startup
const migrationNeeded = await checkMigrationNeeded();
if (migrationNeeded) {
  await migrateOldSettingsToNewConfig();
}
```

### Manual Migration

If you need to manually trigger migration:

```javascript
await migrateOldSettingsToNewConfig();
```

## 🎯 Common Use Cases

### Saving Panel Position After Drag

```javascript
const handleDragEnd = async (panelId, newPosition) => {
  setPanelPositions(prev => ({
    ...prev,
    [panelId]: { ...prev[panelId], ...newPosition }
  }));

  await configManager.updatePanelPosition(panelId, newPosition);
};
```

### Saving Theme Change

```javascript
const handleThemeChange = async (theme) => {
  setCurrentTheme(theme);
  applyTheme(theme);
  await configManager.updateTheme(theme);
};
```

### Saving Account Mappings

```javascript
const handleMappingChange = async (newMappings) => {
  setAccountMappings(newMappings);
  await configManager.updatePanelSettings('account-mapping-panel', {
    accountMappings: newMappings
  });
};
```

### Saving Screen Configuration

```javascript
const handleScreenUpdate = async (screenData) => {
  setSecondaryScreens(screenData);
  await configManager.updateScreens({ secondaryScreens: screenData });
};
```

## 🛠️ ConfigManager API

### Loading Methods
- `loadAll()` - Load all config files
- `getPanelsConfig()` - Get current panels config
- `getAppConfig()` - Get current app config
- `getAccountsConfig()` - Get current accounts config

### Saving Methods
- `savePanelsConfig(config)` - Save panels config
- `saveAppConfig(config)` - Save app config
- `saveAccountsConfig(config)` - Save accounts config

### Update Methods
- `updatePanelPosition(panelId, position)` - Update panel position
- `updatePanelSize(panelId, size)` - Update panel size
- `updatePanelSettings(panelId, settings)` - Update panel settings
- `updateTheme(theme)` - Update theme
- `updateLanguage(language)` - Update language
- `updateLayoutMode(layoutMode)` - Update layout mode
- `updateScreens(screens)` - Update screens
- `updateView(view)` - Update view settings
- `updateContaAccounts(updates)` - Update conta accounts
- `updateAnafAccounts(updates)` - Update anaf accounts

## 🔍 Debugging

### Check Current Config State

```javascript
console.log('Panels:', configManager.getPanelsConfig());
console.log('App:', configManager.getAppConfig());
console.log('Accounts:', configManager.getAccountsConfig());
```

### Verify File Locations

Check the console for file paths or use:
```javascript
console.log(app.getPath('userData'));
```

### Reset to Defaults

To reset configs, delete the config files:
- Delete `%APPDATA%/[app-name]/config/` folder
- Restart the app
- Default configs will be created

## ⚠️ Important Notes

1. **Always use ConfigManager** - Don't directly access `window.electronAPI` config methods
2. **Debounce frequent updates** - Use debouncing for drag/resize operations
3. **Handle errors** - Wrap config operations in try-catch blocks
4. **Version control** - Each config has a version field for future migrations
5. **Backward compatibility** - Old settings.json is still supported

## 📝 Integration Checklist

- [ ] Import ConfigManager in App.js
- [ ] Replace old settings loading
- [ ] Update all state-changing functions to save to config
- [ ] Add debouncing for frequent updates
- [ ] Test migration from old settings
- [ ] Verify all panels save their settings correctly
- [ ] Test theme/language persistence
- [ ] Test screen configuration persistence
- [ ] Test account configuration persistence
- [ ] Remove old settings.json calls

## 🐛 Troubleshooting

### Config not saving
- Check console for errors
- Verify ConfigManager is properly imported
- Ensure config directory has write permissions

### Config not loading
- Check if config files exist
- Verify file paths are correct
- Check for JSON syntax errors in config files

### Migration issues
- Backup old settings.json before migration
- Check console for migration errors
- Manually verify migrated data

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review INTEGRATION_EXAMPLE.md for code samples
3. Check CONFIG_SYSTEM.md for detailed specifications
4. Review console logs for error messages

## 🎉 Benefits

✅ **Organized** - Settings logically grouped into separate files
✅ **Performance** - Only load/save relevant config sections
✅ **Maintainable** - Easier to understand and modify
✅ **Scalable** - Easy to add new config sections
✅ **Backward Compatible** - Supports migration from old system
✅ **Type-Safe** - Structured config with clear schemas
✅ **Debuggable** - Easy to inspect and modify config files
