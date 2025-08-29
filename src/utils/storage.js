// Storage utility for persisting app state

const STORAGE_FILE = 'app-state.json';

// Get the path to the user data directory
const getStoragePath = () => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    // In renderer process, use electronAPI
    return window.electronAPI.getStoragePath();
  }
  // In main process or fallback
  try {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, STORAGE_FILE);
  } catch (error) {
    // Fallback to localStorage if electron is not available
    return null;
  }
};

// Default state structure
const DEFAULT_STATE = {
  // File management
  contabilitateFiles: [],
  anafFiles: [],
  selectedFileIndices: [],
  selectedAnafFileIndices: [],
  
  // Configuration settings
  currentLanguage: 'en',
  currentTheme: 'professional',
  commonLines: 1,
  columnNamesRow: 1,
  contabilitateCommonLines: 1,
  contabilitateColumnNamesRow: 1,
  anafCommonLines: 1,
  anafColumnNamesRow: 1,
  
  // Account management
  selectedAccounts: [],
  availableAccounts: ['4423', '4424', '4315', '4316', '444', '436', '4411', '4418', '446.DIV', '446.CHIRII', '446.CV'],
  customAccounts: [],
  removedDefaultAccounts: [],
  selectedAnafAccounts: [],
  availableAnafAccounts: ['1/4423', '1/4424', '2', '3', '7', '9', '14', '33', '412', '432', '451', '458', '459', '461', '480', '483', '628'],
  customAnafAccounts: [],
  
  // Date settings
  startDate: '01/01/2001',
  endDate: '05/06/2025',
  contabilitateSelectedDateColumns: [],
  contabilitateAutoDetectedDateColumns: [],
  contabilitateDateColumnsWithTime: [],
  anafSelectedDateColumns: [],
  anafAutoDetectedDateColumns: [],
  anafDateColumnsWithTime: [],
  
  // Account configurations and mappings
  accountConfigs: {},
  anafAccountConfigs: {},
  accountMappings: {
    '436': [],
    '444': [],
    '4315': []
  },
  
  // Worksheet selections
  selectedWorksheets: {
    relationsSummary: true,
    accountsSummary: true,
    anafMergedData: true
  },
  
  // Layout and UI settings
  panelPositions: {
    'contabilitate-panel': { x: 50, y: 50 },
    'anaf-panel': { x: 400, y: 50 },
    'contabilitate-files-panel': { x: 50, y: 200 },
    'anaf-files-panel': { x: 400, y: 200 },
    'account-mapping-panel': { x: 50, y: 350 },
    'summary-panel': { x: 400, y: 350 },
    'final-summary-panel': { x: 750, y: 350 }
  },
  isLayoutMode: false,
  isScreenMode: false,
  tabPosition: 'left',
  homeScreen: null,
  secondaryScreens: [],
  currentScreen: 'home',
  panOffset: { x: 0, y: 0 },
  isGridVisible: true,
  
  // Processing data (non-persistent by design)
  // These will be cleared on app start
  processingSummary: null,
  accountSums: {},
  anafAccountSums: {},
  contaAccountFiles: {},
  anafAccountFiles: {},
  processedContaFiles: []
};

// Save state to persistent storage
export const saveState = async (state) => {
  try {
    const storagePath = getStoragePath();
    
    if (!storagePath) {
      // Use localStorage as fallback
      const serializedState = JSON.stringify(state);
      localStorage.setItem('excelMergerAppState', serializedState);
      console.log('State saved to localStorage');
      return;
    }

    // Use file system for electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.saveState(state);
      console.log('State saved to file system via electronAPI');
    } else {
      const serializedState = JSON.stringify(state, null, 2);
      fs.writeFileSync(storagePath, serializedState, 'utf8');
      console.log('State saved to file system directly');
    }
  } catch (error) {
    console.error('Error saving state:', error);
    // Fallback to localStorage
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem('excelMergerAppState', serializedState);
      console.log('State saved to localStorage as fallback');
    } catch (fallbackError) {
      console.error('Error saving to localStorage fallback:', fallbackError);
    }
  }
};

// Load state from persistent storage
export const loadState = async () => {
  try {
    const storagePath = getStoragePath();
    
    if (!storagePath) {
      // Use localStorage as fallback
      const serializedState = localStorage.getItem('excelMergerAppState');
      if (serializedState) {
        const state = JSON.parse(serializedState);
        console.log('State loaded from localStorage');
        return { ...DEFAULT_STATE, ...state };
      }
      return DEFAULT_STATE;
    }

    // Use file system for electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      const state = await window.electronAPI.loadState();
      if (state) {
        console.log('State loaded from file system via electronAPI');
        return { ...DEFAULT_STATE, ...state };
      }
    } else {
      if (fs.existsSync(storagePath)) {
        const serializedState = fs.readFileSync(storagePath, 'utf8');
        const state = JSON.parse(serializedState);
        console.log('State loaded from file system directly');
        return { ...DEFAULT_STATE, ...state };
      }
    }
    
    return DEFAULT_STATE;
  } catch (error) {
    console.error('Error loading state:', error);
    
    // Try localStorage fallback
    try {
      const serializedState = localStorage.getItem('excelMergerAppState');
      if (serializedState) {
        const state = JSON.parse(serializedState);
        console.log('State loaded from localStorage fallback');
        return { ...DEFAULT_STATE, ...state };
      }
    } catch (fallbackError) {
      console.error('Error loading from localStorage fallback:', fallbackError);
    }
    
    return DEFAULT_STATE;
  }
};

// Clear all saved state
export const clearState = async () => {
  try {
    const storagePath = getStoragePath();
    
    if (!storagePath) {
      localStorage.removeItem('excelMergerAppState');
      console.log('State cleared from localStorage');
      return;
    }

    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.clearState();
      console.log('State cleared via electronAPI');
    } else {
      if (fs.existsSync(storagePath)) {
        fs.unlinkSync(storagePath);
        console.log('State file deleted');
      }
    }
  } catch (error) {
    console.error('Error clearing state:', error);
  }
};

// Debounced save function to avoid excessive file writes
let saveTimeout;
export const debouncedSaveState = (state, delay = 1000) => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveState(state);
  }, delay);
};

export { DEFAULT_STATE };