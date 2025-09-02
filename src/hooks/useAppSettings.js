// React hook for managing application settings
import { useState, useEffect, useCallback, useRef } from 'react';

const { ipcRenderer } = window.require('electron');

// Custom hook for managing application settings
export function useAppSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const saveTimeoutRef = useRef(null);
  const settingsRef = useRef(null);

  // Load settings on mount
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedSettings = await ipcRenderer.invoke('load-settings');
      setSettings(loadedSettings);
      settingsRef.current = loadedSettings;
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save settings with debouncing
  const saveSettings = useCallback(async (newSettings, immediate = false) => {
    try {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const doSave = async () => {
        const settingsToSave = newSettings || settingsRef.current;
        await ipcRenderer.invoke('save-settings', settingsToSave);
        settingsRef.current = settingsToSave;
      };

      if (immediate) {
        await doSave();
      } else {
        // Debounce save operations to avoid excessive file writes
        saveTimeoutRef.current = setTimeout(doSave, 300);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.message);
    }
  }, []);

  // Update a specific setting path
  const updateSetting = useCallback(async (path, value, immediate = false) => {
    if (!settings) return;

    const newSettings = { ...settings };
    setNestedValue(newSettings, path, value);
    
    setSettings(newSettings);
    settingsRef.current = newSettings;
    
    await saveSettings(newSettings, immediate);
  }, [settings, saveSettings]);

  // Update multiple settings at once
  const updateMultipleSettings = useCallback(async (updates, immediate = false) => {
    if (!settings) return;

    const newSettings = { ...settings };
    
    for (const [path, value] of Object.entries(updates)) {
      setNestedValue(newSettings, path, value);
    }
    
    setSettings(newSettings);
    settingsRef.current = newSettings;
    
    await saveSettings(newSettings, immediate);
  }, [settings, saveSettings]);

  // Get a nested setting value
  const getSetting = useCallback((path, defaultValue = null) => {
    if (!settings) return defaultValue;
    return getNestedValue(settings, path) || defaultValue;
  }, [settings]);

  // Panel position management
  const updatePanelPosition = useCallback(async (panelId, position, immediate = false) => {
    await updateSetting(`uiSettings.panelPositions.${panelId}`, position, immediate);
  }, [updateSetting]);

  const getPanelPosition = useCallback((panelId) => {
    return getSetting(`uiSettings.panelPositions.${panelId}`);
  }, [getSetting]);

  // Theme management
  const updateTheme = useCallback(async (themeName, immediate = true) => {
    await updateMultipleSettings({
      theme: themeName,
      'uiSettings.theme.current': themeName
    }, immediate);
  }, [updateMultipleSettings]);

  const getTheme = useCallback(() => {
    return getSetting('theme', 'professional');
  }, [getSetting]);

  // Language management
  const updateLanguage = useCallback(async (languageCode, immediate = true) => {
    await updateMultipleSettings({
      language: languageCode,
      'uiSettings.language.current': languageCode
    }, immediate);
  }, [updateMultipleSettings]);

  const getLanguage = useCallback(() => {
    return getSetting('language', 'en');
  }, [getSetting]);

  // Account mappings management
  const updateAccountMappings = useCallback(async (mappings, immediate = true) => {
    await updateMultipleSettings({
      accountMappings: mappings,
      'uiSettings.accountMappings': mappings
    }, immediate);
  }, [updateMultipleSettings]);

  const getAccountMappings = useCallback(() => {
    return getSetting('accountMappings', {});
  }, [getSetting]);

  // Sum formulas management
  const updateSumFormulas = useCallback(async (type, accountName, formula, immediate = true) => {
    const currentFormulas = getSetting('sumFormulas', { conta: {}, anaf: {} });
    const newFormulas = {
      ...currentFormulas,
      [type]: {
        ...currentFormulas[type],
        [accountName]: formula
      }
    };
    
    await updateMultipleSettings({
      sumFormulas: newFormulas,
      'uiSettings.sumFormulas': newFormulas
    }, immediate);
  }, [getSetting, updateMultipleSettings]);

  const getSumFormulas = useCallback((type) => {
    return getSetting(`sumFormulas.${type}`, {});
  }, [getSetting]);

  // ANAF header panel management
  const updateAnafHeaderPanel = useCallback(async (values, immediate = true) => {
    await updateMultipleSettings({
      'anafHeaderPanel.commonLines': values.commonLines,
      'anafHeaderPanel.columnNamesRow': values.columnNamesRow,
      'anafHeaderPanel.selectedDateColumns': values.selectedDateColumns,
      'anafHeaderPanel.dateColumnsWithTime': values.dateColumnsWithTime,
      'uiSettings.anafHeaderPanel.commonLines': values.commonLines,
      'uiSettings.anafHeaderPanel.columnNamesRow': values.columnNamesRow,
      'uiSettings.anafHeaderPanel.selectedDateColumns': values.selectedDateColumns,
      'uiSettings.anafHeaderPanel.dateColumnsWithTime': values.dateColumnsWithTime
    }, immediate);
  }, [updateMultipleSettings]);

  const getAnafHeaderPanel = useCallback(() => {
    return getSetting('anafHeaderPanel', {
      commonLines: 1,
      columnNamesRow: 1,
      selectedDateColumns: [],
      dateColumnsWithTime: []
    });
  }, [getSetting]);

  // Date interval management
  const updateDateInterval = useCallback(async (startDate, endDate, immediate = true) => {
    await updateMultipleSettings({
      'accountSelection.dateInterval.startDate': startDate,
      'accountSelection.dateInterval.endDate': endDate,
      'uiSettings.accountSelection.dateInterval.startDate': startDate,
      'uiSettings.accountSelection.dateInterval.endDate': endDate
    }, immediate);
  }, [updateMultipleSettings]);

  const getDateInterval = useCallback(() => {
    return getSetting('accountSelection.dateInterval', {
      startDate: null,
      endDate: null
    });
  }, [getSetting]);

  // Screen management
  const updateScreens = useCallback(async (screenData, immediate = true) => {
    await updateMultipleSettings({
      homeScreen: screenData.homeScreen,
      secondaryScreens: screenData.secondaryScreens,
      tabPosition: screenData.tabPosition,
      'uiSettings.screens.homeScreen': screenData.homeScreen,
      'uiSettings.screens.secondaryScreens': screenData.secondaryScreens,
      'uiSettings.screens.currentScreen': screenData.currentScreen,
      'uiSettings.screens.tabPosition': screenData.tabPosition
    }, immediate);
  }, [updateMultipleSettings]);

  const getScreens = useCallback(() => {
    return {
      homeScreen: getSetting('homeScreen'),
      secondaryScreens: getSetting('secondaryScreens', []),
      currentScreen: getSetting('uiSettings.screens.currentScreen', 'home'),
      tabPosition: getSetting('tabPosition', 'left')
    };
  }, [getSetting]);

  // View settings management
  const updateViewSettings = useCallback(async (viewSettings, immediate = false) => {
    await updateSetting('uiSettings.view', viewSettings, immediate);
  }, [updateSetting]);

  const getViewSettings = useCallback(() => {
    return getSetting('uiSettings.view', {
      panOffset: { x: 0, y: 0 },
      zoom: 1,
      gridVisible: true,
      snapToGrid: true
    });
  }, [getSetting]);

  // Panel visibility management
  const updatePanelVisibility = useCallback(async (panelId, visible, immediate = false) => {
    await updateSetting(`uiSettings.panels.visibility.${panelId}`, visible, immediate);
  }, [updateSetting]);

  const getPanelVisibility = useCallback((panelId) => {
    return getSetting(`uiSettings.panels.visibility.${panelId}`, true);
  }, [getSetting]);

  // File paths management
  const updateLastUsedPath = useCallback(async (type, path, immediate = false) => {
    await updateSetting(`files.lastUsedPaths.${type}`, path, immediate);
  }, [updateSetting]);

  const getLastUsedPath = useCallback((type) => {
    return getSetting(`files.lastUsedPaths.${type}`);
  }, [getSetting]);

  // Recent files management
  const addToRecentFiles = useCallback(async (type, filePath, immediate = false) => {
    const recentFiles = getSetting(`files.recentFiles.${type}`, []);
    const maxRecent = getSetting('files.maxRecentFiles', 10);
    
    // Remove if already exists and add to front
    const filteredFiles = recentFiles.filter(path => path !== filePath);
    const newRecentFiles = [filePath, ...filteredFiles].slice(0, maxRecent);
    
    await updateSetting(`files.recentFiles.${type}`, newRecentFiles, immediate);
  }, [getSetting, updateSetting]);

  const getRecentFiles = useCallback((type) => {
    return getSetting(`files.recentFiles.${type}`, []);
  }, [getSetting]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    settings,
    loading,
    error,
    
    // Core functions
    loadSettings,
    saveSettings,
    updateSetting,
    updateMultipleSettings,
    getSetting,
    
    // Panel management
    updatePanelPosition,
    getPanelPosition,
    updatePanelVisibility,
    getPanelVisibility,
    
    // Theme and language
    updateTheme,
    getTheme,
    updateLanguage,
    getLanguage,
    
    // Account management
    updateAccountMappings,
    getAccountMappings,
    updateSumFormulas,
    getSumFormulas,
    
    // ANAF header panel
    updateAnafHeaderPanel,
    getAnafHeaderPanel,
    
    // Date intervals
    updateDateInterval,
    getDateInterval,
    
    // Screen management
    updateScreens,
    getScreens,
    
    // View settings
    updateViewSettings,
    getViewSettings,
    
    // File management
    updateLastUsedPath,
    getLastUsedPath,
    addToRecentFiles,
    getRecentFiles
  };
}

// Utility functions
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

export default useAppSettings;