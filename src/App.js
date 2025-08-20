import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [commonLines, setCommonLines] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdFilePath, setCreatedFilePath] = useState('');
  const [status, setStatus] = useState('');
  const [processingSummary, setProcessingSummary] = useState(null);
  const [showMergedFilesPopup, setShowMergedFilesPopup] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('professional');
  const [isLoading, setIsLoading] = useState(true);
  const [columnNamesRow, setColumnNamesRow] = useState(1);
  const [columnNames, setColumnNames] = useState([]);
  const [selectedDateColumns, setSelectedDateColumns] = useState([]);
  const [autoDetectedDateColumns, setAutoDetectedDateColumns] = useState([]);
  const [dateColumnsWithTime, setDateColumnsWithTime] = useState([]);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [panelPositions, setPanelPositions] = useState({
    'contabilitate-upload-panel': { x: 20, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'anaf-upload-panel': { x: 800, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'contabilitate-summary-panel': { x: 20, y: 240, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'anaf-summary-panel': { x: 800, y: 240, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'contabilitate-header-panel': { x: 20, y: 460, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'anaf-header-panel': { x: 800, y: 460, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'contabilitate-date-panel': { x: 20, y: 680, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'anaf-date-panel': { x: 800, y: 680, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
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
    { id: 'contabilitate-header-panel', name: 'Contabilitate Header Panel', type: 'panel', active: true },
    { id: 'anaf-header-panel', name: 'ANAF Header Panel', type: 'panel', active: true },
    { id: 'contabilitate-date-panel', name: 'Contabilitate Date Panel', type: 'panel', active: true },
    { id: 'anaf-date-panel', name: 'ANAF Date Panel', type: 'panel', active: true },
    { id: 'final-summary-panel', name: 'Final Summary Panel', type: 'panel', active: true }
  ]);
  const [showUploadedFilesPopup, setShowUploadedFilesPopup] = useState(false);
  const [showDateColumnsPopup, setShowDateColumnsPopup] = useState(false);
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
        setSelectedDateColumns(settings.selectedDateColumns || []);
        
        // Load saved layout positions only for current panels
        if (settings.panelPositions) {
          const defaultPanelPositions = {
            'contabilitate-upload-panel': { x: 20, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'anaf-upload-panel': { x: 800, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'contabilitate-summary-panel': { x: 20, y: 240, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'anaf-summary-panel': { x: 800, y: 240, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'contabilitate-header-panel': { x: 20, y: 460, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'anaf-header-panel': { x: 800, y: 460, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'contabilitate-date-panel': { x: 20, y: 680, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
            'anaf-date-panel': { x: 800, y: 680, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
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

  // Apply theme when component mounts and currentTheme changes
  useEffect(() => {
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentTheme]);

  // Auto-extract columns when columnNamesRow changes
  useEffect(() => {
    const numValue = parseInt(columnNamesRow);
    if (!isNaN(numValue) && numValue > 0 && anafFiles.length > 0) {
      console.log('useEffect: columnNamesRow changed to:', numValue, 'triggering extraction');
      const delayedExtraction = setTimeout(() => {
        extractColumnNames();
      }, 300);
      
      return () => clearTimeout(delayedExtraction);
    }
  }, [columnNamesRow, anafFiles]);

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
          await extractColumnNames();
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

  // Extract column names from the specified row
  const extractColumnNames = async () => {
    if (anafFiles.length === 0) return;
    
    try {
      console.log('Extracting column names for row:', columnNamesRow, '(type:', typeof columnNamesRow, ') with commonLines:', commonLines, '(type:', typeof commonLines, ')');
      const rowIndex = (parseInt(columnNamesRow) || 1) - 1;
      const commonLinesInt = parseInt(commonLines) || 1;
      
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
        setColumnNames(result.columnNames);
        setAutoDetectedDateColumns(result.autoDetectedDateColumns || []);
        setDateColumnsWithTime(result.dateColumnsWithTime || []);
        
        if (result.autoDetectedDateColumns && result.autoDetectedDateColumns.length > 0) {
          const newSelectedColumns = [...result.autoDetectedDateColumns];
          console.log('Auto-selecting all date columns:', newSelectedColumns);
          setSelectedDateColumns(newSelectedColumns);
          
          try {
            const settings = await window.electronAPI.loadSettings();
            await window.electronAPI.saveSettings({
              ...settings,
              selectedDateColumns: newSelectedColumns
            });
          } catch (saveError) {
            console.error('Failed to save auto-selected date columns:', saveError);
          }
          
          setStatus(`${result.columnNames.length} columns found. Auto-selected ${newSelectedColumns.length} date column(s).`);
        } else {
          setStatus(`${result.columnNames.length} columns found from row ${columnNamesRow}`);
        }
      } else {
        console.warn('Column extraction failed:', result.error);
        setColumnNames([]);
        setAutoDetectedDateColumns([]);
        setDateColumnsWithTime([]);
        setSelectedDateColumns([]);
        setStatus(`Error extracting column names: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to extract column names:', error);
      setColumnNames([]);
      setAutoDetectedDateColumns([]);
      setDateColumnsWithTime([]);
      setSelectedDateColumns([]);
      setStatus(`Failed to extract column names: ${error.message}`);
    }
  };

  // Handle date column selection (multi-select)
  const handleDateColumnChange = async (columnIndex) => {
    const newSelectedColumns = selectedDateColumns.includes(columnIndex)
      ? selectedDateColumns.filter(col => col !== columnIndex)
      : [...selectedDateColumns, columnIndex];
    
    setSelectedDateColumns(newSelectedColumns);
    
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        selectedDateColumns: newSelectedColumns
      });
    } catch (error) {
      console.error('Failed to save date columns:', error);
    }
  };

  // Gather sample data for columns when opening the popup
  const handleViewColumnsClick = async () => {
    if (anafFiles.length === 0 || columnNames.length === 0) {
      setShowDateColumnsPopup(true);
      return;
    }

    try {
      // Find sample data for each column by looking for non-null values in data rows
      const sampleData = [];
      const firstFile = anafFiles[0];
      const dataStartIndex = commonLines; // Start looking after header rows

      for (let colIndex = 0; colIndex < columnNames.length; colIndex++) {
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
      console.error('Error gathering sample data:', error);
      setShowDateColumnsPopup(true);
    }
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
        await extractColumnNames();
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

  const handleGenerateSummary = async () => {
    if (anafFiles.length === 0) {
      setStatus('Please select ANAF files first');
      return;
    }
    
    if (commonLines < 0 || commonLines > 100) {
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
        commonLines: parseInt(commonLines),
        outputPath,
        dateColumnIndices: selectedDateColumns,
        dateColumnsWithTime,
        columnNamesRow: parseInt(columnNamesRow)
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
    setSelectedFiles([]);
    setContabilitateFiles([]);
    setAnafFiles([]);
    setSelectedFileIndices(new Set());
    setSelectedAnafFileIndices(new Set());
    setColumnNames([]);
    setAutoDetectedDateColumns([]);
    setDateColumnsWithTime([]);
    setSelectedDateColumns([]);
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
    } else if (elementId === 'contabilitate-header-panel' || elementId === 'anaf-header-panel') {
      // 2 input groups with labels and input fields - need full height for both sections
      minWidth = Math.max(minWidth, 420);
      minHeight = Math.max(minHeight, 180);
    } else if (elementId === 'contabilitate-date-panel' || elementId === 'anaf-date-panel') {
      // Date column buttons need space for multiple columns
      minWidth = Math.max(minWidth, 300);
      minHeight = Math.max(minHeight, 200);
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
    
    // Calculate core bounds from all panels and buttons
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
    
    // Repopulate matrix with current panel positions
    Object.entries(panelPositions).forEach(([elementId, pos]) => {
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
    
    // Populate matrix with existing panels and buttons
    // Adjust coordinates to matrix space (subtract minX, minY offset)
    Object.entries(panelPositions).forEach(([elementId, pos]) => {
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
        {Object.entries(panelPositions).map(([elementId, pos]) => {
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
                  onClick={() => setShowUploadedFilesPopup(true)}
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
                  onClick={() => setShowUploadedFilesPopup(true)}
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

        {/* Panel 5 - Contabilitate Header Selection */}
        <div 
          className="xy-selection-section panel"
          data-panel="contabilitate-header-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'contabilitate-header-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('contabilitate-header-panel').x}px`,
            top: `${getVisualPosition('contabilitate-header-panel').y}px`,
            width: `${getVisualPosition('contabilitate-header-panel').width}px`,
            height: `${getVisualPosition('contabilitate-header-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'contabilitate-header-panel')}
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
                contabilitate-header-panel
              </div>
            )}
            <h3 style={{ textAlign: 'center' }}>Header Selection for {t('contabilitate')}</h3>
            {contabilitateFiles.length > 0 ? (
              <div className="input-controls" style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '30px',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%'
              }}>
                <div className="input-group" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  minWidth: 'fit-content'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px'
                  }}>
                    <label style={{ 
                      fontSize: '0.9em',
                      whiteSpace: 'nowrap'
                    }}>{t('headerNumberOfRows')}</label>
                    <Tooltip content="The number of lines that is common at the beggining of all the uploaded files, like the column names." />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commonLines}
                    onChange={(e) => handleCommonLinesChange(e.target.value)}
                    disabled={isProcessing}
                    style={{ 
                      width: '120px',
                      textAlign: 'center',
                      padding: '10px',
                      fontSize: '1.2em',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <div className="input-group" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  minWidth: 'fit-content'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px'
                  }}>
                    <label style={{ 
                      fontSize: '0.9em',
                      whiteSpace: 'nowrap'
                    }}>{t('columnsRow')}</label>
                    <Tooltip content="The row that contains the name of the columns." />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={columnNamesRow}
                    onChange={(e) => handleColumnNamesRowChange(e.target.value)}
                    disabled={isProcessing}
                    style={{ 
                      width: '120px',
                      textAlign: 'center',
                      padding: '10px',
                      fontSize: '1.2em',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center' }}>Upload files to configure headers</p>
            )}
          </div>
        </div>

        {/* Panel 6 - ANAF Header Selection */}
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
            zIndex: 10
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
                    value={commonLines} 
                    onChange={handleCommonLinesChange}
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
                    value={columnNamesRow} 
                    onChange={handleColumnNamesRowChange}
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
        
        {/* Panel 7 - Contabilitate Date Columns */}
        <div 
          className="date-columns-section panel"
          data-panel="contabilitate-date-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'contabilitate-date-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${getVisualPosition('contabilitate-date-panel').x}px`,
            top: `${getVisualPosition('contabilitate-date-panel').y}px`,
            width: `${getVisualPosition('contabilitate-date-panel').width}px`,
            height: `${getVisualPosition('contabilitate-date-panel').height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'contabilitate-date-panel')}
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
                contabilitate-date-panel
              </div>
            )}
            <h3 style={{ textAlign: 'center' }}>Date Columns for {t('contabilitate')}</h3>
            {columnNames.length > 0 ? (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <p style={{ 
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Found {selectedDateColumns.length} date columns
                    <Tooltip content="Columns that will be automatically changed to date type. You can see beneath the column name an example of the data in that column. You can select and deselect more columns by clicking on the '+' button. By default the merge process takes all of the data as general and you can't sort the dates if they are not of date type." />
                  </p>
                </div>
                <div className="date-column-list" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedDateColumns.slice(0, 6).map((colIndex) => {
                    const col = columnNames[colIndex];
                    return (
                      <span key={colIndex} className="date-column-badge">
                        {col?.name || `Column ${colIndex + 1}`}
                      </span>
                    );
                  })}
                  {selectedDateColumns.length > 6 && (
                    <span className="date-column-badge" style={{ 
                      backgroundColor: 'var(--theme-accent-color, #667eea)',
                      cursor: 'pointer' 
                    }}
                    onClick={handleViewColumnsClick}>
                      +{selectedDateColumns.length - 6} more
                    </span>
                  )}
                  <button 
                    className="btn btn-primary"
                    onClick={handleViewColumnsClick}
                    style={{
                      padding: '0',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '24px',
                      border: 'none',
                      backgroundColor: 'var(--theme-primary, #4f46e5)',
                      color: 'white',
                      position: 'relative'
                    }}
                    title="View and select more date columns"
                  >
                    <span style={{
                      display: 'block',
                      width: '10px',
                      height: '2px',
                      backgroundColor: 'white',
                      position: 'absolute'
                    }}></span>
                    <span style={{
                      display: 'block',
                      width: '2px',
                      height: '10px',
                      backgroundColor: 'white',
                      position: 'absolute'
                    }}></span>
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center' }}>Upload files to detect date columns</p>
            )}
          </div>
        </div>

        {/* Panel 8 - ANAF Date Columns */}
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
            zIndex: 10
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
            {columnNames.length > 0 ? (
              <div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{t('dateColumnsFound')}</span>
                  <span style={{ 
                    fontSize: '11px', 
                    backgroundColor: 'var(--theme-accent-bg)', 
                    color: 'var(--theme-accent-text)', 
                    padding: '2px 6px', 
                    borderRadius: '3px' 
                  }}>
                    {selectedDateColumns.length}
                  </span>
                  <Tooltip content={t('dateColumnsTooltip')} />
                  <button 
                    className="btn btn-secondary"
                    onClick={handleViewColumnsClick}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      marginLeft: '8px'
                    }}
                  >
                    {t('viewColumns')}
                  </button>
                </div>
                
                <div className="date-columns-preview" style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  justifyContent: 'center',
                  maxHeight: '60px',
                  overflowY: 'auto'
                }}>
                  {selectedDateColumns.slice(0, 6).map((columnIndex, index) => (
                    <span 
                      key={index}
                      className="date-column-badge"
                      style={{
                        backgroundColor: 'var(--theme-date-column-bg, #e3f2fd)',
                        color: 'var(--theme-date-column-text, #1976d2)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        border: '1px solid var(--theme-date-column-border, #bbdefb)'
                      }}
                    >
                      {columnNames[columnIndex]?.name || `Column ${columnIndex + 1}`}
                    </span>
                  ))}
                  {selectedDateColumns.length > 6 && (
                    <span style={{ fontSize: '10px', color: 'var(--theme-text-color, #666)' }}>
                      {t('andMore')} {selectedDateColumns.length - 6} {t('more')}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center' }}>Upload ANAF files to detect date columns</p>
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
        
        
        {/* Uploaded Files Popup */}
        {showUploadedFilesPopup && (
          <div className="popup-overlay" onClick={() => setShowUploadedFilesPopup(false)}>
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
                  uploaded-files-popup
                </div>
              )}
              <div className="popup-header">
                <h3>All Uploaded Files</h3>
                <button className="close-btn" onClick={() => setShowUploadedFilesPopup(false)}>×</button>
              </div>
              <div className="popup-body">
                <div className="file-list-detailed">
                  {contabilitateFiles.map((fileData, index) => (
                    <div 
                      key={index} 
                      className={`file-item-detailed ${selectedFileIndices.has(index) ? 'selected' : ''}`}
                      onClick={(e) => handleFileClick(index, e)}
                    >
                      <div className="file-name-detailed">{fileData.fileName}</div>
                      <div className="file-info">
                        <span className="file-rows">{fileData.rowCount} rows</span>
                        <span className="file-path">{fileData.filePath}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="file-controls">
                  <button className="btn btn-secondary" onClick={selectAllFiles}>Select All</button>
                  <button className="btn btn-secondary" onClick={deselectAllFiles}>Deselect All</button>
                  <button className="btn btn-danger" onClick={handleDeleteSelected} disabled={selectedFileIndices.size === 0}>
                    Delete Selected ({selectedFileIndices.size})
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
                  {columnNames.map((col, index) => {
                    const isSelected = selectedDateColumns.includes(index);
                    const isAutoDetected = autoDetectedDateColumns.includes(index);
                    const hasTime = dateColumnsWithTime.includes(index);
                    
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
                  })}
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
    </div>
  );
}

export default App;