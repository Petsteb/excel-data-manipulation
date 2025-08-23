import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import ThemeMenu, { themes } from './ThemeMenu';
import LanguageMenu, { languages } from './LanguageMenu';
import { useTranslation } from './translations';
import dashboardIcon from './dashboard.png';

const GRID_SIZE = 20;
const DEFAULT_PANEL_WIDTH = 240;
const DEFAULT_PANEL_HEIGHT = 180;

// Universal Tooltip Component
const Tooltip = ({ content, position = "top" }) => {
  return (
    <div className="tooltip-wrapper">
      <div 
        className="tooltip-indicator"
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '1px solid var(--theme-border-color, #ccc)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          color: 'var(--theme-text-color, #333)',
          cursor: 'help',
          backgroundColor: 'var(--theme-tooltip-bg, rgba(255,255,255,0.1))'
        }}
      >
        i
      </div>
      <div className="tooltip-content">
        {content}
      </div>
    </div>
  );
};
const DEFAULT_BUTTON_SIZE = 80;

// Collision Detection Matrix Class
class CollisionMatrix {
  constructor(width, height, cellSize = GRID_SIZE) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.matrix = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.width = width;
    this.height = height;
  }

  // Expand matrix to accommodate new boundaries
  expandMatrix(newWidth, newHeight) {
    const newCols = Math.ceil(newWidth / this.cellSize);
    const newRows = Math.ceil(newHeight / this.cellSize);
    
    if (newCols > this.cols || newRows > this.rows) {
      const oldMatrix = this.matrix;
      this.matrix = Array(newRows).fill(null).map(() => Array(newCols).fill(0));
      
      // Copy old matrix data
      for (let row = 0; row < Math.min(this.rows, newRows); row++) {
        for (let col = 0; col < Math.min(this.cols, newCols); col++) {
          this.matrix[row][col] = oldMatrix[row][col];
        }
      }
      
      this.cols = newCols;
      this.rows = newRows;
      this.width = newWidth;
      this.height = newHeight;
    }
  }

  // Convert world coordinates to matrix indices
  worldToMatrix(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return { row: Math.max(0, row), col: Math.max(0, col) };
  }

  // Get cells occupied by a rectangle
  getOccupiedCells(x, y, width, height) {
    const startCell = this.worldToMatrix(x, y);
    const endCell = this.worldToMatrix(x + width - 1, y + height - 1);
    
    const cells = [];
    for (let row = startCell.row; row <= Math.min(endCell.row, this.rows - 1); row++) {
      for (let col = startCell.col; col <= Math.min(endCell.col, this.cols - 1); col++) {
        cells.push({ row, col });
      }
    }
    return cells;
  }

  // Mark cells as occupied (1) or free (0)
  setCells(x, y, width, height, value) {
    const cells = this.getOccupiedCells(x, y, width, height);
    cells.forEach(({ row, col }) => {
      if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
        this.matrix[row][col] = value;
      }
    });
  }

  // Check if all cells in area are free
  areAllCellsFree(x, y, width, height) {
    const cells = this.getOccupiedCells(x, y, width, height);
    return cells.every(({ row, col }) => {
      if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
        return this.matrix[row][col] === 0;
      }
      return false; // Out of bounds = not free
    });
  }

  // Temporarily expand matrix for checking positions outside current bounds
  checkPositionWithExpansion(x, y, width, height) {
    const requiredWidth = Math.max(this.width, x + width);
    const requiredHeight = Math.max(this.height, y + height);
    
    if (requiredWidth > this.width || requiredHeight > this.height) {
      // Create temporary expanded matrix for checking
      const tempMatrix = new CollisionMatrix(requiredWidth, requiredHeight, this.cellSize);
      
      // Copy current matrix data
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          if (row < tempMatrix.rows && col < tempMatrix.cols) {
            tempMatrix.matrix[row][col] = this.matrix[row][col];
          }
        }
      }
      
      return tempMatrix.areAllCellsFree(x, y, width, height);
    }
    
    return this.areAllCellsFree(x, y, width, height);
  }

  // Get furthest boundaries of occupied cells
  getBoundaries() {
    let maxX = 0, maxY = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.matrix[row][col] === 1) {
          maxX = Math.max(maxX, (col + 1) * this.cellSize);
          maxY = Math.max(maxY, (row + 1) * this.cellSize);
        }
      }
    }
    return { maxX, maxY };
  }
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const { t } = useTranslation(currentLanguage);
  const [contabilitateFiles, setContabilitateFiles] = useState([]);
  const [anafFiles, setAnafFiles] = useState([]);
  const [selectedFileIndices, setSelectedFileIndices] = useState(new Set());
  const [selectedAnafFileIndices, setSelectedAnafFileIndices] = useState(new Set());
  // Shared header configuration (for backwards compatibility)
  const [commonLines, setCommonLines] = useState(1);
  const [columnNamesRow, setColumnNamesRow] = useState(1);
  
  // Batch-specific header configuration
  const [contabilitateCommonLines, setContabilitateCommonLines] = useState(1);
  const [contabilitateColumnNamesRow, setContabilitateColumnNamesRow] = useState(1);
  const [anafCommonLines, setAnafCommonLines] = useState(1);
  const [anafColumnNamesRow, setAnafColumnNamesRow] = useState(1);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdFilePath, setCreatedFilePath] = useState('');
  const [status, setStatus] = useState('');
  const [processingSummary, setProcessingSummary] = useState(null);
  const [showMergedFilesPopup, setShowMergedFilesPopup] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('professional');
  const [isLoading, setIsLoading] = useState(true);
  // Contabilitate column state
  const [contabilitateColumnNames, setContabilitateColumnNames] = useState([]);
  const [contabilitateSelectedDateColumns, setContabilitateSelectedDateColumns] = useState([]);
  const [contabilitateAutoDetectedDateColumns, setContabilitateAutoDetectedDateColumns] = useState([]);
  const [contabilitateDateColumnsWithTime, setContabilitateDateColumnsWithTime] = useState([]);
  
  // ANAF column state  
  const [anafColumnNames, setAnafColumnNames] = useState([]);
  
  // Conta processing state
  const [processedContaFiles, setProcessedContaFiles] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [defaultAccounts] = useState(['4423', '4424', '4315', '4316', '444', '436', '4411', '4418', '446.DIV', '446.CHIRII', '446.CV']);
  const [availableAccounts, setAvailableAccounts] = useState(['4423', '4424', '4315', '4316', '444', '436', '4411', '4418', '446.DIV', '446.CHIRII', '446.CV']);
  const [customAccounts, setCustomAccounts] = useState([]);
  const [removedDefaultAccounts, setRemovedDefaultAccounts] = useState([]);
  const [showAccountInput, setShowAccountInput] = useState(false);
  const [newAccountInput, setNewAccountInput] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sumDropdownOpen, setSumDropdownOpen] = useState(false);
  const [anafFilterDropdownOpen, setAnafFilterDropdownOpen] = useState(false);
  const [anafSumDropdownOpen, setAnafSumDropdownOpen] = useState(false);
  const [anafSubtractFilterDropdownOpen, setAnafSubtractFilterDropdownOpen] = useState(false);
  const [anafSubtractSumDropdownOpen, setAnafSubtractSumDropdownOpen] = useState(false);
  const [anafFilterValueDropdownOpen, setAnafFilterValueDropdownOpen] = useState(false);
  const [anafSubtractFilterValueDropdownOpen, setAnafSubtractFilterValueDropdownOpen] = useState(false);
  const [anafSubtractionEnabled, setAnafSubtractionEnabled] = useState({});
  const [accountConfigs, setAccountConfigs] = useState({});
  const [startDate, setStartDate] = useState('01/01/2001');
  const [endDate, setEndDate] = useState('05/06/2025');
  const [accountSums, setAccountSums] = useState({});
  const [anafSelectedDateColumns, setAnafSelectedDateColumns] = useState([]);
  const [anafAutoDetectedDateColumns, setAnafAutoDetectedDateColumns] = useState([]);
  const [anafDateColumnsWithTime, setAnafDateColumnsWithTime] = useState([]);

  // ANAF accounts management
  const [selectedAnafAccounts, setSelectedAnafAccounts] = useState([]);
  const [defaultAnafAccounts] = useState(['1/4423', '1/4424', '2', '3', '7', '9', '14', '33', '412', '432', '451', '458', '459', '461', '480', '483', '628']);
  const [availableAnafAccounts, setAvailableAnafAccounts] = useState(['1/4423', '1/4424', '2', '3', '7', '9', '14', '33', '412', '432', '451', '458', '459', '461', '480', '483', '628']);
  const [customAnafAccounts, setCustomAnafAccounts] = useState([]);
  const [showAnafAccountInput, setShowAnafAccountInput] = useState(false);
  const [newAnafAccountInput, setNewAnafAccountInput] = useState('');
  const [anafAccountSums, setAnafAccountSums] = useState({});
  const [anafContextMenu, setAnafContextMenu] = useState(null);
  const [anafAccountConfigs, setAnafAccountConfigs] = useState({});
  
  // Account mapping state (1 conta account to multiple anaf accounts)
  // Default mappings from conta anaf.txt
  const defaultAccountMappings = {
    '4423': ['1/4423'],
    '4424': ['1/4424'],
    '4315': ['412', '451', '458', '483'],
    '4316': ['432', '459', '461'],
    '444': ['2', '9'],
    '436': ['480'],
    '4411': ['3'],
    '4418': ['14'],
    '446.DIV': ['7'],
    '446.CHIRII': ['628'],
    '446.CV': ['33']
  };
  const [accountMappings, setAccountMappings] = useState(defaultAccountMappings);
  
  // Account mapping context menu and input states
  const [mappingContextMenu, setMappingContextMenu] = useState(null);
  
  // ANAF account selection modal states
  const [showAnafSelectionModal, setShowAnafSelectionModal] = useState(false);
  const [modalContaAccount, setModalContaAccount] = useState('');
  const [modalAvailableAnafAccounts, setModalAvailableAnafAccounts] = useState([]);
  const [modalSelectedAnafAccount, setModalSelectedAnafAccount] = useState('');
  
  // Conta account selection modal states
  const [showContaSelectionModal, setShowContaSelectionModal] = useState(false);
  const [modalAvailableContaAccounts, setModalAvailableContaAccounts] = useState([]);
  const [modalSelectedContaAccount, setModalSelectedContaAccount] = useState('');
  
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [panelPositions, setPanelPositions] = useState({
    'contabilitate-upload-panel': { x: 20, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'anaf-upload-panel': { x: 800, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'contabilitate-summary-panel': { x: 20, y: 240, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'anaf-summary-panel': { x: 800, y: 240, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'anaf-header-panel': { x: 800, y: 460, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'anaf-date-panel': { x: 800, y: 680, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'account-selection-panel': { x: 280, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'account-mapping-panel': { x: 280, y: 240, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'sums-panel': { x: 540, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'generate-summary-button': { x: 450, y: 240, width: DEFAULT_BUTTON_SIZE, height: DEFAULT_BUTTON_SIZE },
    'final-summary-panel': { x: 300, y: 560, width: 300, height: 200 }
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialDragPosition, setInitialDragPosition] = useState({ x: 0, y: 0 });
  const [initialPanelPosition, setInitialPanelPosition] = useState({ x: 0, y: 0 });
  const [dragVisualPosition, setDragVisualPosition] = useState(null); // For visual feedback during drag
  const boardRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [normalModeViewPosition, setNormalModeViewPosition] = useState({ x: 0, y: 0 }); // Store last normal mode view position
  const panAnimationFrame = useRef(null);
  const [availablePanels] = useState([
    { id: 'contabilitate-upload-panel', name: 'Contabilitate Upload Panel', type: 'panel', active: true },
    { id: 'anaf-upload-panel', name: 'ANAF Upload Panel', type: 'panel', active: true },
    { id: 'contabilitate-summary-panel', name: 'Contabilitate Summary Panel', type: 'panel', active: true },
    { id: 'anaf-summary-panel', name: 'ANAF Summary Panel', type: 'panel', active: true },
    { id: 'anaf-header-panel', name: 'ANAF Header Panel', type: 'panel', active: true },
    { id: 'anaf-date-panel', name: 'ANAF Date Panel', type: 'panel', active: true },
    { id: 'account-selection-panel', name: 'Account Selection Panel', type: 'panel', active: true },
    { id: 'account-mapping-panel', name: 'Account Mapping Panel', type: 'panel', active: true },
    { id: 'sums-panel', name: 'Account Sums Panel', type: 'panel', active: true },
    { id: 'final-summary-panel', name: 'Final Summary Panel', type: 'panel', active: true }
  ]);
  const [showContaFilesPopup, setShowContaFilesPopup] = useState(false);
  const [showAnafFilesPopup, setShowAnafFilesPopup] = useState(false);
  const [showDateColumnsPopup, setShowDateColumnsPopup] = useState(false);
  const [dateColumnsPopupBatch, setDateColumnsPopupBatch] = useState(null); // 'contabilitate' or 'anaf'
  const [columnSampleData, setColumnSampleData] = useState([]);
  const [availableButtons] = useState([
    { id: 'generate-summary-button', name: 'Generate Summary Button', type: 'button', active: true }
  ]);
  const [collisionMatrix, setCollisionMatrix] = useState(null);
  const [workspaceBounds, setWorkspaceBounds] = useState({
    minX: 0,
    maxX: 1200, // Initial viewport width
    minY: 0,
    maxY: 800   // Initial viewport height
  });
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  // Refs for separate popups
  const contaPopupBodyRef = useRef(null);
  const anafPopupBodyRef = useRef(null);

  // Load settings on app start
  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        const settings = await window.electronAPI.loadSettings();
        
        const commonLinesValue = Number.isInteger(settings.commonLines) ? settings.commonLines : (parseInt(settings.commonLines) || 1);
        let columnNamesRowValue = Number.isInteger(settings.columnNamesRow) ? settings.columnNamesRow : (parseInt(settings.columnNamesRow) || 1);
        
        if (!settings.columnNamesRowExplicitlySet) {
          columnNamesRowValue = commonLinesValue;
        }
        
        setCurrentTheme(settings.theme || 'professional');
        setCurrentLanguage(settings.language || 'en');
        setCommonLines(commonLinesValue);
        setColumnNamesRow(columnNamesRowValue);
        // Load batch-specific date columns from settings
        setAnafSelectedDateColumns(settings.anafSelectedDateColumns || []);
        setContabilitateSelectedDateColumns(settings.contabilitateSelectedDateColumns || []);
        
        // Load saved layout positions only for current panels
        if (settings.panelPositions) {
          const defaultPanelPositions = {
            'contabilitate-upload-panel': { x: 20, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'anaf-upload-panel': { x: 800, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'contabilitate-summary-panel': { x: 20, y: 240, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'anaf-summary-panel': { x: 800, y: 240, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'anaf-header-panel': { x: 800, y: 460, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'anaf-date-panel': { x: 800, y: 680, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'account-selection-panel': { x: 280, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'account-mapping-panel': { x: 280, y: 240, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'sums-panel': { x: 540, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'generate-summary-button': { x: 450, y: 240, width: DEFAULT_BUTTON_SIZE, height: DEFAULT_BUTTON_SIZE },
            'final-summary-panel': { x: 300, y: 560, width: 300, height: 200 }
          };
          
          const currentPanelIds = Object.keys(defaultPanelPositions);
          const filteredPositions = {};
          
          // Only load positions for panels that exist in current layout
          currentPanelIds.forEach(panelId => {
            if (settings.panelPositions[panelId]) {
              filteredPositions[panelId] = settings.panelPositions[panelId];
            }
          });
          
          setPanelPositions(prev => ({ ...prev, ...filteredPositions }));
        }
        
        // Don't load old workspace bounds - let them be recalculated from current panels
        // This prevents issues with phantom panels from old layouts
        
        // Load saved normal mode view position or use defaults
        if (settings.normalModeViewPosition) {
          setNormalModeViewPosition(settings.normalModeViewPosition);
        }
        
        // Load saved conta date range and convert to DD/MM/YYYY display format
        if (settings.contaStartDate) {
          setStartDate(formatToDisplay(settings.contaStartDate));
        }
        if (settings.contaEndDate) {
          setEndDate(formatToDisplay(settings.contaEndDate));
        }
        
        // Load saved custom accounts and removed default accounts
        if (settings.customAccounts && Array.isArray(settings.customAccounts)) {
          setCustomAccounts(settings.customAccounts);
        }
        
        if (settings.removedDefaultAccounts && Array.isArray(settings.removedDefaultAccounts)) {
          setRemovedDefaultAccounts(settings.removedDefaultAccounts);
        }
        
        // Build available accounts: defaults minus removed ones, plus custom ones
        const baseDefaults = ['4423', '4424', '4315', '4316', '444', '436', '4411', '4418', '446.DIV', '446.CHIRII', '446.CV'];
        const removedDefaults = settings.removedDefaultAccounts || [];
        const customAccs = settings.customAccounts || [];
        const activeDefaults = baseDefaults.filter(acc => !removedDefaults.includes(acc));
        setAvailableAccounts([...activeDefaults, ...customAccs]);
        
        // Load account configurations
        if (settings.accountConfigs) {
          setAccountConfigs(settings.accountConfigs);
        }
        
        // Load ANAF account configurations
        if (settings.anafAccountConfigs) {
          setAnafAccountConfigs(settings.anafAccountConfigs);
        }
        
        // Load ANAF subtraction enabled states
        if (settings.anafSubtractionEnabled) {
          setAnafSubtractionEnabled(settings.anafSubtractionEnabled);
        }
        
        // Load account mappings (conta to anaf) - merge with defaults
        if (settings.accountMappings) {
          // Merge saved mappings with defaults, prioritizing saved ones
          const mergedMappings = { ...defaultAccountMappings, ...settings.accountMappings };
          setAccountMappings(mergedMappings);
        }
        
        // Force recalculation of workspace bounds and collision matrix based on current panels
        setTimeout(() => {
          updateWorkspaceBounds();
          initializeCollisionMatrix();
          applyTheme(settings.theme || 'professional');
        }, 100);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setCommonLines(1);
        setColumnNamesRow(1);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppSettings();
  }, []);

  // Handle document clicks to close context menu
  useEffect(() => {
    if (contextMenu || anafContextMenu || mappingContextMenu) {
      document.addEventListener('click', handleDocumentClick);
      return () => {
        document.removeEventListener('click', handleDocumentClick);
      };
    }
  }, [contextMenu, anafContextMenu, mappingContextMenu]);

  // Apply theme when component mounts and currentTheme changes
  useEffect(() => {
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentTheme]);

  // Auto-extract columns when columnNamesRow changes
  useEffect(() => {
    const numValue = parseInt(anafColumnNamesRow);
    if (!isNaN(numValue) && numValue > 0 && anafFiles.length > 0) {
      console.log('useEffect: anafColumnNamesRow changed to:', numValue, 'triggering extraction');
      const delayedExtraction = setTimeout(() => {
        extractAnafColumnNames();
      }, 300);
      
      return () => clearTimeout(delayedExtraction);
    }
  }, [anafColumnNamesRow, anafFiles]);

  // Auto-extract columns for Contabilitate when columnNamesRow changes
  useEffect(() => {
    const numValue = parseInt(contabilitateColumnNamesRow);
    if (!isNaN(numValue) && numValue > 0 && contabilitateFiles.length > 0) {
      console.log('useEffect: contabilitateColumnNamesRow changed for Contabilitate to:', numValue, 'triggering extraction');
      const delayedExtraction = setTimeout(() => {
        extractContabilitateColumnNames();
      }, 300);
      
      return () => clearTimeout(delayedExtraction);
    }
  }, [contabilitateColumnNamesRow, contabilitateFiles]);

  // Restore view position when app finishes loading
  useEffect(() => {
    if (!isLoading) {
      // Restore the view position after a short delay to ensure all state is loaded
      const restoreTimeout = setTimeout(() => {
        if (isLayoutMode) {
          centerViewOnWorkspace();
        } else {
          // Restore saved normal mode view position
          setPanOffset(normalModeViewPosition);
        }
      }, 200);
      
      return () => clearTimeout(restoreTimeout);
    }
  }, [isLoading, normalModeViewPosition]);

  // Save normal mode view position when panning in normal mode
  useEffect(() => {
    if (!isLoading && !isLayoutMode && !isPanning) {
      // Debounce saving to avoid too many writes during smooth panning
      const saveTimeout = setTimeout(() => {
        if (panOffset.x !== normalModeViewPosition.x || panOffset.y !== normalModeViewPosition.y) {
          saveNormalModeViewPosition();
        }
      }, 1000); // Save 1 second after panning stops
      
      return () => clearTimeout(saveTimeout);
    }
  }, [panOffset, isLayoutMode, isPanning, isLoading, normalModeViewPosition]);

  // Apply theme to CSS variables
  const applyTheme = (themeKey) => {
    const theme = themes[themeKey];
    if (theme) {
      document.documentElement.style.setProperty('--theme-primary', theme.primary);
      document.documentElement.style.setProperty('--theme-primary-hover', theme.primaryHover);
      document.documentElement.style.setProperty('--theme-primary-light', theme.primaryLight);
      document.documentElement.style.setProperty('--theme-accent', theme.primary);
      document.documentElement.style.setProperty('--theme-background', theme.background);
      document.documentElement.style.setProperty('--theme-card-bg', theme.cardBg);
      document.documentElement.style.setProperty('--theme-shadow', theme.shadow || '0 20px 40px rgba(139, 92, 246, 0.1)');
      document.documentElement.style.setProperty('--theme-shadow-hover', theme.shadowHover || '0 25px 50px rgba(139, 92, 246, 0.15)');
      document.documentElement.style.setProperty('--theme-border-color', theme.borderColor || 'rgba(255, 255, 255, 0.2)');
      
      // Add theme-aware tooltip variables
      if (theme.isDark) {
        document.documentElement.style.setProperty('--theme-text-color', '#ffffff');
        document.documentElement.style.setProperty('--theme-tooltip-bg', 'rgba(255, 255, 255, 0.1)');
      } else {
        document.documentElement.style.setProperty('--theme-text-color', '#333333');
        document.documentElement.style.setProperty('--theme-tooltip-bg', 'rgba(0, 0, 0, 0.05)');
      }
      
      const appElement = document.querySelector('.App');
      if (appElement) {
        if (theme.isDark) {
          appElement.classList.add('dark-theme');
        } else {
          appElement.classList.remove('dark-theme');
        }
      }
    }
  };

  // Handle theme change
  const handleThemeChange = async (themeKey) => {
    setCurrentTheme(themeKey);
    applyTheme(themeKey);
    
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        theme: themeKey
      });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  // Handle language change
  const handleLanguageChange = async (languageKey) => {
    setCurrentLanguage(languageKey);
    
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        language: languageKey
      });
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  // Save commonLines when it changes
  const handleCommonLinesChange = async (value) => {
    const numValue = parseInt(value);
    
    if (!isNaN(numValue) && numValue > 0) {
      setCommonLines(numValue);
      setColumnNamesRow(numValue);
      
      try {
        const settings = await window.electronAPI.loadSettings();
        const updatedSettings = {
          ...settings,
          commonLines: numValue,
          columnNamesRow: numValue,
          columnNamesRowExplicitlySet: false
        };
        
        await window.electronAPI.saveSettings(updatedSettings);
        
        if (anafFiles.length > 0) {
          await extractAnafColumnNames();
        }
      } catch (error) {
        console.error('Failed to save common lines:', error);
      }
    } else {
      setCommonLines(value);
    }
  };

  // Save columnNamesRow when it changes
  const handleColumnNamesRowChange = async (value) => {
    console.log('=== handleColumnNamesRowChange called with value:', value, 'type:', typeof value);
    
    setColumnNamesRow(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      try {
        const settings = await window.electronAPI.loadSettings();
        const currentCommonLines = parseInt(commonLines);
        
        await window.electronAPI.saveSettings({
          ...settings,
          columnNamesRow: numValue,
          columnNamesRowExplicitlySet: numValue !== currentCommonLines
        });
        console.log('Settings saved for value:', numValue, 'explicitly set:', numValue !== currentCommonLines);
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }
  };

  // Batch-specific handlers for Contabilitate
  const handleContabilitateCommonLinesChange = async (value) => {
    const numValue = parseInt(value);
    
    if (!isNaN(numValue) && numValue > 0) {
      setContabilitateCommonLines(numValue);
      setContabilitateColumnNamesRow(numValue);
      
      try {
        const settings = await window.electronAPI.loadSettings();
        const updatedSettings = {
          ...settings,
          contabilitateCommonLines: numValue,
          contabilitateColumnNamesRow: numValue,
          contabilitateColumnNamesRowExplicitlySet: false
        };
        
        await window.electronAPI.saveSettings(updatedSettings);
        
        if (contabilitateFiles.length > 0) {
          await extractContabilitateColumnNames();
        }
      } catch (error) {
        console.error('Failed to save Contabilitate common lines:', error);
      }
    } else {
      setContabilitateCommonLines(value);
    }
  };

  const handleContabilitateColumnNamesRowChange = async (value) => {
    console.log('=== handleContabilitateColumnNamesRowChange called with value:', value, 'type:', typeof value);
    
    setContabilitateColumnNamesRow(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      try {
        const settings = await window.electronAPI.loadSettings();
        const currentCommonLines = parseInt(contabilitateCommonLines);
        
        await window.electronAPI.saveSettings({
          ...settings,
          contabilitateColumnNamesRow: numValue,
          contabilitateColumnNamesRowExplicitlySet: numValue !== currentCommonLines
        });
        console.log('Contabilitate settings saved for value:', numValue, 'explicitly set:', numValue !== currentCommonLines);
      } catch (error) {
        console.error('Failed to save Contabilitate settings:', error);
      }
    }
  };

  // Batch-specific handlers for ANAF
  const handleAnafCommonLinesChange = async (value) => {
    const numValue = parseInt(value);
    
    if (!isNaN(numValue) && numValue > 0) {
      setAnafCommonLines(numValue);
      setAnafColumnNamesRow(numValue);
      
      try {
        const settings = await window.electronAPI.loadSettings();
        const updatedSettings = {
          ...settings,
          anafCommonLines: numValue,
          anafColumnNamesRow: numValue,
          anafColumnNamesRowExplicitlySet: false
        };
        
        await window.electronAPI.saveSettings(updatedSettings);
        
        if (anafFiles.length > 0) {
          await extractAnafColumnNames();
        }
      } catch (error) {
        console.error('Failed to save ANAF common lines:', error);
      }
    } else {
      setAnafCommonLines(value);
    }
  };

  const handleAnafColumnNamesRowChange = async (value) => {
    console.log('=== handleAnafColumnNamesRowChange called with value:', value, 'type:', typeof value);
    
    setAnafColumnNamesRow(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      try {
        const settings = await window.electronAPI.loadSettings();
        const currentCommonLines = parseInt(anafCommonLines);
        
        await window.electronAPI.saveSettings({
          ...settings,
          anafColumnNamesRow: numValue,
          anafColumnNamesRowExplicitlySet: numValue !== currentCommonLines
        });
        console.log('ANAF settings saved for value:', numValue, 'explicitly set:', numValue !== currentCommonLines);
      } catch (error) {
        console.error('Failed to save ANAF settings:', error);
      }
    }
  };

  // Extract column names for ANAF batch
  const extractAnafColumnNames = async () => {
    if (anafFiles.length === 0) return;
    
    try {
      console.log('Extracting ANAF column names for row:', anafColumnNamesRow, '(type:', typeof anafColumnNamesRow, ') with commonLines:', anafCommonLines, '(type:', typeof anafCommonLines, ')');
      const rowIndex = (parseInt(anafColumnNamesRow) || 1) - 1;
      const commonLinesInt = parseInt(anafCommonLines) || 1;
      
      console.log('Calculated rowIndex (0-based):', rowIndex, 'commonLinesInt:', commonLinesInt);
      
      if (rowIndex < 0) {
        setStatus('Error: Row number must be 1 or greater');
        return;
      }
      
      const result = await window.electronAPI.getColumnNames({
        filesData: anafFiles,
        rowIndex: rowIndex,
        commonLines: commonLinesInt
      });
      
      console.log('Column extraction result:', result);
      
      if (result.success) {
        setAnafColumnNames(result.columnNames);
        setAnafAutoDetectedDateColumns(result.autoDetectedDateColumns || []);
        setAnafDateColumnsWithTime(result.dateColumnsWithTime || []);
        
        if (result.autoDetectedDateColumns && result.autoDetectedDateColumns.length > 0) {
          const newSelectedColumns = [...result.autoDetectedDateColumns];
          console.log('Auto-selecting ANAF date columns:', newSelectedColumns);
          setAnafSelectedDateColumns(newSelectedColumns);
          
          try {
            const settings = await window.electronAPI.loadSettings();
            await window.electronAPI.saveSettings({
              ...settings,
              anafSelectedDateColumns: newSelectedColumns
            });
          } catch (saveError) {
            console.error('Failed to save auto-selected date columns:', saveError);
          }
          
          setStatus(`${result.columnNames.length} columns found. Auto-selected ${newSelectedColumns.length} date column(s).`);
        } else {
          setStatus(`${result.columnNames.length} columns found from row ${anafColumnNamesRow}`);
        }
      } else {
        console.warn('ANAF column extraction failed:', result.error);
        setAnafColumnNames([]);
        setAnafAutoDetectedDateColumns([]);
        setAnafDateColumnsWithTime([]);
        setAnafSelectedDateColumns([]);
        setStatus(`Error extracting ANAF column names: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to extract ANAF column names:', error);
      setAnafColumnNames([]);
      setAnafAutoDetectedDateColumns([]);
      setAnafDateColumnsWithTime([]);
      setAnafSelectedDateColumns([]);
      setStatus(`Failed to extract ANAF column names: ${error.message}`);
    }
  };

  // Extract column names for Contabilitate batch
  const extractContabilitateColumnNames = async () => {
    if (contabilitateFiles.length === 0) return;
    
    try {
      console.log('Extracting Contabilitate column names for row:', contabilitateColumnNamesRow, '(type:', typeof contabilitateColumnNamesRow, ') with commonLines:', contabilitateCommonLines, '(type:', typeof contabilitateCommonLines, ')');
      const rowIndex = (parseInt(contabilitateColumnNamesRow) || 1) - 1;
      const commonLinesInt = parseInt(contabilitateCommonLines) || 1;
      
      console.log('Calculated rowIndex (0-based):', rowIndex, 'commonLinesInt:', commonLinesInt);
      
      if (rowIndex < 0) {
        setStatus('Error: Row number must be 1 or greater');
        return;
      }
      
      const result = await window.electronAPI.getColumnNames({
        filesData: contabilitateFiles,
        rowIndex: rowIndex,
        commonLines: commonLinesInt
      });
      
      console.log('Contabilitate column extraction result:', result);
      
      if (result.success) {
        setContabilitateColumnNames(result.columnNames);
        setContabilitateAutoDetectedDateColumns(result.autoDetectedDateColumns || []);
        setContabilitateDateColumnsWithTime(result.dateColumnsWithTime || []);
        
        if (result.autoDetectedDateColumns && result.autoDetectedDateColumns.length > 0) {
          const newSelectedColumns = [...result.autoDetectedDateColumns];
          console.log('Auto-selecting Contabilitate date columns:', newSelectedColumns);
          setContabilitateSelectedDateColumns(newSelectedColumns);
          
          try {
            const settings = await window.electronAPI.loadSettings();
            await window.electronAPI.saveSettings({
              ...settings,
              contabilitateSelectedDateColumns: newSelectedColumns
            });
          } catch (saveError) {
            console.error('Failed to save Contabilitate auto-selected date columns:', saveError);
          }
          
          setStatus(`${result.columnNames.length} Contabilitate columns found. Auto-selected ${newSelectedColumns.length} date column(s).`);
        } else {
          setStatus(`${result.columnNames.length} Contabilitate columns found from row ${contabilitateColumnNamesRow}`);
        }
      } else {
        console.warn('Contabilitate column extraction failed:', result.error);
        setContabilitateColumnNames([]);
        setContabilitateAutoDetectedDateColumns([]);
        setContabilitateDateColumnsWithTime([]);
        setContabilitateSelectedDateColumns([]);
        setStatus(`Error extracting Contabilitate column names: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to extract Contabilitate column names:', error);
      setContabilitateColumnNames([]);
      setContabilitateAutoDetectedDateColumns([]);
      setContabilitateDateColumnsWithTime([]);
      setContabilitateSelectedDateColumns([]);
      setStatus(`Failed to extract Contabilitate column names: ${error.message}`);
    }
  };

  // Handle date column selection (multi-select) - batch-aware
  const handleDateColumnChange = async (columnIndex) => {
    if (dateColumnsPopupBatch === 'anaf') {
      const newSelectedColumns = anafSelectedDateColumns.includes(columnIndex)
        ? anafSelectedDateColumns.filter(col => col !== columnIndex)
        : [...anafSelectedDateColumns, columnIndex];
      
      setAnafSelectedDateColumns(newSelectedColumns);
      
      try {
        const settings = await window.electronAPI.loadSettings();
        await window.electronAPI.saveSettings({
          ...settings,
          anafSelectedDateColumns: newSelectedColumns
        });
      } catch (error) {
        console.error('Failed to save ANAF date columns:', error);
      }
    } else if (dateColumnsPopupBatch === 'contabilitate') {
      const newSelectedColumns = contabilitateSelectedDateColumns.includes(columnIndex)
        ? contabilitateSelectedDateColumns.filter(col => col !== columnIndex)
        : [...contabilitateSelectedDateColumns, columnIndex];
      
      setContabilitateSelectedDateColumns(newSelectedColumns);
      
      try {
        const settings = await window.electronAPI.loadSettings();
        await window.electronAPI.saveSettings({
          ...settings,
          contabilitateSelectedDateColumns: newSelectedColumns
        });
      } catch (error) {
        console.error('Failed to save Contabilitate date columns:', error);
      }
    }
  };

  // Gather sample data for Contabilitate columns when opening the popup
  const handleContabilitateViewColumnsClick = async () => {
    setDateColumnsPopupBatch('contabilitate');
    if (contabilitateFiles.length === 0 || contabilitateColumnNames.length === 0) {
      setShowDateColumnsPopup(true);
      return;
    }

    try {
      // Find sample data for each column by looking for non-null values in data rows
      const sampleData = [];
      const firstFile = contabilitateFiles[0];
      const dataStartIndex = contabilitateCommonLines; // Start looking after header rows

      for (let colIndex = 0; colIndex < contabilitateColumnNames.length; colIndex++) {
        let sample = null;
        
        // Look for first non-null, non-empty value in this column
        for (let rowIndex = dataStartIndex; rowIndex < Math.min(firstFile.data.length, dataStartIndex + 20); rowIndex++) {
          const row = firstFile.data[rowIndex];
          if (row && row[colIndex] !== null && row[colIndex] !== undefined && 
              String(row[colIndex]).trim() !== '') {
            sample = row[colIndex];
            break;
          }
        }
        
        sampleData[colIndex] = sample;
      }

      setColumnSampleData(sampleData);
      setShowDateColumnsPopup(true);
    } catch (error) {
      console.error('Error gathering Contabilitate sample data:', error);
      setShowDateColumnsPopup(true);
    }
  };

  // Gather sample data for ANAF columns when opening the popup
  const handleAnafViewColumnsClick = async () => {
    setDateColumnsPopupBatch('anaf');
    if (anafFiles.length === 0 || anafColumnNames.length === 0) {
      setShowDateColumnsPopup(true);
      return;
    }

    try {
      // Find sample data for each column by looking for non-null values in data rows
      const sampleData = [];
      const firstFile = anafFiles[0];
      const dataStartIndex = anafCommonLines; // Start looking after header rows

      for (let colIndex = 0; colIndex < anafColumnNames.length; colIndex++) {
        let sample = null;
        
        // Look for first non-null, non-empty value in this column
        for (let rowIndex = dataStartIndex; rowIndex < Math.min(firstFile.data.length, dataStartIndex + 20); rowIndex++) {
          const row = firstFile.data[rowIndex];
          if (row && row[colIndex] !== null && row[colIndex] !== undefined && 
              String(row[colIndex]).trim() !== '') {
            sample = row[colIndex];
            break;
          }
        }
        
        sampleData[colIndex] = sample;
      }

      setColumnSampleData(sampleData);
      setShowDateColumnsPopup(true);
    } catch (error) {
      console.error('Error gathering ANAF sample data:', error);
      setShowDateColumnsPopup(true);
    }
  };

  const detectFileType = (fileData) => {
    if (!fileData.data || fileData.data.length === 0) return 'unknown';
    
    const firstRow = fileData.data[0];
    
    // Check if first row is empty (all cells are null, undefined, or empty string)
    const isFirstRowEmpty = !firstRow || firstRow.every(cell => 
      cell === null || cell === undefined || cell === ''
    );
    
    if (isFirstRowEmpty) {
      console.log('Detected empty first row format - single-account file');
      return 'single-account';
    }
    
    // Check if first row has exactly 12 values with the expected headers
    const expectedHeaders = ['data', 'ndp', 'explicatie', 'cont', 'cd', 'suma_d', 'suma_c', 'sold', 'validat', 'categorie', 'id_nota', 'fel_d'];
    const nonEmptyCount = firstRow.filter(cell => 
      cell !== null && cell !== undefined && cell !== ''
    ).length;
    
    if (nonEmptyCount >= 12) {
      // Check if it actually contains the expected header values
      const hasExpectedHeaders = expectedHeaders.some(header => 
        firstRow.some(cell => 
          cell && typeof cell === 'string' && 
          cell.toLowerCase().includes(header.toLowerCase())
        )
      );
      
      if (hasExpectedHeaders) {
        console.log('Detected 12-column header format - multiple-accounts file');
        return 'multiple-accounts';
      }
    }
    
    // Default to single-account if unclear
    console.log('Unclear format - defaulting to single-account file');
    return 'single-account';
  };

  const extractAccountFromFilename = (filePath) => {
    const filename = filePath.split(/[/\\]/).pop() || '';
    const numbers = filename.match(/\d+/g) || [];
    
    if (numbers.length === 0) return null;
    
    let largestNumber = '';
    for (const num of numbers) {
      if (num.length > largestNumber.length || (num.length === largestNumber.length && num > largestNumber)) {
        largestNumber = num;
      }
    }
    
    return largestNumber;
  };

  const cleanSingleAccountFile = (fileData, accountNumber) => {
    
    const cleanedData = [];
    const data = fileData.data;
    
    // Skip first 9 rows (headers), start from row 9 which contains first transaction
    let startIndex = 9;
    
    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row || row.every(cell => !cell || cell === '')) {
        continue;
      }
      
      // Skip "Fisa contului" groups (7 rows starting with empty first row, second row contains "Fisa contului")
      if (i + 1 < data.length && 
          (!row[0] || row[0] === '') && 
          data[i + 1] && 
          data[i + 1][0] && 
          data[i + 1][0].toString().includes('Fisa contului')) {
        i += 6; // Skip the next 6 rows (total 7 rows)
        continue;
      }
      
      // Check if row has 6 or 7 values (non-empty cells) - both are valid transaction formats
      const nonEmptyValues = row.filter(cell => 
        cell !== null && cell !== undefined && cell !== ''
      );
      
      if (nonEmptyValues.length === 7 || nonEmptyValues.length === 6) {
        // For empty first row files: INSERT 'cont' column BETWEEN 3rd and 4th positions
        // Original format: data | ndp | explicatie | cd | suma_d | suma_c | sold (6-7 columns)
        // Standardized format: data | ndp | explicatie | CONT | cd | suma_d | suma_c | sold (8 columns)
        // The 'cont' column gets the account number from FILENAME
        const standardizedRow = [
          row[0], // data (position 0)
          row[1], // ndp (position 1)
          row[2], // explicatie (position 2)  
          accountNumber, // cont (INSERTED at position 3 - from filename, e.g., 436)
          row[3], // cd (shifted from position 3 to 4)
          row[4], // suma_d (shifted from position 4 to 5)
          row[5], // suma_c (shifted from position 5 to 6) 
          row[6]  // sold (shifted from position 6 to 7)
        ];
        
        
        cleanedData.push(standardizedRow);
      }
    }
    
    
    return {
      ...fileData,
      data: cleanedData,
      standardized: true,
      accountNumber: accountNumber
    };
  };

  const cleanMultipleAccountsFile = (fileData) => {
    
    const cleanedData = [];
    const data = fileData.data;
    
    // Skip first row (header) and process rest
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (row && row.length >= 12) {
        // Format: data, ndp, explicatie, cont, cd, suma_d, suma_c, sold, validat, categorie, id_nota, fel_d, isred
        // We ignore the last 4 columns (validat, categorie, id_nota, fel_d) and use first 8
        // Standard format: data, ndp, explicatie, cont, cd, suma_d, suma_c, sold
        const standardizedRow = [
          row[0], // data
          row[1], // ndp
          row[2], // explicatie
          row[3], // cont
          row[4], // cd
          row[5], // suma_d
          row[6], // suma_c
          row[7]  // sold
        ];
        cleanedData.push(standardizedRow);
      }
    }
    
    if (cleanedData.length > 0) {
    }
    
    return {
      ...fileData,
      data: cleanedData,
      standardized: true,
      multipleAccounts: true
    };
  };

  const processContaFiles = async (files) => {
    console.log('Number of files to process:', files?.length);
    try {
      setStatus('Processing conta files...');
      const processedFiles = [];
      
      for (const file of files) {
        const fileType = detectFileType(file);
        
        if (fileType === 'single-account') {
          const accountNumber = extractAccountFromFilename(file.filePath);
          if (accountNumber) {
            const cleanedFile = cleanSingleAccountFile(file, accountNumber);
            processedFiles.push(cleanedFile);
          } else {
          }
        } else if (fileType === 'multiple-accounts') {
          const cleanedFile = cleanMultipleAccountsFile(file);
          processedFiles.push(cleanedFile);
        }
      }
      
      setProcessedContaFiles(processedFiles);
      setStatus(`Processed ${processedFiles.length} conta files`);
      console.log('Total processed files:', processedFiles.length);
      
      // Auto-detect and set data column as date column
      autoDetectDataColumn(processedFiles);
      
      // Auto-select all found accounts
      autoSelectFoundAccounts(processedFiles);
      
    } catch (error) {
      setStatus(`Error processing conta files: ${error.message}`);
      console.error('Error processing conta files:', error);
    }
  };

  const autoDetectDataColumn = (files) => {
    // Automatically set column 0 (data) as date column
    setContabilitateSelectedDateColumns([0]);
    setContabilitateAutoDetectedDateColumns([0]);
  };

  const getDefaultAccountConfig = (account) => {
    // Default configurations based on conta anaf relation.txt
    if (account === '4423') {
      return { filterColumn: 'cont', sumColumn: 'suma_c', filterValue: account };
    } else if (account === '4424') {
      return { filterColumn: 'cont', sumColumn: 'suma_d', filterValue: account };
    } else if (account.startsWith('44') || account.startsWith('43')) {
      return { filterColumn: 'cont', sumColumn: 'suma_c', filterValue: account };
    } else {
      return { filterColumn: 'cont', sumColumn: 'suma_c', filterValue: account };
    }
  };

  const getAccountConfig = (account) => {
    return accountConfigs[account] || getDefaultAccountConfig(account);
  };

  const autoSelectFoundAccounts = (files) => {
    const foundAccounts = [];
    
    // Use current availableAccounts which includes both default and custom accounts
    for (const account of availableAccounts) {
      const isFoundInFiles = files.some(file => {
        // For single account files, check the accountNumber property
        if (file.accountNumber) {
          // Exact match
          if (file.accountNumber === account) {
            return true;
          }
          // Partial match for accounts like 446.DIV where file might be fise_446.xls
          if (account.startsWith(file.accountNumber + '.')) {
            return true;
          }
        }
        // For multiple account files, check the data rows
        return file.data.some(row => row[3] && row[3].toString() === account);
      });
      
      if (isFoundInFiles) {
        foundAccounts.push(account);
      }
    }
    
    setSelectedAccounts(foundAccounts);
    
    if (foundAccounts.length > 0) {
      setStatus(`Auto-selected ${foundAccounts.length} found Conta account(s): ${foundAccounts.join(', ')}`);
    }
  };

  const autoSelectFoundAnafAccounts = (files) => {
    const foundAnafAccounts = [];
    
    // Use current availableAnafAccounts to find accounts that exist in the files
    for (const account of availableAnafAccounts) {
      const isFoundInFiles = files.some(file => {
        // Check if account exists in ANAF files by extracting from filename
        const fileAccount = extractAccountFromFilename(file.filePath || file.name || '');
        if (fileAccount === account) {
          return true;
        }
        // Also check for partial matches like 446.DIV where file might be anaf_446.xls
        if (account.startsWith(fileAccount + '.')) {
          return true;
        }
        // Special case for 1/4423 and 1/4424 accounts that should match files with account '1'
        if ((account === '1/4423' || account === '1/4424') && fileAccount === '1') {
          return true;
        }
        return false;
      });
      
      if (isFoundInFiles) {
        foundAnafAccounts.push(account);
      }
    }
    
    setSelectedAnafAccounts(foundAnafAccounts);
    
    // Auto-enable subtraction for all accounts except 1/4423 and 1/4424
    const newSubtractionStates = { ...anafSubtractionEnabled };
    foundAnafAccounts.forEach(anafAccount => {
      if (anafAccount !== '1/4423' && anafAccount !== '1/4424') {
        newSubtractionStates[anafAccount] = true;
      }
    });
    if (JSON.stringify(newSubtractionStates) !== JSON.stringify(anafSubtractionEnabled)) {
      saveAnafSubtractionEnabled(newSubtractionStates);
    }
    
    if (foundAnafAccounts.length > 0) {
      setStatus(`Auto-selected ${foundAnafAccounts.length} found ANAF account(s): ${foundAnafAccounts.join(', ')}`);
    }
  };

  // Function to get the date range from conta files for a specific account
  const getContaAccountDateRange = (account) => {
    if (!processedContaFiles.length) return null;
    
    let oldestDate = null;
    let newestDate = null;
    
    for (const file of processedContaFiles) {
      for (let i = 0; i < file.data.length; i++) {
        const row = file.data[i];
        const rowAccount = row[3]; // cont column (at index 3)
        
        // Check if this row matches the account we're looking for
        if (rowAccount === account) {
          // Get the date from the first column (index 0)
          const dateValue = row[0];
          if (!dateValue) continue;
          
          let rowDate = null;
          if (typeof dateValue === 'string') {
            // Handle DD/MM/YYYY format
            const ddmmyyyyMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (ddmmyyyyMatch) {
              const [, day, month, year] = ddmmyyyyMatch;
              rowDate = new Date(year, month - 1, day);
            }
          } else if (dateValue instanceof Date) {
            rowDate = dateValue;
          } else if (typeof dateValue === 'number') {
            // Excel date number
            rowDate = new Date((dateValue - 25569) * 86400 * 1000);
          }
          
          if (rowDate && !isNaN(rowDate.getTime())) {
            if (!oldestDate || rowDate < oldestDate) {
              oldestDate = rowDate;
            }
            if (!newestDate || rowDate > newestDate) {
              newestDate = rowDate;
            }
          }
        }
      }
    }
    
    if (oldestDate && newestDate) {
      // Format dates as DD/MM/YYYY
      const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };
      
      return {
        startDate: formatDate(oldestDate),
        endDate: formatDate(newestDate)
      };
    }
    
    return null;
  };

  const calculateAccountSums = (account, startDate, endDate) => {
    if (!processedContaFiles.length) return 0;
    
    console.log(`[DEBUG] calculateAccountSums called for account: ${account}`);
    let sum = 0;
    // Parse DD/MM/YYYY format to ISO format before creating Date objects
    const startISO = parseDDMMYYYY(startDate);
    const endISO = parseDDMMYYYY(endDate);
    const start = startISO ? new Date(startISO + 'T00:00:00') : null;
    const end = endISO ? new Date(endISO + 'T23:59:59') : null;
    const config = getAccountConfig(account);
    
    
    
    
    for (const file of processedContaFiles) {
      
      for (let i = 0; i < file.data.length; i++) {
        const row = file.data[i];
        const rowAccount = row[3]; // cont column (now at index 3)
        
        // Apply filtering based on account configuration (config already defined above)
        let rowMatches = false;
        
        // Get the value from the row based on the filter column
        let filterValue;
        if (config.filterColumn === 'cont') {
          filterValue = row[3]; // cont column (now at index 3)
        } else if (config.filterColumn === 'data') {
          filterValue = row[0]; // data column
        } else if (config.filterColumn === 'explicatie') {
          filterValue = row[2]; // explicatie column
        } else if (config.filterColumn === 'ndp') {
          filterValue = row[1]; // ndp column
        } else {
          filterValue = row[3]; // default to cont (now at index 3)
        }
        
        // Check if the row matches the filter criteria
        if (config.filterColumn === 'cont') {
          // For account filtering, use the existing logic
          if (filterValue === account) {
            rowMatches = true;
          } else if (file.accountNumber) {
            // For single account files, also check if this account matches the file's account
            rowMatches = (file.accountNumber === account) || 
                        (account.startsWith(file.accountNumber + '.'));
          }
        } else {
          // For other filter columns, check if the value matches the configured filter value
          const targetFilterValue = config.filterValue || '';
          rowMatches = filterValue && filterValue.toString().includes(targetFilterValue);
        }
        
        
        
        
        if (rowMatches) {
          // Parse the date from the row
          const rowDateValue = row[0]; // data column
          let rowDate = null;
          
          if (rowDateValue) {
            // Handle different date formats
            if (rowDateValue instanceof Date) {
              rowDate = rowDateValue;
            } else if (typeof rowDateValue === 'number') {
              // Excel serial date - convert from Excel serial number to JavaScript date
              // Excel serial date 1 = January 1, 1900 (with leap year bug adjustment)
              rowDate = new Date((rowDateValue - 25569) * 86400 * 1000);
            } else {
              rowDate = new Date(rowDateValue);
            }
            
            
            // Skip invalid dates
            if (isNaN(rowDate.getTime())) {
              continue;
            }
          }
          
          // Check date range (only if both rowDate and range dates are valid)
          if (rowDate) {
            if (start && rowDate < start) {
              continue;
            }
            if (end && rowDate > end) {
              continue;
            }
          }
          
          // Apply sum rules based on account configuration (config already defined above)
          let columnIndex;
          
          // Map column names to indices in standardized row format
          // Row format: [data, ndp, explicatie, cont, cd, suma_d, suma_c, sold]
          if (config.sumColumn === 'suma_c') {
            columnIndex = 6; // suma_c is now at index 6
          } else if (config.sumColumn === 'suma_d') {
            columnIndex = 5; // suma_d is now at index 5
          } else if (config.sumColumn === 'sold') {
            columnIndex = 7; // sold is now at index 7
          } else {
            columnIndex = 6; // Default to suma_c
          }
          
          const value = parseFloat(row[columnIndex]) || 0;
          sum += value;
        }
      }
    }
    
    return sum;
  };

  const handleAccountToggle = (account) => {
    setSelectedAccounts(prev => {
      const isCurrentlySelected = prev.includes(account);
      const newSelectedAccounts = isCurrentlySelected 
        ? prev.filter(a => a !== account)
        : [...prev, account];
      
      // Auto-select/deselect corresponding ANAF accounts
      const correspondingAnafAccounts = getCorrespondingAnafAccounts(newSelectedAccounts);
      
      // Update ANAF selection to match corresponding accounts
      const validAnafAccounts = correspondingAnafAccounts.filter(anafAccount => 
        availableAnafAccounts.includes(anafAccount)
      );
      setSelectedAnafAccounts(validAnafAccounts);
      
      // Auto-enable subtraction for 44xx and 43xx accounts that need it
      const newSubtractionStates = { ...anafSubtractionEnabled };
      validAnafAccounts.forEach(anafAccount => {
        if ((anafAccount.startsWith('44') && anafAccount !== '4423' && anafAccount !== '4424') || anafAccount.startsWith('43')) {
          newSubtractionStates[anafAccount] = true;
        }
      });
      if (JSON.stringify(newSubtractionStates) !== JSON.stringify(anafSubtractionEnabled)) {
        saveAnafSubtractionEnabled(newSubtractionStates);
      }
      
      return newSelectedAccounts;
    });
  };

  // Helper function to parse DD/MM/YYYY format to ISO format (YYYY-MM-DD)
  const parseDDMMYYYY = (dateStr) => {
    if (!dateStr) return null;
    
    // If already in ISO format (YYYY-MM-DD), return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Parse DD/MM/YYYY format (with slashes)
    let match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    
    // Parse DD.MM.YYYY format (with dots) - common in European Excel files
    if (!match) {
      match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    }
    
    if (!match) return null;
    
    const [, day, month, year] = match;
    const paddedDay = day.padStart(2, '0');
    const paddedMonth = month.padStart(2, '0');
    
    return `${year}-${paddedMonth}-${paddedDay}`;
  };

  // Helper function to format ISO date (YYYY-MM-DD) to DD/MM/YYYY for display
  const formatToDisplay = (isoDateStr) => {
    if (!isoDateStr) return '';
    
    // If already in DD/MM/YYYY format, return as is
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(isoDateStr)) {
      return isoDateStr;
    }
    
    // Parse ISO format (YYYY-MM-DD)
    const match = isoDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return isoDateStr;
    
    const [, year, month, day] = match;
    return `${parseInt(day)}/${parseInt(month)}/${year}`;
  };

  const handleStartDateChange = async (newStartDate) => {
    setStartDate(newStartDate);
    
    try {
      const settings = await window.electronAPI.loadSettings();
      // Convert DD/MM/YYYY to ISO format for storage
      const isoDate = parseDDMMYYYY(newStartDate);
      await window.electronAPI.saveSettings({
        ...settings,
        contaStartDate: isoDate || newStartDate
      });
    } catch (error) {
      console.error('Failed to save start date:', error);
    }
  };

  const handleEndDateChange = async (newEndDate) => {
    setEndDate(newEndDate);
    
    try {
      const settings = await window.electronAPI.loadSettings();
      // Convert DD/MM/YYYY to ISO format for storage
      const isoDate = parseDDMMYYYY(newEndDate);
      await window.electronAPI.saveSettings({
        ...settings,
        contaEndDate: isoDate || newEndDate
      });
    } catch (error) {
      console.error('Failed to save end date:', error);
    }
  };

  const handleAddAccountClick = () => {
    setShowAccountInput(true);
    setNewAccountInput('');
  };

  const handleAccountInputSubmit = () => {
    const accountName = newAccountInput.trim();
    if (accountName && !availableAccounts.includes(accountName) && !customAccounts.includes(accountName)) {
      const updatedCustomAccounts = [...customAccounts, accountName];
      setCustomAccounts(updatedCustomAccounts);
      setAvailableAccounts([...availableAccounts, accountName]);
      saveCustomAccounts(updatedCustomAccounts);
    }
    setShowAccountInput(false);
    setNewAccountInput('');
  };

  const handleAccountInputCancel = () => {
    setShowAccountInput(false);
    setNewAccountInput('');
  };

  const handleAccountRightClick = (e, account) => {
    e.preventDefault();
    // Allow deletion of any account (both custom and default)
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      account: account
    });
  };

  const handleDeleteAccount = async () => {
    if (contextMenu && contextMenu.account) {
      const accountToDelete = contextMenu.account;
      const updatedAvailableAccounts = availableAccounts.filter(acc => acc !== accountToDelete);
      const updatedSelectedAccounts = selectedAccounts.filter(acc => acc !== accountToDelete);
      
      setAvailableAccounts(updatedAvailableAccounts);
      setSelectedAccounts(updatedSelectedAccounts);
      
      // Remove deleted conta account from mapping panel
      const updatedMappings = { ...accountMappings };
      if (updatedMappings[accountToDelete]) {
        delete updatedMappings[accountToDelete];
        setAccountMappings(updatedMappings);
        
        // Save updated mappings to settings
        try {
          const settings = await window.electronAPI.loadSettings();
          await window.electronAPI.saveSettings({
            ...settings,
            accountMappings: updatedMappings
          });
        } catch (error) {
          console.error('Error saving mapping settings after conta account deletion:', error);
        }
      }
      
      if (customAccounts.includes(accountToDelete)) {
        // It's a custom account - remove from custom accounts list
        const updatedCustomAccounts = customAccounts.filter(acc => acc !== accountToDelete);
        setCustomAccounts(updatedCustomAccounts);
        saveAccountSettings(updatedCustomAccounts, removedDefaultAccounts);
      } else if (defaultAccounts.includes(accountToDelete)) {
        // It's a default account - add to removed list
        const updatedRemovedDefaults = [...removedDefaultAccounts, accountToDelete];
        setRemovedDefaultAccounts(updatedRemovedDefaults);
        saveAccountSettings(customAccounts, updatedRemovedDefaults);
      }
    }
    setContextMenu(null);
  };

  const saveAccountSettings = async (customAccts, removedDefaultAccts) => {
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        customAccounts: customAccts,
        removedDefaultAccounts: removedDefaultAccts
      });
    } catch (error) {
      console.error('Failed to save account settings:', error);
    }
  };

  const saveCustomAccounts = async (accounts) => {
    await saveAccountSettings(accounts, removedDefaultAccounts);
  };

  const saveAccountConfigs = async (configs) => {
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        accountConfigs: configs
      });
      setAccountConfigs(configs);
    } catch (error) {
      console.error('Failed to save account configurations:', error);
    }
  };

  const saveAnafAccountConfigs = async (configs) => {
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        anafAccountConfigs: configs
      });
      setAnafAccountConfigs(configs);
    } catch (error) {
      console.error('Failed to save ANAF account configurations:', error);
    }
  };

  const saveAnafSubtractionEnabled = async (enabledStates) => {
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        anafSubtractionEnabled: enabledStates
      });
      setAnafSubtractionEnabled(enabledStates);
    } catch (error) {
      console.error('Failed to save ANAF subtraction states:', error);
    }
  };

  const updateAccountConfig = (account, config) => {
    const newConfigs = {
      ...accountConfigs,
      [account]: config
    };
    saveAccountConfigs(newConfigs);
  };

  // ANAF Account config helpers
  const getAnafAccountConfig = (account) => {
    // If user has custom config, use that
    if (anafAccountConfigs[account]) {
      return anafAccountConfigs[account];
    }

    // Apply automatic configuration based on Account 412 settings
    // Default config for all accounts except 1/4423 and 1/4424
    let defaultConfig = {
      filterColumn: 'CTG_SUME',
      filterValue: 'D',
      sumColumn: 'SUMA_PLATA'
      // No subtractConfig by default - only specific accounts should have subtraction
    };

    // Account 2: No subtraction - clean sum only
    if (account === '2') {
      defaultConfig = {
        filterColumn: 'CTG_SUME',
        filterValue: 'D',
        sumColumn: 'SUMA_PLATA'
        // No subtractConfig
      };
    }
    // For other accounts that need subtraction (like 412), add it back
    else if (account !== '1/4423' && account !== '1/4424' && account !== '2') {
      defaultConfig.subtractConfig = {
        filterColumn: 'ATRIBUT_PL',
        filterValue: 'DIM',
        sumColumn: 'INCASARI'
      };
    }

    // Special configs for accounts 1/4423 and 1/4424 (no subtraction)
    if (account === '1/4423') {
      defaultConfig = {
        filterColumn: 'CTG_SUME',
        filterValue: '',
        sumColumn: 'SUMA_PLATA',
        subtractConfig: {
          filterColumn: 'CTG_SUME',
          filterValue: '',
          sumColumn: 'SUMA_PLATA'
        }
      };
    }
    else if (account === '1/4424') {
      defaultConfig = {
        filterColumn: 'CTG_SUME',
        filterValue: '',
        sumColumn: 'SUMA_PLATA',
        subtractConfig: {
          filterColumn: 'CTG_SUME',
          filterValue: '',
          sumColumn: 'SUMA_PLATA'
        }
      };
    }
    // Account 4423: CTG_SUME=D, SUMA_PLATA
    else if (account === '4423') {
      defaultConfig = {
        filterColumn: 'CTG_SUME',
        filterValue: 'D',
        sumColumn: 'SUMA_PLATA',
        subtractConfig: {
          filterColumn: 'CTG_SUME',
          filterValue: '',
          sumColumn: 'SUMA_PLATA'
        }
      };
    }
    // Account 4424: ATRIBUT_PL=DRA, INCASARI
    else if (account === '4424') {
      defaultConfig = {
        filterColumn: 'ATRIBUT_PL',
        filterValue: 'DRA',
        sumColumn: 'INCASARI',
        subtractConfig: {
          filterColumn: 'ATRIBUT_PL',
          filterValue: '',
          sumColumn: 'INCASARI'
        }
      };
    }
    // Accounts 44xx and 43xx (except 4423 and 4424): CTG_SUME=D, SUMA_PLATA with subtraction ATRIBUT_PL=DIM, INCASARI
    else if ((account.startsWith('44') && account !== '4423' && account !== '4424') || account.startsWith('43')) {
      defaultConfig = {
        filterColumn: 'CTG_SUME',
        filterValue: 'D',
        sumColumn: 'SUMA_PLATA',
        subtractConfig: {
          filterColumn: 'ATRIBUT_PL',
          filterValue: 'DIM',
          sumColumn: 'INCASARI'
        }
      };
      // Auto-enable subtraction for these accounts
      if (!anafSubtractionEnabled.hasOwnProperty(account)) {
        setAnafSubtractionEnabled(prev => ({ ...prev, [account]: true }));
      }
    }

    // Auto-enable subtraction for all accounts except 1/4423 and 1/4424
    if (account !== '1/4423' && account !== '1/4424') {
      if (!anafSubtractionEnabled.hasOwnProperty(account)) {
        setAnafSubtractionEnabled(prev => ({ ...prev, [account]: true }));
      }
    }

    return defaultConfig;
  };

  const isAnafSubtractionEnabled = (account) => {
    return anafSubtractionEnabled[account] || false;
  };

  const toggleAnafSubtraction = (account) => {
    const newEnabledStates = {
      ...anafSubtractionEnabled,
      [account]: !isAnafSubtractionEnabled(account)
    };
    saveAnafSubtractionEnabled(newEnabledStates);
  };

  // Get available filter values based on the selected filter column
  const getAnafFilterValueOptions = (filterColumn) => {
    const uniqueValues = new Set();
    
    // Extract unique values from all ANAF files
    anafFiles.forEach(file => {
      if (file.data && Array.isArray(file.data)) {
        file.data.forEach((row, index) => {
          // Skip company info row (0) and column header row (1)
          if (index === 0 || index === 1) return;
          
          let columnValue = '';
          
          // Get the value from the appropriate column based on the filter column
          switch (filterColumn) {
            case 'CTG_SUME':
              columnValue = row[6]; // CTG_SUME column
              break;
            case 'ATRIBUT_PL':
              columnValue = row[12]; // ATRIBUT_PL column
              break;
            case 'IME_COD_IMPOZIT':
              columnValue = row[0]; // IME_COD_IMPOZIT column
              break;
            case 'DENUMIRE_IMPOZIT':
              columnValue = row[1]; // DENUMIRE_IMPOZIT column
              break;
            default:
              return;
          }
          
          // Add non-null, defined values to the set
          if (columnValue !== null && columnValue !== undefined) {
            // Convert to string and trim whitespace
            const stringValue = String(columnValue).trim();
            uniqueValues.add(stringValue);
          }
        });
      }
    });
    
    // Convert to array and sort, then create option objects
    const sortedValues = Array.from(uniqueValues).sort();
    const options = sortedValues.map(value => ({
      value: value,
      label: value === '' ? '(Empty)' : value
    }));
    
    // Add "No filter" option at the beginning
    options.unshift({ value: '', label: '(No filter)' });
    
    return options;
  };

  // Parse conta anaf.txt mapping to get corresponding ANAF accounts for Conta accounts
  const getContaAnafMapping = () => {
    // Based on conta anaf.txt content
    return {
      '4423': ['1'],
      '4424': ['1'], 
      '4315': ['412', '451', '458', '483'],
      '4316': ['432', '459', '461'],
      '444': ['2', '9'],
      '436': ['480'],
      '4411': ['3'],
      '4418': ['14'],
      '446.DIV': ['7'],
      '446.CHIRII': ['628'],
      '446.CV': ['33']
    };
  };

  // Get ANAF accounts that should be auto-selected based on selected Conta accounts
  const getCorrespondingAnafAccounts = (selectedContaAccounts) => {
    const mapping = getContaAnafMapping();
    const anafAccounts = new Set();
    
    selectedContaAccounts.forEach(contaAccount => {
      if (mapping[contaAccount]) {
        mapping[contaAccount].forEach(anafAccount => {
          anafAccounts.add(anafAccount);
        });
      }
    });
    
    return Array.from(anafAccounts);
  };

  const updateAnafAccountConfig = (account, config) => {
    const newConfigs = {
      ...anafAccountConfigs,
      [account]: config
    };
    saveAnafAccountConfigs(newConfigs);
  };

  const handleDeleteAnafAccount = async () => {
    if (anafContextMenu && anafContextMenu.account) {
      const accountToDelete = anafContextMenu.account;
      const updatedAvailableAnafAccounts = availableAnafAccounts.filter(acc => acc !== accountToDelete);
      const updatedSelectedAnafAccounts = selectedAnafAccounts.filter(acc => acc !== accountToDelete);
      
      setAvailableAnafAccounts(updatedAvailableAnafAccounts);
      setSelectedAnafAccounts(updatedSelectedAnafAccounts);
      
      // Remove deleted ANAF account from all mappings in mapping panel
      const updatedMappings = { ...accountMappings };
      let mappingsChanged = false;
      
      Object.keys(updatedMappings).forEach(contaAccount => {
        const anafAccounts = updatedMappings[contaAccount];
        const filteredAnafAccounts = anafAccounts.filter(anaf => anaf !== accountToDelete);
        
        if (filteredAnafAccounts.length !== anafAccounts.length) {
          updatedMappings[contaAccount] = filteredAnafAccounts;
          mappingsChanged = true;
        }
      });
      
      if (mappingsChanged) {
        setAccountMappings(updatedMappings);
        
        // Save updated mappings to settings
        try {
          const settings = await window.electronAPI.loadSettings();
          await window.electronAPI.saveSettings({
            ...settings,
            accountMappings: updatedMappings
          });
        } catch (error) {
          console.error('Error saving mapping settings after ANAF account deletion:', error);
        }
      }
      
      // Remove from config
      const updatedConfigs = { ...anafAccountConfigs };
      delete updatedConfigs[accountToDelete];
      setAnafAccountConfigs(updatedConfigs);
      
      setAnafContextMenu(null);
    }
  };

  // ANAF Account handlers
  const handleAnafAccountToggle = (account) => {
    setSelectedAnafAccounts(prev => 
      prev.includes(account) 
        ? prev.filter(a => a !== account)
        : [...prev, account]
    );
  };

  const handleAnafAccountRightClick = (e, account) => {
    e.preventDefault();
    setAnafContextMenu({
      x: e.clientX,
      y: e.clientY,
      account: account
    });
  };

  const handleAddAnafAccountClick = useCallback(() => {
    setShowAnafAccountInput(true);
    setNewAnafAccountInput('');
  }, []);

  const sortAnafAccounts = useCallback((accounts) => {
    const priorityAccounts = ['1/4423', '1/4424'];
    const otherAccounts = accounts
      .filter(acc => !priorityAccounts.includes(acc))
      .sort((a, b) => {
        const numA = parseFloat(a) || 0;
        const numB = parseFloat(b) || 0;
        return numA - numB;
      });
    
    return [...priorityAccounts.filter(acc => accounts.includes(acc)), ...otherAccounts];
  }, []);

  const handleAnafAccountInputSubmit = useCallback(() => {
    const accountName = newAnafAccountInput.trim();
    if (accountName && !availableAnafAccounts.includes(accountName) && !customAnafAccounts.includes(accountName)) {
      const updatedCustomAnafAccounts = [...customAnafAccounts, accountName];
      setCustomAnafAccounts(updatedCustomAnafAccounts);
      
      // Add account and sort properly with 1/4423 and 1/4424 first
      const newAccounts = [...availableAnafAccounts, accountName];
      const sortedAccounts = sortAnafAccounts(newAccounts);
      setAvailableAnafAccounts(sortedAccounts);
      // Save to settings if needed
    }
    setShowAnafAccountInput(false);
    setNewAnafAccountInput('');
  }, [newAnafAccountInput, availableAnafAccounts, customAnafAccounts, sortAnafAccounts]);

  const handleAnafAccountInputCancel = useCallback(() => {
    setShowAnafAccountInput(false);
    setNewAnafAccountInput('');
  }, []);

  // Memoized style objects for ANAF input to prevent re-creation on every render
  const anafInputStyles = useMemo(() => ({
    container: {
      display: 'flex', 
      alignItems: 'center', 
      gap: '4px',
      animation: 'fadeIn 0.2s ease-in'
    },
    input: {
      padding: '4px 8px',
      borderRadius: '12px',
      border: '1px solid var(--theme-border-color)',
      backgroundColor: 'var(--theme-input-bg)',
      color: 'var(--theme-text-color)',
      fontSize: '12px',
      width: '80px',
      outline: 'none',
      transition: 'border-color 0.1s ease'
    },
    submitButton: {
      padding: '0',
      borderRadius: '50%',
      border: '1px solid #10b981',
      backgroundColor: '#10b981',
      color: 'white',
      fontSize: '12px',
      cursor: 'pointer',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'background-color 0.1s ease'
    },
    cancelButton: {
      padding: '0',
      borderRadius: '50%',
      border: '1px solid #ef4444',
      backgroundColor: '#ef4444',
      color: 'white',
      fontSize: '12px',
      cursor: 'pointer',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'background-color 0.1s ease'
    },
    addButton: {
      padding: '0',
      borderRadius: '50%',
      border: '1px solid var(--theme-border-color)',
      backgroundColor: 'var(--theme-button-bg)',
      color: 'var(--theme-text-color)',
      fontSize: '14px',
      cursor: 'pointer',
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'background-color 0.1s ease'
    }
  }), []);

  // Optimized ANAF account button styling function 
  const getAnafAccountButtonStyle = useCallback((isSelected, isFoundInFiles) => ({
    padding: '6px 12px',
    borderRadius: '16px',
    border: isFoundInFiles 
      ? '2px solid #10b981' 
      : '1px solid var(--theme-border-color)',
    backgroundColor: isSelected 
      ? 'var(--theme-secondary, #10b981)' 
      : 'var(--theme-button-bg)',
    color: isSelected 
      ? 'white' 
      : 'var(--theme-text-color)',
    fontSize: '12px',
    cursor: 'pointer',
    // Only transition specific properties to avoid unwanted visual effects
    transition: 'background-color 0.1s ease, border-color 0.1s ease, transform 0.1s ease',
    minWidth: 'fit-content',
    boxShadow: isFoundInFiles ? '0 0 0 1px rgba(16, 185, 129, 0.1)' : 'none',
    userSelect: 'none' // Prevent text selection that can cause visual artifacts
  }), []);

  // Optimized input event handlers
  const handleAnafInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAnafAccountInputSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleAnafAccountInputCancel();
    }
  }, [handleAnafAccountInputSubmit, handleAnafAccountInputCancel]);

  const handleAnafInputChange = useCallback((e) => {
    setNewAnafAccountInput(e.target.value);
  }, []);

  const handleAnafInputFocus = useCallback((e) => {
    e.target.style.borderColor = 'var(--theme-primary, #4f46e5)';
  }, []);

  const handleAnafInputBlur = useCallback((e) => {
    e.target.style.borderColor = 'var(--theme-border-color)';
  }, []);

  // Account mapping functions
  const handleContaAccountMapping = (contaAccount) => {
    const currentMappings = accountMappings[contaAccount] || [];
    const availableAnafForMapping = availableAnafAccounts.filter(anaf => 
      !currentMappings.includes(anaf)
    );
    
    if (availableAnafForMapping.length === 0) {
      alert(`All ANAF accounts are already mapped to ${contaAccount}`);
      return;
    }

    // Show modal instead of prompt
    setModalContaAccount(contaAccount);
    setModalAvailableAnafAccounts(availableAnafForMapping);
    setModalSelectedAnafAccount('');
    setShowAnafSelectionModal(true);
  };

  // Modal handler functions
  const handleModalConfirm = async () => {
    if (!modalSelectedAnafAccount) {
      return;
    }
    
    const currentMappings = accountMappings[modalContaAccount] || [];
    const newMappings = {
      ...accountMappings,
      [modalContaAccount]: [...currentMappings, modalSelectedAnafAccount]
    };
    setAccountMappings(newMappings);
    
    // Save to settings
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        accountMappings: newMappings
      });
    } catch (error) {
      console.error('Failed to save account mappings:', error);
    }
    
    // Close modal
    handleModalCancel();
  };

  const handleModalCancel = () => {
    setShowAnafSelectionModal(false);
    setModalContaAccount('');
    setModalAvailableAnafAccounts([]);
    setModalSelectedAnafAccount('');
  };

  // Conta modal handler functions
  const handleContaModalCancel = () => {
    setShowContaSelectionModal(false);
    setModalAvailableContaAccounts([]);
    setModalSelectedContaAccount('');
  };

  const handleContaModalConfirm = async () => {
    if (!modalSelectedContaAccount) {
      return;
    }
    
    setModalSelectedContaAccount(modalSelectedContaAccount);
    await handleAddNewContaRelation();
  };

  const handleRemoveMapping = async (contaAccount, anafAccount) => {
    const newMappings = {
      ...accountMappings,
      [contaAccount]: (accountMappings[contaAccount] || []).filter(anaf => anaf !== anafAccount)
    };
    setAccountMappings(newMappings);
    
    // Save to settings
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        accountMappings: newMappings
      });
    } catch (error) {
      console.error('Failed to save account mappings:', error);
    }
  };


  // Enhanced mapping functions for new UI
  const handleShowContaAccountSelection = () => {
    // Get all available accounts that are not already mapped
    const unmappedContaAccounts = availableAccounts.filter(account => 
      !accountMappings.hasOwnProperty(account)
    );
    
    if (unmappedContaAccounts.length === 0) {
      alert('All available conta accounts are already mapped. Add new accounts in the Account Selection panel first.');
      return;
    }

    // Show modal
    setModalAvailableContaAccounts(unmappedContaAccounts);
    setModalSelectedContaAccount('');
    setShowContaSelectionModal(true);
  };

  const handleAddNewContaRelation = async () => {
    if (!modalSelectedContaAccount) {
      return;
    }
    
    const contaAccount = modalSelectedContaAccount;
    
    // Start with empty mapping
    const newMappings = {
      ...accountMappings,
      [contaAccount]: []
    };
    
    setAccountMappings(newMappings);
    
    // Save to settings
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        accountMappings: newMappings
      });
    } catch (error) {
      console.error('Failed to save account mappings:', error);
    }
    
    // Close modal
    handleContaModalCancel();
  };


  const handleAddMoreAnafAccounts = (contaAccount) => {
    const currentMappings = accountMappings[contaAccount] || [];
    const availableAnafForMapping = availableAnafAccounts.filter(anaf => 
      !currentMappings.includes(anaf)
    );
    
    if (availableAnafForMapping.length === 0) {
      alert(`All ANAF accounts are already mapped to ${contaAccount}`);
      return;
    }

    // Show modal instead of prompt
    setModalContaAccount(contaAccount);
    setModalAvailableAnafAccounts(availableAnafForMapping);
    setModalSelectedAnafAccount('');
    setShowAnafSelectionModal(true);
  };

  const handleMappingRightClick = (e, contaAccount) => {
    e.preventDefault();
    setMappingContextMenu({
      x: e.clientX,
      y: e.clientY,
      contaAccount: contaAccount
    });
  };

  const handleDeleteContaRelation = async () => {
    if (mappingContextMenu && mappingContextMenu.contaAccount) {
      const contaToDelete = mappingContextMenu.contaAccount;
      const newMappings = { ...accountMappings };
      delete newMappings[contaToDelete];
      
      setAccountMappings(newMappings);
      setMappingContextMenu(null);
      
      // Save to settings
      try {
        const settings = await window.electronAPI.loadSettings();
        await window.electronAPI.saveSettings({
          ...settings,
          accountMappings: newMappings
        });
      } catch (error) {
        console.error('Failed to save account mappings:', error);
      }
    }
  };

  const calculateAnafAccountSums = (account, startDate, endDate, config = {}) => {
    const { filterColumn = 'CTG_SUME', filterValue = '', sumColumn = 'SUMA_PLATA', subtractConfig } = config;
    console.log(`[DEBUG] calculateAnafAccountSums called for account: ${account}`);
    console.log(`[DEBUG] ANAF files available:`, anafFiles.length);
    console.log(`[DEBUG] Config:`, config);
    let sum = 0;
    let subtractSum = 0;

    // Parse dates at function level so both main and subtraction calculations can use them
    const startISO = parseDDMMYYYY(startDate);
    const endISO = parseDDMMYYYY(endDate);
    const start = startISO ? new Date(startISO + 'T00:00:00') : null;
    const end = endISO ? new Date(endISO + 'T23:59:59') : null;
    

    anafFiles.forEach((file, fileIndex) => {
      console.log(`[DEBUG] Processing ANAF file ${fileIndex}:`, file.filePath || file.name);
      if (file.data && Array.isArray(file.data)) {
        // First check if this file matches the account we're calculating for
        const fileAccount = extractAccountFromFilename(file.filePath || file.name || '');
        console.log(`[DEBUG] Extracted fileAccount: "${fileAccount}" for account: "${account}"`);
        let fileMatches = false;
        
        if (fileAccount === account) {
          fileMatches = true;
          console.log(`[DEBUG] File matches account (exact match)`);
        } else if (account.startsWith(fileAccount + '.')) {
          fileMatches = true;
          console.log(`[DEBUG] File matches account (startsWith match)`);
        } else if ((account === '1/4423' || account === '1/4424') && fileAccount === '1') {
          fileMatches = true;
          console.log(`[DEBUG] File matches account (special 1/4423-4424 case)`);
        } else {
          console.log(`[DEBUG] File does NOT match account`);
        }
        
        // Skip this file if it doesn't match the account
        if (!fileMatches) return;
        
        let processedRows = 0;
        console.log(`[DEBUG] File has ${file.data.length} total rows`);
        
        file.data.forEach((row, index) => {
          // Skip company info row (0) and column header row (1)
          if (index === 0 || index === 1) {
            console.log(`[DEBUG] Skipping header row ${index}`);
            return;
          }

          const termPlataValue = row[5]; // TERM_PLATA column (based on debug output)
          const ctgSumeValue = row[6]; // CTG_SUME column (based on debug output)
          const atributPlValue = row[12]; // ATRIBUT_PL column (based on debug output)
          const imeCodeValue = row[0]; // IME_COD_IMPOZIT column (based on debug output)
          const denumireValue = row[1]; // DENUMIRE_IMPOZIT column (based on debug output)
          const sumaPlataValue = parseFloat(row[8]) || 0; // SUMA_PLATA column (based on debug output)
          const incasariValue = parseFloat(row[13]) || 0; // INCASARI column (based on debug output)
          const sumaNEValue = parseFloat(row[9]) || 0; // SUMA_NEACHITATA column (based on debug output)
          const rambursariValue = parseFloat(row[14]) || 0; // RAMBURSARI column (based on debug output)


          // Date filtering using SCADENTA and TERM_PLATA columns
          let rowDate = null;
          
          // First check SCADENTA column - try common indices (3, 4, 6, 7)
          const potentialScadentaIndices = [3, 4, 6, 7];
          for (const scadentaIndex of potentialScadentaIndices) {
            const scadentaDate = row[scadentaIndex];
            if (scadentaDate) {
              const scadentaISO = parseDDMMYYYY(scadentaDate);
              if (scadentaISO) {
                rowDate = new Date(scadentaISO + 'T12:00:00');
                break;
              }
            }
          }
          
          // If no valid date in SCADENTA, fall back to TERM_PLATA column (index 5)
          if (!rowDate) {
            const termPlataDate = row[5];
            if (termPlataDate) {
              const termISO = parseDDMMYYYY(termPlataDate);
              if (termISO) {
                rowDate = new Date(termISO + 'T12:00:00');
              }
            }
          }
          
          // Final fallback to selected date columns
          if (!rowDate && anafSelectedDateColumns.length > 0) {
            for (const dateColumnIndex of anafSelectedDateColumns) {
              if (dateColumnIndex !== 5 && ![4, 6, 7].includes(dateColumnIndex)) { // Skip already checked columns
                const dateValue = row[dateColumnIndex];
                if (dateValue) {
                  const rowISO = parseDDMMYYYY(dateValue);
                  if (rowISO) {
                    rowDate = new Date(rowISO + 'T12:00:00');
                    break;
                  }
                }
              }
            }
          }

          // Apply date filtering only if we have valid start/end dates and the row has a valid date
          if (start && rowDate && rowDate < start) return;
          if (end && rowDate && rowDate > end) return;
          
          // Skip rows with no valid date only if we have date constraints and the row date is required
          // For now, allow rows with no date to pass through

          // Apply filter based on selected filter column
          if (filterValue) {
            let matchesFilter = false;
            switch (filterColumn) {
              case 'CTG_SUME':
                matchesFilter = ctgSumeValue === filterValue;
                console.log(`[DEBUG] Row ${index}: CTG_SUME filter - value: "${ctgSumeValue}", expected: "${filterValue}", matches: ${matchesFilter}`);
                break;
              case 'ATRIBUT_PL':
                matchesFilter = atributPlValue === filterValue;
                console.log(`[DEBUG] Row ${index}: ATRIBUT_PL filter - value: "${atributPlValue}", expected: "${filterValue}", matches: ${matchesFilter}`);
                break;
              case 'IME_COD_IMPOZIT':
                matchesFilter = imeCodeValue === filterValue;
                console.log(`[DEBUG] Row ${index}: IME_COD_IMPOZIT filter - value: "${imeCodeValue}", expected: "${filterValue}", matches: ${matchesFilter}`);
                break;
              case 'DENUMIRE_IMPOZIT':
                matchesFilter = denumireValue === filterValue;
                console.log(`[DEBUG] Row ${index}: DENUMIRE_IMPOZIT filter - value: "${denumireValue}", expected: "${filterValue}", matches: ${matchesFilter}`);
                break;
              default:
                matchesFilter = true;
                console.log(`[DEBUG] Row ${index}: No specific filter, matches: true`);
            }
            if (!matchesFilter) {
              console.log(`[DEBUG] Row ${index}: Filtered out due to filter mismatch`);
              return;
            }
          } else {
            console.log(`[DEBUG] Row ${index}: No filterValue, passing through`);
          }

          // Add to sum based on selected sum column
          console.log(`[DEBUG] Row ${index}: Adding to sum using column ${sumColumn}`);
          switch (sumColumn) {
            case 'SUMA_PLATA':
              console.log(`[DEBUG] Row ${index}: SUMA_PLATA value: ${sumaPlataValue}, adding to sum (was: ${sum})`);
              sum += sumaPlataValue;
              console.log(`[DEBUG] Row ${index}: Sum is now: ${sum}`);
              processedRows++;
              break;
            case 'INCASARI':
              console.log(`[DEBUG] Row ${index}: INCASARI value: ${incasariValue}, adding to sum (was: ${sum})`);
              sum += incasariValue;
              processedRows++;
              break;
            case 'SUMA_NEACHITATA':
              sum += sumaNEValue;
              processedRows++;
              break;
            case 'RAMBURSARI':
              sum += rambursariValue;
              processedRows++;
              break;
          }
        });
      }
    });

    // Calculate subtraction if configured
    if (subtractConfig && subtractConfig.filterValue) {
      anafFiles.forEach(file => {
        if (file.data && Array.isArray(file.data)) {
          // First check if this file matches the account we're calculating for
          const fileAccount = extractAccountFromFilename(file.filePath || file.name || '');
          let fileMatches = false;
          
          if (fileAccount === account) {
            fileMatches = true;
          } else if (account.startsWith(fileAccount + '.')) {
            fileMatches = true;
          } else if ((account === '1/4423' || account === '1/4424') && fileAccount === '1') {
            fileMatches = true;
          }
          
          // Skip this file if it doesn't match the account
          if (!fileMatches) return;
          
          file.data.forEach((row, index) => {
            // Skip company info row (0) and column header row (1)
            if (index === 0 || index === 1) return;

            const termPlataValue = row[5]; // TERM_PLATA column (based on debug output)
            const ctgSumeValue = row[6]; // CTG_SUME column (based on debug output)
            const atributPlValue = row[12]; // ATRIBUT_PL column (based on debug output)
            const imeCodeValue = row[0]; // IME_COD_IMPOZIT column (based on debug output)
            const denumireValue = row[1]; // DENUMIRE_IMPOZIT column (based on debug output)
            const sumaPlataValue = parseFloat(row[8]) || 0; // SUMA_PLATA column (based on debug output)
            const incasariValue = parseFloat(row[13]) || 0; // INCASARI column (based on debug output)
            const sumaNEValue = parseFloat(row[9]) || 0; // SUMA_NEACHITATA column (based on debug output)
            const rambursariValue = parseFloat(row[14]) || 0; // RAMBURSARI column (based on debug output)

            // Date filtering using SCADENTA and TERM_PLATA columns - same as main calculation  
            let rowDate = null;
            
            // First check SCADENTA column - try common indices (3, 4, 6, 7)
            const potentialScadentaIndices = [3, 4, 6, 7];
            for (const scadentaIndex of potentialScadentaIndices) {
              const scadentaDate = row[scadentaIndex];
              if (scadentaDate) {
                const scadentaISO = parseDDMMYYYY(scadentaDate);
                if (scadentaISO) {
                  rowDate = new Date(scadentaISO + 'T12:00:00');
                  break;
                }
              }
            }
            
            // If no valid date in SCADENTA, fall back to TERM_PLATA column (index 5)
            if (!rowDate) {
              const termPlataDate = row[5];
              if (termPlataDate) {
                const termISO = parseDDMMYYYY(termPlataDate);
                if (termISO) {
                  rowDate = new Date(termISO + 'T12:00:00');
                }
              }
            }
            
            // Final fallback to selected date columns
            if (!rowDate && anafSelectedDateColumns.length > 0) {
              for (const dateColumnIndex of anafSelectedDateColumns) {
                if (dateColumnIndex !== 5 && ![4, 6, 7].includes(dateColumnIndex)) { // Skip already checked columns
                  const dateValue = row[dateColumnIndex];
                  if (dateValue) {
                    const rowISO = parseDDMMYYYY(dateValue);
                    if (rowISO) {
                      rowDate = new Date(rowISO + 'T12:00:00');
                      break;
                    }
                  }
                }
              }
            }

            // Apply date filtering only if we have valid start/end dates and the row has a valid date
            if (start && rowDate && rowDate < start) return;
            if (end && rowDate && rowDate > end) return;
            
            // Skip rows with no valid date only if we have date constraints and the row date is required
            // For now, allow rows with no date to pass through

            // Apply subtraction filter based on selected filter column
            let matchesSubtractFilter = false;
            switch (subtractConfig.filterColumn || 'CTG_SUME') {
              case 'CTG_SUME':
                matchesSubtractFilter = ctgSumeValue === subtractConfig.filterValue;
                break;
              case 'ATRIBUT_PL':
                matchesSubtractFilter = atributPlValue === subtractConfig.filterValue;
                break;
              case 'IME_COD_IMPOZIT':
                matchesSubtractFilter = imeCodeValue === subtractConfig.filterValue;
                break;
              case 'DENUMIRE_IMPOZIT':
                matchesSubtractFilter = denumireValue === subtractConfig.filterValue;
                break;
              default:
                matchesSubtractFilter = true;
            }
            
            if (!matchesSubtractFilter) return;

            // Add to subtraction sum based on selected sum column
            switch (subtractConfig.sumColumn || 'SUMA_PLATA') {
              case 'SUMA_PLATA':
                subtractSum += sumaPlataValue;
                break;
              case 'INCASARI':
                subtractSum += incasariValue;
                break;
              case 'SUMA_NEACHITATA':
                subtractSum += sumaNEValue;
                break;
              case 'RAMBURSARI':
                subtractSum += rambursariValue;
                break;
            }
          });
        }
      });
    }

    console.log(`[DEBUG] ANAF calculation complete for account ${account}: sum=${sum}, subtractSum=${subtractSum}, final=${sum - subtractSum}`);
    return sum - subtractSum;
  };

  const handleCalculateAnafSums = () => {
    if (selectedAnafAccounts.length === 0) {
      setStatus('Please select at least one ANAF account first');
      return;
    }
    
    const newSums = {};
    selectedAnafAccounts.forEach(account => {
      const config = anafAccountConfigs[account] || {};
      const sum = calculateAnafAccountSums(account, startDate, endDate, config);
      newSums[account] = sum;
    });
    
    setAnafAccountSums(newSums);
    setStatus(`Calculated sums for ${selectedAnafAccounts.length} ANAF account(s)`);
  };

  // Helper function to get intersection of two date ranges
  const getDateRangeIntersection = (userStart, userEnd, contaStart, contaEnd) => {
    // Parse dates to Date objects for comparison
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      return new Date(parts[2], parts[1] - 1, parts[0]);
    };
    
    const userStartDate = parseDate(userStart);
    const userEndDate = parseDate(userEnd);
    const contaStartDate = parseDate(contaStart);
    const contaEndDate = parseDate(contaEnd);
    
    // Calculate intersection
    const intersectionStart = !userStartDate ? contaStartDate : 
                             !contaStartDate ? userStartDate :
                             new Date(Math.max(userStartDate.getTime(), contaStartDate.getTime()));
    
    const intersectionEnd = !userEndDate ? contaEndDate :
                           !contaEndDate ? userEndDate :
                           new Date(Math.min(userEndDate.getTime(), contaEndDate.getTime()));
    
    // Format back to DD/MM/YYYY
    const formatDate = (date) => {
      if (!date) return null;
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    return {
      startDate: formatDate(intersectionStart),
      endDate: formatDate(intersectionEnd)
    };
  };

  // Helper function to adjust date interval for ANAF accounts (1 month delayed, day set to 25th)
  const getAnafDateInterval = (contaStartDate, contaEndDate) => {
    if (!contaStartDate || !contaEndDate) return { startDate: null, endDate: null };
    
    // Parse conta dates
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      return new Date(parts[2], parts[1] - 1, parts[0]);
    };
    
    const startDate = parseDate(contaStartDate);
    const endDate = parseDate(contaEndDate);
    
    if (!startDate || !endDate) return { startDate: null, endDate: null };
    
    // Add 1 month to both dates and set day to 25th
    const anafStartDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 25);
    const anafEndDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 25);
    
    // Format back to DD/MM/YYYY
    const formatDate = (date) => {
      if (!date) return null;
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    return {
      startDate: formatDate(anafStartDate),
      endDate: formatDate(anafEndDate)
    };
  };

  // Helper function to determine if an account is a conta account or ANAF account
  const isContaAccount = (accountNumber) => {
    // Check if the account exists as a key in accountMappings (conta accounts)
    return accountMappings.hasOwnProperty(accountNumber);
  };

  const isAnafAccount = (accountNumber) => {
    // Check if the account exists as a value in any accountMappings (ANAF accounts)
    return Object.values(accountMappings).some(anafAccounts => 
      anafAccounts.includes(accountNumber)
    );
  };

  // Function to automatically categorize and move accounts to correct sections
  const categorizeAccount = (accountNumber) => {
    if (isContaAccount(accountNumber)) {
      // Add to conta accounts if not already there
      if (!selectedAccounts.includes(accountNumber)) {
        setSelectedAccounts(prev => [...prev, accountNumber]);
      }
      // Remove from ANAF accounts if it was there by mistake
      if (selectedAnafAccounts.includes(accountNumber)) {
        setSelectedAnafAccounts(prev => prev.filter(acc => acc !== accountNumber));
      }
    } else if (isAnafAccount(accountNumber)) {
      // Add to ANAF accounts if not already there
      if (!selectedAnafAccounts.includes(accountNumber)) {
        setSelectedAnafAccounts(prev => [...prev, accountNumber]);
      }
      // Remove from conta accounts if it was there by mistake
      if (selectedAccounts.includes(accountNumber)) {
        setSelectedAccounts(prev => prev.filter(acc => acc !== accountNumber));
      }
    }
  };

  // Auto-categorize accounts when mappings change
  useEffect(() => {
    const allSelectedAccounts = [...selectedAccounts, ...selectedAnafAccounts];
    let needsRecategorization = false;
    
    allSelectedAccounts.forEach(account => {
      const shouldBeContaAccount = isContaAccount(account);
      const shouldBeAnafAccount = isAnafAccount(account);
      const isInContaSection = selectedAccounts.includes(account);
      const isInAnafSection = selectedAnafAccounts.includes(account);
      
      if (shouldBeContaAccount && !isInContaSection) {
        needsRecategorization = true;
      } else if (shouldBeAnafAccount && !isInAnafSection) {
        needsRecategorization = true;
      }
    });
    
    if (needsRecategorization) {
      console.log('[DEBUG] Auto-categorizing accounts based on relations');
      allSelectedAccounts.forEach(account => {
        categorizeAccount(account);
      });
    }
  }, [accountMappings, selectedAccounts, selectedAnafAccounts]);

  // Unified calculation for both Conta and ANAF accounts
  const handleCalculateAllSums = () => {
    console.log('[DEBUG] Starting handleCalculateAllSums');
    console.log('[DEBUG] selectedAccounts:', selectedAccounts);
    console.log('[DEBUG] selectedAnafAccounts:', selectedAnafAccounts);
    
    // First, automatically categorize any misplaced accounts
    const allSelectedAccounts = [...selectedAccounts, ...selectedAnafAccounts];
    allSelectedAccounts.forEach(account => {
      categorizeAccount(account);
    });
    
    let totalCalculated = 0;
    
    // Calculate Conta sums if any conta accounts are selected
    if (selectedAccounts.length > 0) {
      const newContaSums = {};
      selectedAccounts.forEach(account => {
        // Get the conta account's date range from its transactions
        const contaDateRange = getContaAccountDateRange(account);
        
        // Calculate intersection with user-provided date range
        const effectiveDateRange = contaDateRange ? 
          getDateRangeIntersection(startDate, endDate, contaDateRange.startDate, contaDateRange.endDate) :
          { startDate, endDate };
        
        const sum = calculateAccountSums(account, effectiveDateRange.startDate, effectiveDateRange.endDate);
        newContaSums[account] = sum;
        totalCalculated++;
      });
      setAccountSums(newContaSums);
    }
    
    // Calculate ANAF sums using synchronized date intervals with their related conta accounts
    if (selectedAnafAccounts.length > 0) {
      const newAnafSums = {};
      selectedAnafAccounts.forEach(anafAccount => {
        // Find the conta account that this ANAF account is related to
        const relatedContaAccount = Object.keys(accountMappings).find(contaAccount => 
          accountMappings[contaAccount].includes(anafAccount)
        );
        
        let effectiveDateRange = { startDate, endDate };
        
        if (relatedContaAccount && selectedAccounts.includes(relatedContaAccount)) {
          // Get the conta account's date range from its transactions
          const contaDateRange = getContaAccountDateRange(relatedContaAccount);
          
          if (contaDateRange) {
            // First get intersection of user date range and conta date range
            const contaEffectiveRange = getDateRangeIntersection(
              startDate, endDate, 
              contaDateRange.startDate, contaDateRange.endDate
            );
            
            // Then adjust for ANAF: 1 month delayed with day set to 25th
            effectiveDateRange = getAnafDateInterval(
              contaEffectiveRange.startDate, 
              contaEffectiveRange.endDate
            );
          }
        }
        
        const config = getAnafAccountConfig(anafAccount);
        const sum = calculateAnafAccountSums(anafAccount, effectiveDateRange.startDate, effectiveDateRange.endDate, config);
        newAnafSums[anafAccount] = sum;
        totalCalculated++;
      });
      setAnafAccountSums(newAnafSums);
    }
    
    if (totalCalculated === 0) {
      setStatus('Please select at least one account (Conta or ANAF) first');
      return;
    }
    
    const contaCount = selectedAccounts.length;
    const anafCount = selectedAnafAccounts.length;
    let statusMessage = `Calculated sums for `;
    
    if (contaCount > 0 && anafCount > 0) {
      statusMessage += `${contaCount} Conta account${contaCount !== 1 ? 's' : ''} and ${anafCount} ANAF account${anafCount !== 1 ? 's' : ''} (ANAF dates: +1 month, day 25)`;
    } else if (contaCount > 0) {
      statusMessage += `${contaCount} Conta account${contaCount !== 1 ? 's' : ''}`;
    } else {
      statusMessage += `${anafCount} ANAF account${anafCount !== 1 ? 's' : ''}`;
    }
    
    setStatus(statusMessage);
  };

  // Close context menu when clicking elsewhere
  const handleDocumentClick = () => {
    if (contextMenu) {
      setContextMenu(null);
      setFilterDropdownOpen(false);
      setSumDropdownOpen(false);
    }
    if (anafContextMenu) {
      setAnafContextMenu(null);
      setAnafFilterDropdownOpen(false);
      setAnafSumDropdownOpen(false);
      setAnafSubtractFilterDropdownOpen(false);
      setAnafSubtractSumDropdownOpen(false);
      setAnafFilterValueDropdownOpen(false);
      setAnafSubtractFilterValueDropdownOpen(false);
    }
    if (mappingContextMenu) {
      setMappingContextMenu(null);
    }
  };

  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleCalculateSums = () => {
    if (selectedAccounts.length === 0) {
      setStatus('Please select at least one account first');
      return;
    }
    
    const newSums = {};
    selectedAccounts.forEach(account => {
      const sum = calculateAccountSums(account, startDate, endDate);
      newSums[account] = sum;
    });
    
    setAccountSums({
      ...accountSums,
      ...newSums
    });
    
    const dateRangeInfo = (startDate || endDate) 
      ? ` (${startDate || 'start'} → ${endDate || 'end'})` 
      : '';
    setStatus(`Calculated sums for ${selectedAccounts.length} account(s)${dateRangeInfo}`);
  };

  const handleSelectContabilitateFiles = async (append = false) => {
    try {
      const filePaths = await window.electronAPI.selectExcelFiles();
      if (filePaths.length > 0) {
        let newFilePaths = filePaths;
        let newData = [];
        
        if (append && contabilitateFiles.length > 0) {
          // Filter out files that are already selected
          const existingPaths = contabilitateFiles.map(file => file.filePath.toLowerCase());
          newFilePaths = filePaths.filter(path => !existingPaths.includes(path.toLowerCase()));
          
          if (newFilePaths.length === 0) {
            setStatus('All selected files are already uploaded to Contabilitate');
            return;
          }
          
          setStatus(`Adding ${newFilePaths.length} new files to Contabilitate...`);
          newData = await window.electronAPI.readExcelFiles(newFilePaths);
          
          // Combine with existing data
          setContabilitateFiles([...contabilitateFiles, ...newData]);
          setSelectedFileIndices(new Set());
          setStatus(`${contabilitateFiles.length + newData.length} Contabilitate files loaded successfully (${newData.length} added)`);
        } else {
          // Replace existing files
          setSelectedFileIndices(new Set());
          setStatus('Contabilitate files selected. Reading data...');
          
          newData = await window.electronAPI.readExcelFiles(newFilePaths);
          setContabilitateFiles(newData);
          setStatus(`${newData.length} Contabilitate files loaded successfully`);
        }
        
        // Extract column names from Contabilitate files
        await extractContabilitateColumnNames();
        
        // Process conta files for uniform structure (use the correct data)
        await processContaFiles(append ? [...contabilitateFiles, ...newData] : newData);
      }
    } catch (error) {
      setStatus(`Error selecting files: ${error.message}`);
    }
  };

  const handleSelectAnafFiles = async (append = false) => {
    try {
      const filePaths = await window.electronAPI.selectExcelFiles();
      if (filePaths.length > 0) {
        let newFilePaths = filePaths;
        let newData = [];
        
        if (append && anafFiles.length > 0) {
          // Filter out files that are already selected
          const existingPaths = anafFiles.map(file => file.filePath.toLowerCase());
          newFilePaths = filePaths.filter(path => !existingPaths.includes(path.toLowerCase()));
          
          if (newFilePaths.length === 0) {
            setStatus('All selected files are already uploaded to ANAF');
            return;
          }
          
          setStatus(`Adding ${newFilePaths.length} new files to ANAF...`);
          newData = await window.electronAPI.readExcelFiles(newFilePaths);
          
          // Combine with existing data
          setAnafFiles([...anafFiles, ...newData]);
          setSelectedAnafFileIndices(new Set());
          setStatus(`${anafFiles.length + newData.length} ANAF files loaded successfully (${newData.length} added)`);
        } else {
          // Replace existing files
          setSelectedAnafFileIndices(new Set());
          setStatus('ANAF files selected. Reading data...');
          
          newData = await window.electronAPI.readExcelFiles(newFilePaths);
          setAnafFiles(newData);
          setStatus(`${newData.length} ANAF files loaded successfully`);
        }
        
        // Extract column names from ANAF files (main processing batch)
        await extractAnafColumnNames();
        
        // Auto-select all found ANAF accounts
        autoSelectFoundAnafAccounts(append ? [...anafFiles, ...newData] : newData);
      }
    } catch (error) {
      setStatus(`Error selecting ANAF files: ${error.message}`);
    }
  };

  const handleFileClick = (index, event) => {
    const newSelected = new Set(selectedFileIndices);
    
    if (event.ctrlKey || event.metaKey) {
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
    } else if (event.shiftKey && selectedFileIndices.size > 0) {
      const indices = Array.from(selectedFileIndices);
      const lastSelected = Math.max(...indices);
      const start = Math.min(lastSelected, index);
      const end = Math.max(lastSelected, index);
      
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else {
      newSelected.clear();
      newSelected.add(index);
    }
    
    setSelectedFileIndices(newSelected);
  };

  const handleAnafFileClick = (index, event) => {
    const newSelected = new Set(selectedAnafFileIndices);
    
    if (event.ctrlKey || event.metaKey) {
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
    } else if (event.shiftKey && selectedAnafFileIndices.size > 0) {
      const indices = Array.from(selectedAnafFileIndices);
      const lastSelected = Math.max(...indices);
      const start = Math.min(lastSelected, index);
      const end = Math.max(lastSelected, index);
      
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else {
      newSelected.clear();
      newSelected.add(index);
    }
    
    setSelectedAnafFileIndices(newSelected);
  };

  const handleDeleteSelectedContabilitate = () => {
    if (selectedFileIndices.size === 0) return;
    
    const newContabilitateFiles = contabilitateFiles.filter((_, index) => !selectedFileIndices.has(index));
    
    setContabilitateFiles(newContabilitateFiles);
    setSelectedFileIndices(new Set());
    setStatus(`Deleted ${selectedFileIndices.size} Contabilitate files remaining.`);
  };

  const handleDeleteSelectedAnaf = () => {
    if (selectedAnafFileIndices.size === 0) return;
    
    const newAnafFiles = anafFiles.filter((_, index) => !selectedAnafFileIndices.has(index));
    
    setAnafFiles(newAnafFiles);
    setSelectedAnafFileIndices(new Set());
    setStatus(`Deleted ${selectedAnafFileIndices.size} ANAF files remaining.`);
  };

  const selectAllContabilitateFiles = () => {
    const allIndices = new Set(contabilitateFiles.map((_, index) => index));
    setSelectedFileIndices(allIndices);
  };

  const selectAllAnafFiles = () => {
    const allIndices = new Set(anafFiles.map((_, index) => index));
    setSelectedAnafFileIndices(allIndices);
  };

  const deselectAllContabilitateFiles = () => {
    setSelectedFileIndices(new Set());
  };

  const deselectAllAnafFiles = () => {
    setSelectedAnafFileIndices(new Set());
  };


  const handleDeleteSelected = () => {
    handleDeleteSelectedContabilitate();
  };



  const handleGenerateSummary = async () => {
    if (anafFiles.length === 0) {
      setStatus('Please select ANAF files first');
      return;
    }
    
    if (anafCommonLines < 0 || anafCommonLines > 100) {
      setStatus('Please enter a valid number of common lines (0-100)');
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('Choosing save location...');
      
      const outputPath = await window.electronAPI.saveFileDialog();
      if (!outputPath) {
        setStatus('Save cancelled');
        setIsProcessing(false);
        return;
      }

      setStatus('Generating summary and processing ANAF files...');
      
      // Generate summary that includes data from both batches
      const summaryData = {
        contabilitateFiles: contabilitateFiles,
        anafFiles: anafFiles,
        totalFiles: contabilitateFiles.length + anafFiles.length,
        contabilitateRowCount: contabilitateFiles.reduce((total, file) => total + file.rowCount, 0),
        anafRowCount: anafFiles.reduce((total, file) => total + file.rowCount, 0)
      };
      
      // Process only ANAF files for file generation
      const result = await window.electronAPI.mergeAndSaveExcel({
        filesData: anafFiles,
        commonLines: parseInt(anafCommonLines),
        outputPath,
        dateColumnIndices: anafSelectedDateColumns,
        dateColumnsWithTime: anafDateColumnsWithTime,
        columnNamesRow: parseInt(anafColumnNamesRow)
      });

      if (result.success) {
        setCreatedFilePath(result.outputPath);
        // Enhanced summary with both batch information
        const enhancedSummary = {
          ...result.summary,
          contabilitateInfo: summaryData,
          processedBatch: 'ANAF'
        };
        setProcessingSummary(enhancedSummary);
        setStatus(`Successfully created merged file: ${result.outputPath}`);
      } else {
        setStatus(`Error merging files: ${result.error}`);
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenFile = async () => {
    if (createdFilePath) {
      try {
        await window.electronAPI.openFile(createdFilePath);
        setStatus('File opened successfully');
      } catch (error) {
        setStatus(`Error opening file: ${error.message}`);
      }
    }
  };

  const handleDownloadFile = async () => {
    if (createdFilePath) {
      try {
        // For Electron apps, we can show the file in Explorer/Finder
        await window.electronAPI.showItemInFolder(createdFilePath);
        setStatus('File location opened');
      } catch (error) {
        // Fallback to opening the file if showItemInFolder is not available
        try {
          await window.electronAPI.openFile(createdFilePath);
          setStatus('File opened successfully');
        } catch (openError) {
          setStatus(`Error accessing file: ${error.message}`);
        }
      }
    }
  };

  const resetApp = () => {
    setContabilitateFiles([]);
    setAnafFiles([]);
    setSelectedFileIndices(new Set());
    setSelectedAnafFileIndices(new Set());
    // Clear Contabilitate batch state
    setContabilitateColumnNames([]);
    setContabilitateSelectedDateColumns([]);
    setContabilitateAutoDetectedDateColumns([]);
    setContabilitateDateColumnsWithTime([]);
    // Clear ANAF batch state
    setAnafColumnNames([]);
    setAnafSelectedDateColumns([]);
    setAnafAutoDetectedDateColumns([]);
    setAnafDateColumnsWithTime([]);
    // Clear Conta processing state
    setProcessedContaFiles([]);
    setSelectedAccounts([]);
    // Clear ANAF account selections and state (but preserve configurations)
    setSelectedAnafAccounts([]);
    setAnafAccountSums({});
    setAnafContextMenu(null);
    // Note: Keep anafAccountConfigs and anafSubtractionEnabled to preserve filter settings
    // Preserve date selection - don't reset startDate and endDate
    setAccountSums({});
    setShowAccountInput(false);
    setNewAccountInput('');
    setContextMenu(null);
    setCreatedFilePath('');
    setStatus('');
    setProcessingSummary(null);
    setIsProcessing(false);
  };

  // Grid snapping function
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Calculate minimum size based on content
  const getMinimumSize = (elementId, elementType) => {
    if (elementType === 'button') {
      return { width: DEFAULT_BUTTON_SIZE, height: DEFAULT_BUTTON_SIZE };
    }
    
    // Base minimum for panels
    let minWidth = DEFAULT_PANEL_WIDTH;
    let minHeight = DEFAULT_PANEL_HEIGHT;
    
    // Adjust based on content requirements
    if (elementId === 'contabilitate-upload-panel' || elementId === 'anaf-upload-panel') {
      minWidth = Math.max(minWidth, 280);
      minHeight = Math.max(minHeight, 200);
    } else if (elementId === 'final-summary-panel') {
      // 3 stat items + View Summary button + Download/Open buttons + all padding
      minWidth = Math.max(minWidth, 400);
      minHeight = Math.max(minHeight, 300);
    } else if (elementId === 'anaf-header-panel') {
      // 2 input groups with labels and input fields - need full height for both sections
      minWidth = Math.max(minWidth, 420);
      minHeight = Math.max(minHeight, 180);
    } else if (elementId === 'anaf-date-panel') {
      // Date column buttons need space for multiple columns
      minWidth = Math.max(minWidth, 300);
      minHeight = Math.max(minHeight, 200);
    } else if (elementId === 'account-selection-panel') {
      // Account selection chips for both Conta and ANAF, date inputs, and calculate buttons
      minWidth = Math.max(minWidth, 300);
      minHeight = Math.max(minHeight, 400);
    } else if (elementId === 'account-mapping-panel') {
      // Account mapping interface with conta to anaf mappings
      minWidth = Math.max(minWidth, 350);
      minHeight = Math.max(minHeight, 300);
    } else if (elementId === 'sums-panel') {
      // Account sum display and clear button
      minWidth = Math.max(minWidth, 240);
      minHeight = Math.max(minHeight, 180);
    } else if (elementId === 'contabilitate-summary-panel' || elementId === 'anaf-summary-panel') {
      // File count/rows display + View Files button
      minWidth = Math.max(minWidth, 280);
      minHeight = Math.max(minHeight, 180);
    }
    
    return { width: minWidth, height: minHeight };
  };

  // Matrix-based collision detection
  const checkCollisionMatrix = (elementId, worldX, worldY, width, height, useInitialPosition = false) => {
    if (!collisionMatrix) {
      return false; // No matrix available, allow movement
    }
    
    // Convert world coordinates to matrix coordinates
    const matrixX = worldX - workspaceBounds.minX;
    const matrixY = worldY - workspaceBounds.minY;
    
    // Create temporary matrix copy to test the move
    const tempMatrix = new CollisionMatrix(collisionMatrix.width, collisionMatrix.height);
    
    // Copy current matrix state
    for (let row = 0; row < collisionMatrix.rows; row++) {
      for (let col = 0; col < collisionMatrix.cols; col++) {
        tempMatrix.matrix[row][col] = collisionMatrix.matrix[row][col];
      }
    }
    
    // Clear the element from its original position during drag operations
    let clearX, clearY, clearWidth, clearHeight;
    
    if (useInitialPosition && draggedElement && draggedElement.id === elementId) {
      // During drag: use the initial position that was stored at drag start
      clearX = initialPanelPosition.x;
      clearY = initialPanelPosition.y;
      const currentPos = panelPositions[elementId];
      clearWidth = currentPos?.width || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
      clearHeight = currentPos?.height || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
    } else {
      // Normal operation: use current position
      const currentPos = panelPositions[elementId];
      if (!currentPos) return false;
      
      clearX = currentPos.x || 0;
      clearY = currentPos.y || 0;
      clearWidth = currentPos.width || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
      clearHeight = currentPos.height || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
    }
    
    // Convert to matrix coordinates and clear the original position
    const clearMatrixX = clearX - workspaceBounds.minX;
    const clearMatrixY = clearY - workspaceBounds.minY;
    
    if (clearMatrixX >= 0 && clearMatrixY >= 0) {
      tempMatrix.setCells(clearMatrixX, clearMatrixY, clearWidth, clearHeight, 0);
    }
    
    // Check if the new position would be valid
    return !tempMatrix.checkPositionWithExpansion(matrixX, matrixY, width, height);
  };

  // Simple and reliable AABB collision detection
  const checkCollision = (elementId, x, y, width, height) => {
    // Check collision against all other panels (exclude the element being checked)
    for (const [otherId, otherPos] of Object.entries(panelPositions)) {
      if (otherId === elementId) continue; // Skip self
      
      const otherX = otherPos.x || 0;
      const otherY = otherPos.y || 0;
      const otherWidth = otherPos.width || DEFAULT_PANEL_WIDTH;
      const otherHeight = otherPos.height || DEFAULT_PANEL_HEIGHT;
      
      // AABB collision detection
      const separated = (
        x >= otherX + otherWidth ||
        x + width <= otherX ||
        y >= otherY + otherHeight ||
        y + height <= otherY
      );
      
      if (!separated) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  };

  // Get board boundaries accounting for CSS padding
  const getBoardBoundaries = () => {
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) {
      return { width: 1200, height: 800 }; // fallback
    }
    
    // Account for CSS padding: 60px 20px 20px 20px (top right bottom left)
    const availableWidth = boardRect.width - 40; // left(20) + right(20) padding
    const availableHeight = boardRect.height - 80; // top(60) + bottom(20) padding
    
    return { 
      width: Math.max(0, availableWidth), 
      height: Math.max(0, availableHeight) 
    };
  };

  // No boundary clamping - allow placement anywhere in workspace
  // Objects can be placed outside initial viewport via dynamic boundaries

  // Find valid position without collision using spiral search with matrix expansion
  const findValidPosition = (elementId, preferredX, preferredY, width, height) => {
    // Try preferred position first
    let x = snapToGrid(preferredX);
    let y = snapToGrid(preferredY);
    
    if (!checkCollision(elementId, x, y, width, height)) {
      return { x, y };
    }
    
    // Search for valid position in a spiral pattern within extended boundaries
    const maxSearchRadius = Math.max(workspaceBounds.maxX - workspaceBounds.minX, workspaceBounds.maxY - workspaceBounds.minY) / 2;
    
    for (let radius = GRID_SIZE; radius < maxSearchRadius; radius += GRID_SIZE) {
      for (let angle = 0; angle < 360; angle += 45) {
        const testX = snapToGrid(x + Math.cos(angle * Math.PI / 180) * radius);
        const testY = snapToGrid(y + Math.sin(angle * Math.PI / 180) * radius);
        
        // Allow positions within extended boundaries
        if (testX >= workspaceBounds.minX && testX + width <= workspaceBounds.maxX &&
            testY >= workspaceBounds.minY && testY + height <= workspaceBounds.maxY &&
            !checkCollision(elementId, testX, testY, width, height)) {
          return { x: testX, y: testY };
        }
      }
    }
    
    // Fallback: find next available grid position within extended boundaries
    if (collisionMatrix) {
      const startX = workspaceBounds.minX;
      const startY = workspaceBounds.minY;
      const endX = workspaceBounds.maxX - width;
      const endY = workspaceBounds.maxY - height;
      
      for (let testY = startY; testY < endY; testY += GRID_SIZE) {
        for (let testX = startX; testX < endX; testX += GRID_SIZE) {
          if (!checkCollision(elementId, testX, testY, width, height)) {
            return { x: testX, y: testY };
          }
        }
      }
    }
    
    // Final fallback - place in workspace center
    const centerX = (workspaceBounds.minX + workspaceBounds.maxX) / 2;
    const centerY = (workspaceBounds.minY + workspaceBounds.maxY) / 2;
    return { x: snapToGrid(centerX), y: snapToGrid(centerY) };
  };

  // Calculate workspace boundaries based on all object positions
  const calculateWorkspaceBounds = () => {
    const { width: viewportWidth, height: viewportHeight } = getBoardBoundaries();
    
    let minX = 0;
    let maxX = viewportWidth;
    let minY = 0;
    let maxY = viewportHeight;
    
    // Calculate core bounds from active panels and buttons only
    Object.entries(panelPositions).filter(([elementId]) => {
      // Exclude ANAF header and date panels from workspace calculations
      if (elementId === 'anaf-header-panel' || elementId === 'anaf-date-panel') {
        return false;
      }
      // Only include panels that are in the availablePanels list and active, or buttons
      const panel = availablePanels.find(p => p.id === elementId);
      const button = availableButtons.find(b => b.id === elementId);
      return (panel && panel.active) || button;
    }).forEach(([elementId, pos]) => {
      const x = pos.x || 0;
      const y = pos.y || 0;
      const width = pos.width || DEFAULT_PANEL_WIDTH;
      const height = pos.height || DEFAULT_PANEL_HEIGHT;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    
    // Add buffer around objects for core workspace
    const buffer = GRID_SIZE * 5;
    const coreMinX = minX - buffer;
    const coreMinY = minY - buffer;
    const coreMaxX = maxX + buffer;
    const coreMaxY = maxY + buffer;
    
    // Calculate core workspace dimensions
    const coreWidth = coreMaxX - coreMinX;
    const coreHeight = coreMaxY - coreMinY;
    
    // Create extended boundaries: 3x the core dimensions in each direction
    const extendedMinX = coreMinX - (coreWidth * 2); // 2x additional on left (total 3x)
    const extendedMaxX = coreMaxX + (coreWidth * 2); // 2x additional on right (total 3x)
    const extendedMinY = coreMinY - (coreHeight * 2); // 2x additional on top (total 3x)
    const extendedMaxY = coreMaxY + (coreHeight * 2); // 2x additional on bottom (total 3x)
    
    return { 
      minX: extendedMinX, 
      maxX: extendedMaxX, 
      minY: extendedMinY, 
      maxY: extendedMaxY,
      // Store core bounds for reference
      coreMinX,
      coreMaxX,
      coreMinY,
      coreMaxY
    };
  };

  // Update workspace boundaries
  const updateWorkspaceBounds = () => {
    const newBounds = calculateWorkspaceBounds();
    setWorkspaceBounds(newBounds);
    return newBounds;
  };

  // Center view on the actual panel positions
  const centerViewOnWorkspace = () => {
    const { width: viewportWidth, height: viewportHeight } = getBoardBoundaries();
    
    // Calculate the actual bounds of all panels based on current positions
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    Object.values(panelPositions).forEach(pos => {
      const x = pos.x || 0;
      const y = pos.y || 0;
      const width = pos.width || DEFAULT_PANEL_WIDTH;
      const height = pos.height || DEFAULT_PANEL_HEIGHT;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    
    // If no panels exist, use default center
    if (!isFinite(minX)) {
      setPanOffset({ x: 0, y: 0 });
      return { x: 0, y: 0 };
    }
    
    // Calculate the center of all panels
    const panelsCenterX = (minX + maxX) / 2;
    const panelsCenterY = (minY + maxY) / 2;
    
    // Calculate pan offset to center the panels in the viewport
    const centeredPanX = -(panelsCenterX - viewportWidth / 2);
    const centeredPanY = -(panelsCenterY - viewportHeight / 2);
    
    // Apply different constraints based on mode
    let maxPanX, maxPanY, minPanX, minPanY;
    
    if (isLayoutMode) {
      // Layout mode: Use extended workspace boundaries
      const bounds = calculateWorkspaceBounds();
      maxPanX = -bounds.minX;
      maxPanY = -bounds.minY;
      minPanX = -(bounds.maxX - viewportWidth);
      minPanY = -(bounds.maxY - viewportHeight);
    } else {
      // Normal mode: Use tight bounds around panels only
      const normalModeBuffer = GRID_SIZE * 2;
      const workspaceMinX = minX - normalModeBuffer;
      const workspaceMinY = minY - normalModeBuffer;
      const workspaceMaxX = maxX + normalModeBuffer;
      const workspaceMaxY = maxY + normalModeBuffer;
      
      maxPanX = -workspaceMinX;
      maxPanY = -workspaceMinY;
      minPanX = -(workspaceMaxX - viewportWidth);
      minPanY = -(workspaceMaxY - viewportHeight);
    }
    
    const constrainedX = Math.max(minPanX, Math.min(maxPanX, centeredPanX));
    const constrainedY = Math.max(minPanY, Math.min(maxPanY, centeredPanY));
    
    setPanOffset({ x: constrainedX, y: constrainedY });
    
    return { x: constrainedX, y: constrainedY };
  };

  // Normalize workspace coordinates to center around (0,0)
  const normalizeWorkspaceCoordinates = () => {
    // Calculate the center of the current workspace
    const centerX = (workspaceBounds.minX + workspaceBounds.maxX) / 2;
    const centerY = (workspaceBounds.minY + workspaceBounds.maxY) / 2;
    
    // Normalize all panel positions by subtracting the center
    const normalizedPositions = {};
    Object.entries(panelPositions).forEach(([elementId, pos]) => {
      normalizedPositions[elementId] = {
        ...pos,
        x: (pos.x || 0) - centerX,
        y: (pos.y || 0) - centerY
      };
    });
    
    // Normalize workspace bounds to center around (0,0)
    const width = workspaceBounds.maxX - workspaceBounds.minX;
    const height = workspaceBounds.maxY - workspaceBounds.minY;
    const normalizedBounds = {
      minX: -width / 2,
      maxX: width / 2,
      minY: -height / 2,
      maxY: height / 2
    };
    
    // Update pan offset to maintain visual continuity
    // The pan offset needs to be adjusted by the center offset
    const newPanOffset = {
      x: panOffset.x + centerX,
      y: panOffset.y + centerY
    };
    
    return {
      normalizedPositions,
      normalizedBounds,
      centerOffset: { x: centerX, y: centerY },
      newPanOffset
    };
  };

  // Get visual position for a panel (drag position if dragging, otherwise normal position)
  const getVisualPosition = (elementId) => {
    if (dragVisualPosition && dragVisualPosition.elementId === elementId) {
      return {
        x: dragVisualPosition.x,
        y: dragVisualPosition.y,
        width: dragVisualPosition.width,
        height: dragVisualPosition.height
      };
    }
    
    const normalPos = panelPositions[elementId] || {};
    return {
      x: normalPos.x || 0,
      y: normalPos.y || 0,
      width: normalPos.width || DEFAULT_PANEL_WIDTH,
      height: normalPos.height || DEFAULT_PANEL_HEIGHT
    };
  };

  // Save layout settings
  const saveLayoutSettings = async (customPositions = null, customBounds = null) => {
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        panelPositions: customPositions || panelPositions,
        workspaceBounds: customBounds || workspaceBounds,
        normalModeViewPosition
      });
    } catch (error) {
      console.error('Failed to save layout settings:', error);
    }
  };

  // Save normal mode view position
  const saveNormalModeViewPosition = async (position = null) => {
    try {
      const settings = await window.electronAPI.loadSettings();
      const positionToSave = position || panOffset;
      setNormalModeViewPosition(positionToSave);
      await window.electronAPI.saveSettings({
        ...settings,
        normalModeViewPosition: positionToSave
      });
    } catch (error) {
      console.error('Failed to save normal mode view position:', error);
    }
  };

  // Rebuild collision matrix from current panel positions
  const rebuildCollisionMatrix = () => {
    if (!collisionMatrix) return null;
    
    // Clear the entire matrix
    for (let row = 0; row < collisionMatrix.rows; row++) {
      for (let col = 0; col < collisionMatrix.cols; col++) {
        collisionMatrix.matrix[row][col] = 0;
      }
    }
    
    // Repopulate matrix with active panel positions only
    Object.entries(panelPositions).filter(([elementId]) => {
      // Include ANAF header and date panels in collision detection when in layout mode
      if ((elementId === 'anaf-header-panel' || elementId === 'anaf-date-panel') && isLayoutMode) {
        return true;
      }
      // Only include panels that are in the availablePanels list and active, or buttons
      const panel = availablePanels.find(p => p.id === elementId);
      const button = availableButtons.find(b => b.id === elementId);
      return (panel && panel.active) || button;
    }).forEach(([elementId, pos]) => {
      const x = (pos.x || 0) - workspaceBounds.minX;
      const y = (pos.y || 0) - workspaceBounds.minY;
      const width = pos.width || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
      const height = pos.height || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
      
      if (x >= 0 && y >= 0) {
        // Expand matrix if needed
        const requiredWidth = x + width + GRID_SIZE * 2;
        const requiredHeight = y + height + GRID_SIZE * 2;
        if (requiredWidth > collisionMatrix.width || requiredHeight > collisionMatrix.height) {
          collisionMatrix.expandMatrix(requiredWidth, requiredHeight);
        }
        
        collisionMatrix.setCells(x, y, width, height, 1);
      }
    });
    
    return collisionMatrix;
  };

  // Initialize collision matrix with current panel positions
  const initializeCollisionMatrix = () => {
    // Calculate initial workspace bounds
    const bounds = calculateWorkspaceBounds();
    setWorkspaceBounds(bounds);
    
    // Create matrix large enough to cover extended workspace boundaries
    const matrixWidth = bounds.maxX - bounds.minX;
    const matrixHeight = bounds.maxY - bounds.minY;
    
    const matrix = new CollisionMatrix(matrixWidth, matrixHeight);
    
    // Populate matrix with active panels and buttons only
    // Adjust coordinates to matrix space (subtract minX, minY offset)
    Object.entries(panelPositions).filter(([elementId]) => {
      // Include ANAF header and date panels in collision detection when in layout mode
      if ((elementId === 'anaf-header-panel' || elementId === 'anaf-date-panel') && isLayoutMode) {
        return true;
      }
      // Only include panels that are in the availablePanels list and active, or buttons
      const panel = availablePanels.find(p => p.id === elementId);
      const button = availableButtons.find(b => b.id === elementId);
      return (panel && panel.active) || button;
    }).forEach(([elementId, pos]) => {
      const x = (pos.x || 0) - bounds.minX;
      const y = (pos.y || 0) - bounds.minY;
      const width = pos.width || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
      const height = pos.height || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
      
      if (x >= 0 && y >= 0) {
        matrix.setCells(x, y, width, height, 1);
      }
    });
    
    setCollisionMatrix(matrix);
    return matrix;
  };


  // Toggle layout mode
  const toggleLayoutMode = async () => {
    const newLayoutMode = !isLayoutMode;
    
    if (newLayoutMode) {
      // Save current normal mode view position before entering layout mode
      await saveNormalModeViewPosition();
      
      setIsLayoutMode(newLayoutMode);
      
      // Initialize collision matrix when entering layout mode
      const matrix = initializeCollisionMatrix();
      
      // Rebuild the matrix to ensure it's in sync with current panel positions
      setTimeout(() => {
        rebuildCollisionMatrix();
      }, 10);
      
      // Center the view on the workspace when entering layout mode
      setTimeout(() => {
        centerViewOnWorkspace();
      }, 50);
    } else {
      // When exiting layout mode, normalize coordinates and calculate normal mode view
      const normalization = normalizeWorkspaceCoordinates();
      
      // Calculate what the normal mode view position should be
      const normalModePosition = centerViewOnWorkspace();
      
      // Save the normalized layout and calculated normal mode position
      await saveLayoutSettings(normalization.normalizedPositions, normalization.normalizedBounds);
      await saveNormalModeViewPosition(normalModePosition);
      
      setIsLayoutMode(newLayoutMode);
      
      // Apply normalized positions and bounds to state
      setPanelPositions(normalization.normalizedPositions);
      setWorkspaceBounds(normalization.normalizedBounds);
      
      setCollisionMatrix(null);
      
      // Set the view to normal mode position after a delay
      setTimeout(() => {
        setPanOffset(normalModePosition);
        // Update the stored normal mode position to match what we just set
        setNormalModeViewPosition(normalModePosition);
      }, 150);
      
      console.log(`Workspace normalized: center was at (${normalization.centerOffset.x.toFixed(1)}, ${normalization.centerOffset.y.toFixed(1)}), now at (0, 0)`);
      console.log(`Normal mode view position calculated: (${normalModePosition.x.toFixed(1)}, ${normalModePosition.y.toFixed(1)})`);
    }
  };


  // Convert screen coordinates to board coordinates
  const screenToBoardCoords = (screenX, screenY) => {
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return { x: screenX, y: screenY };
    
    // Account for board padding: 60px top, 20px left (from CSS)
    const BOARD_PADDING_LEFT = 20;
    const BOARD_PADDING_TOP = 60;
    
    // Convert screen coordinates to board viewport coordinates
    const viewportX = screenX - boardRect.left - BOARD_PADDING_LEFT;
    const viewportY = screenY - boardRect.top - BOARD_PADDING_TOP;
    
    // Convert viewport coordinates directly to board coordinates
    const scaledViewportX = viewportX;
    const scaledViewportY = viewportY;
    
    // Convert viewport coordinates to absolute board coordinates
    const boardX = scaledViewportX - panOffset.x;
    const boardY = scaledViewportY - panOffset.y;
    
    return { x: boardX, y: boardY };
  };

  // Convert board coordinates to screen coordinates
  const boardToScreenCoords = (boardX, boardY) => {
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return { x: boardX, y: boardY };
    
    // Account for board padding: 60px top, 20px left (from CSS)
    const BOARD_PADDING_LEFT = 20;
    const BOARD_PADDING_TOP = 60;
    
    // Convert board coordinates to viewport coordinates
    const viewportX = boardX + panOffset.x;
    const viewportY = boardY + panOffset.y;
    
    // Convert viewport coordinates directly to screen coordinates
    const scaledViewportX = viewportX;
    const scaledViewportY = viewportY;
    
    // Convert viewport coordinates to screen coordinates
    const screenX = scaledViewportX + boardRect.left + BOARD_PADDING_LEFT;
    const screenY = scaledViewportY + boardRect.top + BOARD_PADDING_TOP;
    
    return { x: screenX, y: screenY };
  };


  // Handle drag start for panels and buttons
  const handleDragStart = (e, element) => {
    if (!isLayoutMode) return;
    
    setDraggedElement(element);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    
    // Create transparent drag image
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Convert mouse position to board coordinates
    const mouseBoard = screenToBoardCoords(e.clientX, e.clientY);
    setInitialDragPosition(mouseBoard);
    
    // Get element's position in board coordinates (this is what's stored in panelPositions)
    const currentPos = panelPositions[element.id] || {};
    const elementBoardX = currentPos.x || 0;
    const elementBoardY = currentPos.y || 0;
    
    // Store initial panel position for collision matrix cleanup
    setInitialPanelPosition({ x: elementBoardX, y: elementBoardY });
    
    // Calculate offset from mouse to element in board coordinates
    const offsetX = mouseBoard.x - elementBoardX;
    const offsetY = mouseBoard.y - elementBoardY;
    setDragOffset({ x: offsetX, y: offsetY });
    
    e.target.classList.add('dragging');
  };

  // Handle drag over with modern boundary clamping and collision detection
  const handleDragOver = (e) => {
    if (!isLayoutMode || !draggedElement) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Convert current mouse position to board coordinates
    const mouseBoard = screenToBoardCoords(e.clientX, e.clientY);
    
    // Calculate new element position by subtracting the drag offset (all in board coordinates)
    const elementX = mouseBoard.x - dragOffset.x;
    const elementY = mouseBoard.y - dragOffset.y;
    
    const currentPos = panelPositions[draggedElement.id] || {};
    const width = currentPos.width || (draggedElement.type === 'button' ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
    const height = currentPos.height || (draggedElement.type === 'button' ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
    
    // Snap to grid - no boundary clamping needed
    const snappedX = snapToGrid(elementX);
    const snappedY = snapToGrid(elementY);
    
    // Check for collisions at the snapped position
    const hasCollision = checkCollision(draggedElement.id, snappedX, snappedY, width, height);
    
    // Update visual position for smooth dragging feedback (doesn't affect collision detection)
    setDragVisualPosition({
      elementId: draggedElement.id,
      x: snappedX,
      y: snappedY,
      width,
      height,
      hasCollision
    });
    
  };



  // Handle drop with modern collision prevention and boundary clamping
  const handleDrop = async (e) => {
    if (!isLayoutMode || !draggedElement) return;
    
    e.preventDefault();
    
    // Convert current mouse position to board coordinates
    const mouseBoard = screenToBoardCoords(e.clientX, e.clientY);
    
    // Calculate new element position by subtracting the drag offset (all in board coordinates)
    const elementX = mouseBoard.x - dragOffset.x;
    const elementY = mouseBoard.y - dragOffset.y;
    
    const currentPos = panelPositions[draggedElement.id] || {};
    
    const width = currentPos.width || (draggedElement.type === 'button' ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
    const height = currentPos.height || (draggedElement.type === 'button' ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
    
    // Snap to grid - no boundary clamping needed
    const snappedX = snapToGrid(elementX);
    const snappedY = snapToGrid(elementY);
    
    // Check for collisions at the snapped position
    const hasCollision = checkCollision(draggedElement.id, snappedX, snappedY, width, height);
    
    // Finalize position: keep current position if no collision, otherwise find valid position
    let finalX = snappedX;
    let finalY = snappedY;
    
    if (hasCollision) {
      const validPosition = findValidPosition(draggedElement.id, snappedX, snappedY, width, height);
      finalX = validPosition.x;
      finalY = validPosition.y;
    }
    
    // Set final position
    const { width: minWidth, height: minHeight } = getMinimumSize(draggedElement.id, draggedElement.type);
    const finalWidth = Math.max(width, minWidth);
    const finalHeight = Math.max(height, minHeight);
    
    setPanelPositions(prev => ({
      ...prev,
      [draggedElement.id]: {
        x: finalX,
        y: finalY,
        width: finalWidth,
        height: finalHeight
      }
    }));
    
    // Rebuild collision matrix after position change to ensure consistency
    setTimeout(() => {
      if (collisionMatrix) {
        rebuildCollisionMatrix();
      }
      updateWorkspaceBounds();
    }, 10);
    
    await saveLayoutSettings();
    
    // Cleanup
    setDraggedElement(null);
    setDragOffset({ x: 0, y: 0 });
    setInitialDragPosition({ x: 0, y: 0 });
    setInitialPanelPosition({ x: 0, y: 0 });
    setDragVisualPosition(null);
    
    document.querySelectorAll('.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedElement(null);
    setInitialDragPosition({ x: 0, y: 0 });
    setInitialPanelPosition({ x: 0, y: 0 });
    setDragVisualPosition(null);
  };

  // Panning functionality with improved performance
  const handlePanStart = (e) => {
    if (draggedElement) return;
    
    // Allow panning on empty space (not on panels) or when right-clicking in layout mode
    const isRightClick = e.button === 2;
    const isOnPanel = e.target.closest('.panel');
    const isOnResizeHandle = e.target.closest('.resize-handle');
    
    if ((e.button === 0 && !isOnPanel) || (isRightClick && isLayoutMode)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handlePanMove = useCallback((e) => {
    if (!isPanning) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;
    
    // Cancel previous animation frame to prevent queuing
    if (panAnimationFrame.current) {
      cancelAnimationFrame(panAnimationFrame.current);
    }
    
    // Use requestAnimationFrame for smoother updates
    panAnimationFrame.current = requestAnimationFrame(() => {
      setPanOffset(prev => {
        const newX = prev.x + deltaX;
        const newY = prev.y + deltaY;
        
        // Get viewport dimensions to calculate panning limits
        const { width: viewportWidth, height: viewportHeight } = getBoardBoundaries();
        
        let maxPanX, maxPanY, minPanX, minPanY;
        
        if (isLayoutMode) {
          // Layout mode: Allow extended boundaries for panel arrangement
          // Calculate panning limits based on extended workspace boundaries
          // Pan offset represents how much the viewport is shifted from world coordinates
          // Positive pan offset shows content that's to the left/above the viewport origin
          // Negative pan offset shows content that's to the right/below the viewport origin
          
          // Maximum positive pan: can show the leftmost/topmost content
          maxPanX = -workspaceBounds.minX;
          maxPanY = -workspaceBounds.minY;
          
          // Maximum negative pan: can show the rightmost/bottommost content
          minPanX = -(workspaceBounds.maxX - viewportWidth);
          minPanY = -(workspaceBounds.maxY - viewportHeight);
        } else {
          // Normal mode: Restrict to core workspace only (panels and small buffer)
          // Calculate the actual bounds of all panels
          let coreMinX = Infinity, coreMaxX = -Infinity, coreMinY = Infinity, coreMaxY = -Infinity;
          
          Object.values(panelPositions).forEach(pos => {
            const x = pos.x || 0;
            const y = pos.y || 0;
            const width = pos.width || DEFAULT_PANEL_WIDTH;
            const height = pos.height || DEFAULT_PANEL_HEIGHT;
            
            coreMinX = Math.min(coreMinX, x);
            coreMinY = Math.min(coreMinY, y);
            coreMaxX = Math.max(coreMaxX, x + width);
            coreMaxY = Math.max(coreMaxY, y + height);
          });
          
          // Add small buffer around panels for normal mode
          const normalModeBuffer = GRID_SIZE * 2; // Smaller buffer for normal mode
          const workspaceMinX = coreMinX - normalModeBuffer;
          const workspaceMinY = coreMinY - normalModeBuffer;
          const workspaceMaxX = coreMaxX + normalModeBuffer;
          const workspaceMaxY = coreMaxY + normalModeBuffer;
          
          // Calculate panning limits to stay within this restricted workspace
          maxPanX = -workspaceMinX;
          maxPanY = -workspaceMinY;
          minPanX = -(workspaceMaxX - viewportWidth);
          minPanY = -(workspaceMaxY - viewportHeight);
        }
        
        // Constrain the new pan offset to stay within boundaries
        const constrainedX = Math.max(minPanX, Math.min(maxPanX, newX));
        const constrainedY = Math.max(minPanY, Math.min(maxPanY, newY));
        
        return {
          x: constrainedX,
          y: constrainedY
        };
      });
      panAnimationFrame.current = null;
    });
    
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart.x, panStart.y, workspaceBounds, isLayoutMode, panelPositions]);

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Mouse event handlers for the board
  const handleMouseDown = (e) => {
    handlePanStart(e);
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      handlePanMove(e);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      handlePanEnd();
    }
  };




  // Prevent context menu when right-clicking for panning
  const handleContextMenu = (e) => {
    if (isLayoutMode) {
      e.preventDefault();
    }
  };

  // Render minimap component
  const renderMinimap = () => {
    if (!isLayoutMode) return null;

    const MINIMAP_PADDING = 4;
    const MAX_MINIMAP_WIDTH = 250;
    const MAX_MINIMAP_HEIGHT = 200;

    // Calculate workspace dimensions
    const workspaceWidth = workspaceBounds.maxX - workspaceBounds.minX;
    const workspaceHeight = workspaceBounds.maxY - workspaceBounds.minY;
    const workspaceAspectRatio = workspaceWidth / workspaceHeight;

    // Calculate minimap dimensions to match workspace aspect ratio
    let minimapWidth, minimapHeight;
    
    if (workspaceAspectRatio > MAX_MINIMAP_WIDTH / MAX_MINIMAP_HEIGHT) {
      // Workspace is wider than max minimap aspect ratio, constrain by width
      minimapWidth = MAX_MINIMAP_WIDTH;
      minimapHeight = MAX_MINIMAP_WIDTH / workspaceAspectRatio;
    } else {
      // Workspace is taller than max minimap aspect ratio, constrain by height
      minimapHeight = MAX_MINIMAP_HEIGHT;
      minimapWidth = MAX_MINIMAP_HEIGHT * workspaceAspectRatio;
    }

    // Calculate scale factor - now both dimensions should scale equally
    const scale = (minimapWidth - MINIMAP_PADDING * 2) / workspaceWidth;

    // Calculate viewport boundaries
    const { width: viewportWidth, height: viewportHeight } = getBoardBoundaries();
    const viewportLeft = -panOffset.x;
    const viewportTop = -panOffset.y;
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;

    // Convert viewport to minimap coordinates
    const minimapViewportX = (viewportLeft - workspaceBounds.minX) * scale + MINIMAP_PADDING;
    const minimapViewportY = (viewportTop - workspaceBounds.minY) * scale + MINIMAP_PADDING;
    const minimapViewportWidth = viewportWidth * scale;
    const minimapViewportHeight = viewportHeight * scale;

    // Handle minimap click to pan
    const handleMinimapClick = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left - MINIMAP_PADDING;
      const clickY = e.clientY - rect.top - MINIMAP_PADDING;
      
      // Convert click position back to workspace coordinates
      const workspaceX = (clickX / scale) + workspaceBounds.minX;
      const workspaceY = (clickY / scale) + workspaceBounds.minY;
      
      // Center viewport on clicked position
      const newPanX = -(workspaceX - viewportWidth / 2);
      const newPanY = -(workspaceY - viewportHeight / 2);
      
      // Apply panning constraints
      const maxPanX = -workspaceBounds.minX;
      const maxPanY = -workspaceBounds.minY;
      const minPanX = -(workspaceBounds.maxX - viewportWidth);
      const minPanY = -(workspaceBounds.maxY - viewportHeight);
      
      const constrainedX = Math.max(minPanX, Math.min(maxPanX, newPanX));
      const constrainedY = Math.max(minPanY, Math.min(maxPanY, newPanY));
      
      setPanOffset({ x: constrainedX, y: constrainedY });
    };

    return (
      <div 
        className="minimap"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: `${minimapWidth}px`,
          height: `${minimapHeight}px`,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid var(--theme-primary)',
          borderRadius: '8px',
          zIndex: 1000,
          cursor: 'pointer',
          overflow: 'hidden'
        }}
        onClick={handleMinimapClick}
      >
        {/* Minimap panels */}
        {Object.entries(panelPositions).filter(([elementId]) => {
          // Only show panels that are in the availablePanels list and active, or buttons
          const panel = availablePanels.find(p => p.id === elementId);
          const button = availableButtons.find(b => b.id === elementId);
          return (panel && panel.active) || button;
        }).map(([elementId, pos]) => {
          const x = pos.x || 0;
          const y = pos.y || 0;
          const width = pos.width || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
          const height = pos.height || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
          
          // Convert to minimap coordinates
          const minimapX = (x - workspaceBounds.minX) * scale + MINIMAP_PADDING;
          const minimapY = (y - workspaceBounds.minY) * scale + MINIMAP_PADDING;
          const minimapWidth = width * scale;
          const minimapHeight = height * scale;
          
          return (
            <div
              key={elementId}
              className="minimap-panel"
              style={{
                position: 'absolute',
                left: `${minimapX}px`,
                top: `${minimapY}px`,
                width: `${minimapWidth}px`,
                height: `${minimapHeight}px`,
                backgroundColor: availableButtons.find(b => b.id === elementId) 
                  ? 'var(--theme-accent)' 
                  : 'var(--theme-primary)',
                borderRadius: '2px',
                opacity: 0.8
              }}
            />
          );
        })}
        
        {/* Viewport indicator */}
        <div
          className="minimap-viewport"
          style={{
            position: 'absolute',
            left: `${minimapViewportX}px`,
            top: `${minimapViewportY}px`,
            width: `${minimapViewportWidth}px`,
            height: `${minimapViewportHeight}px`,
            border: '1px solid white',
            borderRadius: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            pointerEvents: 'none'
          }}
        />
      </div>
    );
  };


  // Handle resize start with grid snapping and collision prevention
  const handleResizeStart = (e, elementId) => {
    if (!isLayoutMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const currentPos = panelPositions[elementId] || {};
    const startWidth = currentPos.width || DEFAULT_PANEL_WIDTH;
    const startHeight = currentPos.height || DEFAULT_PANEL_HEIGHT;
    const currentX = currentPos.x || 0;
    const currentY = currentPos.y || 0;
    
    const elementType = availableButtons.find(b => b.id === elementId) ? 'button' : 'panel';
    const { width: minWidth, height: minHeight } = getMinimumSize(elementId, elementType);

    const handleMouseMove = (e) => {
      let newWidth = startWidth + (e.clientX - startX);
      let newHeight = startHeight + (e.clientY - startY);
      
      // Snap to grid increments (20px) and enforce minimums
      newWidth = Math.max(minWidth, Math.round(newWidth / GRID_SIZE) * GRID_SIZE);
      newHeight = Math.max(minHeight, Math.round(newHeight / GRID_SIZE) * GRID_SIZE);
      
      // Simple directional collision check using AABB
      let canResize = true;
      
      // Calculate expansion areas
      const widthExpanded = newWidth > startWidth;
      const heightExpanded = newHeight > startHeight;
      
      if (widthExpanded || heightExpanded) {
        // Check collision against all other panels (excluding current element)
        for (const [otherId, otherPos] of Object.entries(panelPositions)) {
          if (otherId === elementId) continue; // Skip self
          
          const otherX = otherPos.x || 0;
          const otherY = otherPos.y || 0;
          const otherWidth = otherPos.width || (availableButtons.find(b => b.id === otherId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
          const otherHeight = otherPos.height || (availableButtons.find(b => b.id === otherId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
          
          // Check expansion areas individually
          if (widthExpanded && !heightExpanded) {
            // Only width expanded - check right expansion area
            const rightExpansionX = currentX + startWidth;
            const rightExpansionWidth = newWidth - startWidth;
            
            // Check if right expansion area intersects with other panel
            const intersects = !(
              rightExpansionX >= otherX + otherWidth ||  // expansion is to the right of other
              rightExpansionX + rightExpansionWidth <= otherX ||  // expansion is to the left of other
              currentY >= otherY + otherHeight ||  // expansion is below other
              currentY + startHeight <= otherY     // expansion is above other
            );
            
            if (intersects) {
              canResize = false;
              break;
            }
          } else if (heightExpanded && !widthExpanded) {
            // Only height expanded - check bottom expansion area
            const bottomExpansionY = currentY + startHeight;
            const bottomExpansionHeight = newHeight - startHeight;
            
            // Check if bottom expansion area intersects with other panel
            const intersects = !(
              currentX >= otherX + otherWidth ||  // expansion is to the right of other
              currentX + startWidth <= otherX ||  // expansion is to the left of other
              bottomExpansionY >= otherY + otherHeight ||  // expansion is below other
              bottomExpansionY + bottomExpansionHeight <= otherY     // expansion is above other
            );
            
            if (intersects) {
              canResize = false;
              break;
            }
          } else if (widthExpanded && heightExpanded) {
            // Both dimensions expanded - check if new size intersects with other panel
            const intersects = !(
              currentX >= otherX + otherWidth ||  // panel is to the right of other
              currentX + newWidth <= otherX ||    // panel is to the left of other
              currentY >= otherY + otherHeight || // panel is below other
              currentY + newHeight <= otherY      // panel is above other
            );
            
            // But we need to exclude the current overlapping area (if panels are touching)
            const currentlyIntersects = !(
              currentX >= otherX + otherWidth ||  // panel is to the right of other
              currentX + startWidth <= otherX ||  // panel is to the left of other
              currentY >= otherY + otherHeight || // panel is below other
              currentY + startHeight <= otherY    // panel is above other
            );
            
            // Only block if the new intersection would be larger than current intersection
            if (intersects && !currentlyIntersects) {
              canResize = false;
              break;
            }
          }
        }
      }
      
      // Update state if resize is allowed
      if (canResize) {
        setPanelPositions(prev => ({
          ...prev,
          [elementId]: {
            ...prev[elementId],
            width: newWidth,
            height: newHeight
          }
        }));
      }
    };

    const handleMouseUp = async () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Finalize collision matrix and workspace bounds after resize is complete
      const finalPos = panelPositions[elementId];
      if (finalPos && collisionMatrix) {
        const currentMatrixX = currentX - workspaceBounds.minX;
        const currentMatrixY = currentY - workspaceBounds.minY;
        const finalWidth = finalPos.width || startWidth;
        const finalHeight = finalPos.height || startHeight;
        
        // Clear old size from matrix
        if (currentMatrixX >= 0 && currentMatrixY >= 0) {
          collisionMatrix.setCells(currentMatrixX, currentMatrixY, startWidth, startHeight, 0);
        }
        
        // Expand matrix if needed for final size
        const requiredMatrixWidth = currentMatrixX + finalWidth + GRID_SIZE * 5;
        const requiredMatrixHeight = currentMatrixY + finalHeight + GRID_SIZE * 5;
        if (requiredMatrixWidth > collisionMatrix.width || requiredMatrixHeight > collisionMatrix.height) {
          collisionMatrix.expandMatrix(requiredMatrixWidth, requiredMatrixHeight);
        }
        
        // Set final size in matrix
        if (currentMatrixX >= 0 && currentMatrixY >= 0) {
          collisionMatrix.setCells(currentMatrixX, currentMatrixY, finalWidth, finalHeight, 1);
        }
      }
      
      // Update workspace boundaries once at the end
      updateWorkspaceBounds();
      await saveLayoutSettings();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (isLoading) {
    return (
      <div className="App loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Excel Merger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App layout-mode">
      <div className="top-menu-bar">
        <ThemeMenu currentTheme={currentTheme} onThemeChange={handleThemeChange} t={t} />
        <LanguageMenu currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} t={t} />
        <button 
          className={`layout-button ${isLayoutMode ? 'active' : ''}`}
          onClick={toggleLayoutMode}
          title="Toggle Layout Mode"
        >
          <img src={dashboardIcon} alt="Layout" className="layout-icon" />
        </button>
        <button 
          className={`layout-button ${isDeveloperMode ? 'active' : ''}`}
          onClick={() => setIsDeveloperMode(!isDeveloperMode)}
          title="Toggle Developer Mode"
          style={{ fontSize: '14px', fontWeight: 'bold' }}
        >
          DEV
        </button>
      </div>
      
      {(processingSummary || contabilitateFiles.length > 0 || anafFiles.length > 0) && (
        <div className="remake-button-container">
          <button className="btn btn-secondary" onClick={resetApp}>
            {t('remake')}
          </button>
        </div>
      )}

      <main 
        ref={boardRef}
        className={`app-main board ${isPanning ? 'panning' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {/* Grid Board - all panels positioned absolutely */}
        {/* Panel 1 - Contabilitate Upload */}
        <div 
          className="upload-section panel"
          data-panel="contabilitate-upload-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'contabilitate-upload-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('contabilitate-upload-panel').x}px`,
            top: `${getVisualPosition('contabilitate-upload-panel').y}px`,
            width: `${getVisualPosition('contabilitate-upload-panel').width}px`,
            height: `${getVisualPosition('contabilitate-upload-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'contabilitate-upload-panel')}
            />
          )}
          <div className="panel-content">
            {isDeveloperMode && (
              <div style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px', 
                fontSize: '10px', 
                color: 'var(--theme-text-color, #666)', 
                backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                padding: '2px 4px', 
                borderRadius: '2px',
                fontFamily: 'monospace',
                zIndex: 1000
              }}>
                contabilitate-upload-panel
              </div>
            )}
            <h3 style={{ textAlign: 'center' }}>{t('contabilitate')}</h3>
            <div className="panel-controls" style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => handleSelectContabilitateFiles(false)} disabled={isProcessing}>
                {t('selectExcelFiles')}
              </button>
              <button 
                className={`btn btn-secondary ${contabilitateFiles.length === 0 ? 'disabled-grey' : ''}`}
                onClick={() => handleSelectContabilitateFiles(true)} 
                disabled={isProcessing || contabilitateFiles.length === 0}
              >
                {t('addMoreFiles')}
              </button>
            </div>
          </div>
        </div>

        {/* Panel 2 - ANAF Upload */}
        <div 
          className="upload-section panel"
          data-panel="anaf-upload-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'anaf-upload-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('anaf-upload-panel').x}px`,
            top: `${getVisualPosition('anaf-upload-panel').y}px`,
            width: `${getVisualPosition('anaf-upload-panel').width}px`,
            height: `${getVisualPosition('anaf-upload-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'anaf-upload-panel')}
            />
          )}
          <div className="panel-content">
            {isDeveloperMode && (
              <div style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px', 
                fontSize: '10px', 
                color: 'var(--theme-text-color, #666)', 
                backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                padding: '2px 4px', 
                borderRadius: '2px',
                fontFamily: 'monospace',
                zIndex: 1000
              }}>
                anaf-upload-panel
              </div>
            )}
            <h3 style={{ textAlign: 'center' }}>{t('anaf')}</h3>
            <div className="panel-controls" style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => handleSelectAnafFiles(false)} disabled={isProcessing}>
                {t('selectExcelFiles')}
              </button>
              <button 
                className={`btn btn-secondary ${anafFiles.length === 0 ? 'disabled-grey' : ''}`}
                onClick={() => handleSelectAnafFiles(true)} 
                disabled={isProcessing || anafFiles.length === 0}
              >
                {t('addMoreFiles')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Panel 3 - Contabilitate Summary */}
        <div 
          className="uploaded-files-summary panel"
          data-panel="contabilitate-summary-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'contabilitate-summary-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('contabilitate-summary-panel').x}px`,
            top: `${getVisualPosition('contabilitate-summary-panel').y}px`,
            width: `${getVisualPosition('contabilitate-summary-panel').width}px`,
            height: `${getVisualPosition('contabilitate-summary-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'contabilitate-summary-panel')}
            />
          )}
          <div className="panel-content">
            {isDeveloperMode && (
              <div style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px', 
                fontSize: '10px', 
                color: 'var(--theme-text-color, #666)', 
                backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                padding: '2px 4px', 
                borderRadius: '2px',
                fontFamily: 'monospace',
                zIndex: 1000
              }}>
                contabilitate-summary-panel
              </div>
            )}
            <h3 style={{ textAlign: 'center' }}>Summary of {t('contabilitate')} files</h3>
            {contabilitateFiles.length > 0 ? (
              <div className="file-summary" style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%'
              }}>
                <div className="summary-item" style={{ flex: '0 0 auto' }}>📁 {contabilitateFiles.length} files</div>
                <div className="summary-item" style={{ flex: '0 0 auto' }}>📊 {contabilitateFiles.reduce((total, file) => total + file.rowCount, 0)} rows</div>
                <button 
                  className="btn btn-primary view-files-button" 
                  onClick={() => setShowContaFilesPopup(true)}
                  style={{ 
                    flex: '0 0 auto',
                    minWidth: 'fit-content',
                    padding: '6px 16px',
                    fontSize: '0.9em',
                    whiteSpace: 'nowrap'
                  }}
                >
                  View Files
                </button>
              </div>
            ) : (
              <p>No files uploaded</p>
            )}
          </div>
        </div>

        {/* Panel 4 - ANAF Summary */}
        <div 
          className="uploaded-files-summary panel"
          data-panel="anaf-summary-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'anaf-summary-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('anaf-summary-panel').x}px`,
            top: `${getVisualPosition('anaf-summary-panel').y}px`,
            width: `${getVisualPosition('anaf-summary-panel').width}px`,
            height: `${getVisualPosition('anaf-summary-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'anaf-summary-panel')}
            />
          )}
          <div className="panel-content">
            {isDeveloperMode && (
              <div style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px', 
                fontSize: '10px', 
                color: 'var(--theme-text-color, #666)', 
                backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                padding: '2px 4px', 
                borderRadius: '2px',
                fontFamily: 'monospace',
                zIndex: 1000
              }}>
                anaf-summary-panel
              </div>
            )}
            <h3 style={{ textAlign: 'center' }}>Summary of {t('anaf')} files</h3>
            {anafFiles.length > 0 ? (
              <div className="file-summary" style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%'
              }}>
                <div className="summary-item" style={{ flex: '0 0 auto' }}>📁 {anafFiles.length} files</div>
                <div className="summary-item" style={{ flex: '0 0 auto' }}>📊 {anafFiles.reduce((total, file) => total + file.rowCount, 0)} rows</div>
                <button 
                  className="btn btn-primary view-files-button" 
                  onClick={() => setShowAnafFilesPopup(true)}
                  style={{
                    flex: '0 0 auto',
                    fontSize: '11px',
                    padding: '4px 8px'
                  }}
                >
                  View Files
                </button>
              </div>
            ) : (
              <p>No files uploaded</p>
            )}
          </div>
        </div>

        {/* Panel 5 - ANAF Header Selection */}
        <div 
          className="xy-selection-section panel"
          data-panel="anaf-header-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'anaf-header-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('anaf-header-panel').x}px`,
            top: `${getVisualPosition('anaf-header-panel').y}px`,
            width: `${getVisualPosition('anaf-header-panel').width}px`,
            height: `${getVisualPosition('anaf-header-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10,
            display: isLayoutMode ? 'block' : 'none'
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'anaf-header-panel')}
            />
          )}
          <div className="panel-content">
            {isDeveloperMode && (
              <div style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px', 
                fontSize: '10px', 
                color: 'var(--theme-text-color, #666)', 
                backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                padding: '2px 4px', 
                borderRadius: '2px',
                fontFamily: 'monospace',
                zIndex: 1000
              }}>
                anaf-header-panel
              </div>
            )}
            <h3 style={{ textAlign: 'center' }}>Header Selection for {t('anaf')}</h3>
            {anafFiles.length > 0 ? (
              <div className="input-controls" style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '20px',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
                padding: '10px'
              }}>
                <div className="input-group" style={{ flex: '1 1 160px', minWidth: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label className="input-label" style={{ fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                    {t('headerNumberOfRows')}
                    <Tooltip content={t('headerNumberTooltip')} />
                  </label>
                  <input 
                    type="number" 
                    value={anafCommonLines} 
                    onChange={(e) => handleAnafCommonLinesChange(e.target.value)}
                    style={{
                      width: '60px',
                      padding: '2px 4px',
                      textAlign: 'center',
                      fontSize: '12px'
                    }}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="input-group" style={{ flex: '1 1 160px', minWidth: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label className="input-label" style={{ fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                    {t('columnsRow')}
                    <Tooltip content={t('columnsRowTooltip')} />
                  </label>
                  <input 
                    type="number" 
                    value={anafColumnNamesRow} 
                    onChange={(e) => handleAnafColumnNamesRowChange(e.target.value)}
                    style={{
                      width: '60px',
                      padding: '2px 4px',
                      textAlign: 'center',
                      fontSize: '12px'
                    }}
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center' }}>Upload ANAF files to configure headers</p>
            )}
          </div>
        </div>
        
        {/* Panel 6 - ANAF Date Columns */}
        <div 
          className="date-columns-section panel"
          data-panel="anaf-date-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'anaf-date-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('anaf-date-panel').x}px`,
            top: `${getVisualPosition('anaf-date-panel').y}px`,
            width: `${getVisualPosition('anaf-date-panel').width}px`,
            height: `${getVisualPosition('anaf-date-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10,
            display: isLayoutMode ? 'block' : 'none'
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'anaf-date-panel')}
            />
          )}
          <div className="panel-content">
            {isDeveloperMode && (
              <div style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px', 
                fontSize: '10px', 
                color: 'var(--theme-text-color, #666)', 
                backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                padding: '2px 4px', 
                borderRadius: '2px',
                fontFamily: 'monospace',
                zIndex: 1000
              }}>
                anaf-date-panel
              </div>
            )}
            <h3 style={{ textAlign: 'center' }}>Date Columns for {t('anaf')}</h3>
            {anafColumnNames.length > 0 ? (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{ 
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Found {anafSelectedDateColumns.length} date columns
                    <Tooltip content="Columns that will be automatically changed to date type. You can see beneath the column name an example of the data in that column. You can select and deselect more columns by clicking on the '+' button. By default the merge process takes all of the data as general and you can't sort the dates if they are not of date type." />
                  </div>
                </div>
                <div className="date-column-list" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  {anafSelectedDateColumns.slice(0, 6).map((colIndex) => {
                    const col = anafColumnNames[colIndex];
                    return (
                      <span key={colIndex} className="date-column-badge">
                        {col?.name || `Column ${colIndex + 1}`}
                      </span>
                    );
                  })}
                  {anafSelectedDateColumns.length > 6 && (
                    <span className="date-column-badge" style={{ 
                      backgroundColor: 'var(--theme-accent-color, #667eea)',
                      cursor: 'pointer' 
                    }}
                    onClick={handleAnafViewColumnsClick}>
                      +{anafSelectedDateColumns.length - 6} more
                    </span>
                  )}
                  <button 
                    className="btn btn-primary"
                    onClick={handleAnafViewColumnsClick}
                    style={{
                      padding: '0',
                      fontSize: '18px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      marginLeft: '8px'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center' }}>Upload ANAF files to detect date columns</p>
            )}
          </div>
        </div>
        
        {/* Panel 9 - Conta Account Selection */}
        <div 
          className="conta-account-selection panel"
          data-panel="account-selection-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'account-selection-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('account-selection-panel').x}px`,
            top: `${getVisualPosition('account-selection-panel').y}px`,
            width: `${getVisualPosition('account-selection-panel').width}px`,
            height: `${getVisualPosition('account-selection-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'account-selection-panel')}
            />
          )}
          <div className="panel-content">
            {isDeveloperMode && (
              <div style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px', 
                fontSize: '10px', 
                color: 'var(--theme-text-color, #666)', 
                opacity: 0.7,
                userSelect: 'none',
                pointerEvents: 'none'
              }}>
                account-selection-panel
              </div>
            )}
            <div>
              {/* Account Selection Section */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Conta Account Selection</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  {availableAccounts.map(account => {
                    const isSelected = selectedAccounts.includes(account);
                    const isFoundInFiles = processedContaFiles.some(file => {
                      // For single account files, check the accountNumber property
                      if (file.accountNumber) {
                        // Exact match
                        if (file.accountNumber === account) {
                          return true;
                        }
                        // Partial match for accounts like 446.DIV where file might be fise_446.xls
                        if (account.startsWith(file.accountNumber + '.')) {
                          return true;
                        }
                      }
                      // For multiple account files, check the data rows
                      return file.data.some(row => row[3] && row[3].toString() === account);
                    });
                    
                    return (
                      <button
                        key={account}
                        onClick={() => handleAccountToggle(account)}
                        onContextMenu={(e) => handleAccountRightClick(e, account)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '16px',
                          border: isFoundInFiles 
                            ? '2px solid #10b981' 
                            : '1px solid var(--theme-border-color)',
                          backgroundColor: isSelected 
                            ? 'var(--theme-primary, #4f46e5)' 
                            : 'var(--theme-button-bg)',
                          color: isSelected 
                            ? 'white' 
                            : 'var(--theme-text-color)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minWidth: 'fit-content',
                          boxShadow: isFoundInFiles ? '0 0 0 1px rgba(16, 185, 129, 0.1)' : 'none'
                        }}
                        title={isFoundInFiles ? `Found in uploaded files` : `Not found in uploaded files`}
                      >
                        {account}
                      </button>
                    );
                  })}
                  
                  {/* Add Account Input Field */}
                  {showAccountInput ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="text"
                        value={newAccountInput}
                        onChange={(e) => setNewAccountInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAccountInputSubmit();
                          } else if (e.key === 'Escape') {
                            handleAccountInputCancel();
                          }
                        }}
                        placeholder="Account name"
                        autoFocus
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          border: '1px solid var(--theme-border-color)',
                          backgroundColor: 'var(--theme-input-bg)',
                          color: 'var(--theme-text-color)',
                          fontSize: '12px',
                          width: '80px'
                        }}
                      />
                      <button
                        onClick={handleAccountInputSubmit}
                        style={{
                          padding: '2px 6px',
                          borderRadius: '50%',
                          border: '1px solid #10b981',
                          backgroundColor: '#10b981',
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Add account"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleAccountInputCancel}
                        style={{
                          padding: '2px 6px',
                          borderRadius: '50%',
                          border: '1px solid #ef4444',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddAccountClick}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '50%',
                        border: '1px solid var(--theme-border-color)',
                        backgroundColor: 'var(--theme-button-bg)',
                        color: 'var(--theme-text-color)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Add custom account"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* ANAF Account Selection Section */}
              <div style={{ marginTop: '30px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>ANAF Account Selection</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  {availableAnafAccounts.map(account => {
                    const isSelected = selectedAnafAccounts.includes(account);
                    const isFoundInFiles = anafFiles.some(file => {
                      // Check if account exists in ANAF files by extracting from filename
                      const fileAccount = extractAccountFromFilename(file.filePath || file.name || '');
                      if (fileAccount === account) {
                        return true;
                      }
                      // Also check for partial matches like 446.DIV where file might be anaf_446.xls
                      if (account.startsWith(fileAccount + '.')) {
                        return true;
                      }
                      return false;
                    });
                    
                    return (
                      <button
                        key={account}
                        onClick={() => handleAnafAccountToggle(account)}
                        onContextMenu={(e) => handleAnafAccountRightClick(e, account)}
                        style={getAnafAccountButtonStyle(isSelected, isFoundInFiles)}
                        title={isFoundInFiles ? `Found in uploaded ANAF files` : `Not found in uploaded ANAF files`}
                      >
                        {account}
                      </button>
                    );
                  })}
                  
                  {/* Add ANAF Account Input Field */}
                  {showAnafAccountInput ? (
                    <div style={anafInputStyles.container}>
                      <input
                        type="text"
                        value={newAnafAccountInput}
                        onChange={handleAnafInputChange}
                        onKeyDown={handleAnafInputKeyDown}
                        placeholder="Account name"
                        autoFocus
                        style={anafInputStyles.input}
                        onFocus={handleAnafInputFocus}
                        onBlur={handleAnafInputBlur}
                      />
                      <button
                        onClick={handleAnafAccountInputSubmit}
                        style={anafInputStyles.submitButton}
                        title="Add ANAF account"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleAnafAccountInputCancel}
                        style={anafInputStyles.cancelButton}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddAnafAccountClick}
                      style={anafInputStyles.addButton}
                      title="Add custom ANAF account"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* Date Selection Section */}
              <div style={{ marginTop: '30px', marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Date Selection</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/([0-9]{4})$"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--theme-border-color)',
                      backgroundColor: 'var(--theme-input-bg)',
                      color: 'var(--theme-text-color)',
                      fontSize: '14px'
                    }}
                  />
                  <span style={{ color: 'var(--theme-text-color)', fontSize: '14px' }}>→</span>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/([0-9]{4})$"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--theme-border-color)',
                      backgroundColor: 'var(--theme-input-bg)',
                      color: 'var(--theme-text-color)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Unified Calculate Button */}
              <button
                className="btn btn-primary"
                onClick={handleCalculateAllSums}
                disabled={(selectedAccounts.length === 0 && selectedAnafAccounts.length === 0) || isProcessing}
                style={{ width: '100%', marginTop: '10px' }}
                title={startDate || endDate ? `Date range: ${startDate || 'start'} → ${endDate || 'end'}` : 'No date filter applied'}
              >
                Calculate All Sums 
                ({selectedAccounts.length} Conta + {selectedAnafAccounts.length} ANAF account{(selectedAccounts.length + selectedAnafAccounts.length) !== 1 ? 's' : ''})
                {(startDate || endDate) && (
                  <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>
                    📅
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Account Mapping Panel - Map Conta to ANAF accounts */}
        <div 
          className="account-mapping panel"
          data-panel="account-mapping-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'account-mapping-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('account-mapping-panel').x}px`,
            top: `${getVisualPosition('account-mapping-panel').y}px`,
            width: `${getVisualPosition('account-mapping-panel').width}px`,
            height: `${getVisualPosition('account-mapping-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'account-mapping-panel')}
            />
          )}
          <div className="panel-content">
            {isDeveloperMode && (
              <div style={{ 
                position: 'absolute', 
                top: '2px', 
                right: '8px', 
                fontSize: '10px', 
                color: 'var(--theme-text-color, #666)', 
                opacity: 0.7,
                userSelect: 'none',
                pointerEvents: 'none'
              }}>
                account-mapping-panel
              </div>
            )}
            <div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Account Mapping</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: 'var(--theme-text-secondary)' }}>
                Map each Conta account to multiple ANAF accounts
              </p>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {Object.keys(accountMappings).map(contaAccount => {
                  const mappedAnafAccounts = accountMappings[contaAccount] || [];
                  const isContaSelected = selectedAccounts.includes(contaAccount);
                  
                  // Check if this conta account has a calculated sum
                  const contaSum = accountSums[contaAccount];
                  const hasContaSum = contaSum !== undefined && contaSum !== null;
                  
                  // Calculate total ANAF sum for mapped accounts
                  const anafSum = mappedAnafAccounts.reduce((total, anafAccount) => {
                    const anafValue = anafAccountSums[anafAccount];
                    return total + (anafValue || 0);
                  }, 0);
                  
                  // Calculate difference (conta sum - anaf sum)
                  const difference = hasContaSum ? (contaSum - anafSum) : null;
                  const isBalanced = difference !== null && Math.abs(difference) < 1; // Consider balanced if difference is less than 1
                  
                  // Determine if this relation should be grayed out
                  // Gray out relations for conta accounts that are not selected
                  const shouldGrayOut = !isContaSelected;
                  
                  return (
                    <div key={contaAccount} 
                      onContextMenu={(e) => handleMappingRightClick(e, contaAccount)}
                      style={{ 
                        marginBottom: '15px', 
                        padding: '10px', 
                        border: `1px solid ${isContaSelected ? 'var(--theme-primary, #4f46e5)' : 'var(--theme-border-color)'}`,
                        borderRadius: '8px',
                        backgroundColor: isContaSelected ? 'rgba(79, 70, 229, 0.1)' : 'var(--theme-panel-bg)',
                        opacity: shouldGrayOut ? 0.4 : 1,
                        transition: 'opacity 0.2s ease'
                      }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <strong style={{ fontSize: '14px', color: 'var(--theme-text-color)' }}>
                          {contaAccount}
                        </strong>
                        {shouldGrayOut && (
                          <span style={{ 
                            fontSize: '10px', 
                            color: 'var(--theme-text-secondary)', 
                            fontStyle: 'italic' 
                          }}>
                            No sum calculated
                          </span>
                        )}
                      </div>
                      
                      {/* Sum Comparison Section */}
                      {hasContaSum && mappedAnafAccounts.length > 0 && (
                        <div style={{
                          padding: '8px',
                          marginBottom: '8px',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          borderRadius: '6px',
                          border: `2px solid ${isBalanced ? '#10b981' : '#ef4444'}`,
                          fontSize: '11px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--theme-text-color)' }}>
                              <strong>Sum1 (Conta):</strong> {contaSum?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--theme-text-color)' }}>
                              <strong>Sum2 (ANAF):</strong> {anafSum?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--theme-border-color)' }}>
                            <span style={{ 
                              color: isBalanced ? '#10b981' : '#ef4444',
                              fontWeight: 'bold'
                            }}>
                              <strong>Diff:</strong> {difference?.toFixed(2) || '0.00'}
                            </span>
                            <span style={{ 
                              color: isBalanced ? '#10b981' : '#ef4444',
                              fontWeight: 'bold',
                              fontSize: '10px'
                            }}>
                              {isBalanced ? '✓ BALANCED' : '⚠ UNBALANCED'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        {mappedAnafAccounts.length > 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--theme-text-secondary)', marginBottom: '5px' }}>
                            Mapped ANAF accounts:
                          </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                          {mappedAnafAccounts.map(anafAccount => (
                            <span
                              key={anafAccount}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--theme-secondary, #10b981)',
                                color: 'white',
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {anafAccount}
                              <button
                                onClick={() => handleRemoveMapping(contaAccount, anafAccount)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  padding: '0',
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Remove mapping"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <button
                            onClick={() => handleAddMoreAnafAccounts(contaAccount)}
                            style={{
                              padding: '3px 6px',
                              borderRadius: '12px',
                              border: '1px dashed var(--theme-secondary, #10b981)',
                              backgroundColor: 'transparent',
                              color: 'var(--theme-secondary, #10b981)',
                              fontSize: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '20px',
                              height: '20px'
                            }}
                            title="Add more ANAF accounts to this mapping"
                          >
                            +
                          </button>
                        </div>
                        {mappedAnafAccounts.length === 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--theme-text-secondary)', fontStyle: 'italic', marginTop: '5px' }}>
                            No ANAF accounts mapped yet
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Add New Conta Relation Section */}
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--theme-border-color)' }}>
                {(() => {
                  const unmappedContaAccounts = availableAccounts.filter(account => 
                    !accountMappings.hasOwnProperty(account)
                  );
                  const hasAvailableAccounts = unmappedContaAccounts.length > 0;
                  
                  return (
                    <button
                      onClick={hasAvailableAccounts ? handleShowContaAccountSelection : undefined}
                      disabled={!hasAvailableAccounts}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: `2px dashed ${hasAvailableAccounts ? 'var(--theme-border-color)' : '#ccc'}`,
                        backgroundColor: 'transparent',
                        color: hasAvailableAccounts ? 'var(--theme-text-color)' : '#999',
                        fontSize: '14px',
                        cursor: hasAvailableAccounts ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        opacity: hasAvailableAccounts ? 1 : 0.5
                      }}
                      title={hasAvailableAccounts 
                        ? "Add new conta account relation" 
                        : "All available conta accounts are already mapped. Add new accounts in the Account Selection panel first."}
                      onMouseOver={(e) => {
                        if (hasAvailableAccounts) {
                          e.target.style.backgroundColor = 'var(--theme-hover-bg, rgba(0,0,0,0.05))';
                          e.target.style.borderColor = 'var(--theme-primary, #4f46e5)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (hasAvailableAccounts) {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.borderColor = 'var(--theme-border-color)';
                        }
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>+</span>
                      Add New Conta Account Relation
                      {!hasAvailableAccounts && (
                        <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                          (No available accounts)
                        </span>
                      )}
                    </button>
                  );
                })()}
              </div>
              
              {Object.keys(accountMappings).length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  color: 'var(--theme-text-secondary)', 
                  fontSize: '12px' 
                }}>
                  No account mappings defined.<br />
                  Click the button below to add your first mapping.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Panel 10 - Account Sums Display */}
        <div 
          className="conta-sums panel"
          data-panel="sums-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'sums-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('sums-panel').x}px`,
            top: `${getVisualPosition('sums-panel').y}px`,
            width: `${getVisualPosition('sums-panel').width}px`,
            height: `${getVisualPosition('sums-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'sums-panel')}
            />
          )}
          <div className="panel-content">
            {isDeveloperMode && (
              <div style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px', 
                fontSize: '10px', 
                color: 'var(--theme-text-color, #666)', 
                opacity: 0.7,
                userSelect: 'none',
                pointerEvents: 'none'
              }}>
                sums-panel
              </div>
            )}
            <h3 style={{ textAlign: 'center' }}>Account Sums</h3>
            
            {/* Conta Sums Section */}
            {Object.keys(accountSums).length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--theme-primary, #4f46e5)' }}>Conta Accounts</h4>
                {Object.entries(accountSums).map(([account, sum]) => (
                  <div key={account} style={{
                    padding: '10px',
                    margin: '5px 0',
                    backgroundColor: 'var(--theme-button-bg)',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>Account {account}:</span>
                    <strong>{sum.toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* ANAF Sums Section */}
            {Object.keys(anafAccountSums).length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--theme-secondary, #10b981)' }}>ANAF Accounts</h4>
                {Object.entries(anafAccountSums).map(([account, sum]) => (
                  <div key={`anaf-${account}`} style={{
                    padding: '10px',
                    margin: '5px 0',
                    backgroundColor: 'var(--theme-button-bg)',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    border: '1px solid var(--theme-secondary, #10b981)'
                  }}>
                    <span>ANAF {account}:</span>
                    <strong>{sum.toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            {(Object.keys(accountSums).length > 0 || Object.keys(anafAccountSums).length > 0) ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                {Object.keys(accountSums).length > 0 && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setAccountSums({})}
                    style={{ flex: 1, fontSize: '12px' }}
                  >
                    Clear Conta
                  </button>
                )}
                {Object.keys(anafAccountSums).length > 0 && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setAnafAccountSums({})}
                    style={{ flex: 1, fontSize: '12px' }}
                  >
                    Clear ANAF
                  </button>
                )}
              </div>
            ) : (
              <p style={{ textAlign: 'center' }}>No sums calculated yet</p>
            )}
          </div>
        </div>
        
        {/* Generate Summary Button */}
        <div 
          className="merge-section panel button-panel"
          data-panel="generate-summary-button"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'generate-summary-button', type: 'button' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('generate-summary-button').x}px`,
            top: `${getVisualPosition('generate-summary-button').y}px`,
            width: `${getVisualPosition('generate-summary-button').width}px`,
            height: `${getVisualPosition('generate-summary-button').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'generate-summary-button')}
            />
          )}
          {isDeveloperMode && (
            <div style={{ 
              position: 'absolute', 
              top: '4px', 
              right: '4px', 
              fontSize: '10px', 
              color: 'var(--theme-text-color, #666)', 
              backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
              padding: '2px 4px', 
              borderRadius: '2px',
              fontFamily: 'monospace',
              zIndex: 1000
            }}>
              generate-summary-button
            </div>
          )}
          <button 
            className="merge-button" 
            onClick={handleGenerateSummary}
            disabled={isProcessing || anafFiles.length === 0}
          >
            {isProcessing ? 'Processing...' : t('generateSummary')}
          </button>
        </div>
        
        {/* Panel 9 - Final Summary */}
        <div 
          className="merged-files-section panel"
          data-panel="final-summary-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'final-summary-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('final-summary-panel').x}px`,
            top: `${getVisualPosition('final-summary-panel').y}px`,
            width: `${getVisualPosition('final-summary-panel').width}px`,
            height: `${getVisualPosition('final-summary-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'final-summary-panel')}
            />
          )}
          <div className="panel-content">
            {isDeveloperMode && (
              <div style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px', 
                fontSize: '10px', 
                color: 'var(--theme-text-color, #666)', 
                backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                padding: '2px 4px', 
                borderRadius: '2px',
                fontFamily: 'monospace',
                zIndex: 1000
              }}>
                final-summary-panel
              </div>
            )}
            <h3>Final Summary</h3>
            {processingSummary ? (
              <div className="merged-summary">
                <div className="summary-stats-compact">
                  <div className="stats-row">
                    <div className="stat-item">
                      <div className="stat-label">{t('filesMerged')}</div>
                      <div className="stat-value">{processingSummary.filesProcessed}</div>
                    </div>
                    
                    <div className="stat-item">
                      <div className="stat-label">{t('totalDataRows')}</div>
                      <div className="stat-value">{processingSummary.totalDataRows}</div>
                    </div>
                    
                    <div className="stat-item">
                      <div className="stat-label">{t('columnHeadersMatch')}</div>
                      <div className="stat-value">
                        <span className={`header-match-badge ${(processingSummary.matchingFiles || 0) === processingSummary.filesProcessed ? 'success' : 'warning'}`}>
                          {processingSummary.matchingFiles || 0}/{processingSummary.filesProcessed}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="summary-actions-inline">
                    <button 
                      className="btn btn-view-summary"
                      onClick={() => setShowMergedFilesPopup(true)}
                    >
                      View Summary
                    </button>
                  </div>
                </div>
                
                <div className="merged-actions">
                  <button className="btn btn-primary" onClick={handleDownloadFile}>
                    {t('download') || 'Download'}
                  </button>
                  <button className="btn btn-secondary" onClick={handleOpenFile}>
                    {t('open') || 'Open'}
                  </button>
                </div>
              </div>
            ) : (
              <p>{t('mergeResultsWillAppearHere') || 'Merge results will appear here'}</p>
            )}
          </div>
        </div>
        
        {/* Status Message */}
        {status && (
          <div className="status-message" style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}>
            <p>{status}</p>
          </div>
        )}
        
        
        {/* Conta Files Popup */}
        {showContaFilesPopup && (
          <div className="popup-overlay" onClick={() => setShowContaFilesPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              {isDeveloperMode && (
                <div style={{ 
                  position: 'absolute', 
                  top: '4px', 
                  right: '4px', 
                  fontSize: '10px', 
                  color: 'var(--theme-text-color, #666)', 
                  backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                  padding: '2px 4px', 
                  borderRadius: '2px',
                  fontFamily: 'monospace',
                  zIndex: 1000
                }}>
                  conta-files-popup
                </div>
              )}
              <div className="popup-header">
                <h3>Conta Files ({contabilitateFiles.length})</h3>
                <button className="close-btn" onClick={() => setShowContaFilesPopup(false)}>×</button>
              </div>
              <div 
                className="popup-body"
                ref={contaPopupBodyRef}
              >
                <div className="file-list-detailed">
                  {contabilitateFiles.length > 0 ? (
                    contabilitateFiles.map((fileData, index) => (
                      <div 
                        key={`conta-${index}`} 
                        className={`file-item-detailed ${selectedFileIndices.has(index) ? 'selected' : ''}`}
                        onClick={(e) => handleFileClick(index, e)}
                      >
                        <div className="file-name-detailed">{fileData.fileName}</div>
                        <div className="file-info">
                          <span className="file-rows">{fileData.rowCount} rows</span>
                          <span className="file-path">{fileData.filePath}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px 20px', 
                      color: 'var(--theme-text-color)', 
                      opacity: 0.6 
                    }}>
                      No Conta files uploaded yet
                    </div>
                  )}
                </div>
                <div className="file-controls">
                  <button className="btn btn-secondary" onClick={selectAllContabilitateFiles}>Select All</button>
                  <button className="btn btn-secondary" onClick={deselectAllContabilitateFiles}>Deselect All</button>
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDeleteSelectedContabilitate} 
                    disabled={selectedFileIndices.size === 0}
                  >
                    Delete Selected ({selectedFileIndices.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANAF Files Popup */}
        {showAnafFilesPopup && (
          <div className="popup-overlay" onClick={() => setShowAnafFilesPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              {isDeveloperMode && (
                <div style={{ 
                  position: 'absolute', 
                  top: '4px', 
                  right: '4px', 
                  fontSize: '10px', 
                  color: 'var(--theme-text-color, #666)', 
                  backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                  padding: '2px 4px', 
                  borderRadius: '2px',
                  fontFamily: 'monospace',
                  zIndex: 1000
                }}>
                  anaf-files-popup
                </div>
              )}
              <div className="popup-header">
                <h3>ANAF Files ({anafFiles.length})</h3>
                <button className="close-btn" onClick={() => setShowAnafFilesPopup(false)}>×</button>
              </div>
              <div 
                className="popup-body"
                ref={anafPopupBodyRef}
              >
                <div className="file-list-detailed">
                  {anafFiles.length > 0 ? (
                    anafFiles.map((fileData, index) => (
                      <div 
                        key={`anaf-${index}`} 
                        className={`file-item-detailed ${selectedAnafFileIndices.has(index) ? 'selected' : ''}`}
                        onClick={(e) => handleAnafFileClick(index, e)}
                      >
                        <div className="file-name-detailed">{fileData.fileName}</div>
                        <div className="file-info">
                          <span className="file-rows">{fileData.rowCount} rows</span>
                          <span className="file-path">{fileData.filePath}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px 20px', 
                      color: 'var(--theme-text-color)', 
                      opacity: 0.6 
                    }}>
                      No ANAF files uploaded yet
                    </div>
                  )}
                </div>
                <div className="file-controls">
                  <button className="btn btn-secondary" onClick={selectAllAnafFiles}>Select All</button>
                  <button className="btn btn-secondary" onClick={deselectAllAnafFiles}>Deselect All</button>
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDeleteSelectedAnaf} 
                    disabled={selectedAnafFileIndices.size === 0}
                  >
                    Delete Selected ({selectedAnafFileIndices.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {showDateColumnsPopup && (
          <div className="popup-overlay" onClick={() => setShowDateColumnsPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              {isDeveloperMode && (
                <div style={{ 
                  position: 'absolute', 
                  top: '4px', 
                  right: '4px', 
                  fontSize: '10px', 
                  color: 'var(--theme-text-color, #666)', 
                  backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                  padding: '2px 4px', 
                  borderRadius: '2px',
                  fontFamily: 'monospace',
                  zIndex: 1000
                }}>
                  date-columns-popup
                </div>
              )}
              <div className="popup-header">
                <h3>All Columns - Select/Deselect Date Columns</h3>
                <button className="close-btn" onClick={() => setShowDateColumnsPopup(false)}>×</button>
              </div>
              <div className="popup-body">
                <div className="columns-grid">
                  {(() => {
                    // Get batch-specific data based on which batch opened the popup
                    const currentColumnNames = dateColumnsPopupBatch === 'anaf' 
                      ? anafColumnNames 
                      : contabilitateColumnNames;
                    const currentSelectedDateColumns = dateColumnsPopupBatch === 'anaf' 
                      ? anafSelectedDateColumns 
                      : contabilitateSelectedDateColumns;
                    const currentAutoDetectedDateColumns = dateColumnsPopupBatch === 'anaf' 
                      ? anafAutoDetectedDateColumns 
                      : contabilitateAutoDetectedDateColumns;
                    const currentDateColumnsWithTime = dateColumnsPopupBatch === 'anaf' 
                      ? anafDateColumnsWithTime 
                      : contabilitateDateColumnsWithTime;
                    
                    return currentColumnNames.map((col, index) => {
                      const isSelected = currentSelectedDateColumns.includes(index);
                      const isAutoDetected = currentAutoDetectedDateColumns.includes(index);
                      const hasTime = currentDateColumnsWithTime.includes(index);
                    
                    return (
                      <button
                        key={index}
                        className={`column-btn ${isSelected ? 'selected' : ''} ${isAutoDetected ? 'auto-detected' : ''}`}
                        onClick={() => handleDateColumnChange(index)}
                        disabled={isProcessing}
                      >
                        <div style={{ flex: '1' }}>
                          <div className="column-name">{col?.name || `Column ${index + 1}`}</div>
                          {columnSampleData[index] !== null && columnSampleData[index] !== undefined && (
                            <div className="column-sample" style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-primary)',
                              marginTop: '6px',
                              padding: '12px 14px',
                              backgroundColor: 'rgba(0, 0, 0, 0.02)',
                              borderRadius: '8px',
                              fontStyle: 'italic',
                              border: '1px dashed rgba(203, 213, 225, 0.4)',
                              wordBreak: 'break-word',
                              lineHeight: '1.5',
                              minHeight: '40px',
                              maxHeight: '55px',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              Example: "{String(columnSampleData[index]).substring(0, 80)}{String(columnSampleData[index]).length > 80 ? '...' : ''}"
                            </div>
                          )}
                        </div>
                        <div className="column-info">
                          {isAutoDetected && <span className="badge auto">Auto</span>}
                          {hasTime && <span className="badge time">⏰</span>}
                          {isSelected && <span className="badge selected">✅</span>}
                        </div>
                      </button>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        
        {showMergedFilesPopup && processingSummary && (
          <div className="popup-overlay" onClick={() => setShowMergedFilesPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              {isDeveloperMode && (
                <div style={{ 
                  position: 'absolute', 
                  top: '4px', 
                  right: '4px', 
                  fontSize: '10px', 
                  color: 'var(--theme-text-color, #666)', 
                  backgroundColor: 'var(--theme-bg-color, rgba(0,0,0,0.1))', 
                  padding: '2px 4px', 
                  borderRadius: '2px',
                  fontFamily: 'monospace',
                  zIndex: 1000
                }}>
                  merged-files-popup
                </div>
              )}
              <div className="popup-header">
                <h3>Merged Files Summary</h3>
                <button className="close-btn" onClick={() => setShowMergedFilesPopup(false)}>×</button>
              </div>
              <div className="popup-body">
                <div className="files-grid">
                  {processingSummary.fileDetails && 
                    // Sort files - non-matching first, then matching
                    [...processingSummary.fileDetails]
                      .sort((a, b) => {
                        // Non-matching files first (headerMatch false comes before true)
                        if (a.headerMatch === b.headerMatch) return 0;
                        return a.headerMatch ? 1 : -1;
                      })
                      .map((file, index) => (
                        <div key={index} className={`file-item ${file.headerMatch ? 'match' : 'no-match'}`}>
                          <div className="file-content">
                            <div className="file-name">{file.fileName}</div>
                            <div className="file-rows">{file.dataRows} rows</div>
                            <div className={`file-status ${file.headerMatch ? 'match' : 'no-match'}`}>
                              {file.headerMatch ? '✓ Headers match' : '⚠ Headers differ'}
                            </div>
                          </div>
                        </div>
                      ))
                  }
                </div>
                <div className="summary-totals-grid">
                  <div className="total-card">
                    <div className="total-label">Total Files:</div>
                    <div className="total-value">{processingSummary.filesProcessed}</div>
                  </div>
                  <div className="total-card">
                    <div className="total-label">Total Rows:</div>
                    <div className="total-value">{processingSummary.totalDataRows}</div>
                  </div>
                  <div className="total-card">
                    <div className="total-label">Common Headers:</div>
                    <div className="total-value">{processingSummary.commonHeaderRows}</div>
                  </div>
                  <div className="total-card">
                    <div className="total-label">Header Matches:</div>
                    <div className="total-value">{processingSummary.matchingFiles || 0}/{processingSummary.filesProcessed}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Minimap - only shown in layout mode */}
        {renderMinimap()}
      </main>

      {/* Context Menu for Account Configuration */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            borderRadius: '12px',
            border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
            boxShadow: `
              0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
              inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
              inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
            `,
            zIndex: 99999,
            minWidth: '200px',
            padding: '12px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--theme-text-color)' }}>
            Account: {contextMenu.account}
          </div>
          
          <div style={{ marginBottom: '8px', position: 'relative' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--theme-text-color)' }}>
              Filter Column:
            </label>
            <div
              onClick={() => {
                setFilterDropdownOpen(!filterDropdownOpen);
                setSumDropdownOpen(false);
              }}
              style={{
                width: '100%',
                padding: '4px 20px 4px 4px',
                fontSize: '12px',
                backgroundColor: 'var(--theme-input-bg)',
                color: 'var(--theme-text-color)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>
                {(() => {
                  const value = getAccountConfig(contextMenu.account).filterColumn;
                  switch(value) {
                    case 'cont': return 'cont (Account)';
                    case 'data': return 'data (Date)';
                    case 'explicatie': return 'explicatie (Description)';
                    case 'ndp': return 'ndp (Document Number)';
                    default: return value;
                  }
                })()}
              </span>
              <span style={{ transform: filterDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </div>
            {filterDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                borderRadius: '8px',
                border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
                boxShadow: `
                  0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                  inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
                  inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
                `,
                zIndex: 100001,
                marginTop: '2px'
              }}>
                {[
                  { value: 'cont', label: 'cont (Account)' },
                  { value: 'data', label: 'data (Date)' },
                  { value: 'explicatie', label: 'explicatie (Description)' },
                  { value: 'ndp', label: 'ndp (Document Number)' }
                ].map((option, index, arr) => (
                  <div
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAccountConfig(contextMenu.account, {
                        ...getAccountConfig(contextMenu.account),
                        filterColumn: option.value
                      });
                      setFilterDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--theme-text-color)',
                      cursor: 'pointer',
                      borderRadius: index === 0 ? '8px 8px 0 0' : 
                                  index === arr.length - 1 ? '0 0 8px 8px' : '0',
                      background: getAccountConfig(contextMenu.account).filterColumn === option.value ? 
                        'linear-gradient(135deg, var(--glass-bg, rgba(255, 255, 255, 0.95)), var(--glass-bg, rgba(255, 255, 255, 0.85)))' : 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
                      backdropFilter: 'blur(15px)',
                      WebkitBackdropFilter: 'blur(15px)',
                      border: getAccountConfig(contextMenu.account).filterColumn === option.value ? 
                        '2px solid var(--theme-accent, #10b981)' : '1px solid transparent',
                      boxShadow: getAccountConfig(contextMenu.account).filterColumn === option.value ? 
                        `0 4px 12px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                         inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.9)),
                         0 0 0 1px var(--theme-accent, rgba(16, 185, 129, 0.3))` : 'none',
                      margin: '2px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (getAccountConfig(contextMenu.account).filterColumn !== option.value) {
                        e.target.style.background = 'var(--glass-bg, rgba(255, 255, 255, 0.75))';
                        e.target.style.border = '1px solid var(--glass-border, rgba(0, 0, 0, 0.15))';
                        e.target.style.boxShadow = '0 1px 4px var(--glass-shadow, rgba(0, 0, 0, 0.08))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (getAccountConfig(contextMenu.account).filterColumn !== option.value) {
                        e.target.style.background = 'var(--glass-bg, rgba(255, 255, 255, 0.6))';
                        e.target.style.border = '1px solid transparent';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--theme-text-color)' }}>
              Filter Value:
            </label>
            <input
              type="text"
              value={getAccountConfig(contextMenu.account).filterValue || ''}
              onChange={(e) => updateAccountConfig(contextMenu.account, {
                ...getAccountConfig(contextMenu.account),
                filterValue: e.target.value
              })}
              disabled={getAccountConfig(contextMenu.account).filterColumn === 'cont'}
              style={{
                width: '100%',
                padding: '4px',
                fontSize: '12px',
                backgroundColor: getAccountConfig(contextMenu.account).filterColumn === 'cont' ? 
                  'var(--theme-bg-color-disabled, rgba(128, 128, 128, 0.2))' : 'var(--theme-input-bg)',
                color: getAccountConfig(contextMenu.account).filterColumn === 'cont' ? 
                  'var(--theme-text-color-disabled, rgba(128, 128, 128, 0.6))' : 'var(--theme-text-color)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '2px',
                cursor: getAccountConfig(contextMenu.account).filterColumn === 'cont' ? 'not-allowed' : 'text'
              }}
              placeholder={getAccountConfig(contextMenu.account).filterColumn === 'cont' ? 
                contextMenu.account : 'Enter filter value...'}
            />
          </div>

          <div style={{ marginBottom: '12px', position: 'relative' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--theme-text-color)' }}>
              Sum Column:
            </label>
            <div
              onClick={() => {
                setSumDropdownOpen(!sumDropdownOpen);
                setFilterDropdownOpen(false);
              }}
              style={{
                width: '100%',
                padding: '4px 20px 4px 4px',
                fontSize: '12px',
                backgroundColor: 'var(--theme-input-bg)',
                color: 'var(--theme-text-color)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>
                {(() => {
                  const value = getAccountConfig(contextMenu.account).sumColumn;
                  switch(value) {
                    case 'suma_c': return 'suma_c (Credit)';
                    case 'suma_d': return 'suma_d (Debit)';
                    case 'sold': return 'sold (Balance)';
                    default: return value;
                  }
                })()}
              </span>
              <span style={{ transform: sumDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </div>
            {sumDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                borderRadius: '8px',
                border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
                boxShadow: `
                  0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                  inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
                  inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
                `,
                zIndex: 100001,
                marginTop: '2px'
              }}>
                {[
                  { value: 'suma_c', label: 'suma_c (Credit)' },
                  { value: 'suma_d', label: 'suma_d (Debit)' },
                  { value: 'sold', label: 'sold (Balance)' }
                ].map((option, index, arr) => (
                  <div
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAccountConfig(contextMenu.account, {
                        ...getAccountConfig(contextMenu.account),
                        sumColumn: option.value
                      });
                      setSumDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--theme-text-color)',
                      cursor: 'pointer',
                      borderRadius: index === 0 ? '8px 8px 0 0' : 
                                  index === arr.length - 1 ? '0 0 8px 8px' : '0',
                      background: getAccountConfig(contextMenu.account).sumColumn === option.value ? 
                        'linear-gradient(135deg, var(--glass-bg, rgba(255, 255, 255, 0.95)), var(--glass-bg, rgba(255, 255, 255, 0.85)))' : 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
                      backdropFilter: 'blur(15px)',
                      WebkitBackdropFilter: 'blur(15px)',
                      border: getAccountConfig(contextMenu.account).sumColumn === option.value ? 
                        '2px solid var(--theme-accent, #10b981)' : '1px solid transparent',
                      boxShadow: getAccountConfig(contextMenu.account).sumColumn === option.value ? 
                        `0 4px 12px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                         inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.9)),
                         0 0 0 1px var(--theme-accent, rgba(16, 185, 129, 0.3))` : 'none',
                      margin: '2px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (getAccountConfig(contextMenu.account).sumColumn !== option.value) {
                        e.target.style.background = 'var(--glass-bg, rgba(255, 255, 255, 0.75))';
                        e.target.style.border = '1px solid var(--glass-border, rgba(0, 0, 0, 0.15))';
                        e.target.style.boxShadow = '0 1px 4px var(--glass-shadow, rgba(0, 0, 0, 0.08))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (getAccountConfig(contextMenu.account).sumColumn !== option.value) {
                        e.target.style.background = 'var(--glass-bg, rgba(255, 255, 255, 0.6))';
                        e.target.style.border = '1px solid transparent';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#ef4444',
              borderRadius: '4px',
              textAlign: 'center',
              border: '1px solid #ef4444'
            }}
            onClick={handleDeleteAccount}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Delete Account
          </div>
        </div>
      )}

      {anafContextMenu && (
        <div
          style={{
            position: 'fixed',
            left: anafContextMenu.x,
            top: anafContextMenu.y,
            background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            borderRadius: '12px',
            border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
            boxShadow: `
              0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
              inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
              inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
            `,
            zIndex: 99999,
            minWidth: '250px',
            padding: '12px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--theme-text-color)' }}>
            Account: {anafContextMenu.account}
          </div>
          
          <div style={{ marginBottom: '8px', position: 'relative' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--theme-text-color)' }}>
              Filter Column:
            </label>
            <div
              onClick={() => {
                setAnafFilterDropdownOpen(!anafFilterDropdownOpen);
                setAnafSumDropdownOpen(false);
              }}
              style={{
                width: '100%',
                padding: '4px 20px 4px 4px',
                fontSize: '12px',
                backgroundColor: 'var(--theme-input-bg)',
                color: 'var(--theme-text-color)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>
                {(() => {
                  const value = getAnafAccountConfig(anafContextMenu.account).filterColumn;
                  switch(value) {
                    case 'CTG_SUME': return 'CTG_SUME';
                    case 'ATRIBUT_PL': return 'ATRIBUT_PL';
                    case 'IME_COD_IMPOZIT': return 'IME_COD_IMPOZIT';
                    case 'DENUMIRE_IMPOZIT': return 'DENUMIRE_IMPOZIT';
                    default: return value;
                  }
                })()
                }
              </span>
              <span style={{ transform: anafFilterDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </div>
            {anafFilterDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                borderRadius: '8px',
                border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
                boxShadow: `
                  0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                  inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
                  inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
                `,
                zIndex: 100001,
                marginTop: '2px'
              }}>
                {[
                  { value: 'CTG_SUME', label: 'CTG_SUME' },
                  { value: 'ATRIBUT_PL', label: 'ATRIBUT_PL' },
                  { value: 'IME_COD_IMPOZIT', label: 'IME_COD_IMPOZIT' },
                  { value: 'DENUMIRE_IMPOZIT', label: 'DENUMIRE_IMPOZIT' }
                ].map((option, index, arr) => (
                  <div
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAnafAccountConfig(anafContextMenu.account, {
                        ...getAnafAccountConfig(anafContextMenu.account),
                        filterColumn: option.value
                      });
                      setAnafFilterDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--theme-text-color)',
                      cursor: 'pointer',
                      borderRadius: index === 0 ? '8px 8px 0 0' : 
                                  index === arr.length - 1 ? '0 0 8px 8px' : '0',
                      background: getAnafAccountConfig(anafContextMenu.account).filterColumn === option.value ? 
                        'linear-gradient(135deg, var(--glass-bg, rgba(255, 255, 255, 0.95)), var(--glass-bg, rgba(255, 255, 255, 0.85)))' : 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
                      backdropFilter: 'blur(15px)',
                      WebkitBackdropFilter: 'blur(15px)',
                      border: getAnafAccountConfig(anafContextMenu.account).filterColumn === option.value ? 
                        '2px solid var(--theme-accent, #10b981)' : '1px solid transparent',
                      boxShadow: getAnafAccountConfig(anafContextMenu.account).filterColumn === option.value ? 
                        `0 4px 12px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                         inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.9)),
                         0 0 0 1px var(--theme-accent, rgba(16, 185, 129, 0.3))` : 'none',
                      margin: '2px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (getAnafAccountConfig(anafContextMenu.account).filterColumn !== option.value) {
                        e.target.style.background = 'var(--glass-bg, rgba(255, 255, 255, 0.75))';
                        e.target.style.border = '1px solid var(--glass-border, rgba(0, 0, 0, 0.15))';
                        e.target.style.boxShadow = '0 1px 4px var(--glass-shadow, rgba(0, 0, 0, 0.08))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (getAnafAccountConfig(anafContextMenu.account).filterColumn !== option.value) {
                        e.target.style.background = 'var(--glass-bg, rgba(255, 255, 255, 0.6))';
                        e.target.style.border = '1px solid transparent';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '8px', position: 'relative' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--theme-text-color)' }}>
              Filter Value:
            </label>
            <div
              onClick={() => {
                setAnafFilterValueDropdownOpen(!anafFilterValueDropdownOpen);
                setAnafFilterDropdownOpen(false);
                setAnafSumDropdownOpen(false);
              }}
              style={{
                width: '100%',
                padding: '4px 20px 4px 4px',
                fontSize: '12px',
                backgroundColor: 'var(--theme-input-bg)',
                color: 'var(--theme-text-color)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>
                {(() => {
                  const value = getAnafAccountConfig(anafContextMenu.account).filterValue || '';
                  return value || '(No filter)';
                })()}
              </span>
              <span style={{ transform: anafFilterValueDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </div>
            {anafFilterValueDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                borderRadius: '8px',
                border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
                boxShadow: `
                  0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                  inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
                  inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
                `,
                zIndex: 100001,
                marginTop: '2px'
              }}>
                {getAnafFilterValueOptions(getAnafAccountConfig(anafContextMenu.account).filterColumn).map((option, index, arr) => (
                  <div
                    key={option.value || `empty-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAnafAccountConfig(anafContextMenu.account, {
                        ...getAnafAccountConfig(anafContextMenu.account),
                        filterValue: option.value
                      });
                      setAnafFilterValueDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--theme-text-color)',
                      cursor: 'pointer',
                      borderRadius: index === 0 ? '8px 8px 0 0' : 
                                  index === arr.length - 1 ? '0 0 8px 8px' : '0',
                      background: getAnafAccountConfig(anafContextMenu.account).filterValue === option.value ? 
                        'linear-gradient(135deg, var(--glass-bg, rgba(255, 255, 255, 0.95)), var(--glass-bg, rgba(255, 255, 255, 0.85)))' : 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
                      backdropFilter: 'blur(15px)',
                      WebkitBackdropFilter: 'blur(15px)',
                      border: getAnafAccountConfig(anafContextMenu.account).filterValue === option.value ? 
                        '2px solid var(--theme-accent, #10b981)' : '1px solid transparent',
                      boxShadow: getAnafAccountConfig(anafContextMenu.account).filterValue === option.value ? 
                        `0 4px 12px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                         inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.9)),
                         0 0 0 1px var(--theme-accent, rgba(16, 185, 129, 0.3))` : 'none',
                      margin: '2px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (getAnafAccountConfig(anafContextMenu.account).filterValue !== option.value) {
                        e.target.style.background = 'var(--glass-bg, rgba(255, 255, 255, 0.75))';
                        e.target.style.border = '1px solid var(--glass-border, rgba(0, 0, 0, 0.15))';
                        e.target.style.boxShadow = '0 1px 4px var(--glass-shadow, rgba(0, 0, 0, 0.08))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (getAnafAccountConfig(anafContextMenu.account).filterValue !== option.value) {
                        e.target.style.background = 'var(--glass-bg, rgba(255, 255, 255, 0.6))';
                        e.target.style.border = '1px solid transparent';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '8px', position: 'relative' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--theme-text-color)' }}>
              Sum Column:
            </label>
            <div
              onClick={() => {
                setAnafSumDropdownOpen(!anafSumDropdownOpen);
                setAnafFilterDropdownOpen(false);
              }}
              style={{
                width: '100%',
                padding: '4px 20px 4px 4px',
                fontSize: '12px',
                backgroundColor: 'var(--theme-input-bg)',
                color: 'var(--theme-text-color)',
                border: '1px solid var(--theme-border-color)',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>
                {(() => {
                  const value = getAnafAccountConfig(anafContextMenu.account).sumColumn;
                  switch(value) {
                    case 'SUMA_PLATA': return 'SUMA_PLATA';
                    case 'INCASARI': return 'INCASARI';
                    case 'SUMA_NEACHITATA': return 'SUMA_NEACHITATA';
                    case 'RAMBURSARI': return 'RAMBURSARI';
                    default: return value;
                  }
                })()}
              </span>
              <span style={{ transform: anafSumDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </div>
            {anafSumDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                borderRadius: '8px',
                border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
                boxShadow: `
                  0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                  inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
                  inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
                `,
                zIndex: 100001,
                marginTop: '2px'
              }}>
                {[
                  { value: 'SUMA_PLATA', label: 'SUMA_PLATA' },
                  { value: 'INCASARI', label: 'INCASARI' },
                  { value: 'SUMA_NEACHITATA', label: 'SUMA_NEACHITATA' },
                  { value: 'RAMBURSARI', label: 'RAMBURSARI' }
                ].map((option, index, arr) => (
                  <div
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAnafAccountConfig(anafContextMenu.account, {
                        ...getAnafAccountConfig(anafContextMenu.account),
                        sumColumn: option.value
                      });
                      setAnafSumDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--theme-text-color)',
                      cursor: 'pointer',
                      borderRadius: index === 0 ? '8px 8px 0 0' : 
                                  index === arr.length - 1 ? '0 0 8px 8px' : '0',
                      background: getAnafAccountConfig(anafContextMenu.account).sumColumn === option.value ? 
                        'linear-gradient(135deg, var(--glass-bg, rgba(255, 255, 255, 0.95)), var(--glass-bg, rgba(255, 255, 255, 0.85)))' : 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
                      backdropFilter: 'blur(15px)',
                      WebkitBackdropFilter: 'blur(15px)',
                      border: getAnafAccountConfig(anafContextMenu.account).sumColumn === option.value ? 
                        '2px solid var(--theme-accent, #10b981)' : '1px solid transparent',
                      boxShadow: getAnafAccountConfig(anafContextMenu.account).sumColumn === option.value ? 
                        `0 4px 12px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                         inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.9)),
                         0 0 0 1px var(--theme-accent, rgba(16, 185, 129, 0.3))` : 'none',
                      margin: '2px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (getAnafAccountConfig(anafContextMenu.account).sumColumn !== option.value) {
                        e.target.style.background = 'var(--glass-bg, rgba(255, 255, 255, 0.75))';
                        e.target.style.border = '1px solid var(--glass-border, rgba(0, 0, 0, 0.15))';
                        e.target.style.boxShadow = '0 1px 4px var(--glass-shadow, rgba(0, 0, 0, 0.08))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (getAnafAccountConfig(anafContextMenu.account).sumColumn !== option.value) {
                        e.target.style.background = 'var(--glass-bg, rgba(255, 255, 255, 0.6))';
                        e.target.style.border = '1px solid transparent';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--theme-text-color)', margin: '0' }}>
                Subtract:
              </label>
              <div 
                onClick={() => toggleAnafSubtraction(anafContextMenu.account)}
                style={{
                  width: '40px',
                  height: '20px',
                  backgroundColor: isAnafSubtractionEnabled(anafContextMenu.account) ? '#10b981' : '#d1d5db',
                  borderRadius: '10px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: isAnafSubtractionEnabled(anafContextMenu.account) ? '22px' : '2px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>
            
            <div style={{ 
              opacity: isAnafSubtractionEnabled(anafContextMenu.account) ? 1 : 0.4, 
              pointerEvents: isAnafSubtractionEnabled(anafContextMenu.account) ? 'auto' : 'none',
              transition: 'opacity 0.2s'
            }}>
              <div style={{ marginBottom: '8px', position: 'relative' }}>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--theme-text-color)' }}>
                  Filter Column:
                </label>
                <div
                  onClick={() => {
                    if (isAnafSubtractionEnabled(anafContextMenu.account)) {
                      setAnafSubtractFilterDropdownOpen(!anafSubtractFilterDropdownOpen);
                      setAnafSubtractSumDropdownOpen(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 20px 4px 4px',
                    fontSize: '12px',
                    backgroundColor: 'var(--theme-input-bg)',
                    color: 'var(--theme-text-color)',
                    border: '1px solid var(--theme-border-color)',
                    borderRadius: '2px',
                    cursor: isAnafSubtractionEnabled(anafContextMenu.account) ? 'pointer' : 'not-allowed',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    {(() => {
                      const value = getAnafAccountConfig(anafContextMenu.account).subtractConfig?.filterColumn || 'CTG_SUME';
                      switch(value) {
                        case 'CTG_SUME': return 'CTG_SUME';
                        case 'ATRIBUT_PL': return 'ATRIBUT_PL';
                        case 'IME_COD_IMPOZIT': return 'IME_COD_IMPOZIT';
                        case 'DENUMIRE_IMPOZIT': return 'DENUMIRE_IMPOZIT';
                        default: return value;
                      }
                    })()
                    }
                  </span>
                  <span style={{ transform: anafSubtractFilterDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                </div>
                {anafSubtractFilterDropdownOpen && isAnafSubtractionEnabled(anafContextMenu.account) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
                    boxShadow: `
                      0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                      inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
                      inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
                    `,
                    zIndex: 100001,
                    marginTop: '2px'
                  }}>
                    {[
                      { value: 'CTG_SUME', label: 'CTG_SUME' },
                      { value: 'ATRIBUT_PL', label: 'ATRIBUT_PL' },
                      { value: 'IME_COD_IMPOZIT', label: 'IME_COD_IMPOZIT' },
                      { value: 'DENUMIRE_IMPOZIT', label: 'DENUMIRE_IMPOZIT' }
                    ].map((option, index, arr) => (
                      <div
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          const config = getAnafAccountConfig(anafContextMenu.account);
                          const subtractConfig = config.subtractConfig || {};
                          updateAnafAccountConfig(anafContextMenu.account, {
                            ...config,
                            subtractConfig: { ...subtractConfig, filterColumn: option.value }
                          });
                          setAnafSubtractFilterDropdownOpen(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: 'var(--theme-text-color)',
                          cursor: 'pointer',
                          borderRadius: index === 0 ? '8px 8px 0 0' : 
                                      index === arr.length - 1 ? '0 0 8px 8px' : '0',
                          background: (getAnafAccountConfig(anafContextMenu.account).subtractConfig?.filterColumn || 'CTG_SUME') === option.value ? 
                            'linear-gradient(135deg, var(--glass-bg, rgba(255, 255, 255, 0.95)), var(--glass-bg, rgba(255, 255, 255, 0.85)))' : 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
                          backdropFilter: 'blur(15px)',
                          WebkitBackdropFilter: 'blur(15px)',
                          border: (getAnafAccountConfig(anafContextMenu.account).subtractConfig?.filterColumn || 'CTG_SUME') === option.value ? 
                            '2px solid var(--theme-accent, #10b981)' : '1px solid transparent',
                          boxShadow: (getAnafAccountConfig(anafContextMenu.account).subtractConfig?.filterColumn || 'CTG_SUME') === option.value ? 
                            `0 4px 12px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                             inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.9)),
                             0 0 0 1px var(--theme-accent, rgba(16, 185, 129, 0.3))` : 'none',
                          margin: '2px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '8px', position: 'relative' }}>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--theme-text-color)' }}>
                  Filter Value:
                </label>
                <div
                  onClick={() => {
                    if (isAnafSubtractionEnabled(anafContextMenu.account)) {
                      setAnafSubtractFilterValueDropdownOpen(!anafSubtractFilterValueDropdownOpen);
                      setAnafSubtractFilterDropdownOpen(false);
                      setAnafSubtractSumDropdownOpen(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 20px 4px 4px',
                    fontSize: '12px',
                    backgroundColor: 'var(--theme-input-bg)',
                    color: 'var(--theme-text-color)',
                    border: '1px solid var(--theme-border-color)',
                    borderRadius: '2px',
                    cursor: isAnafSubtractionEnabled(anafContextMenu.account) ? 'pointer' : 'not-allowed',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    {(() => {
                      const value = getAnafAccountConfig(anafContextMenu.account).subtractConfig?.filterValue || '';
                      return value || '(No filter)';
                    })()}
                  </span>
                  <span style={{ transform: anafSubtractFilterValueDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                </div>
                {anafSubtractFilterValueDropdownOpen && isAnafSubtractionEnabled(anafContextMenu.account) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
                    boxShadow: `
                      0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                      inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
                      inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
                    `,
                    zIndex: 100001,
                    marginTop: '2px'
                  }}>
                    {getAnafFilterValueOptions(getAnafAccountConfig(anafContextMenu.account).subtractConfig?.filterColumn || 'CTG_SUME').map((option, index, arr) => (
                      <div
                        key={option.value || `empty-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const config = getAnafAccountConfig(anafContextMenu.account);
                          const subtractConfig = config.subtractConfig || {};
                          updateAnafAccountConfig(anafContextMenu.account, {
                            ...config,
                            subtractConfig: { ...subtractConfig, filterValue: option.value }
                          });
                          setAnafSubtractFilterValueDropdownOpen(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: 'var(--theme-text-color)',
                          cursor: 'pointer',
                          borderRadius: index === 0 ? '8px 8px 0 0' : 
                                      index === arr.length - 1 ? '0 0 8px 8px' : '0',
                          background: (getAnafAccountConfig(anafContextMenu.account).subtractConfig?.filterValue || '') === option.value ? 
                            'linear-gradient(135deg, var(--glass-bg, rgba(255, 255, 255, 0.95)), var(--glass-bg, rgba(255, 255, 255, 0.85)))' : 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
                          backdropFilter: 'blur(15px)',
                          WebkitBackdropFilter: 'blur(15px)',
                          border: (getAnafAccountConfig(anafContextMenu.account).subtractConfig?.filterValue || '') === option.value ? 
                            '2px solid var(--theme-accent, #10b981)' : '1px solid transparent',
                          boxShadow: (getAnafAccountConfig(anafContextMenu.account).subtractConfig?.filterValue || '') === option.value ? 
                            `0 4px 12px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                             inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.9)),
                             0 0 0 1px var(--theme-accent, rgba(16, 185, 129, 0.3))` : 'none',
                          margin: '2px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '8px', position: 'relative' }}>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--theme-text-color)' }}>
                  Sum Column:
                </label>
                <div
                  onClick={() => {
                    if (isAnafSubtractionEnabled(anafContextMenu.account)) {
                      setAnafSubtractSumDropdownOpen(!anafSubtractSumDropdownOpen);
                      setAnafSubtractFilterDropdownOpen(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 20px 4px 4px',
                    fontSize: '12px',
                    backgroundColor: 'var(--theme-input-bg)',
                    color: 'var(--theme-text-color)',
                    border: '1px solid var(--theme-border-color)',
                    borderRadius: '2px',
                    cursor: isAnafSubtractionEnabled(anafContextMenu.account) ? 'pointer' : 'not-allowed',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    {(() => {
                      const value = getAnafAccountConfig(anafContextMenu.account).subtractConfig?.sumColumn || 'SUMA_PLATA';
                      switch(value) {
                        case 'SUMA_PLATA': return 'SUMA_PLATA';
                        case 'INCASARI': return 'INCASARI';
                        case 'SUMA_NEACHITATA': return 'SUMA_NEACHITATA';
                        case 'RAMBURSARI': return 'RAMBURSARI';
                        default: return value;
                      }
                    })()}
                  </span>
                  <span style={{ transform: anafSubtractSumDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                </div>
                {anafSubtractSumDropdownOpen && isAnafSubtractionEnabled(anafContextMenu.account) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
                    boxShadow: `
                      0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                      inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
                      inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
                    `,
                    zIndex: 100001,
                    marginTop: '2px'
                  }}>
                    {[
                      { value: 'SUMA_PLATA', label: 'SUMA_PLATA' },
                      { value: 'INCASARI', label: 'INCASARI' },
                      { value: 'SUMA_NEACHITATA', label: 'SUMA_NEACHITATA' },
                      { value: 'RAMBURSARI', label: 'RAMBURSARI' }
                    ].map((option, index, arr) => (
                      <div
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          const config = getAnafAccountConfig(anafContextMenu.account);
                          const subtractConfig = config.subtractConfig || {};
                          updateAnafAccountConfig(anafContextMenu.account, {
                            ...config,
                            subtractConfig: { ...subtractConfig, sumColumn: option.value }
                          });
                          setAnafSubtractSumDropdownOpen(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: 'var(--theme-text-color)',
                          cursor: 'pointer',
                          borderRadius: index === 0 ? '8px 8px 0 0' : 
                                      index === arr.length - 1 ? '0 0 8px 8px' : '0',
                          background: (getAnafAccountConfig(anafContextMenu.account).subtractConfig?.sumColumn || 'SUMA_PLATA') === option.value ? 
                            'linear-gradient(135deg, var(--glass-bg, rgba(255, 255, 255, 0.95)), var(--glass-bg, rgba(255, 255, 255, 0.85)))' : 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
                          backdropFilter: 'blur(15px)',
                          WebkitBackdropFilter: 'blur(15px)',
                          border: (getAnafAccountConfig(anafContextMenu.account).subtractConfig?.sumColumn || 'SUMA_PLATA') === option.value ? 
                            '2px solid var(--theme-accent, #10b981)' : '1px solid transparent',
                          boxShadow: (getAnafAccountConfig(anafContextMenu.account).subtractConfig?.sumColumn || 'SUMA_PLATA') === option.value ? 
                            `0 4px 12px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                             inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.9)),
                             0 0 0 1px var(--theme-accent, rgba(16, 185, 129, 0.3))` : 'none',
                          margin: '2px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#ef4444',
              borderRadius: '4px',
              textAlign: 'center',
              border: '1px solid #ef4444'
            }}
            onClick={handleDeleteAnafAccount}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Delete Account
          </div>
        </div>
      )}

      {mappingContextMenu && (
        <div
          style={{
            position: 'fixed',
            left: mappingContextMenu.x,
            top: mappingContextMenu.y,
            backgroundColor: 'var(--theme-panel-bg)',
            border: '1px solid var(--theme-border-color)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '180px'
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#ef4444',
              borderRadius: '4px',
              textAlign: 'center',
              border: '1px solid #ef4444'
            }}
            onClick={handleDeleteContaRelation}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Delete Relation
          </div>
        </div>
      )}

      {/* ANAF Account Selection Modal */}
      {showAnafSelectionModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={handleModalCancel}
        >
          <div
            style={{
              background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              borderRadius: '12px',
              border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
              boxShadow: `
                0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
                inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
              `,
              minWidth: '300px',
              maxWidth: '400px',
              maxHeight: '70vh',
              overflow: 'auto',
              padding: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {modalAvailableAnafAccounts.map(anafAccount => (
              <div
                key={anafAccount}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--theme-text-color)',
                  borderRadius: '4px',
                  textAlign: 'center',
                  border: '1px solid transparent',
                  marginBottom: '4px'
                }}
                onClick={() => {
                  setModalSelectedAnafAccount(anafAccount);
                  handleModalConfirm();
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(79, 70, 229, 0.1)';
                  e.target.style.borderColor = 'var(--theme-primary, #4f46e5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {anafAccount}
                  {defaultAccountMappings[modalContaAccount] && defaultAccountMappings[modalContaAccount].includes(anafAccount) && (
                    <span style={{
                      fontSize: '6px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '1px 3px',
                      borderRadius: '6px',
                      opacity: 0.8
                    }} title="Default mapping from conta anaf.txt">
                      DEFAULT
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conta Account Selection Modal */}
      {showContaSelectionModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={handleContaModalCancel}
        >
          <div
            style={{
              background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              borderRadius: '12px',
              border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
              boxShadow: `
                0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.15)),
                inset 0 1px 0 var(--glass-highlight, rgba(255, 255, 255, 0.8)),
                inset 0 -1px 0 var(--glass-lowlight, rgba(0, 0, 0, 0.05))
              `,
              minWidth: '300px',
              maxWidth: '400px',
              maxHeight: '70vh',
              overflow: 'auto',
              padding: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {modalAvailableContaAccounts.map(contaAccount => (
              <div
                key={contaAccount}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--theme-text-color)',
                  borderRadius: '4px',
                  textAlign: 'center',
                  border: '1px solid transparent',
                  marginBottom: '4px'
                }}
                onClick={() => {
                  setModalSelectedContaAccount(contaAccount);
                  handleContaModalConfirm();
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(79, 70, 229, 0.1)';
                  e.target.style.borderColor = 'var(--theme-primary, #4f46e5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = 'transparent';
                }}
              >
                {contaAccount}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;