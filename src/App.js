import React, { useState, useEffect } from 'react';
import './App.css';
import ThemeMenu, { themes } from './ThemeMenu';

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filesData, setFilesData] = useState([]);
  const [selectedFileIndices, setSelectedFileIndices] = useState(new Set());
  const [commonLines, setCommonLines] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdFilePath, setCreatedFilePath] = useState('');
  const [status, setStatus] = useState('');
  const [processingSummary, setProcessingSummary] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('purple');
  const [isLoading, setIsLoading] = useState(true);
  const [columnNamesRow, setColumnNamesRow] = useState(1);
  const [columnNames, setColumnNames] = useState([]);
  const [selectedDateColumns, setSelectedDateColumns] = useState([]);
  const [autoDetectedDateColumns, setAutoDetectedDateColumns] = useState([]);
  const [dateColumnsWithTime, setDateColumnsWithTime] = useState([]);
  const [menuStates, setMenuStates] = useState({
    headerSettings: true,
    columnSettings: true,
    fileList: true,
    processingDetails: false
  });

  // Load settings on app start
  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        const settings = await window.electronAPI.loadSettings();
        console.log('Loaded settings:', settings);
        
        // Ensure numeric values are properly parsed and validated
        const commonLinesValue = Number.isInteger(settings.commonLines) ? settings.commonLines : (parseInt(settings.commonLines) || 1);
        let columnNamesRowValue = Number.isInteger(settings.columnNamesRow) ? settings.columnNamesRow : (parseInt(settings.columnNamesRow) || 1);
        
        // Default y to equal x if not explicitly different
        if (!settings.columnNamesRowExplicitlySet) {
          columnNamesRowValue = commonLinesValue;
        }
        
        console.log('Parsed values - commonLines:', commonLinesValue, 'columnNamesRow:', columnNamesRowValue);
        
        setCurrentTheme(settings.theme || 'purple');
        setCommonLines(commonLinesValue);
        setColumnNamesRow(columnNamesRowValue);
        setSelectedDateColumns(settings.selectedDateColumns || []);
        setMenuStates(settings.menuStates || { headerSettings: true, columnSettings: true, fileList: true, processingDetails: false });
        applyTheme(settings.theme || 'purple');
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Set safe defaults if loading fails
        setCommonLines(1);
        setColumnNamesRow(1);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppSettings();
  }, []);

  // Auto-extract columns when columnNamesRow changes
  useEffect(() => {
    const numValue = parseInt(columnNamesRow);
    if (!isNaN(numValue) && numValue > 0 && filesData.length > 0) {
      console.log('useEffect: columnNamesRow changed to:', numValue, 'triggering extraction');
      const delayedExtraction = setTimeout(() => {
        extractColumnNames();
      }, 300); // Small delay to avoid rapid-fire extractions while typing
      
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
      document.documentElement.style.setProperty('--theme-accent', theme.accent);
      document.documentElement.style.setProperty('--theme-background', theme.background);
      document.documentElement.style.setProperty('--theme-card-bg', theme.cardBg);
      
      // Apply dark theme class if it's a dark theme
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

  // Save commonLines when it changes
  const handleCommonLinesChange = async (value) => {
    const numValue = parseInt(value);
    
    // Only proceed if it's a valid number
    if (!isNaN(numValue) && numValue > 0) {
      const currentCommonLines = parseInt(commonLines);
      const currentColumnNamesRow = parseInt(columnNamesRow);
      
      setCommonLines(numValue);
      
      // Always set y (columnNamesRow) to equal x (commonLines) when x changes
      setColumnNamesRow(numValue);
      
      try {
        const settings = await window.electronAPI.loadSettings();
        const updatedSettings = {
          ...settings,
          commonLines: numValue
        };
        
        // Always update columnNamesRow to match commonLines when commonLines changes
        updatedSettings.columnNamesRow = numValue;
        // Reset the explicitly set flag when x changes
        updatedSettings.columnNamesRowExplicitlySet = false;
        
        await window.electronAPI.saveSettings(updatedSettings);
        
        // Re-extract column names when commonLines changes (affects date detection)
        if (filesData.length > 0) {
          await extractColumnNames();
        }
      } catch (error) {
        console.error('Failed to save common lines:', error);
      }
    } else {
      // Handle invalid input - just update the display
      setCommonLines(value);
    }
  };

  // Save columnNamesRow when it changes
  const handleColumnNamesRowChange = async (value) => {
    console.log('=== handleColumnNamesRowChange called with value:', value, 'type:', typeof value);
    
    // Always update the display value immediately - this will trigger useEffect
    setColumnNamesRow(value);
    
    // Save to settings if it's a valid number
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      try {
        const settings = await window.electronAPI.loadSettings();
        const currentCommonLines = parseInt(commonLines);
        
        await window.electronAPI.saveSettings({
          ...settings,
          columnNamesRow: numValue,
          // Mark as explicitly set if different from commonLines
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
      const rowIndex = (parseInt(columnNamesRow) || 1) - 1; // Convert to 0-based index
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
        
        // Auto-select all detected date columns by default
        if (result.autoDetectedDateColumns && result.autoDetectedDateColumns.length > 0) {
          const newSelectedColumns = [...result.autoDetectedDateColumns];
          console.log('Auto-selecting all date columns:', newSelectedColumns);
          setSelectedDateColumns(newSelectedColumns);
          
          // Save the auto-selected date columns
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
      ? selectedDateColumns.filter(col => col !== columnIndex)  // Remove if already selected
      : [...selectedDateColumns, columnIndex];  // Add if not selected
    
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

  // Toggle menu state
  const toggleMenuState = async (menuKey) => {
    const newMenuStates = {
      ...menuStates,
      [menuKey]: !menuStates[menuKey]
    };
    setMenuStates(newMenuStates);
    
    try {
      const settings = await window.electronAPI.loadSettings();
      await window.electronAPI.saveSettings({
        ...settings,
        menuStates: newMenuStates
      });
    } catch (error) {
      console.error('Failed to save menu states:', error);
    }
  };

  const handleSelectFiles = async () => {
    try {
      const filePaths = await window.electronAPI.selectExcelFiles();
      if (filePaths.length > 0) {
        setSelectedFiles(filePaths);
        setSelectedFileIndices(new Set());
        setStatus('Files selected. Reading data...');
        
        const data = await window.electronAPI.readExcelFiles(filePaths);
        setFilesData(data);
        setStatus(`${data.length} Excel files loaded successfully`);
        setProcessingSummary(null);
        
        // Auto-minimize file list after loading
        const newMenuStates = { ...menuStates, fileList: false };
        setMenuStates(newMenuStates);
        try {
          const settings = await window.electronAPI.loadSettings();
          await window.electronAPI.saveSettings({
            ...settings,
            menuStates: newMenuStates
          });
        } catch (error) {
          console.error('Failed to save menu state:', error);
        }
        
        // Extract column names after loading files
        await extractColumnNames();
      }
    } catch (error) {
      setStatus(`Error selecting files: ${error.message}`);
    }
  };

  const handleFileClick = (index, event) => {
    const newSelected = new Set(selectedFileIndices);
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd click - toggle selection
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
    } else if (event.shiftKey && selectedFileIndices.size > 0) {
      // Shift click - select range
      const indices = Array.from(selectedFileIndices);
      const lastSelected = Math.max(...indices);
      const start = Math.min(lastSelected, index);
      const end = Math.max(lastSelected, index);
      
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else {
      // Regular click - select only this item
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

  const handleDeleteUnselected = () => {
    if (selectedFileIndices.size === 0) return;
    
    const newFilesData = filesData.filter((_, index) => selectedFileIndices.has(index));
    const newSelectedFiles = selectedFiles.filter((_, index) => selectedFileIndices.has(index));
    
    const deletedCount = filesData.length - newFilesData.length;
    setFilesData(newFilesData);
    setSelectedFiles(newSelectedFiles);
    setSelectedFileIndices(new Set());
    setStatus(`Deleted ${deletedCount} unselected files. ${newFilesData.length} files remaining.`);
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
        dateColumnsWithTime
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
    <div className="App">
      <ThemeMenu currentTheme={currentTheme} onThemeChange={handleThemeChange} />
      
      <header className="app-header">
        <h1>Excel File Merger</h1>
        <p>Merge multiple Excel files with source tracking</p>
      </header>

      <main className="app-main">
        <div className="card">
          <div className="step">
            <h2>Step 1: Select Excel Files</h2>
            <button 
              className="btn btn-primary" 
              onClick={handleSelectFiles}
              disabled={isProcessing}
            >
              Select Excel Files
            </button>
            {filesData.length > 0 && (
              <div className="file-list">
                <div className="file-list-header" onClick={() => toggleMenuState('fileList')}>
                  <div className="file-list-title">
                    <h3>
                      <span className={`collapse-icon ${menuStates.fileList ? 'expanded' : 'collapsed'}`}>
                        ▼
                      </span>
                      Loaded Files ({filesData.length})
                    </h3>
                    {!menuStates.fileList && (
                      <div className="file-summary">
                        <span className="summary-item">
                          📁 {filesData.length} files
                        </span>
                        <span className="summary-item">
                          📊 {filesData.reduce((total, file) => total + file.rowCount, 0)} total rows
                        </span>
                      </div>
                    )}
                  </div>
                  {menuStates.fileList && (
                    <div className="file-controls">
                      <button className="btn btn-small btn-secondary" onClick={(e) => { e.stopPropagation(); selectAllFiles(); }}>
                        Select All
                      </button>
                      <button className="btn btn-small btn-secondary" onClick={(e) => { e.stopPropagation(); deselectAllFiles(); }}>
                        Deselect All
                      </button>
                      <button 
                        className="btn btn-small btn-danger" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteSelected(); }}
                        disabled={selectedFileIndices.size === 0}
                      >
                        Delete Selected ({selectedFileIndices.size})
                      </button>
                      <button 
                        className="btn btn-small btn-danger" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteUnselected(); }}
                        disabled={selectedFileIndices.size === 0 || selectedFileIndices.size === filesData.length}
                      >
                        Keep Only Selected
                      </button>
                    </div>
                  )}
                </div>
                
                {menuStates.fileList && (
                  <div className="file-list-content">
                    <div className="file-items">
                      {filesData.map((fileData, index) => (
                        <div 
                          key={index} 
                          className={`file-item ${selectedFileIndices.has(index) ? 'selected' : ''}`}
                          onClick={(e) => handleFileClick(index, e)}
                        >
                          <div className="file-info">
                            <strong>{fileData.fileName}</strong>
                            <span className="file-stats">{fileData.rowCount} rows</span>
                          </div>
                          <div className="file-path">{fileData.filePath}</div>
                        </div>
                      ))}
                    </div>
                    <div className="selection-hint">
                      <p>💡 Click to select, Ctrl+Click to toggle, Shift+Click to select range</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {filesData.length > 0 && (
            <div className="step">
              <div className="step-header">
                <h2>Step 2: Configure Settings</h2>
              </div>
              
              <div className="collapsible-section">
                <div className="section-header" onClick={() => toggleMenuState('headerSettings')}>
                  <h3>
                    <span className={`collapse-icon ${menuStates.headerSettings ? 'expanded' : 'collapsed'}`}>
                      ▼
                    </span>
                    Header Settings
                  </h3>
                </div>
                
                {menuStates.headerSettings && (
                  <div className="section-content">
                    <div className="input-group">
                      <label htmlFor="commonLines">
                        Number of common header lines to preserve (x):
                      </label>
                      <input
                        id="commonLines"
                        type="number"
                        min="0"
                        max="100"
                        value={commonLines}
                        onChange={(e) => handleCommonLinesChange(e.target.value)}
                        onBlur={(e) => {
                          // Ensure extraction happens when user finishes typing
                          const numValue = parseInt(e.target.value);
                          if (!isNaN(numValue) && numValue >= 0 && filesData.length > 0) {
                            console.log('onBlur (commonLines): Ensuring column extraction for value:', numValue);
                            extractColumnNames();
                          }
                        }}
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div className="input-group">
                      <label htmlFor="columnNamesRow">
                        Row number containing column names (y):
                      </label>
                      <input
                        id="columnNamesRow"
                        type="number"
                        min="1"
                        max="100"
                        value={columnNamesRow}
                        onChange={(e) => {
                          console.log('onChange event triggered with:', e.target.value);
                          handleColumnNamesRowChange(e.target.value);
                        }}
                        onBlur={(e) => {
                          // Ensure extraction happens when user finishes typing
                          const numValue = parseInt(e.target.value);
                          if (!isNaN(numValue) && numValue > 0 && filesData.length > 0) {
                            console.log('onBlur: Ensuring column extraction for value:', numValue);
                            extractColumnNames();
                          }
                        }}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="collapsible-section">
                <div className="section-header" onClick={() => toggleMenuState('columnSettings')}>
                  <h3>
                    <span className={`collapse-icon ${menuStates.columnSettings ? 'expanded' : 'collapsed'}`}>
                      ▼
                    </span>
                    Column Settings
                  </h3>
                </div>
                
                {menuStates.columnSettings && (
                  <div className="section-content">
                    {columnNames.length > 0 ? (
                      <>
                        {autoDetectedDateColumns.length > 0 && (
                          <>
                            <div className="column-info">
                              <h4>Date Columns Detected (Row {columnNamesRow}):</h4>
                              <p className="column-hint">Click to select/deselect date columns for formatting. Selected columns will be formatted as dates in the merged file:</p>
                            </div>
                            <div className="column-grid">
                              {autoDetectedDateColumns.map((colIndex) => {
                                const col = columnNames[colIndex];
                                const isSelected = selectedDateColumns.includes(colIndex);
                                const hasTime = dateColumnsWithTime.includes(colIndex);
                                
                                return (
                                  <button
                                    key={colIndex}
                                    className={`column-btn ${isSelected ? 'selected-date' : 'auto-detected-date'}`}
                                    onClick={() => handleDateColumnChange(colIndex)}
                                    disabled={isProcessing}
                                  >
                                    <div className="column-header">
                                      <span className="column-name">{col?.name || `Column ${colIndex + 1}`}</span>
                                      <span className="column-index">#{colIndex + 1}</span>
                                    </div>
                                    {isSelected ? (
                                      <div className="date-indicator selected">
                                        ✅ Selected for Date Formatting {hasTime ? '⏰' : ''}
                                      </div>
                                    ) : (
                                      <div className="date-indicator auto-detected">
                                        🤖 Auto-detected (Click to Select) {hasTime ? '⏰' : ''}
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                        
                        {/* Show all other columns in a minimized list */}
                        {columnNames.filter((_, index) => !autoDetectedDateColumns.includes(index)).length > 0 && (
                          <details className="other-columns-section">
                            <summary>
                              <h4>Other Columns ({columnNames.filter((_, index) => !autoDetectedDateColumns.includes(index)).length})</h4>
                            </summary>
                            <div className="other-columns-grid">
                              {columnNames.map((col, index) => {
                                if (autoDetectedDateColumns.includes(index)) return null;
                                
                                return (
                                  <div key={index} className="other-column-item">
                                    <span className="column-name">{col?.name || `Column ${index + 1}`}</span>
                                    <span className="column-index">#{index + 1}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        )}
                      </>
                    ) : (
                      <div className="no-columns">
                        <p>No columns detected in the data. Please check if the column names row (y) and common header lines (x) settings are correct.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {filesData.length > 0 && (
            <div className="step">
              <h2>Step 3: Merge Files</h2>
              <button 
                className="btn btn-success" 
                onClick={handleMergeFiles}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Merge and Save'}
              </button>
            </div>
          )}

          {createdFilePath && (
            <div className="step">
              <h2>Step 4: Open Result</h2>
              {processingSummary && (
                <div className="processing-summary">
                  <div className="summary-stats">
                    <div className="stat-item">
                      <strong>✅ Successfully merged {processingSummary.filesProcessed} files</strong>
                    </div>
                    <div className="stat-item">
                      <strong>📊 Total data rows:</strong> {processingSummary.totalDataRows}
                    </div>
                    <div className="stat-item">
                      <strong>📄 Common header rows:</strong> {processingSummary.commonHeaderRows}
                    </div>
                    <div className="stat-item">
                      <strong>🔍 Headers match:</strong> 
                      <span className={`status-badge ${processingSummary.headersMatch ? 'success' : 'warning'}`}>
                        {processingSummary.headersMatch ? '✓ Yes' : '⚠ No'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="collapsible-section">
                    <div className="section-header" onClick={() => toggleMenuState('processingDetails')}>
                      <h3>
                        <span className={`collapse-icon ${menuStates.processingDetails ? 'expanded' : 'collapsed'}`}>
                          ▼
                        </span>
                        Detailed Processing Information
                      </h3>
                    </div>
                    
                    {menuStates.processingDetails && (
                      <div className="section-content">
                        <div className="file-details">
                          <h4>File Details:</h4>
                          {processingSummary.fileDetails.map((file, index) => (
                            <div key={index} className="file-detail">
                              <strong>{file.fileName}:</strong> {file.dataRows} data rows
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="result-actions">
                <button 
                  className="btn btn-accent" 
                  onClick={handleOpenFile}
                >
                  Open Merged File
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={resetApp}
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {status && (
            <div className="status-message">
              <p>{status}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;