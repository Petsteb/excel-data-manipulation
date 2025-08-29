import { useState, useEffect, useRef } from 'react';
import { loadState, debouncedSaveState, DEFAULT_STATE } from '../utils/storage';

/**
 * Custom hook for managing persistent state
 * Automatically loads state on mount and saves changes
 */
export const usePersistentState = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const stateRef = useRef({});
  
  // Individual state pieces that need persistence
  const [contabilitateFiles, setContabilitateFiles] = useState([]);
  const [anafFiles, setAnafFiles] = useState([]);
  const [selectedFileIndices, setSelectedFileIndices] = useState(new Set());
  const [selectedAnafFileIndices, setSelectedAnafFileIndices] = useState(new Set());
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentTheme, setCurrentTheme] = useState('professional');
  const [commonLines, setCommonLines] = useState(1);
  const [columnNamesRow, setColumnNamesRow] = useState(1);
  const [contabilitateCommonLines, setContabilitateCommonLines] = useState(1);
  const [contabilitateColumnNamesRow, setContabilitateColumnNamesRow] = useState(1);
  const [anafCommonLines, setAnafCommonLines] = useState(1);
  const [anafColumnNamesRow, setAnafColumnNamesRow] = useState(1);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [availableAccounts, setAvailableAccounts] = useState(['4423', '4424', '4315', '4316', '444', '436', '4411', '4418', '446.DIV', '446.CHIRII', '446.CV']);
  const [customAccounts, setCustomAccounts] = useState([]);
  const [removedDefaultAccounts, setRemovedDefaultAccounts] = useState([]);
  const [selectedAnafAccounts, setSelectedAnafAccounts] = useState([]);
  const [availableAnafAccounts, setAvailableAnafAccounts] = useState(['1/4423', '1/4424', '2', '3', '7', '9', '14', '33', '412', '432', '451', '458', '459', '461', '480', '483', '628']);
  const [customAnafAccounts, setCustomAnafAccounts] = useState([]);
  const [startDate, setStartDate] = useState('01/01/2001');
  const [endDate, setEndDate] = useState('05/06/2025');
  const [contabilitateSelectedDateColumns, setContabilitateSelectedDateColumns] = useState([]);
  const [contabilitateAutoDetectedDateColumns, setContabilitateAutoDetectedDateColumns] = useState([]);
  const [contabilitateDateColumnsWithTime, setContabilitateDateColumnsWithTime] = useState([]);
  const [anafSelectedDateColumns, setAnafSelectedDateColumns] = useState([]);
  const [anafAutoDetectedDateColumns, setAnafAutoDetectedDateColumns] = useState([]);
  const [anafDateColumnsWithTime, setAnafDateColumnsWithTime] = useState([]);
  const [accountConfigs, setAccountConfigs] = useState({});
  const [anafAccountConfigs, setAnafAccountConfigs] = useState({});
  const [accountMappings, setAccountMappings] = useState({
    '436': [],
    '444': [],
    '4315': []
  });
  const [selectedWorksheets, setSelectedWorksheets] = useState({
    relationsSummary: true,
    accountsSummary: true,
    anafMergedData: true
  });
  const [panelPositions, setPanelPositions] = useState({
    'contabilitate-panel': { x: 50, y: 50 },
    'anaf-panel': { x: 400, y: 50 },
    'contabilitate-files-panel': { x: 50, y: 200 },
    'anaf-files-panel': { x: 400, y: 200 },
    'account-mapping-panel': { x: 50, y: 350 },
    'summary-panel': { x: 400, y: 350 },
    'final-summary-panel': { x: 750, y: 350 }
  });
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [isScreenMode, setIsScreenMode] = useState(false);
  const [tabPosition, setTabPosition] = useState('left');
  const [homeScreen, setHomeScreen] = useState(null);
  const [secondaryScreens, setSecondaryScreens] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isGridVisible, setIsGridVisible] = useState(true);

  // Load state on mount
  useEffect(() => {
    const initializeState = async () => {
      try {
        setIsLoading(true);
        const savedState = await loadState();
        
        if (savedState) {
          // Update all state variables from loaded data
          if (savedState.contabilitateFiles) setContabilitateFiles(savedState.contabilitateFiles);
          if (savedState.anafFiles) setAnafFiles(savedState.anafFiles);
          if (savedState.selectedFileIndices) setSelectedFileIndices(new Set(savedState.selectedFileIndices));
          if (savedState.selectedAnafFileIndices) setSelectedAnafFileIndices(new Set(savedState.selectedAnafFileIndices));
          if (savedState.currentLanguage) setCurrentLanguage(savedState.currentLanguage);
          if (savedState.currentTheme) setCurrentTheme(savedState.currentTheme);
          if (savedState.commonLines !== undefined) setCommonLines(savedState.commonLines);
          if (savedState.columnNamesRow !== undefined) setColumnNamesRow(savedState.columnNamesRow);
          if (savedState.contabilitateCommonLines !== undefined) setContabilitateCommonLines(savedState.contabilitateCommonLines);
          if (savedState.contabilitateColumnNamesRow !== undefined) setContabilitateColumnNamesRow(savedState.contabilitateColumnNamesRow);
          if (savedState.anafCommonLines !== undefined) setAnafCommonLines(savedState.anafCommonLines);
          if (savedState.anafColumnNamesRow !== undefined) setAnafColumnNamesRow(savedState.anafColumnNamesRow);
          if (savedState.selectedAccounts) setSelectedAccounts(savedState.selectedAccounts);
          if (savedState.availableAccounts) setAvailableAccounts(savedState.availableAccounts);
          if (savedState.customAccounts) setCustomAccounts(savedState.customAccounts);
          if (savedState.removedDefaultAccounts) setRemovedDefaultAccounts(savedState.removedDefaultAccounts);
          if (savedState.selectedAnafAccounts) setSelectedAnafAccounts(savedState.selectedAnafAccounts);
          if (savedState.availableAnafAccounts) setAvailableAnafAccounts(savedState.availableAnafAccounts);
          if (savedState.customAnafAccounts) setCustomAnafAccounts(savedState.customAnafAccounts);
          if (savedState.startDate) setStartDate(savedState.startDate);
          if (savedState.endDate) setEndDate(savedState.endDate);
          if (savedState.contabilitateSelectedDateColumns) setContabilitateSelectedDateColumns(savedState.contabilitateSelectedDateColumns);
          if (savedState.contabilitateAutoDetectedDateColumns) setContabilitateAutoDetectedDateColumns(savedState.contabilitateAutoDetectedDateColumns);
          if (savedState.contabilitateDateColumnsWithTime) setContabilitateDateColumnsWithTime(savedState.contabilitateDateColumnsWithTime);
          if (savedState.anafSelectedDateColumns) setAnafSelectedDateColumns(savedState.anafSelectedDateColumns);
          if (savedState.anafAutoDetectedDateColumns) setAnafAutoDetectedDateColumns(savedState.anafAutoDetectedDateColumns);
          if (savedState.anafDateColumnsWithTime) setAnafDateColumnsWithTime(savedState.anafDateColumnsWithTime);
          if (savedState.accountConfigs) setAccountConfigs(savedState.accountConfigs);
          if (savedState.anafAccountConfigs) setAnafAccountConfigs(savedState.anafAccountConfigs);
          if (savedState.accountMappings) setAccountMappings(savedState.accountMappings);
          if (savedState.selectedWorksheets) setSelectedWorksheets(savedState.selectedWorksheets);
          if (savedState.panelPositions) setPanelPositions(savedState.panelPositions);
          if (savedState.isLayoutMode !== undefined) setIsLayoutMode(savedState.isLayoutMode);
          if (savedState.isScreenMode !== undefined) setIsScreenMode(savedState.isScreenMode);
          if (savedState.tabPosition) setTabPosition(savedState.tabPosition);
          if (savedState.homeScreen) setHomeScreen(savedState.homeScreen);
          if (savedState.secondaryScreens) setSecondaryScreens(savedState.secondaryScreens);
          if (savedState.currentScreen) setCurrentScreen(savedState.currentScreen);
          if (savedState.panOffset) setPanOffset(savedState.panOffset);
          if (savedState.isGridVisible !== undefined) setIsGridVisible(savedState.isGridVisible);
          
          console.log('State loaded successfully from storage');
        } else {
          console.log('No saved state found, using defaults');
        }
      } catch (error) {
        console.error('Error loading persistent state:', error);
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
      }
    };

    initializeState();
  }, []);

  // Create current state object for saving
  const getCurrentState = () => ({
    contabilitateFiles,
    anafFiles,
    selectedFileIndices: Array.from(selectedFileIndices),
    selectedAnafFileIndices: Array.from(selectedAnafFileIndices),
    currentLanguage,
    currentTheme,
    commonLines,
    columnNamesRow,
    contabilitateCommonLines,
    contabilitateColumnNamesRow,
    anafCommonLines,
    anafColumnNamesRow,
    selectedAccounts,
    availableAccounts,
    customAccounts,
    removedDefaultAccounts,
    selectedAnafAccounts,
    availableAnafAccounts,
    customAnafAccounts,
    startDate,
    endDate,
    contabilitateSelectedDateColumns,
    contabilitateAutoDetectedDateColumns,
    contabilitateDateColumnsWithTime,
    anafSelectedDateColumns,
    anafAutoDetectedDateColumns,
    anafDateColumnsWithTime,
    accountConfigs,
    anafAccountConfigs,
    accountMappings,
    selectedWorksheets,
    panelPositions,
    isLayoutMode,
    isScreenMode,
    tabPosition,
    homeScreen,
    secondaryScreens,
    currentScreen,
    panOffset,
    isGridVisible
  });

  // Auto-save when state changes (debounced)
  useEffect(() => {
    if (hasLoaded) {
      const currentState = getCurrentState();
      stateRef.current = currentState;
      debouncedSaveState(currentState);
    }
  }, [
    contabilitateFiles, anafFiles, selectedFileIndices, selectedAnafFileIndices,
    currentLanguage, currentTheme, commonLines, columnNamesRow,
    contabilitateCommonLines, contabilitateColumnNamesRow, anafCommonLines, anafColumnNamesRow,
    selectedAccounts, availableAccounts, customAccounts, removedDefaultAccounts,
    selectedAnafAccounts, availableAnafAccounts, customAnafAccounts,
    startDate, endDate, contabilitateSelectedDateColumns, contabilitateAutoDetectedDateColumns,
    contabilitateDateColumnsWithTime, anafSelectedDateColumns, anafAutoDetectedDateColumns,
    anafDateColumnsWithTime, accountConfigs, anafAccountConfigs, accountMappings,
    selectedWorksheets, panelPositions, isLayoutMode, isScreenMode, tabPosition,
    homeScreen, secondaryScreens, currentScreen, panOffset, isGridVisible, hasLoaded
  ]);

  return {
    // Loading state
    isLoading,
    hasLoaded,
    
    // All state variables and setters
    contabilitateFiles, setContabilitateFiles,
    anafFiles, setAnafFiles,
    selectedFileIndices, setSelectedFileIndices,
    selectedAnafFileIndices, setSelectedAnafFileIndices,
    currentLanguage, setCurrentLanguage,
    currentTheme, setCurrentTheme,
    commonLines, setCommonLines,
    columnNamesRow, setColumnNamesRow,
    contabilitateCommonLines, setContabilitateCommonLines,
    contabilitateColumnNamesRow, setContabilitateColumnNamesRow,
    anafCommonLines, setAnafCommonLines,
    anafColumnNamesRow, setAnafColumnNamesRow,
    selectedAccounts, setSelectedAccounts,
    availableAccounts, setAvailableAccounts,
    customAccounts, setCustomAccounts,
    removedDefaultAccounts, setRemovedDefaultAccounts,
    selectedAnafAccounts, setSelectedAnafAccounts,
    availableAnafAccounts, setAvailableAnafAccounts,
    customAnafAccounts, setCustomAnafAccounts,
    startDate, setStartDate,
    endDate, setEndDate,
    contabilitateSelectedDateColumns, setContabilitateSelectedDateColumns,
    contabilitateAutoDetectedDateColumns, setContabilitateAutoDetectedDateColumns,
    contabilitateDateColumnsWithTime, setContabilitateDateColumnsWithTime,
    anafSelectedDateColumns, setAnafSelectedDateColumns,
    anafAutoDetectedDateColumns, setAnafAutoDetectedDateColumns,
    anafDateColumnsWithTime, setAnafDateColumnsWithTime,
    accountConfigs, setAccountConfigs,
    anafAccountConfigs, setAnafAccountConfigs,
    accountMappings, setAccountMappings,
    selectedWorksheets, setSelectedWorksheets,
    panelPositions, setPanelPositions,
    isLayoutMode, setIsLayoutMode,
    isScreenMode, setIsScreenMode,
    tabPosition, setTabPosition,
    homeScreen, setHomeScreen,
    secondaryScreens, setSecondaryScreens,
    currentScreen, setCurrentScreen,
    panOffset, setPanOffset,
    isGridVisible, setIsGridVisible,
    
    // Utility functions
    getCurrentState,
    saveCurrentState: () => {
      const currentState = getCurrentState();
      debouncedSaveState(currentState, 0); // Immediate save
    }
  };
};

export default usePersistentState;