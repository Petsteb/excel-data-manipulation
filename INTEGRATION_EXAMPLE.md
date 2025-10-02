# Config System Integration Example

This document shows how to integrate the new config system into App.js.

## Step 1: Import ConfigManager

At the top of your App.js:

```javascript
import { configManager } from './configManager';
```

## Step 2: Load Configs on Startup

Replace the existing settings loading code with:

```javascript
useEffect(() => {
  const loadAppConfigs = async () => {
    try {
      setIsLoading(true);

      const configs = await configManager.loadAll();

      // Load App Config
      if (configs.app) {
        const { theme, language, layout, screens, view, upperRightButtons, ui } = configs.app;

        // Theme & Language
        setCurrentTheme(theme.current);
        setCurrentLanguage(language.current);
        applyTheme(theme.current);

        // Layout Mode
        setIsLayoutMode(layout.layoutMode.enabled);
        setLayoutModeOnlyPanels(layout.layoutMode.onlyPanels);
        setShowLayoutControlPanel(layout.layoutMode.showControlPanel);

        // Screen Mode
        setIsScreenMode(screens.mode.enabled);
        setScreenModeStep(screens.mode.step);
        setHomeScreen(screens.homeScreen);
        setSecondaryScreens(screens.secondaryScreens);
        setCurrentScreen(screens.currentScreen);
        setTabPosition(screens.tabPosition);

        // View Settings
        setPanOffset(view.panOffset);
        setNormalModeScreenPosition(view.normalModeScreenPosition);
        setIsPanningDisabled(view.isPanningDisabled);
      }

      // Load Panels Config
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
          if (panelId === 'anaf-header-panel' && panel.settings) {
            setAnafCommonLines(panel.settings.commonLines);
            setAnafColumnNamesRow(panel.settings.columnNamesRow);
            setAnafSelectedDateColumns(panel.settings.selectedDateColumns || []);
          }

          if (panelId === 'account-selection-panel' && panel.settings) {
            setStartDate(panel.settings.dateInterval.startDate);
            setEndDate(panel.settings.dateInterval.endDate);
            setSelectedAccounts(panel.settings.selectedAccounts || []);
            setSelectedAnafAccounts(panel.settings.selectedAnafAccounts || []);
            setAccountConfigs(panel.settings.accountConfigs || {});
            setAnafAccountConfigs(panel.settings.anafAccountConfigs || {});
            setAnafSubtractionEnabled(panel.settings.anafSubtractionEnabled || {});
          }

          if (panelId === 'account-mapping-panel' && panel.settings) {
            setAccountMappings(panel.settings.accountMappings || {});
          }

          if (panelId === 'worksheet-selection-panel' && panel.settings) {
            setSelectedWorksheets(panel.settings.selectedWorksheets || {});
            setIncludeEndOfYearTransactions(panel.settings.includeEndOfYearTransactions || false);
          }
        });

        setPanelPositions(positions);
      }

      // Load Accounts Config
      if (configs.accounts) {
        const { conta, anaf } = configs.accounts;

        // Conta accounts
        setAvailableAccounts(conta.availableAccounts);
        setCustomAccounts(conta.customAccounts);
        setRemovedDefaultAccounts(conta.removedDefaultAccounts);
        setContaAccountFiles(conta.accountFiles || {});
        setContabilitateCommonLines(conta.headerSettings.commonLines);
        setContabilitateColumnNamesRow(conta.headerSettings.columnNamesRow);

        // ANAF accounts
        setAvailableAnafAccounts(anaf.availableAccounts);
        setCustomAnafAccounts(anaf.customAccounts);
        setAnafAccountFiles(anaf.accountFiles || {});
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

## Step 3: Save Panel Position/Size Changes

When a panel is moved or resized:

```javascript
const handlePanelPositionChange = useCallback(async (elementId, newPosition) => {
  // Update local state
  setPanelPositions(prev => ({
    ...prev,
    [elementId]: {
      ...prev[elementId],
      x: newPosition.x,
      y: newPosition.y
    }
  }));

  // Save to config
  await configManager.updatePanelPosition(elementId, {
    x: newPosition.x,
    y: newPosition.y
  });
}, []);

const handlePanelSizeChange = useCallback(async (elementId, newSize) => {
  // Update local state
  setPanelPositions(prev => ({
    ...prev,
    [elementId]: {
      ...prev[elementId],
      width: newSize.width,
      height: newSize.height
    }
  }));

  // Save to config
  await configManager.updatePanelSize(elementId, {
    width: newSize.width,
    height: newSize.height
  });
}, []);
```

## Step 4: Save Panel Settings Changes

### ANAF Header Panel Settings

```javascript
const handleAnafHeaderChange = useCallback(async (field, value) => {
  // Update local state
  if (field === 'commonLines') setAnafCommonLines(value);
  if (field === 'columnNamesRow') setAnafColumnNamesRow(value);

  // Save to config
  await configManager.updatePanelSettings('anaf-header-panel', {
    commonLines: field === 'commonLines' ? value : anafCommonLines,
    columnNamesRow: field === 'columnNamesRow' ? value : anafColumnNamesRow,
    selectedDateColumns: anafSelectedDateColumns,
    dateColumnsWithTime: anafDateColumnsWithTime
  });
}, [anafCommonLines, anafColumnNamesRow, anafSelectedDateColumns, anafDateColumnsWithTime]);
```

### Account Selection Panel Settings

```javascript
const handleAccountSelectionChange = useCallback(async (updates) => {
  // Update local state
  if (updates.startDate) setStartDate(updates.startDate);
  if (updates.endDate) setEndDate(updates.endDate);
  if (updates.selectedAccounts) setSelectedAccounts(updates.selectedAccounts);

  // Prepare settings object
  const settings = {
    dateInterval: {
      startDate: updates.startDate || startDate,
      endDate: updates.endDate || endDate
    },
    selectedAccounts: updates.selectedAccounts || selectedAccounts,
    selectedAnafAccounts: updates.selectedAnafAccounts || selectedAnafAccounts,
    accountConfigs: updates.accountConfigs || accountConfigs,
    anafAccountConfigs: updates.anafAccountConfigs || anafAccountConfigs,
    anafSubtractionEnabled: updates.anafSubtractionEnabled || anafSubtractionEnabled
  };

  // Save to config
  await configManager.updatePanelSettings('account-selection-panel', settings);
}, [startDate, endDate, selectedAccounts, selectedAnafAccounts, accountConfigs, anafAccountConfigs, anafSubtractionEnabled]);
```

### Account Mapping Panel Settings

```javascript
const handleAccountMappingChange = useCallback(async (newMappings) => {
  // Update local state
  setAccountMappings(newMappings);

  // Save to config
  await configManager.updatePanelSettings('account-mapping-panel', {
    accountMappings: newMappings
  });
}, []);
```

### Worksheet Selection Panel Settings

```javascript
const handleWorksheetSelectionChange = useCallback(async (updates) => {
  // Update local state
  if (updates.selectedWorksheets) setSelectedWorksheets(updates.selectedWorksheets);
  if (updates.includeEndOfYearTransactions !== undefined) {
    setIncludeEndOfYearTransactions(updates.includeEndOfYearTransactions);
  }

  // Save to config
  await configManager.updatePanelSettings('worksheet-selection-panel', {
    selectedWorksheets: updates.selectedWorksheets || selectedWorksheets,
    includeEndOfYearTransactions: updates.includeEndOfYearTransactions !== undefined
      ? updates.includeEndOfYearTransactions
      : includeEndOfYearTransactions
  });
}, [selectedWorksheets, includeEndOfYearTransactions]);
```

## Step 5: Save App-Level Changes

### Theme Change

```javascript
const handleThemeChange = useCallback(async (themeKey) => {
  setCurrentTheme(themeKey);
  applyTheme(themeKey);
  await configManager.updateTheme(themeKey);
}, []);
```

### Language Change

```javascript
const handleLanguageChange = useCallback(async (languageKey) => {
  setCurrentLanguage(languageKey);
  await configManager.updateLanguage(languageKey);
}, []);
```

### Layout Mode Change

```javascript
const handleLayoutModeToggle = useCallback(async () => {
  const newLayoutMode = !isLayoutMode;
  setIsLayoutMode(newLayoutMode);

  await configManager.updateLayoutMode({
    enabled: newLayoutMode,
    onlyPanels: layoutModeOnlyPanels,
    showControlPanel: showLayoutControlPanel
  });
}, [isLayoutMode, layoutModeOnlyPanels, showLayoutControlPanel]);
```

### Screen Updates

```javascript
const handleScreensUpdate = useCallback(async (updates) => {
  // Update local state
  if (updates.homeScreen) setHomeScreen(updates.homeScreen);
  if (updates.secondaryScreens) setSecondaryScreens(updates.secondaryScreens);
  if (updates.currentScreen) setCurrentScreen(updates.currentScreen);
  if (updates.tabPosition) setTabPosition(updates.tabPosition);

  // Save to config
  await configManager.updateScreens(updates);
}, []);
```

### View Settings

```javascript
const handleViewUpdate = useCallback(async (updates) => {
  // Update local state
  if (updates.panOffset) setPanOffset(updates.panOffset);
  if (updates.normalModeScreenPosition) setNormalModeScreenPosition(updates.normalModeScreenPosition);

  // Save to config
  await configManager.updateView(updates);
}, []);
```

## Step 6: Save Account Changes

### Conta Accounts

```javascript
const handleContaAccountsUpdate = useCallback(async (updates) => {
  // Update local state
  if (updates.availableAccounts) setAvailableAccounts(updates.availableAccounts);
  if (updates.customAccounts) setCustomAccounts(updates.customAccounts);
  if (updates.removedDefaultAccounts) setRemovedDefaultAccounts(updates.removedDefaultAccounts);

  // Save to config
  await configManager.updateContaAccounts({
    availableAccounts: updates.availableAccounts || availableAccounts,
    customAccounts: updates.customAccounts || customAccounts,
    removedDefaultAccounts: updates.removedDefaultAccounts || removedDefaultAccounts,
    accountFiles: updates.accountFiles || contaAccountFiles,
    headerSettings: {
      commonLines: contabilitateCommonLines,
      columnNamesRow: contabilitateColumnNamesRow
    }
  });
}, [availableAccounts, customAccounts, removedDefaultAccounts, contaAccountFiles, contabilitateCommonLines, contabilitateColumnNamesRow]);
```

### ANAF Accounts

```javascript
const handleAnafAccountsUpdate = useCallback(async (updates) => {
  // Update local state
  if (updates.availableAccounts) setAvailableAnafAccounts(updates.availableAccounts);
  if (updates.customAccounts) setCustomAnafAccounts(updates.customAccounts);

  // Save to config
  await configManager.updateAnafAccounts({
    availableAccounts: updates.availableAccounts || availableAnafAccounts,
    customAccounts: updates.customAccounts || customAnafAccounts,
    accountFiles: updates.accountFiles || anafAccountFiles,
    headerSettings: {
      commonLines: anafCommonLines,
      columnNamesRow: anafColumnNamesRow
    }
  });
}, [availableAnafAccounts, customAnafAccounts, anafAccountFiles, anafCommonLines, anafColumnNamesRow]);
```

## Step 7: Debounce Frequent Updates

For settings that update frequently (like panel dragging), use debouncing:

```javascript
import { useCallback, useRef } from 'react';

const useDebouncedConfigSave = (delay = 500) => {
  const timeoutRef = useRef(null);

  const debouncedSave = useCallback((saveFunction) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveFunction();
    }, delay);
  }, [delay]);

  return debouncedSave;
};

// Usage
const debouncedSave = useDebouncedConfigSave(500);

const handlePanelDrag = (elementId, newPosition) => {
  // Update UI immediately
  setPanelPositions(prev => ({
    ...prev,
    [elementId]: { ...prev[elementId], ...newPosition }
  }));

  // Debounce the config save
  debouncedSave(() => {
    configManager.updatePanelPosition(elementId, newPosition);
  });
};
```

## Complete Integration Checklist

- [ ] Import ConfigManager
- [ ] Replace old settings loading with new config loading
- [ ] Update panel move/resize handlers to save to panels config
- [ ] Update panel settings handlers for each panel type
- [ ] Update theme/language handlers to save to app config
- [ ] Update layout mode handlers to save to app config
- [ ] Update screen handlers to save to app config
- [ ] Update view handlers to save to app config
- [ ] Update account handlers to save to accounts config
- [ ] Add debouncing for frequent updates
- [ ] Remove old settings save calls
- [ ] Test all config save/load operations
