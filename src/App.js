import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import ThemeMenu, { themes } from './ThemeMenu';
import LanguageMenu, { languages } from './LanguageMenu';
import { useTranslation } from './translations';
import dashboardIcon from './dashboard.png';

const GRID_SIZE = 20;
const DEFAULT_PANEL_WIDTH = 240;
const DEFAULT_PANEL_HEIGHT = 180;
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
  const [filesData, setFilesData] = useState([]);
  const [selectedFileIndices, setSelectedFileIndices] = useState(new Set());
  const [commonLines, setCommonLines] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdFilePath, setCreatedFilePath] = useState('');
  const [status, setStatus] = useState('');
  const [processingSummary, setProcessingSummary] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('professional');
  const [isLoading, setIsLoading] = useState(true);
  const [columnNamesRow, setColumnNamesRow] = useState(1);
  const [columnNames, setColumnNames] = useState([]);
  const [selectedDateColumns, setSelectedDateColumns] = useState([]);
  const [autoDetectedDateColumns, setAutoDetectedDateColumns] = useState([]);
  const [dateColumnsWithTime, setDateColumnsWithTime] = useState([]);
  const [isLayoutMode, setIsLayoutMode] = useState(true);
  const [draggedElement, setDraggedElement] = useState(null);
  const [panelPositions, setPanelPositions] = useState({
    'upload-panel': { x: 20, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'files-summary-panel': { x: 280, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'header-selection-panel': { x: 540, y: 20, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'date-columns-panel': { x: 20, y: 220, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'merged-summary-panel': { x: 280, y: 220, width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT },
    'merge-button': { x: 540, y: 220, width: DEFAULT_BUTTON_SIZE, height: DEFAULT_BUTTON_SIZE }
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialDragPosition, setInitialDragPosition] = useState({ x: 0, y: 0 });
  const [snapLines, setSnapLines] = useState([]);
  const boardRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panAnimationFrame = useRef(null);
  const [availablePanels] = useState([
    { id: 'upload-panel', name: 'Upload Files Panel', type: 'panel', active: true },
    { id: 'files-summary-panel', name: 'Files Summary Panel', type: 'panel', active: true },
    { id: 'header-selection-panel', name: 'Header Selection Panel', type: 'panel', active: true },
    { id: 'date-columns-panel', name: 'Date Columns Panel', type: 'panel', active: true },
    { id: 'merged-summary-panel', name: 'Merged Summary Panel', type: 'panel', active: true }
  ]);
  const [availableButtons] = useState([
    { id: 'merge-button', name: 'Merge Button', type: 'button', active: true }
  ]);
  const [collisionMatrix, setCollisionMatrix] = useState(null);
  const [workspaceBounds, setWorkspaceBounds] = useState({
    minX: 0,
    maxX: 1200, // Initial viewport width
    minY: 0,
    maxY: 800   // Initial viewport height
  });

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
        
        // Load saved layout positions or use defaults
        if (settings.panelPositions) {
          setPanelPositions(prev => ({ ...prev, ...settings.panelPositions }));
        }
        
        // Load saved workspace bounds or use defaults
        if (settings.workspaceBounds) {
          setWorkspaceBounds(settings.workspaceBounds);
        }
        
        setTimeout(() => {
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
    if (!isNaN(numValue) && numValue > 0 && filesData.length > 0) {
      console.log('useEffect: columnNamesRow changed to:', numValue, 'triggering extraction');
      const delayedExtraction = setTimeout(() => {
        extractColumnNames();
      }, 300);
      
      return () => clearTimeout(delayedExtraction);
    }
  }, [columnNamesRow, filesData]);

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
        
        if (filesData.length > 0) {
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
    if (filesData.length === 0) return;
    
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
        filesData,
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

  const handleSelectFiles = async (append = false) => {
    try {
      const filePaths = await window.electronAPI.selectExcelFiles();
      if (filePaths.length > 0) {
        let newFilePaths = filePaths;
        let newData = [];
        
        if (append && selectedFiles.length > 0) {
          // Filter out files that are already selected
          const existingPaths = selectedFiles.map(path => path.toLowerCase());
          newFilePaths = filePaths.filter(path => !existingPaths.includes(path.toLowerCase()));
          
          if (newFilePaths.length === 0) {
            setStatus('All selected files are already uploaded');
            return;
          }
          
          setStatus(`Adding ${newFilePaths.length} new files...`);
          newData = await window.electronAPI.readExcelFiles(newFilePaths);
          
          // Combine with existing data
          setSelectedFiles([...selectedFiles, ...newFilePaths]);
          setFilesData([...filesData, ...newData]);
          setSelectedFileIndices(new Set());
          setStatus(`${filesData.length + newData.length} Excel files loaded successfully (${newData.length} added)`);
        } else {
          // Replace existing files (original behavior)
          setSelectedFiles(newFilePaths);
          setSelectedFileIndices(new Set());
          setStatus('Files selected. Reading data...');
          
          newData = await window.electronAPI.readExcelFiles(newFilePaths);
          setFilesData(newData);
          setStatus(`${newData.length} Excel files loaded successfully`);
          setProcessingSummary(null);
        }
        
        await extractColumnNames();
      }
    } catch (error) {
      setStatus(`Error selecting files: ${error.message}`);
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

  const handleDeleteSelected = () => {
    if (selectedFileIndices.size === 0) return;
    
    const newFilesData = filesData.filter((_, index) => !selectedFileIndices.has(index));
    const newSelectedFiles = selectedFiles.filter((_, index) => !selectedFileIndices.has(index));
    
    setFilesData(newFilesData);
    setSelectedFiles(newSelectedFiles);
    setSelectedFileIndices(new Set());
    setStatus(`Deleted ${selectedFileIndices.size} files. ${newFilesData.length} files remaining.`);
  };

  const selectAllFiles = () => {
    const allIndices = new Set(filesData.map((_, index) => index));
    setSelectedFileIndices(allIndices);
  };

  const deselectAllFiles = () => {
    setSelectedFileIndices(new Set());
  };

  const handleMergeFiles = async () => {
    if (filesData.length === 0) {
      setStatus('Please select Excel files first');
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

      setStatus('Merging files...');
      const result = await window.electronAPI.mergeAndSaveExcel({
        filesData,
        commonLines: parseInt(commonLines),
        outputPath,
        dateColumnIndices: selectedDateColumns,
        dateColumnsWithTime,
        columnNamesRow: parseInt(columnNamesRow)
      });

      if (result.success) {
        setCreatedFilePath(result.outputPath);
        setProcessingSummary(result.summary);
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
    setFilesData([]);
    setSelectedFileIndices(new Set());
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
    
    // Adjust based on content
    if (elementId === 'upload-panel') {
      minWidth = Math.max(minWidth, 280);
      minHeight = Math.max(minHeight, 200);
    } else if (elementId === 'merged-summary-panel') {
      minWidth = Math.max(minWidth, 300);
      minHeight = Math.max(minHeight, 220);
    }
    
    return { width: minWidth, height: minHeight };
  };

  // Matrix-based collision detection
  const checkCollisionMatrix = (elementId, worldX, worldY, width, height) => {
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
    
    // Clear the current element from the matrix
    const currentPos = panelPositions[elementId];
    if (currentPos) {
      const currentMatrixX = (currentPos.x || 0) - workspaceBounds.minX;
      const currentMatrixY = (currentPos.y || 0) - workspaceBounds.minY;
      const currentWidth = currentPos.width || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
      const currentHeight = currentPos.height || (availableButtons.find(b => b.id === elementId) ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
      
      if (currentMatrixX >= 0 && currentMatrixY >= 0) {
        tempMatrix.setCells(currentMatrixX, currentMatrixY, currentWidth, currentHeight, 0);
      }
    }
    
    // Check if the new position would be valid
    return !tempMatrix.checkPositionWithExpansion(matrixX, matrixY, width, height);
  };

  // Legacy AABB collision detection (fallback)
  const checkCollision = (elementId, x, y, width, height) => {
    // Use matrix-based collision detection if available
    if (collisionMatrix) {
      return checkCollisionMatrix(elementId, x, y, width, height);
    }
    
    // Fallback to AABB collision detection
    for (const [otherId, otherPos] of Object.entries(panelPositions)) {
      if (otherId === elementId) continue;
      
      const otherX = otherPos.x || 0;
      const otherY = otherPos.y || 0;
      const otherWidth = otherPos.width || DEFAULT_PANEL_WIDTH;
      const otherHeight = otherPos.height || DEFAULT_PANEL_HEIGHT;
      
      const separated = (
        x >= otherX + otherWidth ||
        x + width <= otherX ||
        y >= otherY + otherHeight ||
        y + height <= otherY
      );
      
      if (!separated) {
        return true;
      }
    }
    
    return false;
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
    
    // Search for valid position in a spiral pattern, allowing unlimited expansion
    const maxSearchRadius = Math.max(workspaceBounds.maxX - workspaceBounds.minX, workspaceBounds.maxY - workspaceBounds.minY) * 2;
    
    for (let radius = GRID_SIZE; radius < maxSearchRadius; radius += GRID_SIZE) {
      for (let angle = 0; angle < 360; angle += 45) {
        const testX = snapToGrid(x + Math.cos(angle * Math.PI / 180) * radius);
        const testY = snapToGrid(y + Math.sin(angle * Math.PI / 180) * radius);
        
        // Allow any position - no boundary restrictions
        if (!checkCollision(elementId, testX, testY, width, height)) {
          return { x: testX, y: testY };
        }
      }
    }
    
    // Fallback: find next available grid position by scanning workspace + expansion area
    if (collisionMatrix) {
      const startX = Math.min(0, workspaceBounds.minX - GRID_SIZE * 10);
      const startY = Math.min(0, workspaceBounds.minY - GRID_SIZE * 10);
      const endX = workspaceBounds.maxX + GRID_SIZE * 10;
      const endY = workspaceBounds.maxY + GRID_SIZE * 10;
      
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
    
    // Calculate bounds from all panels and buttons
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
    
    // Add buffer around objects
    const buffer = GRID_SIZE * 5;
    minX -= buffer;
    minY -= buffer;
    maxX += buffer;
    maxY += buffer;
    
    return { minX, maxX, minY, maxY };
  };

  // Update workspace boundaries
  const updateWorkspaceBounds = () => {
    const newBounds = calculateWorkspaceBounds();
    setWorkspaceBounds(newBounds);
    return newBounds;
  };

  // Save layout settings
  const saveLayoutSettings = async () => {
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        panelPositions,
        workspaceBounds
      });
    } catch (error) {
      console.error('Failed to save layout settings:', error);
    }
  };

  // Initialize collision matrix with current panel positions
  const initializeCollisionMatrix = () => {
    // Calculate initial workspace bounds
    const bounds = calculateWorkspaceBounds();
    setWorkspaceBounds(bounds);
    
    // Create matrix large enough to cover workspace + expansion buffer
    const matrixWidth = bounds.maxX - bounds.minX + GRID_SIZE * 20;
    const matrixHeight = bounds.maxY - bounds.minY + GRID_SIZE * 20;
    
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
    setIsLayoutMode(newLayoutMode);
    
    if (newLayoutMode) {
      // Initialize collision matrix when entering layout mode
      initializeCollisionMatrix();
    } else {
      await saveLayoutSettings();
      setCollisionMatrix(null);
    }
  };

  // Show snap preview with clear visual feedback
  const showSnapPreview = (x, y, width, height, hasCollision = false) => {
    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);
    
    setSnapLines([{
      id: 'preview-outline',
      type: 'outline',
      x: snappedX,
      y: snappedY,
      width,
      height,
      collision: hasCollision
    }]);
  };
  
  // Hide snap preview
  const hideSnapPreview = () => {
    setSnapLines([]);
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
    
    // Convert viewport coordinates to absolute board coordinates
    const boardX = viewportX - panOffset.x;
    const boardY = viewportY - panOffset.y;
    
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
    
    // Convert viewport coordinates to screen coordinates
    const screenX = viewportX + boardRect.left + BOARD_PADDING_LEFT;
    const screenY = viewportY + boardRect.top + BOARD_PADDING_TOP;
    
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
    
    // Show preview at the snapped position
    showSnapPreview(snappedX, snappedY, width, height, hasCollision);
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
    
    // If no collision, place the element at the desired position
    if (!hasCollision) {
      const { width: minWidth, height: minHeight } = getMinimumSize(draggedElement.id, draggedElement.type);
      const finalWidth = Math.max(width, minWidth);
      const finalHeight = Math.max(height, minHeight);
      
      // Update collision matrix
      if (collisionMatrix) {
        // Clear old position from matrix
        const currentPos = panelPositions[draggedElement.id];
        if (currentPos) {
          const currentMatrixX = (currentPos.x || 0) - workspaceBounds.minX;
          const currentMatrixY = (currentPos.y || 0) - workspaceBounds.minY;
          const currentWidth = currentPos.width || (draggedElement.type === 'button' ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
          const currentHeight = currentPos.height || (draggedElement.type === 'button' ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
          
          if (currentMatrixX >= 0 && currentMatrixY >= 0) {
            collisionMatrix.setCells(currentMatrixX, currentMatrixY, currentWidth, currentHeight, 0);
          }
        }
        
        // Convert new position to matrix coordinates
        const newMatrixX = snappedX - workspaceBounds.minX;
        const newMatrixY = snappedY - workspaceBounds.minY;
        
        // Expand matrix if needed for positions outside current bounds
        const requiredMatrixWidth = newMatrixX + finalWidth + GRID_SIZE * 5;
        const requiredMatrixHeight = newMatrixY + finalHeight + GRID_SIZE * 5;
        if (requiredMatrixWidth > collisionMatrix.width || requiredMatrixHeight > collisionMatrix.height) {
          collisionMatrix.expandMatrix(requiredMatrixWidth, requiredMatrixHeight);
        }
        
        // Set new position in matrix
        if (newMatrixX >= 0 && newMatrixY >= 0) {
          collisionMatrix.setCells(newMatrixX, newMatrixY, finalWidth, finalHeight, 1);
        }
      }
      
      setPanelPositions(prev => ({
        ...prev,
        [draggedElement.id]: {
          x: snappedX,
          y: snappedY,
          width: finalWidth,
          height: finalHeight
        }
      }));
      
      // Update workspace boundaries after positioning
      updateWorkspaceBounds();
      await saveLayoutSettings();
    } else {
      // If collision, try to find a nearby valid position
      const validPosition = findValidPosition(draggedElement.id, snappedX, snappedY, width, height);
      
      // Update collision matrix for valid position
      if (collisionMatrix) {
        // Clear old position from matrix
        const currentPos = panelPositions[draggedElement.id];
        if (currentPos) {
          const currentMatrixX = (currentPos.x || 0) - workspaceBounds.minX;
          const currentMatrixY = (currentPos.y || 0) - workspaceBounds.minY;
          const currentWidth = currentPos.width || (draggedElement.type === 'button' ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_WIDTH);
          const currentHeight = currentPos.height || (draggedElement.type === 'button' ? DEFAULT_BUTTON_SIZE : DEFAULT_PANEL_HEIGHT);
          
          if (currentMatrixX >= 0 && currentMatrixY >= 0) {
            collisionMatrix.setCells(currentMatrixX, currentMatrixY, currentWidth, currentHeight, 0);
          }
        }
        
        // Set new position in matrix
        const validMatrixX = validPosition.x - workspaceBounds.minX;
        const validMatrixY = validPosition.y - workspaceBounds.minY;
        if (validMatrixX >= 0 && validMatrixY >= 0) {
          collisionMatrix.setCells(validMatrixX, validMatrixY, width, height, 1);
        }
      }
      
      setPanelPositions(prev => ({
        ...prev,
        [draggedElement.id]: {
          ...prev[draggedElement.id],
          x: validPosition.x,
          y: validPosition.y
        }
      }));
      
      // Update workspace boundaries after positioning
      updateWorkspaceBounds();
      await saveLayoutSettings();
    }
    
    // Cleanup
    setDraggedElement(null);
    setDragOffset({ x: 0, y: 0 });
    setInitialDragPosition({ x: 0, y: 0 });
    hideSnapPreview();
    
    document.querySelectorAll('.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedElement(null);
    setInitialDragPosition({ x: 0, y: 0 });
    hideSnapPreview();
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
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      panAnimationFrame.current = null;
    });
    
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart.x, panStart.y]);

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
      
      // Use matrix-based collision detection for resize (no boundary clamping)
      let wouldCollide = false;
      if (collisionMatrix) {
        // Create temporary matrix copy to test the resize
        const tempMatrix = new CollisionMatrix(collisionMatrix.width, collisionMatrix.height);
        
        // Copy current matrix state
        for (let row = 0; row < collisionMatrix.rows; row++) {
          for (let col = 0; col < collisionMatrix.cols; col++) {
            tempMatrix.matrix[row][col] = collisionMatrix.matrix[row][col];
          }
        }
        
        // Clear the current element from the matrix (convert to matrix coordinates)
        const currentMatrixX = currentX - workspaceBounds.minX;
        const currentMatrixY = currentY - workspaceBounds.minY;
        if (currentMatrixX >= 0 && currentMatrixY >= 0) {
          tempMatrix.setCells(currentMatrixX, currentMatrixY, startWidth, startHeight, 0);
        }
        
        // Check if the new size would be valid (convert to matrix coordinates)
        const newMatrixX = currentX - workspaceBounds.minX;
        const newMatrixY = currentY - workspaceBounds.minY;
        wouldCollide = !tempMatrix.checkPositionWithExpansion(newMatrixX, newMatrixY, newWidth, newHeight);
      } else {
        // Fallback to legacy collision detection
        wouldCollide = checkCollision(elementId, currentX, currentY, newWidth, newHeight);
      }
      
      // Only resize if it doesn't cause collision
      if (!wouldCollide) {
        // Update collision matrix
        if (collisionMatrix) {
          // Clear old size from matrix
          const currentMatrixX = currentX - workspaceBounds.minX;
          const currentMatrixY = currentY - workspaceBounds.minY;
          if (currentMatrixX >= 0 && currentMatrixY >= 0) {
            collisionMatrix.setCells(currentMatrixX, currentMatrixY, startWidth, startHeight, 0);
          }
          
          // Expand matrix if needed for larger size
          const newMatrixX = currentX - workspaceBounds.minX;
          const newMatrixY = currentY - workspaceBounds.minY;
          const requiredMatrixWidth = newMatrixX + newWidth + GRID_SIZE * 5;
          const requiredMatrixHeight = newMatrixY + newHeight + GRID_SIZE * 5;
          if (requiredMatrixWidth > collisionMatrix.width || requiredMatrixHeight > collisionMatrix.height) {
            collisionMatrix.expandMatrix(requiredMatrixWidth, requiredMatrixHeight);
          }
          
          // Set new size in matrix
          if (newMatrixX >= 0 && newMatrixY >= 0) {
            collisionMatrix.setCells(newMatrixX, newMatrixY, newWidth, newHeight, 1);
          }
        }
        
        setPanelPositions(prev => ({
          ...prev,
          [elementId]: {
            ...prev[elementId],
            width: newWidth,
            height: newHeight
          }
        }));
        
        // Update workspace boundaries after resize
        updateWorkspaceBounds();
        
        // Show visual feedback during resize
        showSnapPreview(currentX, currentY, newWidth, newHeight, false);
      }
    };

    const handleMouseUp = async () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      hideSnapPreview();
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
      </div>
      
      {(processingSummary || filesData.length > 0) && (
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
        {/* Panel 1 - Upload Files */}
        <div 
          className="upload-section panel"
          data-panel="upload-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'upload-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${panelPositions['upload-panel']?.x || 20}px`,
            top: `${panelPositions['upload-panel']?.y || 20}px`,
            width: `${panelPositions['upload-panel']?.width || DEFAULT_PANEL_WIDTH}px`,
            height: `${panelPositions['upload-panel']?.height || DEFAULT_PANEL_HEIGHT}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'upload-panel')}
            />
          )}
          <div className="panel-content">
            <h3>{t('uploadTitle')}</h3>
            <div className="panel-controls">
              <button className="btn btn-primary" onClick={() => handleSelectFiles(false)} disabled={isProcessing}>
                {t('selectExcelFiles')}
              </button>
              <button 
                className={`btn btn-secondary ${filesData.length === 0 ? 'disabled-grey' : ''}`}
                onClick={() => handleSelectFiles(true)} 
                disabled={isProcessing || filesData.length === 0}
              >
                {t('addMoreFiles')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Panel 2 - Files Summary */}
        <div 
          className="uploaded-files-summary panel"
          data-panel="files-summary-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'files-summary-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${panelPositions['files-summary-panel']?.x || 280}px`,
            top: `${panelPositions['files-summary-panel']?.y || 20}px`,
            width: `${panelPositions['files-summary-panel']?.width || DEFAULT_PANEL_WIDTH}px`,
            height: `${panelPositions['files-summary-panel']?.height || DEFAULT_PANEL_HEIGHT}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'files-summary-panel')}
            />
          )}
          <div className="panel-content">
            <h3>{t('uploadedFilesSummary')}</h3>
            {filesData.length > 0 ? (
              <div className="file-summary">
                <div className="summary-item">📁 {filesData.length} files</div>
                <div className="summary-item">📊 {filesData.reduce((total, file) => total + file.rowCount, 0)} rows</div>
              </div>
            ) : (
              <p>No files uploaded</p>
            )}
          </div>
        </div>
        {/* Panel 3 - Header Selection */}
        <div 
          className="xy-selection-section panel"
          data-panel="header-selection-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'header-selection-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${panelPositions['header-selection-panel']?.x || 540}px`,
            top: `${panelPositions['header-selection-panel']?.y || 20}px`,
            width: `${panelPositions['header-selection-panel']?.width || DEFAULT_PANEL_WIDTH}px`,
            height: `${panelPositions['header-selection-panel']?.height || DEFAULT_PANEL_HEIGHT}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'header-selection-panel')}
            />
          )}
          <div className="panel-content">
            <h3>{t('headerColumnsSelection')}</h3>
            {filesData.length > 0 ? (
              <div className="input-controls">
                <div className="input-group">
                  <label>{t('headerNumberOfRows')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commonLines}
                    onChange={(e) => handleCommonLinesChange(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="input-group">
                  <label>{t('columnsRow')}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={columnNamesRow}
                    onChange={(e) => handleColumnNamesRowChange(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </div>
            ) : (
              <p>Upload files to configure headers</p>
            )}
          </div>
        </div>
        
        {/* Panel 4 - Date Columns */}
        <div 
          className="date-columns-section panel"
          data-panel="date-columns-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'date-columns-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${panelPositions['date-columns-panel']?.x || 20}px`,
            top: `${panelPositions['date-columns-panel']?.y || 220}px`,
            width: `${panelPositions['date-columns-panel']?.width || DEFAULT_PANEL_WIDTH}px`,
            height: `${panelPositions['date-columns-panel']?.height || DEFAULT_PANEL_HEIGHT}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'date-columns-panel')}
            />
          )}
          <div className="panel-content">
            <h3>{t('dateColumnsTitle')}</h3>
            {columnNames.length > 0 && autoDetectedDateColumns.length > 0 ? (
              <div>
                <p>Found {autoDetectedDateColumns.length} date columns</p>
                <div className="date-column-list">
                  {autoDetectedDateColumns.slice(0, 3).map((colIndex) => {
                    const col = columnNames[colIndex];
                    return (
                      <span key={colIndex} className="date-column-badge">
                        {col?.name || `Column ${colIndex + 1}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p>No date columns detected</p>
            )}
          </div>
        </div>
        
        {/* Merge Button */}
        <div 
          className="merge-section panel button-panel"
          data-panel="merge-button"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'merge-button', type: 'button' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${panelPositions['merge-button']?.x || 540}px`,
            top: `${panelPositions['merge-button']?.y || 220}px`,
            width: `${panelPositions['merge-button']?.width || DEFAULT_BUTTON_SIZE}px`,
            height: `${panelPositions['merge-button']?.height || DEFAULT_BUTTON_SIZE}px`,
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
              onMouseDown={(e) => handleResizeStart(e, 'merge-button')}
            />
          )}
          <button 
            className="merge-button" 
            onClick={handleMergeFiles}
            disabled={isProcessing || filesData.length === 0}
          >
            {isProcessing ? 'Processing...' : 'Merge'}
          </button>
        </div>
        
        {/* Panel 5 - Merged Summary */}
        <div 
          className="merged-files-section panel"
          data-panel="merged-summary-panel"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'merged-summary-panel', type: 'panel' })}
          onDragEnd={handleDragEnd}
          style={{
            position: 'absolute',
            left: `${panelPositions['merged-summary-panel']?.x || 280}px`,
            top: `${panelPositions['merged-summary-panel']?.y || 220}px`,
            width: `${panelPositions['merged-summary-panel']?.width || DEFAULT_PANEL_WIDTH}px`,
            height: `${panelPositions['merged-summary-panel']?.height || DEFAULT_PANEL_HEIGHT}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            zIndex: 10
          }}
        >
          {isLayoutMode && (
            <div 
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, 'merged-summary-panel')}
            />
          )}
          <div className="panel-content">
            <h3>{t('mergedFilesSummary')}</h3>
            {processingSummary ? (
              <div className="merged-summary">
                <div className="summary-stats">
                  <div>Files: {processingSummary.filesProcessed}</div>
                  <div>Rows: {processingSummary.totalDataRows}</div>
                </div>
                <div className="merged-actions">
                  <button className="btn btn-primary" onClick={handleDownloadFile}>
                    Download
                  </button>
                  <button className="btn btn-secondary" onClick={handleOpenFile}>
                    Open
                  </button>
                </div>
              </div>
            ) : (
              <p>Merge results will appear here</p>
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
        
        {/* Snap Preview Lines */}
        {snapLines.map(line => (
          <div 
            key={line.id}
            className={`snap-line ${line.type} ${line.collision ? 'collision' : ''}`}
            style={{
              position: 'absolute',
              left: `${line.x}px`,
              top: `${line.y}px`,
              width: `${line.width}px`,
              height: `${line.height}px`,
              pointerEvents: 'none',
              zIndex: 9999
            }}
          />
        ))}
        
        {/* Remove popups for clean interface */}
        {false && (
          <div className="popup-overlay" onClick={() => setShowUploadedFilesPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <h3>All Uploaded Files</h3>
                <button className="close-btn" onClick={() => setShowUploadedFilesPopup(false)}>×</button>
              </div>
              <div className="popup-body">
                <div className="file-list-detailed">
                  {filesData.map((fileData, index) => (
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

        
        {false && (
          <div className="popup-overlay" onClick={() => setShowColumnSelectionPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <h3>All Columns - Select/Deselect Date Columns</h3>
                <button className="close-btn" onClick={() => setShowColumnSelectionPopup(false)}>×</button>
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
                        <div className="column-name">{col?.name || `Column ${index + 1}`}</div>
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

        
        {false && (
          <div className="popup-overlay" onClick={() => setShowMergedFilesPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <h3>Merged Files Summary</h3>
                <button className="close-btn" onClick={() => setShowMergedFilesPopup(false)}>×</button>
              </div>
              <div className="popup-body">
                <div className="merged-files-detailed">
                  {processingSummary.fileDetails && processingSummary.fileDetails.map((file, index) => (
                    <div key={index} className="merged-file-item">
                      <div className="file-info-merged">
                        <div className="file-name-merged">{file.fileName}</div>
                        <div className="file-status">
                          <span className="file-rows-merged">{file.dataRows} rows</span>
                          <span className={`header-status ${file.headerMatch ? 'match' : 'no-match'}`}>
                            {file.headerMatch ? '✓ Headers match' : '⚠ Headers differ'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="summary-totals">
                  <div className="total-item">
                    <strong>Total Files:</strong> {processingSummary.filesProcessed}
                  </div>
                  <div className="total-item">
                    <strong>Total Rows:</strong> {processingSummary.totalDataRows}
                  </div>
                  <div className="total-item">
                    <strong>Common Headers:</strong> {processingSummary.commonHeaderRows}
                  </div>
                  <div className="total-item">
                    <strong>Header Matches:</strong> {processingSummary.matchingFiles || 0}/{processingSummary.filesProcessed}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;