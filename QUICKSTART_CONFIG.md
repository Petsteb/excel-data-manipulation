# Quick Start: Config System Implementation

## What's Been Created

✅ **3 Config Template Files** in `config-templates/`:
- `panels-config.json` - Panel positions, sizes, and settings
- `app-config.json` - App-level settings (theme, language, screens, etc.)
- `accounts-config.json` - Account data for conta and ANAF

✅ **Backend Implementation** in `main.js`:
- Config loading/saving functions for each file
- IPC handlers for frontend communication
- Deep merge support for backward compatibility

✅ **Frontend Utilities**:
- `src/configManager.js` - Easy-to-use config management API
- `src/configMigration.js` - Migration from old settings.json

✅ **Documentation**:
- `CONFIG_README.md` - Overview and quick reference
- `CONFIG_SYSTEM.md` - Detailed system documentation
- `INTEGRATION_EXAMPLE.md` - Step-by-step integration guide

## Next Steps

### 1. Test the Backend (Recommended First)

Before integrating into App.js, test that the config system works:

```bash
# Run the app in dev mode
npm run dev
```

Open DevTools console and test:

```javascript
// Test loading
const panels = await window.electronAPI.loadPanelsConfig();
console.log('Panels config:', panels);

const app = await window.electronAPI.loadAppConfig();
console.log('App config:', app);

const accounts = await window.electronAPI.loadAccountsConfig();
console.log('Accounts config:', accounts);

// Test saving
await window.electronAPI.savePanelsConfig({ ...panels, version: '1.0.1' });
console.log('Saved successfully!');
```

### 2. Integrate ConfigManager into App.js

Follow these steps in order:

#### A. Import the ConfigManager

At the top of `src/App.js`:

```javascript
import { configManager } from './configManager';
import { migrateOldSettingsToNewConfig, checkMigrationNeeded } from './configMigration';
```

#### B. Replace Settings Loading (around line 424)

Replace the existing `loadSettings` useEffect with:

```javascript
useEffect(() => {
  const loadAppConfigs = async () => {
    try {
      setIsLoading(true);

      // Check if migration is needed
      const needsMigration = await checkMigrationNeeded();
      if (needsMigration) {
        console.log('Migrating old settings...');
        await migrateOldSettingsToNewConfig();
      }

      // Load all configs
      const configs = await configManager.loadAll();

      // Apply app config
      if (configs.app) {
        setCurrentTheme(configs.app.theme.current);
        setCurrentLanguage(configs.app.language.current);
        setIsLayoutMode(configs.app.layout.layoutMode.enabled);
        setLayoutModeOnlyPanels(configs.app.layout.layoutMode.onlyPanels);
        // ... apply other app settings
      }

      // Apply panels config
      if (configs.panels) {
        const positions = {};
        Object.entries(configs.panels.panels).forEach(([panelId, panel]) => {
          positions[panelId] = {
            x: panel.position.x,
            y: panel.position.y,
            width: panel.size.width,
            height: panel.size.height
          };
          // Apply panel-specific settings
        });
        setPanelPositions(positions);
      }

      // Apply accounts config
      if (configs.accounts) {
        setAvailableAccounts(configs.accounts.conta.availableAccounts);
        setCustomAccounts(configs.accounts.conta.customAccounts);
        setAvailableAnafAccounts(configs.accounts.anaf.availableAccounts);
        // ... apply other account settings
      }

      setSettingsLoaded(true);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  loadAppConfigs();
}, []);
```

#### C. Update Save Functions

Replace all instances of:
```javascript
const settings = await window.electronAPI.loadSettings();
await window.electronAPI.saveSettings({ ...settings, ... });
```

With:
```javascript
await configManager.updateTheme(newTheme);
// or
await configManager.updatePanelPosition(panelId, position);
// etc.
```

**Key replacements:**

1. **Theme change** (around line 778):
```javascript
const handleThemeChange = async (themeKey) => {
  setCurrentTheme(themeKey);
  applyTheme(themeKey);
  await configManager.updateTheme(themeKey);
};
```

2. **Language change** (around line 791):
```javascript
const handleLanguageChange = async (languageKey) => {
  setCurrentLanguage(languageKey);
  await configManager.updateLanguage(languageKey);
};
```

3. **Panel position change** (when dragging ends):
```javascript
// In handleMouseUp or similar
if (draggedElement) {
  await configManager.updatePanelPosition(draggedElement, {
    x: panelPositions[draggedElement].x,
    y: panelPositions[draggedElement].y
  });
}
```

### 3. Add Debouncing for Frequent Updates

For panel dragging, add debouncing to avoid too many saves:

```javascript
import { useCallback, useRef } from 'react';

const saveTimeoutRef = useRef(null);

const debouncedSavePosition = useCallback((panelId, position) => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }

  saveTimeoutRef.current = setTimeout(async () => {
    await configManager.updatePanelPosition(panelId, position);
  }, 500); // Save after 500ms of no movement
}, []);
```

### 4. Test Each Change Incrementally

Test in this order:

1. ✅ Test config loading on app startup
2. ✅ Test theme change persists
3. ✅ Test language change persists
4. ✅ Test panel position persists after drag
5. ✅ Test panel settings persist
6. ✅ Test account changes persist
7. ✅ Test screen configuration persists

### 5. Remove Old Settings Code (Final Step)

Once everything works, you can remove:
- Old `window.electronAPI.loadSettings()` calls
- Old `window.electronAPI.saveSettings()` calls
- Old settings migration code (if you had any)

## Testing Checklist

- [ ] Config files are created in `%APPDATA%/[app-name]/config/`
- [ ] Theme changes are saved and persist on restart
- [ ] Language changes are saved and persist on restart
- [ ] Panel positions are saved and persist on restart
- [ ] Panel sizes are saved and persist on restart
- [ ] ANAF header settings persist
- [ ] Account selection settings persist
- [ ] Account mappings persist
- [ ] Worksheet selection settings persist
- [ ] Screen configuration persists
- [ ] Old settings.json migrates correctly

## Debugging Tips

### Check Config Files

Navigate to: `%APPDATA%/Electron/config/` (dev) or `%APPDATA%/[app-name]/config/` (prod)

You should see:
- `panels-config.json`
- `app-config.json`
- `accounts-config.json`

### Console Logging

Add logging to verify:

```javascript
console.log('Loaded configs:', await configManager.loadAll());
console.log('Panel positions:', configManager.getPanelsConfig().panels);
console.log('Current theme:', configManager.getAppConfig().theme.current);
```

### Reset Configs

If something goes wrong:
1. Close the app
2. Delete the `config/` folder
3. Restart the app
4. Default configs will be created

## Need Help?

1. **Check Documentation**:
   - `CONFIG_README.md` - Quick reference
   - `CONFIG_SYSTEM.md` - Detailed docs
   - `INTEGRATION_EXAMPLE.md` - Code examples

2. **Check Console**:
   - Open DevTools
   - Look for error messages
   - Check config loading/saving logs

3. **Verify Files**:
   - Check if config files exist
   - Verify JSON syntax is valid
   - Check file permissions

## Expected Behavior

### First Run (No Config Files)
1. App loads default configs
2. Creates config files with defaults
3. Everything works as before

### Subsequent Runs (Config Files Exist)
1. App loads saved configs
2. Applies all saved settings
3. UI reflects saved state

### After Changes
1. User changes a setting (theme, panel position, etc.)
2. Config is immediately saved to appropriate file
3. Next app launch loads the saved state

That's it! You now have a modern, organized configuration system. 🎉
