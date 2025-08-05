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
        setCommonLines(commonLinesValue);
        setColumnNamesRow(columnNamesRowValue);
        setSelectedDateColumns(settings.selectedDateColumns || []);
        applyTheme(settings.theme || 'professional');
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
      document.documentElement.style.setProperty('--theme-accent', theme.accent);
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
        <div className="main-grid">
          {/* Upload Column - Left */}
          <div className="upload-column">
            {/* Upload Section */}
            <div className="upload-section">
              <div className="upload-area">
                <h3>Upload or drag and drop files here</h3>
                <p>Click to select Excel files to merge</p>
                <button className="btn btn-primary" onClick={handleSelectFiles} disabled={isProcessing}>
                  Select Excel Files
                </button>
              </div>
            </div>
            
            {/* Uploaded Files Summary */}
            <div className="uploaded-files-summary">
              <h3 className="section-title">Summary of uploaded files</h3>
              {filesData.length > 0 ? (
                <div className="file-summary">
                  <div className="summary-item">📁 {filesData.length} files</div>
                  <div className="summary-item">📊 {filesData.reduce((total, file) => total + file.rowCount, 0)} total rows</div>
                  <button 
                    className="btn btn-small btn-primary" 
                    onClick={() => setShowUploadedFilesPopup(true)}
                    style={{marginTop: '10px'}}
                  >
                    View
                  </button>
                </div>
              ) : (
                <div className="no-files">
                  <p>No files uploaded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* X and Y Selection Section - Right */}
          <div className="xy-selection-section">

            <h3 className="section-title">X and y selection with the preview for the date columns</h3>
            <div className="section-content">
              {filesData.length > 0 ? (
                <div>
                  <div className="input-group-horizontal">
                    <div className="input-group">
                      <label htmlFor="commonLines">X (Common lines):</label>
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
                      <label htmlFor="columnNamesRow">Y (Column row):</label>
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

                  {columnNames.length > 0 && autoDetectedDateColumns.length > 0 && (
                    <div className="date-columns-preview">
                      <h4>Date Columns Found: {autoDetectedDateColumns.length}</h4>
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
                          <span className="more-columns">...and {autoDetectedDateColumns.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <button 
                    className="btn btn-small btn-primary" 
                    onClick={() => setShowColumnSelectionPopup(true)}
                    style={{marginTop: '10px'}}
                    disabled={columnNames.length === 0}
                  >
                    View
                  </button>
                </div>
              ) : (
                <div className="no-preview">
                  <p>Upload files to see column preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Merge Section - Center */}
          <div className="merge-section">
            <button 
              className="merge-button" 
              onClick={handleMergeFiles}
              disabled={isProcessing || filesData.length === 0}
            >
              {isProcessing ? 'Processing...' : 'Merge Files'}
            </button>
          </div>

          {/* Merged Files Section - Bottom */}
          <div className="merged-files-section">
            <h3 className="section-title">Summary of merged files</h3>
            <div className="section-content">
              {processingSummary ? (
                <div className="merged-summary">
                  <div className="summary-stats">
                    <div className="stat-item">
                      <strong>✅ Files merged:</strong> {processingSummary.filesProcessed}
                    </div>
                    <div className="stat-item">
                      <strong>📊 Total data rows:</strong> {processingSummary.totalDataRows}
                    </div>
                    <div className="stat-item">
                      <strong>📄 Common header rows:</strong> {processingSummary.commonHeaderRows}
                    </div>
                    <div className="stat-item">
                      <strong>🔍 Column headers match:</strong> 
                      <span className={`status-badge ${processingSummary.matchingFiles === processingSummary.filesProcessed ? 'success' : 'warning'}`}>
                        {processingSummary.matchingFiles || 0}/{processingSummary.filesProcessed}
                      </span>
                    </div>
                  </div>
                  
                  <div className="merged-actions">
                    <div className="view-action">
                      <button className="btn btn-small btn-primary" onClick={() => setShowMergedFilesPopup(true)}>
                        View
                      </button>
                    </div>
                    <div className="primary-actions">
                      <button className="download-button" onClick={handleDownloadFile}>
                        Download
                      </button>
                      <button className="btn btn-accent" onClick={handleOpenFile}>
                        Open
                      </button>
                      <button className="btn btn-secondary" onClick={resetApp}>
                        Remake
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-merged-files">
                  <p>Merged file summary will appear here after processing</p>
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
      </main>
    </div>
  );
}

export default App;