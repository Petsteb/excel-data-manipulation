import React, { useState, useEffect } from 'react';
import './App.css';
import ThemeMenu, { themes } from './ThemeMenu';
import LanguageMenu, { languages } from './LanguageMenu';
import { useTranslation } from './translations';
import dashboardIcon from './dashboard.png';

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
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [showUploadedFiles, setShowUploadedFiles] = useState(false);
  const [showOtherColumns, setShowOtherColumns] = useState(false);
  const [showUploadedFilesPopup, setShowUploadedFilesPopup] = useState(false);
  const [showColumnSelectionPopup, setShowColumnSelectionPopup] = useState(false);
  const [showMergedFilesPopup, setShowMergedFilesPopup] = useState(false);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [panelPositions, setPanelPositions] = useState({});
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [availablePanels, setAvailablePanels] = useState([
    { id: 'upload-panel', name: 'Upload Files Panel', type: 'panel', active: true },
    { id: 'files-summary-panel', name: 'Files Summary Panel', type: 'panel', active: true },
    { id: 'header-selection-panel', name: 'Header Selection Panel', type: 'panel', active: true },
    { id: 'date-columns-panel', name: 'Date Columns Panel', type: 'panel', active: true },
    { id: 'merged-summary-panel', name: 'Merged Summary Panel', type: 'panel', active: true }
  ]);
  const [availableButtons, setAvailableButtons] = useState([
    { id: 'theme-button', name: 'Theme Button', type: 'button', active: true },
    { id: 'language-button', name: 'Language Button', type: 'button', active: true },
    { id: 'layout-button', name: 'Layout Button', type: 'button', active: true },
    { id: 'merge-button', name: 'Merge Button', type: 'button', active: true }
  ]);

  // Load settings on app start
  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        const settings = await window.electronAPI.loadSettings();
        console.log('Loaded settings:', settings);
        
        const commonLinesValue = Number.isInteger(settings.commonLines) ? settings.commonLines : (parseInt(settings.commonLines) || 1);
        let columnNamesRowValue = Number.isInteger(settings.columnNamesRow) ? settings.columnNamesRow : (parseInt(settings.columnNamesRow) || 1);
        
        if (!settings.columnNamesRowExplicitlySet) {
          columnNamesRowValue = commonLinesValue;
        }
        
        console.log('Parsed values - commonLines:', commonLinesValue, 'columnNamesRow:', columnNamesRowValue);
        
        setCurrentTheme(settings.theme || 'professional');
        setCurrentLanguage(settings.language || 'en');
        setCommonLines(commonLinesValue);
        setColumnNamesRow(columnNamesRowValue);
        setSelectedDateColumns(settings.selectedDateColumns || []);
        
        // Load saved layout positions
        if (settings.panelPositions) {
          setPanelPositions(settings.panelPositions);
        }
        if (settings.availablePanels) {
          setAvailablePanels(settings.availablePanels);
        }
        if (settings.availableButtons) {
          setAvailableButtons(settings.availableButtons);
        }
        
        // Apply theme after a short delay to ensure DOM is ready
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

  // Save layout settings
  const saveLayoutSettings = async () => {
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        panelPositions,
        availablePanels,
        availableButtons
      });
      console.log('Layout settings saved');
    } catch (error) {
      console.error('Failed to save layout settings:', error);
    }
  };

  // Toggle layout mode
  const toggleLayoutMode = async () => {
    const newLayoutMode = !isLayoutMode;
    setIsLayoutMode(newLayoutMode);
    
    if (newLayoutMode) {
      setIsLayoutMenuOpen(false); // Close menu when entering layout mode
    } else {
      // Save layout when exiting layout mode
      await saveLayoutSettings();
    }
  };

  // Toggle layout menu
  const toggleLayoutMenu = () => {
    setIsLayoutMenuOpen(!isLayoutMenuOpen);
  };

  // Handle drag start for panels and buttons
  const handleDragStart = (e, element) => {
    setDraggedElement(element);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    
    // Calculate the offset between the mouse cursor and the element's top-left corner
    const rect = e.target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });
    
    // Add dragging class for visual feedback
    e.target.classList.add('dragging');
    document.querySelector('.app-main').classList.add('drag-active');
  };

  // Handle drag over
  const handleDragOver = (e) => {
    if (isLayoutMode && draggedElement) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  // Handle drop
  const handleDrop = async (e) => {
    if (isLayoutMode && draggedElement) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      
      // Calculate where the element should be placed (cursor position minus offset)
      const elementX = (e.clientX - rect.left) - dragOffset.x;
      const elementY = (e.clientY - rect.top) - dragOffset.y;
      
      // Snap to the nearest 20px grid point
      const x = Math.max(0, Math.round(elementX / 20) * 20);
      const y = Math.max(0, Math.round(elementY / 20) * 20);
      
      console.log(`Dragged ${draggedElement.id} to grid position (${x}, ${y})`);
      
      const newPositions = {
        ...panelPositions,
        [draggedElement.id]: { 
          ...panelPositions[draggedElement.id],
          x, 
          y 
        }
      };
      
      setPanelPositions(newPositions);
      
      // Clean up
      setDraggedElement(null);
      setDragOffset({ x: 0, y: 0 });
      document.querySelector('.app-main').classList.remove('drag-active');
      
      // Remove dragging class from all elements
      document.querySelectorAll('.dragging').forEach(el => {
        el.classList.remove('dragging');
      });
    }
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    const appMain = document.querySelector('.app-main');
    if (appMain) {
      appMain.classList.remove('drag-active');
    }
    setDraggedElement(null);
  };

  // Add panel or button
  const addElement = async (element) => {
    if (element.type === 'panel') {
      setAvailablePanels(prev => 
        prev.map(p => p.id === element.id ? { ...p, active: true } : p)
      );
    } else {
      setAvailableButtons(prev => 
        prev.map(b => b.id === element.id ? { ...b, active: true } : b)
      );
    }
    // Auto-save layout changes
    setTimeout(saveLayoutSettings, 100);
  };

  // Remove panel or button
  const removeElement = async (element) => {
    if (element.type === 'panel') {
      setAvailablePanels(prev => 
        prev.map(p => p.id === element.id ? { ...p, active: false } : p)
      );
      // Remove position data when removing panel
      setPanelPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[element.id];
        return newPositions;
      });
    } else {
      setAvailableButtons(prev => 
        prev.map(b => b.id === element.id ? { ...b, active: false } : b)
      );
      // Remove position data when removing button
      setPanelPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[element.id];
        return newPositions;
      });
    }
    // Auto-save layout changes
    setTimeout(saveLayoutSettings, 100);
  };

  // Get panel visibility
  const isPanelVisible = (panelId) => {
    // In normal mode, always show all panels
    if (!isLayoutMode) return true;
    
    // In layout mode, show based on active state
    const panel = availablePanels.find(p => p.id === panelId);
    return panel ? panel.active : true;
  };

  // Handle resize start
  const handleResizeStart = (e, elementId) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const element = document.getElementById(elementId);
    const startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    const startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
    
    // Determine minimum sizes based on element type
    const isButton = element.classList.contains('individual-button');
    const minWidth = isButton ? 80 : 240;
    const minHeight = isButton ? 80 : 180;

    const handleMouseMove = (e) => {
      // Calculate new dimensions
      let newWidth = startWidth + (e.clientX - startX);
      let newHeight = startHeight + (e.clientY - startY);
      
      // Snap to 20px grid increments with proper minimums
      newWidth = Math.max(minWidth, Math.round(newWidth / 20) * 20);
      newHeight = Math.max(minHeight, Math.round(newHeight / 20) * 20);
      
      element.style.width = newWidth + 'px';
      element.style.height = newHeight + 'px';
    };

    const handleMouseUp = async () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Get final dimensions and ensure they're snapped to grid
      const finalWidth = parseInt(element.style.width, 10);
      const finalHeight = parseInt(element.style.height, 10);
      const snappedWidth = Math.max(minWidth, Math.round(finalWidth / 20) * 20);
      const snappedHeight = Math.max(minHeight, Math.round(finalHeight / 20) * 20);
      
      // Apply snapped dimensions
      element.style.width = snappedWidth + 'px';
      element.style.height = snappedHeight + 'px';
      
      // Store size in panelPositions along with position
      setPanelPositions(prev => {
        const elementKey = element.getAttribute('data-panel') || elementId.replace('panel-', '').replace('-container', '');
        return {
          ...prev,
          [elementKey]: {
            ...prev[elementKey],
            width: snappedWidth,
            height: snappedHeight
          }
        };
      });
      
      // Auto-save layout after resize
      setTimeout(saveLayoutSettings, 100);
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
    <div 
      className={`App ${isLayoutMode ? 'layout-mode' : ''}`}
      onDragOver={isLayoutMode ? handleDragOver : undefined}
      onDrop={isLayoutMode ? handleDrop : undefined}
    >
      <div className="top-menu-bar">
        {/* Individual Theme Button */}
        <div 
          className={`individual-button ${isLayoutMode ? 'layout-draggable' : ''} ${!isPanelVisible('theme-button') ? 'panel-hidden' : ''}`}
          id="theme-button-container"
          data-panel="theme-button"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'theme-button', type: 'button' })}
          onDragEnd={handleDragEnd}
          style={panelPositions['theme-button'] ? {
            position: 'absolute',
            left: `${panelPositions['theme-button'].x}px`,
            top: `${panelPositions['theme-button'].y}px`,
            zIndex: 1002,
            minWidth: '60px',
            minHeight: '60px',
            width: panelPositions['theme-button'].width ? `${panelPositions['theme-button'].width}px` : '60px',
            height: panelPositions['theme-button'].height ? `${panelPositions['theme-button'].height}px` : '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          } : {}}
        >
          {isLayoutMode && (
            <>
              <button 
                className="panel-remove-btn"
                onClick={() => removeElement({id: 'theme-button', type: 'button'})}
                title="Remove Button"
              >
                ×
              </button>
              <div 
                className="resize-handle"
                onMouseDown={(e) => handleResizeStart(e, 'theme-button-container')}
              />
            </>
          )}
          <ThemeMenu currentTheme={currentTheme} onThemeChange={handleThemeChange} t={t} />
        </div>
        
        {/* Individual Language Button */}
        <div 
          className={`individual-button ${isLayoutMode ? 'layout-draggable' : ''} ${!isPanelVisible('language-button') ? 'panel-hidden' : ''}`}
          id="language-button-container"
          data-panel="language-button"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'language-button', type: 'button' })}
          onDragEnd={handleDragEnd}
          style={panelPositions['language-button'] ? {
            position: 'absolute',
            left: `${panelPositions['language-button'].x}px`,
            top: `${panelPositions['language-button'].y}px`,
            zIndex: 1002,
            minWidth: '60px',
            minHeight: '60px',
            width: panelPositions['language-button'].width ? `${panelPositions['language-button'].width}px` : '60px',
            height: panelPositions['language-button'].height ? `${panelPositions['language-button'].height}px` : '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          } : {}}
        >
          {isLayoutMode && (
            <>
              <button 
                className="panel-remove-btn"
                onClick={() => removeElement({id: 'language-button', type: 'button'})}
                title="Remove Button"
              >
                ×
              </button>
              <div 
                className="resize-handle"
                onMouseDown={(e) => handleResizeStart(e, 'language-button-container')}
              />
            </>
          )}
          <LanguageMenu currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} t={t} />
        </div>
        
        {/* Individual Layout Button */}
        <div 
          className={`individual-button ${isLayoutMode ? 'layout-draggable' : ''} ${!isPanelVisible('layout-button') ? 'panel-hidden' : ''}`}
          id="layout-button-container"
          data-panel="layout-button"
          draggable={isLayoutMode}
          onDragStart={(e) => handleDragStart(e, { id: 'layout-button', type: 'button' })}
          onDragEnd={handleDragEnd}
          style={panelPositions['layout-button'] ? {
            position: 'absolute',
            left: `${panelPositions['layout-button'].x}px`,
            top: `${panelPositions['layout-button'].y}px`,
            zIndex: 1002,
            minWidth: '60px',
            minHeight: '60px',
            width: panelPositions['layout-button'].width ? `${panelPositions['layout-button'].width}px` : '60px',
            height: panelPositions['layout-button'].height ? `${panelPositions['layout-button'].height}px` : '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          } : {}}
        >
          {isLayoutMode && (
            <>
              <button 
                className="panel-remove-btn"
                onClick={() => removeElement({id: 'layout-button', type: 'button'})}
                title="Remove Button"
              >
                ×
              </button>
              <div 
                className="resize-handle"
                onMouseDown={(e) => handleResizeStart(e, 'layout-button-container')}
              />
            </>
          )}
          <button 
            className={`layout-button ${isLayoutMode ? 'active' : ''}`}
            onClick={toggleLayoutMode}
            title="Toggle Layout Mode"
          >
            <img src={dashboardIcon} alt="Layout" className="layout-icon" />
          </button>
        </div>
      </div>
      
      {/* Header removed - no title needed */}
      {(processingSummary || filesData.length > 0) && (
        <div className="remake-button-container">
          <button className="btn btn-secondary" onClick={resetApp}>
            {t('remake')}
          </button>
        </div>
      )}

      <main className={`app-main ${isLayoutMode ? 'layout-mode' : ''} ${Object.keys(panelPositions).length > 0 ? 'custom-layout' : ''}`}>
        <div className={`main-grid ${Object.keys(panelPositions).length > 0 ? 'custom-layout' : ''}`}>
          {/* Upload Column - Left */}
          <div className="upload-column">
            {/* Panel 1 - Upload Files */}
            <div 
              className={`upload-section ${isLayoutMode ? 'layout-draggable' : ''} ${!isPanelVisible('upload-panel') ? 'panel-hidden' : ''}`} 
              id="panel-1" 
              data-panel="upload-panel"
              draggable={isLayoutMode}
              onDragStart={(e) => handleDragStart(e, { id: 'upload-panel', type: 'panel' })}
              onDragEnd={handleDragEnd}
              style={panelPositions['upload-panel'] ? {
                position: 'absolute',
                left: `${panelPositions['upload-panel'].x}px`,
                top: `${panelPositions['upload-panel'].y}px`,
                width: panelPositions['upload-panel'].width ? `${panelPositions['upload-panel'].width}px` : 'auto',
                height: panelPositions['upload-panel'].height ? `${panelPositions['upload-panel'].height}px` : 'auto',
                zIndex: 10
              } : {}}
            >
              {isLayoutMode && (
                <>
                  <button 
                    className="panel-remove-btn"
                    onClick={() => removeElement({id: 'upload-panel', type: 'panel'})}
                    title="Remove Panel"
                  >
                    ×
                  </button>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleResizeStart(e, 'panel-1')}
                  />
                </>
              )}
              <div 
                className="upload-area"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('drag-over');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('drag-over');
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('drag-over');
                  
                  const files = Array.from(e.dataTransfer.files);
                  const excelFiles = files.filter(file => 
                    file.name.toLowerCase().endsWith('.xlsx') || 
                    file.name.toLowerCase().endsWith('.xls')
                  );
                  
                  if (excelFiles.length > 0) {
                    try {
                      const filePaths = excelFiles.map(file => file.path);
                      let newFilePaths = filePaths;
                      let newData = [];
                      
                      if (selectedFiles.length > 0) {
                        // Filter out files that are already selected
                        const existingPaths = selectedFiles.map(path => path.toLowerCase());
                        newFilePaths = filePaths.filter(path => !existingPaths.includes(path.toLowerCase()));
                        
                        if (newFilePaths.length === 0) {
                          setStatus('All dropped files are already uploaded');
                          return;
                        }
                        
                        setStatus(`Adding ${newFilePaths.length} dropped files...`);
                        newData = await window.electronAPI.readExcelFiles(newFilePaths);
                        
                        // Combine with existing data
                        setSelectedFiles([...selectedFiles, ...newFilePaths]);
                        setFilesData([...filesData, ...newData]);
                        setSelectedFileIndices(new Set());
                        setStatus(`${filesData.length + newData.length} Excel files loaded successfully (${newData.length} added)`);
                      } else {
                        // No existing files, just load the dropped ones
                        setSelectedFiles(newFilePaths);
                        setSelectedFileIndices(new Set());
                        setStatus('Dropped files selected. Reading data...');
                        
                        newData = await window.electronAPI.readExcelFiles(newFilePaths);
                        setFilesData(newData);
                        setStatus(`${newData.length} Excel files loaded successfully`);
                        setProcessingSummary(null);
                      }
                      
                      await extractColumnNames();
                    } catch (error) {
                      setStatus(`Error processing dropped files: ${error.message}`);
                    }
                  } else {
                    setStatus('Please drop Excel files (.xlsx or .xls)');
                  }
                }}
              >
                <h3>{t('uploadTitle')}</h3>
                <p>{t('uploadDescription')}</p>
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center'}}>
                  <button className="btn btn-primary" onClick={() => handleSelectFiles(false)} disabled={isProcessing}>
                    {t('selectExcelFiles')}
                  </button>
                  {filesData.length > 0 && (
                    <button className="btn btn-secondary" onClick={() => handleSelectFiles(true)} disabled={isProcessing}>
                      {t('addMoreFiles')}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Panel 2 - Uploaded Files Summary */}
            <div 
              className={`uploaded-files-summary ${isLayoutMode ? 'layout-draggable' : ''} ${!isPanelVisible('files-summary-panel') ? 'panel-hidden' : ''}`} 
              id="panel-2" 
              data-panel="files-summary-panel"
              draggable={isLayoutMode}
              onDragStart={(e) => handleDragStart(e, { id: 'files-summary-panel', type: 'panel' })}
              onDragEnd={handleDragEnd}
              style={panelPositions['files-summary-panel'] ? {
                position: 'absolute',
                left: `${panelPositions['files-summary-panel'].x}px`,
                top: `${panelPositions['files-summary-panel'].y}px`,
                width: panelPositions['files-summary-panel'].width ? `${panelPositions['files-summary-panel'].width}px` : 'auto',
                height: panelPositions['files-summary-panel'].height ? `${panelPositions['files-summary-panel'].height}px` : 'auto',
                zIndex: 10
              } : {}}
            >
              {isLayoutMode && (
                <>
                  <button 
                    className="panel-remove-btn"
                    onClick={() => removeElement({id: 'files-summary-panel', type: 'panel'})}
                    title="Remove Panel"
                  >
                    ×
                  </button>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleResizeStart(e, 'panel-2')}
                  />
                </>
              )}
              <h3 className="section-title">{t('uploadedFilesSummary')}</h3>
              {filesData.length > 0 ? (
                <div className="file-summary">
                  <div className="summary-item">📁 {filesData.length} {t('files')}</div>
                  <div className="summary-item">📊 {filesData.reduce((total, file) => total + file.rowCount, 0)} {t('totalRows')}</div>
                  <button 
                    className="btn btn-small btn-primary summary-view-btn" 
                    onClick={() => setShowUploadedFilesPopup(true)}
                  >
                    {t('viewUploadedFiles')}
                  </button>
                </div>
              ) : (
                <div className="no-files">
                  <p>{t('noFilesUploaded')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Header and Date Panels */}
          <div className="right-column">
            {/* Panel 3 - Header and Columns Selection */}
            <div 
              className={`xy-selection-section ${isLayoutMode ? 'layout-draggable' : ''} ${!isPanelVisible('header-selection-panel') ? 'panel-hidden' : ''}`} 
              id="panel-3" 
              data-panel="header-selection-panel"
              draggable={isLayoutMode}
              onDragStart={(e) => handleDragStart(e, { id: 'header-selection-panel', type: 'panel' })}
              onDragEnd={handleDragEnd}
              style={panelPositions['header-selection-panel'] ? {
                position: 'absolute',
                left: `${panelPositions['header-selection-panel'].x}px`,
                top: `${panelPositions['header-selection-panel'].y}px`,
                width: panelPositions['header-selection-panel'].width ? `${panelPositions['header-selection-panel'].width}px` : 'auto',
                height: panelPositions['header-selection-panel'].height ? `${panelPositions['header-selection-panel'].height}px` : 'auto',
                zIndex: 10
              } : {}}
            >
              {isLayoutMode && (
                <>
                  <button 
                    className="panel-remove-btn"
                    onClick={() => removeElement({id: 'header-selection-panel', type: 'panel'})}
                    title="Remove Panel"
                  >
                    ×
                  </button>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleResizeStart(e, 'panel-3')}
                  />
                </>
              )}
              <h3 className="section-title">{t('headerColumnsSelection')}</h3>
              <div className="section-content">
                {filesData.length > 0 ? (
                  <div>
                    <div className="input-group-horizontal">
                      <div className="input-group">
                        <label htmlFor="commonLines">{t('headerNumberOfRows')} <span className="tooltip-trigger" title={t('headerNumberTooltip')}></span></label>
                        <input
                          id="commonLines"
                          type="number"
                          min="0"
                          max="100"
                          value={commonLines}
                          onChange={(e) => handleCommonLinesChange(e.target.value)}
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div className="input-group">
                        <label htmlFor="columnNamesRow">{t('columnsRow')} <span className="tooltip-trigger" title={t('columnsRowTooltip')}></span></label>
                        <input
                          id="columnNamesRow"
                          type="number"
                          min="1"
                          max="100"
                          value={columnNamesRow}
                          onChange={(e) => handleColumnNamesRowChange(e.target.value)}
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-preview">
                    <p>{t('uploadFilesToSeePreview')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Panel 4 - Columns that will be Formatted as Date */}
            <div 
              className={`date-columns-section ${isLayoutMode ? 'layout-draggable' : ''} ${!isPanelVisible('date-columns-panel') ? 'panel-hidden' : ''}`} 
              id="panel-4" 
              data-panel="date-columns-panel"
              draggable={isLayoutMode}
              onDragStart={(e) => handleDragStart(e, { id: 'date-columns-panel', type: 'panel' })}
              onDragEnd={handleDragEnd}
              style={panelPositions['date-columns-panel'] ? {
                position: 'absolute',
                left: `${panelPositions['date-columns-panel'].x}px`,
                top: `${panelPositions['date-columns-panel'].y}px`,
                width: panelPositions['date-columns-panel'].width ? `${panelPositions['date-columns-panel'].width}px` : 'auto',
                height: panelPositions['date-columns-panel'].height ? `${panelPositions['date-columns-panel'].height}px` : 'auto',
                zIndex: 10
              } : {}}
            >
              {isLayoutMode && (
                <>
                  <button 
                    className="panel-remove-btn"
                    onClick={() => removeElement({id: 'date-columns-panel', type: 'panel'})}
                    title="Remove Panel"
                  >
                    ×
                  </button>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleResizeStart(e, 'panel-4')}
                  />
                </>
              )}
              <h3 className="section-title">{t('dateColumnsTitle')}</h3>
              <div className="section-content">
                {filesData.length > 0 ? (
                  <div>
                    {columnNames.length > 0 && autoDetectedDateColumns.length > 0 ? (
                      <div className="date-columns-preview">
                        <h4>{t('dateColumnsFound')} {autoDetectedDateColumns.length} <span className="tooltip-trigger" title={t('dateColumnsTooltip')}></span></h4>
                        <div className="date-columns-horizontal">
                          {autoDetectedDateColumns.slice(0, 3).map((colIndex) => {
                            const col = columnNames[colIndex];
                            const hasTime = dateColumnsWithTime.includes(colIndex);
                            
                            return (
                              <span key={colIndex} className="date-column-badge">
                                {col?.name || `Column ${colIndex + 1}`} {hasTime ? '⏰' : ''}
                              </span>
                            );
                          })}
                          {autoDetectedDateColumns.length > 3 && (
                            <span className="more-columns">{t('andMore')} {autoDetectedDateColumns.length - 3} {t('more')}</span>
                          )}
                        </div>
                      </div>
                    ) : columnNames.length > 0 ? (
                      <div className="no-preview">
                        <p>{t('noDateColumnsDetected')}</p>
                      </div>
                    ) : (
                      <div className="no-preview">
                        <p>{t('uploadFilesToDetectDate')}</p>
                      </div>
                    )}

                    <button 
                      className="btn btn-small btn-primary" 
                      onClick={() => setShowColumnSelectionPopup(true)}
                      style={{marginTop: '10px'}}
                      disabled={columnNames.length === 0}
                    >
                      {t('viewColumns')}
                    </button>
                  </div>
                ) : (
                  <div className="no-preview">
                    <p>{t('uploadFilesToDetectDate')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Merge Section - Center */}
          <div 
            className={`merge-section individual-button ${isLayoutMode ? 'layout-draggable' : ''} ${!isPanelVisible('merge-button') ? 'panel-hidden' : ''}`}
            id="merge-section"
            data-panel="merge-button"
            draggable={isLayoutMode}
            onDragStart={(e) => handleDragStart(e, { id: 'merge-button', type: 'button' })}
            onDragEnd={handleDragEnd}
            style={panelPositions['merge-button'] ? {
              position: 'absolute',
              left: `${panelPositions['merge-button'].x}px`,
              top: `${panelPositions['merge-button'].y}px`,
              width: panelPositions['merge-button'].width ? `${panelPositions['merge-button'].width}px` : 'auto',
              height: panelPositions['merge-button'].height ? `${panelPositions['merge-button'].height}px` : 'auto',
              zIndex: 10,
              minWidth: '60px',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            } : {}}
          >
            {isLayoutMode && (
              <>
                <button 
                  className="panel-remove-btn"
                  onClick={() => removeElement({id: 'merge-button', type: 'button'})}
                  title="Remove Button"
                >
                  ×
                </button>
                <div 
                  className="resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, 'merge-section')}
                />
              </>
            )}
            <button 
              className="merge-button" 
              onClick={handleMergeFiles}
              disabled={isProcessing || filesData.length === 0}
            >
              {isProcessing ? t('processing') : t('mergeFiles')}
            </button>
          </div>

          {/* Panel 5 - Summary of Merged Files */}
          <div 
            className={`merged-files-section ${isLayoutMode ? 'layout-draggable' : ''} ${!isPanelVisible('merged-summary-panel') ? 'panel-hidden' : ''}`} 
            id="panel-5" 
            data-panel="merged-summary-panel"
            draggable={isLayoutMode}
            onDragStart={(e) => handleDragStart(e, { id: 'merged-summary-panel', type: 'panel' })}
            onDragEnd={handleDragEnd}
            style={panelPositions['merged-summary-panel'] ? {
              position: 'absolute',
              left: `${panelPositions['merged-summary-panel'].x}px`,
              top: `${panelPositions['merged-summary-panel'].y}px`,
              width: panelPositions['merged-summary-panel'].width ? `${panelPositions['merged-summary-panel'].width}px` : 'auto',
              height: panelPositions['merged-summary-panel'].height ? `${panelPositions['merged-summary-panel'].height}px` : 'auto',
              zIndex: 10
            } : {}}
          >
            {isLayoutMode && (
              <>
                <button 
                  className="panel-remove-btn"
                  onClick={() => removeElement({id: 'merged-summary-panel', type: 'panel'})}
                  title="Remove Panel"
                >
                  ×
                </button>
                <div 
                  className="resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, 'panel-5')}
                />
              </>
            )}
            <h3 className="section-title">{t('mergedFilesSummary')}</h3>
            <div className="section-content">
              {processingSummary ? (
                <div className="merged-summary">
                  <div className="summary-stats">
                    <div className="stat-item">
                      <strong>✅ {t('filesMerged')}</strong> <span className="stat-number">{processingSummary.filesProcessed}</span>
                    </div>
                    <div className="stat-item">
                      <strong>📊 {t('totalDataRows')}</strong> <span className="stat-number">{processingSummary.totalDataRows}</span>
                    </div>
                    <div className="stat-item">
                      <strong>📄 {t('commonHeaderRows')}</strong> <span className="stat-number">{processingSummary.commonHeaderRows}</span>
                    </div>
                    <div className="stat-item">
                      <strong>🔍 {t('columnHeadersMatch')}</strong> 
                      <span className={`status-badge ${processingSummary.matchingFiles === processingSummary.filesProcessed ? 'success' : 'warning'}`}>
                        {processingSummary.matchingFiles || 0}/{processingSummary.filesProcessed}
                      </span>
                    </div>
                  </div>
                  
                  <div className="merged-actions">
                    <div className="view-action">
                      <button className="btn btn-small btn-primary" onClick={() => setShowMergedFilesPopup(true)}>
                        {t('viewMergedFiles')}
                      </button>
                    </div>
                    <div className="primary-actions">
                      <button className="download-button" onClick={handleDownloadFile}>
                        {t('download')}
                      </button>
                      <button className="btn btn-accent" onClick={handleOpenFile}>
                        {t('open')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-merged-files">
                  <p>{t('mergedFileSummaryWillAppear')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {status && (
          <div className="status-message">
            <p>{status}</p>
          </div>
        )}

        {/* Popup Modals */}
        {showUploadedFilesPopup && (
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

        {showColumnSelectionPopup && (
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

        {showMergedFilesPopup && processingSummary && (
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
        
        {/* Layout Mode Dropdown Menu */}
        {isLayoutMode && (
          <div className="layout-controls">
            <button 
              className="layout-menu-toggle"
              onClick={toggleLayoutMenu}
              title={isLayoutMenuOpen ? "Collapse Menu" : "Show Element Menu"}
            >
              <span className={`arrow ${isLayoutMenuOpen ? 'up' : 'down'}`}>
                {isLayoutMenuOpen ? '▲' : '▼'}
              </span>
            </button>
            
            {isLayoutMenuOpen && (
              <div className="layout-dropdown">
                <div className="dropdown-header">
                  <h3>Element Library</h3>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button className="close-layout-btn" onClick={async () => {
                      setPanelPositions({});
                      await saveLayoutSettings();
                    }}>Reset Layout</button>
                    <button className="close-layout-btn" onClick={toggleLayoutMode}>Exit Layout Mode</button>
                  </div>
                </div>
                
                <div className="dropdown-content">
                  <div className="dropdown-section">
                    <h4>Panels</h4>
                    <div className="dropdown-items">
                      {availablePanels.filter(panel => !panel.active).map(panel => (
                        <div key={panel.id} className="dropdown-item">
                          <span className="item-name">{panel.name}</span>
                          <button 
                            className="btn-add" 
                            onClick={() => addElement(panel)}
                            title="Add Panel"
                          >
                            +
                          </button>
                        </div>
                      ))}
                      {availablePanels.filter(panel => !panel.active).length === 0 && (
                        <div className="no-items">All panels are currently visible</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="dropdown-section">
                    <h4>Buttons</h4>
                    <div className="dropdown-items">
                      {availableButtons.filter(button => !button.active).map(button => (
                        <div key={button.id} className="dropdown-item">
                          <span className="item-name">{button.name}</span>
                          <button 
                            className="btn-add" 
                            onClick={() => addElement(button)}
                            title="Add Button"
                          >
                            +
                          </button>
                        </div>
                      ))}
                      {availableButtons.filter(button => !button.active).length === 0 && (
                        <div className="no-items">All buttons are currently visible</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;