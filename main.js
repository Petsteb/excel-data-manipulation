const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');

// Suppress Electron cache errors
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Settings storage
const settingsFile = path.join(app.getPath('userData'), 'settings.json');

// Default settings structure
const DEFAULT_SETTINGS = {
  version: '2.0.9',
  theme: 'businessGreen',
  language: 'en',
  excel: {
    commonLines: 1,
    columnNamesRow: 1,
    selectedDateColumns: [],
    dateColumnsWithTime: []
  },
  windowSettings: {
    isFirstLaunch: true,
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    isMaximized: false,
    isFullScreen: false
  },
  menuStates: {
    headerSettings: true,
    columnSettings: true,
    fileList: true,
    processingDetails: false
  },
  uiSettings: {
    panelPositions: {
      'contabilitate-upload-panel': { x: -1587.44873046875, y: -1372.5, width: 280, height: 260 },
      'anaf-upload-panel': { x: -767.44873046875, y: -1372.5, width: 280, height: 260 },
      'contabilitate-summary-panel': { x: -1587.44873046875, y: -1112.5, width: 280, height: 220 },
      'anaf-summary-panel': { x: -767.44873046875, y: -1112.5, width: 280, height: 220 },
      'anaf-header-panel': { x: -303.05908203125, y: -1313.5858154298053, width: 420, height: 180 },
      'anaf-date-panel': { x: -303.05908203125, y: -1133.5858154298053, width: 300, height: 200 },
      'account-selection-panel': { x: -1307.44873046875, y: -1372.5, width: 540, height: 480 },
      'account-mapping-panel': { x: -1363.05908203125, y: 484.7979736328293, width: 360, height: 480 },
      'sums-panel': { x: -1912.55126953125, y: 52.5, width: 460, height: 1320 },
      'worksheet-selection-panel': { x: -1003.05908203125, y: 564.7979736328293, width: 360, height: 400 },
      'generate-summary-button': { x: -1003.05908203125, y: 484.7979736328293, width: 760, height: 80 },
      'final-summary-panel': { x: -643.05908203125, y: 564.7979736328293, width: 400, height: 400 }
    },
    screens: {
      homeScreen: {
        x: -1997.44873046875,
        y: -1661,
        width: 1920,
        height: 1057
      },
      secondaryScreens: [{
        id: "view-1756236196841",
        name: "Summary", 
        x: -1443.05908203125,
        y: 325.7979736328293,
        width: 1280,
        height: 778,
        color: "#06b6d4"
      }],
      currentScreen: 'home',
      tabPosition: 'left'
    },
    panels: {
      visibility: {
        'contabilitate-upload-panel': true,
        'anaf-upload-panel': true,
        'contabilitate-summary-panel': true,
        'anaf-summary-panel': true,
        'anaf-header-panel': true,
        'anaf-date-panel': true,
        'account-selection-panel': true,
        'account-mapping-panel': true,
        'sums-panel': true,
        'worksheet-selection-panel': true,
        'final-summary-panel': true
      },
      layoutMode: {
        enabled: false,
        onlyPanels: ['anaf-header-panel', 'anaf-date-panel', 'sums-panel'],
        showControlPanel: false
      }
    },
    view: {
      panOffset: { x: 0, y: 0 },
      zoom: 1,
      gridVisible: true,
      snapToGrid: true
    },
    mode: {
      current: 'normal',
      screenMode: {
        step: 'idle',
        creatingScreenRect: null
      }
    }
  },
  accountMappings: {
    "436": ["480"],
    "444": ["2", "9"],
    "4315": ["412", "451", "458", "483"],
    "4316": ["432", "459", "461"],
    "4411": ["3"],
    "4418": ["14"],
    "4423": ["1/4423"],
    "4424": ["1/4424"],
    "446.DIV": ["7"],
    "446.CHIRII": ["628"],
    "446.CV": ["33"]
  },
  sumFormulas: {
    conta: {},
    anaf: {}
  },
  anafHeaderPanel: {
    commonLines: 1,
    columnNamesRow: 1,
    selectedDateColumns: [],
    dateColumnsWithTime: []
  },
  accountSelection: {
    dateInterval: {
      startDate: null,
      endDate: null
    },
    selectedAccounts: [],
    selectedAnafAccounts: []
  },
  worksheetSelection: {
    selectedWorksheets: {
      contaMergedData: true,
      anafMergedData: true,
      relationsSummary: true,
      contaAccountSums: true,
      anafAccountSums: true
    }
  },
  files: {
    lastUsedPaths: {
      conta: null,
      anaf: null,
      output: null
    },
    recentFiles: {
      conta: [],
      anaf: []
    }
  }
};

// Deep merge function
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

function loadSettings() {
  try {
    if (fs.existsSync(settingsFile)) {
      const savedSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      // Deep merge saved settings with defaults to handle new fields
      return deepMerge(DEFAULT_SETTINGS, savedSettings);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  try {
    const dir = path.dirname(settingsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

let mainWindow;

function createWindow() {
  const settings = loadSettings();
  
  // Ensure windowSettings exists with default values
  const windowSettings = settings.windowSettings || {
    isFirstLaunch: true,
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    isMaximized: false,
    isFullScreen: false
  };

  // Create window with settings-based dimensions
  mainWindow = new BrowserWindow({
    width: windowSettings.width || 1200,
    height: windowSettings.height || 800,
    x: windowSettings.x,
    y: windowSettings.y,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false,
    icon: path.join(__dirname, 'src', 'assets', 'images', 'logo.png'),
    // Disable the menu bar (File, Edit, View, Window, Help)
    autoHideMenuBar: true,
    menuBarVisible: false
  });

  // Set menu to null to completely remove it
  mainWindow.setMenu(null);

  const isDev = process.argv.includes('--dev');
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile('build/index.html');
  }

  mainWindow.once('ready-to-show', () => {
    // If it's the first launch, open fullscreen
    if (windowSettings.isFirstLaunch !== false) {
      mainWindow.maximize();
      // Mark as no longer first launch and save settings
      settings.windowSettings = {
        ...windowSettings,
        isFirstLaunch: false
      };
      saveSettings(settings);
    } else {
      // Restore previous window state
      if (windowSettings.isMaximized) {
        mainWindow.maximize();
      } else if (windowSettings.isFullScreen) {
        mainWindow.setFullScreen(true);
      }
    }
    
    mainWindow.show();
  });

  // Save window state when it changes
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);
  mainWindow.on('enter-full-screen', saveWindowState);
  mainWindow.on('leave-full-screen', saveWindowState);

  // Save window state before closing
  mainWindow.on('close', saveWindowState);

  // Add keyboard shortcuts for developer tools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // F12 key
    if (input.key === 'F12') {
      event.preventDefault();
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
    
    // Ctrl+Shift+I
    if (input.control && input.shift && input.key === 'I') {
      event.preventDefault();
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });
}

function saveWindowState() {
  if (!mainWindow) return;
  
  try {
    const settings = loadSettings();
    const bounds = mainWindow.getBounds();
    
    // Ensure windowSettings exists
    if (!settings.windowSettings) {
      settings.windowSettings = {};
    }
    
    settings.windowSettings = {
      ...settings.windowSettings,
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: mainWindow.isMaximized(),
      isFullScreen: mainWindow.isFullScreen(),
      isFirstLaunch: false
    };
    
    saveSettings(settings);
  } catch (error) {
    console.error('Error saving window state:', error);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle file selection
ipcMain.handle('select-excel-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
      { name: 'Excel 2007+ (.xlsx)', extensions: ['xlsx'] },
      { name: 'Excel 97-2003 (.xls)', extensions: ['xls'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled) {
    return result.filePaths;
  }
  return [];
});

// Handle Excel file reading
ipcMain.handle('read-excel-files', async (event, filePaths) => {
  const filesData = [];
  
  for (const filePath of filePaths) {
    try {
      const fileName = path.basename(filePath, path.extname(filePath));
      const fileExtension = path.extname(filePath).toLowerCase();
      let data = [];
      
      if (fileExtension === '.xls') {
        // Use XLSX library for older .xls files
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      } else if (fileExtension === '.xlsx') {
        // Use ExcelJS for newer .xlsx files
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const worksheet = workbook.worksheets[0];
        
        // Get the actual used range to ensure we read all data consistently
        const range = worksheet.actualRange;
        if (range) {
          const rowCount = range.end.row;
          const colCount = range.end.col;
          
          for (let rowNum = 1; rowNum <= rowCount; rowNum++) {
            const row = worksheet.getRow(rowNum);
            const rowData = [];
            
            // Ensure we get all columns, including empty ones
            for (let colNum = 1; colNum <= colCount; colNum++) {
              const cell = row.getCell(colNum);
              rowData[colNum - 1] = cell.value;
            }
            data.push(rowData);
          }
        }
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }
      
      
      filesData.push({
        fileName,
        filePath,
        data,
        rowCount: data.length
      });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      // Continue with other files even if one fails
    }
  }
  
  return filesData;
});

// Helper function to transform date values
function transformDateValue(value, columnIndex, dateColumnIndices, preserveTime = false) {
  // Only transform if this is one of the selected date columns and value exists
  if (!dateColumnIndices.includes(columnIndex) || !value || value === '') {
    return value;
  }
  
  try {
    
    // If it's already a Date object, return it
    if (value instanceof Date) {
      return value;
    }
    
    // If it's a number (Excel date serial), convert it
    if (typeof value === 'number' && value >= 30000 && value < 100000) {
      // Excel uses 1900-01-01 as day 1 (but treats 1900 as a leap year incorrectly)
      // JavaScript Date() uses 1970-01-01 as epoch
      // Excel serial 1 = 1900-01-01, Excel serial 2 = 1900-01-02, etc.
      // But Excel incorrectly thinks 1900 is a leap year, so we need to adjust
      
      let adjustedValue = value;
      // Adjust for Excel's leap year bug (if date is after Feb 28, 1900)
      if (value > 59) {
        adjustedValue = value - 1;
      }
      
      // Convert to JavaScript date using UTC to avoid timezone issues
      // Excel day 1 = Jan 1, 1900
      const excelEpochYear = 1900;
      const excelEpochMonth = 0; // January (0-based)
      const excelEpochDay = 1;
      
      // Calculate the target date
      const totalDays = adjustedValue - 1; // adjustedValue is 1-based, we need 0-based
      const targetDate = new Date(Date.UTC(excelEpochYear, excelEpochMonth, excelEpochDay + totalDays));
      
      // If the original value has decimal part (time) and we want to preserve it
      if (preserveTime && value % 1 !== 0) {
        // Add the time portion (fractional part represents time)
        const timeFraction = value % 1;
        const timeMs = timeFraction * 86400 * 1000;
        const dateWithTime = new Date(targetDate.getTime() + timeMs);
        return dateWithTime;
      } else {
        return targetDate;
      }
    }
    
    // If it's a string, try to parse it
    if (typeof value === 'string') {
      const trimmedValue = value.toString().trim();
      
      // Try to handle common formats manually first (more reliable than Date constructor)
      const formats = [
        { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: [1, 2, 3] }, // YYYY-MM-DD
        { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: [3, 1, 2] }, // MM/DD/YYYY
        { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: [3, 1, 2] }, // MM-DD-YYYY
        { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, order: [3, 2, 1] }  // DD.MM.YYYY (European format)
      ];
      
      for (let format of formats) {
        const match = trimmedValue.match(format.regex);
        if (match) {
          const year = parseInt(match[format.order[0]]);
          const month = parseInt(match[format.order[1]]);
          const day = parseInt(match[format.order[2]]);
          
          // Validate date components
          if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            // Use UTC to avoid timezone issues - creates date at exactly midnight UTC
            const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            
            // Verify the date components are correct
            if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
              return date;
            }
          }
        }
      }
      
      // Try direct parsing as fallback (but only for formats we haven't handled manually)
      if (!/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmedValue)) {
        let parsed = new Date(trimmedValue);
        if (!isNaN(parsed.getTime())) {
          // Check if we should preserve time components
          if (preserveTime && hasTimeComponents(trimmedValue)) {
            return parsed;
          } else {
            // Ensure we only have date component (no time)
            const dateOnly = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
            return dateOnly;
          }
        }
      }
    }
    
    return value; // Return original if can't parse
  } catch (error) {
    return value; // Return original on error
  }
}

// Handle Excel file merging and saving
ipcMain.handle('merge-and-save-excel', async (event, { filesData, commonLines, outputPath, dateColumnIndices = [], dateColumnsWithTime = [], columnNamesRow = 1 }) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Merged Data');
    
    let currentRow = 1;
    let totalDataRows = 0;
    
    // Check if ONLY the Y row (column headers) match across all files
    let headersMatch = true;
    let matchingFiles = 0;
    const fileDetails = [];
    
    // Get reference column headers from first file (Y row only)
    const yRowIndex = (columnNamesRow || 1) - 1; // Convert to 0-based index
    const referenceColumnHeaders = filesData[0].data[yRowIndex] ? 
      JSON.stringify(filesData[0].data[yRowIndex]) : '';
    
    // Check Y row (column headers) in all files including the first one
    filesData.forEach((fileData, fileIndex) => {
      let fileHeaderMatch = true;
      
      if (fileData.data[yRowIndex]) {
        const currentColumnHeaders = JSON.stringify(fileData.data[yRowIndex]);
        if (referenceColumnHeaders !== currentColumnHeaders) {
          fileHeaderMatch = false;
          headersMatch = false;
        }
      } else {
        fileHeaderMatch = false;
        headersMatch = false;
      }
      
      if (fileHeaderMatch) {
        matchingFiles++;
      }
      
      // Store individual file header match status for later use
      fileDetails.push({
        fileName: fileData.fileName,
        headerMatch: fileHeaderMatch,
        dataRows: 0 // Will be updated later
      });
    });
    
    // Add common header lines
    for (let i = 0; i < commonLines; i++) {
      if (filesData[0].data[i]) {
        const row = worksheet.getRow(currentRow);
        // Add source column header for first row
        if (i === 0) {
          row.getCell(1).value = 'Source File';
          filesData[0].data[i].forEach((cellValue, colIndex) => {
            const preserveTime = dateColumnsWithTime.includes(colIndex);
            const transformedValue = transformDateValue(cellValue, colIndex, dateColumnIndices, preserveTime);
            row.getCell(colIndex + 2).value = transformedValue;
            
            // Set date format for date columns
            if (dateColumnIndices.includes(colIndex) && transformedValue instanceof Date) {
              const cell = row.getCell(colIndex + 2);
              cell.numFmt = preserveTime ? 'yyyy-mm-dd hh:mm:ss' : 'yyyy-mm-dd';
              // Ensure the cell type is recognized as date
              cell.type = ExcelJS.ValueType.Date;
            }
          });
        } else {
          row.getCell(1).value = '';
          filesData[0].data[i].forEach((cellValue, colIndex) => {
            const preserveTime = dateColumnsWithTime.includes(colIndex);
            const transformedValue = transformDateValue(cellValue, colIndex, dateColumnIndices, preserveTime);
            row.getCell(colIndex + 2).value = transformedValue;
            
            // Set date format for date columns
            if (dateColumnIndices.includes(colIndex) && transformedValue instanceof Date) {
              const cell = row.getCell(colIndex + 2);
              cell.numFmt = preserveTime ? 'yyyy-mm-dd hh:mm:ss' : 'yyyy-mm-dd';
              // Ensure the cell type is recognized as date
              cell.type = ExcelJS.ValueType.Date;
            }
          });
        }
        currentRow++;
      }
    }
    
    // Track file name counts for duplicates
    const fileNameCounts = {};
    
    // Add data from each file
    filesData.forEach((fileData, index) => {
      let displayName = fileData.fileName;
      
      // Handle duplicate file names
      if (fileNameCounts[fileData.fileName]) {
        fileNameCounts[fileData.fileName]++;
        displayName = `${fileData.fileName}_${fileNameCounts[fileData.fileName]}`;
      } else {
        fileNameCounts[fileData.fileName] = 1;
      }
      
      let fileDataRows = 0;
      
      // Add data rows (skip common header lines)
      for (let i = commonLines; i < fileData.data.length; i++) {
        if (fileData.data[i] && fileData.data[i].length > 0) {
          const row = worksheet.getRow(currentRow);
          row.getCell(1).value = displayName;
          fileData.data[i].forEach((cellValue, colIndex) => {
            const preserveTime = dateColumnsWithTime.includes(colIndex);
            const transformedValue = transformDateValue(cellValue, colIndex, dateColumnIndices, preserveTime);
            row.getCell(colIndex + 2).value = transformedValue;
            
            // Set date format for date columns
            if (dateColumnIndices.includes(colIndex) && transformedValue instanceof Date) {
              const cell = row.getCell(colIndex + 2);
              cell.numFmt = preserveTime ? 'yyyy-mm-dd hh:mm:ss' : 'yyyy-mm-dd';
              // Ensure the cell type is recognized as date
              cell.type = ExcelJS.ValueType.Date;
            }
          });
          currentRow++;
          fileDataRows++;
          totalDataRows++;
        }
      }
      
      // Update the file details with the actual data row count and display name
      fileDetails[index].fileName = displayName;
      fileDetails[index].dataRows = fileDataRows;
    });
    
    // Set column widths, especially for date columns to prevent ########## display
    const maxColumns = Math.max(...filesData.map(file => 
      Math.max(...file.data.map(row => row ? row.length : 0))
    ));
    
    for (let colIndex = 1; colIndex <= maxColumns + 1; colIndex++) { // +1 for Source File column
      const column = worksheet.getColumn(colIndex);
      
      if (colIndex === 1) {
        // Source File column
        column.width = 20;
      } else {
        const dataColIndex = colIndex - 2; // Adjust for Source File column
        if (dateColumnIndices.includes(dataColIndex)) {
          // Date columns need more width to display dates properly
          const hasTime = dateColumnsWithTime.includes(dataColIndex);
          column.width = hasTime ? 20 : 12; // 20 for datetime, 12 for date only
        } else {
          // Regular columns
          column.width = 15;
        }
      }
    }
    
    // Save the file
    await workbook.xlsx.writeFile(outputPath);
    
    // Create summary
    const summary = {
      filesProcessed: filesData.length,
      totalDataRows,
      commonHeaderRows: commonLines,
      headersMatch,
      matchingFiles,
      fileDetails
    };
    
    return { success: true, outputPath, summary };
  } catch (error) {
    console.error('Error merging files:', error);
    return { success: false, error: error.message };
  }
});

// Handle saving file dialog
ipcMain.handle('save-file-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Excel Files', extensions: ['xlsx'] }
    ],
    defaultPath: 'merged-excel-data.xlsx'
  });
  
  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

// Handle opening file in default application
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Helper function to detect if a date value has time components
function hasTimeComponents(value) {
  if (!value) return false;
  
  // If it's a Date object, check if it has non-zero time
  if (value instanceof Date) {
    return value.getHours() !== 0 || value.getMinutes() !== 0 || value.getSeconds() !== 0;
  }
  
  // If it's a decimal number (Excel serial with time fraction)
  if (typeof value === 'number' && value % 1 !== 0) {
    return true;
  }
  
  // If it's a string, check for time patterns
  if (typeof value === 'string') {
    const timePatterns = [
      /\d{1,2}:\d{2}/, // HH:MM
      /\d{1,2}:\d{2}:\d{2}/, // HH:MM:SS
      /\d{1,2}:\d{2}\s*(AM|PM)/i, // 12-hour format
      /T\d{2}:\d{2}/, // ISO time separator
    ];
    
    return timePatterns.some(pattern => pattern.test(value.toString()));
  }
  
  return false;
}

// Helper function to detect if a value looks like a date
function looksLikeDate(value) {
  if (!value) return false;
  
  // If it's already a Date object
  if (value instanceof Date) return true;
  
  // If it's a number that could be an Excel serial date
  // Excel dates typically start from around 36526 (Jan 1, 2000) for modern dates
  // But we'll be more conservative and start from 30000 (around 1982)
  if (typeof value === 'number' && value >= 30000 && value < 100000) {
    return true;
  }
  
  // If it's a string, check common date patterns - ensure complete match with no extra characters
  if (typeof value === 'string') {
    const trimmedValue = value.toString().trim();
    const datePatterns = [
      /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY
      /^\d{1,2}\.\d{1,2}\.\d{4}$/, // DD.MM.YYYY (European format)
      /^\d{1,2}\/\d{1,2}\/\d{2}$/, // MM/DD/YY
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i, // Month names with complete format
      /^\d{1,2}[-\/](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\/]\d{4}$/i // DD-MMM-YYYY
    ];
    
    // Additional validation: if it matches a date pattern, validate the numbers
    for (let pattern of datePatterns) {
      if (pattern.test(trimmedValue)) {
        // For DD.MM.YYYY pattern, do additional validation
        if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmedValue)) {
          const parts = trimmedValue.split('.');
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          
          // Validate ranges
          if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return true;
          }
        } else {
          return true;
        }
      }
    }
    
    return false;
  }
  
  return false;
}

// Handle column names extraction
ipcMain.handle('get-column-names', async (event, { filesData, rowIndex, commonLines = 1 }) => {
  try {
    
    if (!Array.isArray(filesData) || filesData.length === 0) {
      return { success: false, error: 'No files data available' };
    }
    
    const parsedRowIndex = parseInt(rowIndex);
    const parsedCommonLines = parseInt(commonLines);
    
    if (isNaN(parsedRowIndex) || parsedRowIndex < 0) {
      return { success: false, error: 'Row index must be a valid number (0 or greater)' };
    }
    
    if (isNaN(parsedCommonLines) || parsedCommonLines < 1) {
      return { success: false, error: 'Common lines must be a valid number (1 or greater)' };
    }
    
    const firstFile = filesData[0];
    
    if (parsedRowIndex >= firstFile.data.length) {
      return { success: false, error: `Row index ${parsedRowIndex + 1} exceeds file data (${firstFile.data.length} rows)` };
    }
    
    const columnNames = firstFile.data[parsedRowIndex] || [];
    
    // Get data from the first row after the common header lines to auto-detect date columns
    // parsedCommonLines represents how many header rows there are (1-based), so first data row is at index parsedCommonLines (0-based)
    const dataRowIndex = parsedCommonLines; // First data row after all header lines
    let autoDetectedDateColumns = [];
    let dateColumnsWithTime = [];
    
    
    if (dataRowIndex < firstFile.data.length) {
      const dataRow = firstFile.data[dataRowIndex] || [];
      
      dataRow.forEach((value, index) => {
        if (looksLikeDate(value)) {
          autoDetectedDateColumns.push(index);
          
          // Check if this date column has time components
          if (hasTimeComponents(value)) {
            dateColumnsWithTime.push(index);
          }
        }
      });
    }
    
    
    return { 
      success: true, 
      columnNames: columnNames.map((name, index) => ({
        index,
        name: name ? name.toString().trim() : `Column ${index + 1}`
      })),
      autoDetectedDateColumns,
      dateColumnsWithTime
    };
  } catch (error) {
    console.error('Error extracting column names:', error);
    return { success: false, error: error.message };
  }
});

// Handle settings
ipcMain.handle('load-settings', async () => {
  return loadSettings();
});

ipcMain.handle('save-settings', async (event, settings) => {
  return saveSettings(settings);
});

// Helper function to transform date values (restored from proven working commit 42a9ca0)
function transformDateValue(value, columnIndex, dateColumnIndices, preserveTime = false) {
  // Only transform if this is one of the selected date columns and value exists
  if (!dateColumnIndices.includes(columnIndex) || !value || value === '') {
    return value;
  }
  
  try {
    
    // If it's already a Date object, return it
    if (value instanceof Date) {
      return value;
    }
    
    // If it's a number (Excel date serial), convert it
    if (typeof value === 'number' && value >= 30000 && value < 100000) {
      // Excel uses 1900-01-01 as day 1 (but treats 1900 as a leap year incorrectly)
      // JavaScript Date() uses 1970-01-01 as epoch
      // Excel serial 1 = 1900-01-01, Excel serial 2 = 1900-01-02, etc.
      // But Excel incorrectly thinks 1900 is a leap year, so we need to adjust
      
      let adjustedValue = value;
      // Adjust for Excel's leap year bug (if date is after Feb 28, 1900)
      if (value > 59) {
        adjustedValue = value - 1;
      }
      
      // Convert to JavaScript date using UTC to avoid timezone issues
      // Excel day 1 = Jan 1, 1900
      const excelEpochYear = 1900;
      const excelEpochMonth = 0; // January (0-based)
      const excelEpochDay = 1;
      
      // Calculate the target date
      const totalDays = adjustedValue - 1; // adjustedValue is 1-based, we need 0-based
      const targetDate = new Date(Date.UTC(excelEpochYear, excelEpochMonth, excelEpochDay + totalDays));
      
      // If the original value has decimal part (time) and we want to preserve it
      if (preserveTime && value % 1 !== 0) {
        // Add the time portion (fractional part represents time)
        const timeFraction = value % 1;
        const timeMs = timeFraction * 86400 * 1000;
        const dateWithTime = new Date(targetDate.getTime() + timeMs);
        return dateWithTime;
      } else {
        return targetDate;
      }
    }
    
    // If it's a string, try to parse it
    if (typeof value === 'string') {
      const trimmedValue = value.toString().trim();
      
      // Try to handle common formats manually first (more reliable than Date constructor)
      const formats = [
        { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: [1, 2, 3] }, // YYYY-MM-DD
        { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: [3, 1, 2] }, // MM/DD/YYYY
        { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: [3, 1, 2] }, // MM-DD-YYYY
        { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, order: [3, 2, 1] }  // DD.MM.YYYY (European format)
      ];
      
      for (let format of formats) {
        const match = trimmedValue.match(format.regex);
        if (match) {
          const year = parseInt(match[format.order[0]]);
          const month = parseInt(match[format.order[1]]);
          const day = parseInt(match[format.order[2]]);
          
          // Validate date components
          if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            // Use UTC to avoid timezone issues - creates date at exactly midnight UTC
            const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            
            // Verify the date components are correct
            if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
              return date;
            }
          }
        }
      }
      
      // Fallback to standard Date constructor
      const parsedDate = new Date(trimmedValue);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    return value;
  } catch (error) {
    console.error('Date transformation error:', error);
    return value; // Return original on error
  }
}

// Handle creating summary workbook with multiple worksheets
ipcMain.handle('create-summary-workbook', async (event, { outputPath, summaryData, anafDateColumns = [], anafDateColumnsWithTime = [] }) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Add each worksheet
    summaryData.worksheets.forEach((worksheetData, index) => {
      const worksheet = workbook.addWorksheet(worksheetData.name);
      const isAnafMergedData = worksheetData.name === 'ANAF Merged Data';
      
      // Add data to worksheet
      worksheetData.data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellRef = worksheet.getCell(rowIndex + 1, colIndex + 1);
          cellRef.value = cell;
          
          // Apply date transformation for ANAF Merged Data worksheet
          if (isAnafMergedData && rowIndex > 0) { // Skip header row
            // Column index in original data (subtract 1 for Source column)
            const originalColIndex = colIndex - 1;
            
            if (originalColIndex >= 0) {
              const preserveTime = anafDateColumnsWithTime.includes(originalColIndex);
              const transformedValue = transformDateValue(cell, originalColIndex, anafDateColumns, preserveTime);
              
              // If the value was transformed to a Date, update the cell
              if (transformedValue !== cell && transformedValue instanceof Date) {
                cellRef.value = transformedValue;
                cellRef.numFmt = preserveTime ? 'dd/mm/yyyy hh:mm:ss' : 'dd/mm/yyyy';
                cellRef.type = ExcelJS.ValueType.Date;
              }
            }
          }
          
          // Style header row
          if (rowIndex === 0) {
            cellRef.font = { bold: true };
            cellRef.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' }
            };
            cellRef.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
        });
      });
      
      // Set column widths with special handling for date columns
      worksheet.columns.forEach((column, colIndex) => {
        if (isAnafMergedData) {
          if (colIndex === 0) {
            // Source File column
            column.width = 20;
          } else {
            const dataColIndex = colIndex - 1; // Adjust for Source File column
            if (anafDateColumns.includes(dataColIndex)) {
              // Date columns need more width to display dates properly
              const hasTime = anafDateColumnsWithTime.includes(dataColIndex);
              column.width = hasTime ? 20 : 12; // 20 for datetime, 12 for date only
            } else {
              // Regular columns
              column.width = 15;
            }
          }
        } else {
          // Auto-fit for other worksheets
          let maxLength = 0;
          worksheetData.data.forEach(row => {
            if (row[colIndex] && row[colIndex].toString().length > maxLength) {
              maxLength = row[colIndex].toString().length;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });
      
      // Add conditional formatting for Relations Summary worksheet
      if (worksheetData.name === 'Relations Summary') {
        // Apply conditional formatting to the Difference column (column E, index 4)
        // Skip header row, apply to all data rows
        const lastRow = worksheetData.data.length;
        if (lastRow > 1) { // Only if there's data beyond the header
          for (let rowIndex = 2; rowIndex <= lastRow; rowIndex++) {
            // Format number columns C, D, E - show 2 decimals if decimal part exists, otherwise no decimals
            const contaSumCell = worksheet.getCell(rowIndex, 3);
            const anafSumCell = worksheet.getCell(rowIndex, 4);
            const diffCell = worksheet.getCell(rowIndex, 5);

            // Apply format based on whether value has decimals
            if (typeof contaSumCell.value === 'number') {
              contaSumCell.numFmt = (contaSumCell.value % 1 === 0) ? '0' : '0.00';
            }
            if (typeof anafSumCell.value === 'number') {
              anafSumCell.numFmt = (anafSumCell.value % 1 === 0) ? '0' : '0.00';
            }
            if (typeof diffCell.value === 'number') {
              diffCell.numFmt = (diffCell.value % 1 === 0) ? '0' : '0.00';
            }

            const differenceCell = worksheet.getCell(rowIndex, 5); // Column E (Difference)
            const cellValue = differenceCell.value;

            if (typeof cellValue === 'number') {
              if (cellValue >= -1 && cellValue <= 1) {
                // Light green for values between -1 and 1
                differenceCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFE8F5E8' } // Light green
                };
              } else {
                // Light red for values outside -1 to 1 range
                differenceCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFFEAEA' } // Light red
                };
              }
            }
          }
        }

        // Adjust column widths for numerical columns to fit content
        // Columns C (Conta Sum), D (ANAF Sum), E (Difference)
        [3, 4, 5].forEach(colNum => {
          let maxWidth = 10; // Minimum width
          worksheet.getColumn(colNum).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            if (rowNumber > 1 && typeof cell.value === 'number') { // Skip header
              // Calculate width based on formatted number
              const formattedValue = cell.value % 1 === 0 ? cell.value.toString() : cell.value.toFixed(2);
              const width = formattedValue.length + 2;
              if (width > maxWidth) maxWidth = width;
            }
          });
          worksheet.getColumn(colNum).width = Math.min(maxWidth, 20);
        });
      }

      // Add number formatting for Accounts Summary worksheet
      if (worksheetData.name === 'Accounts Summary') {
        const lastRow = worksheetData.data.length;
        if (lastRow > 1) {
          for (let rowIndex = 2; rowIndex <= lastRow; rowIndex++) {
            const sumCell = worksheet.getCell(rowIndex, 3);
            // Show 2 decimals if decimal part exists, otherwise no decimals
            if (typeof sumCell.value === 'number') {
              sumCell.numFmt = (sumCell.value % 1 === 0) ? '0' : '0.00';
            }
          }
        }

        // Adjust column width for Sum column (column C) to fit content
        let maxWidth = 10; // Minimum width
        worksheet.getColumn(3).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
          if (rowNumber > 1 && typeof cell.value === 'number') { // Skip header
            // Calculate width based on formatted number
            const formattedValue = cell.value % 1 === 0 ? cell.value.toString() : cell.value.toFixed(2);
            const width = formattedValue.length + 2;
            if (width > maxWidth) maxWidth = width;
          }
        });
        worksheet.getColumn(3).width = Math.min(maxWidth, 20);
      }
    });

    // Add Monthly Analysis worksheets if requested
    const monthlyAnalysisSums = {};
    if (summaryData.includeMonthlyAnalysis && summaryData.monthlyAnalysisParams) {
      const params = summaryData.monthlyAnalysisParams;

      // Helper function to convert column number to Excel column letter
      const getColumnLetter = (colNum) => {
        let letter = '';
        while (colNum > 0) {
          const remainder = (colNum - 1) % 26;
          letter = String.fromCharCode(65 + remainder) + letter;
          colNum = Math.floor((colNum - 1) / 26);
        }
        return letter;
      };

      // Process each account relation for monthly analysis
      for (const [contaAccount, anafAccounts] of Object.entries(params.accountMappings)) {
        const worksheetName = `Monthly_${contaAccount}`;
        const worksheet = workbook.addWorksheet(worksheetName);

        // Get effective date range for this specific conta account (same as Relations Summary)
        const accountDateRange = params.accountDateRanges?.[contaAccount] || params.dateInterval;
        const startDateObj = new Date(parseDDMMYYYY(accountDateRange.startDate) + 'T00:00:00');
        const endDateObj = new Date(parseDDMMYYYY(accountDateRange.endDate) + 'T23:59:59');
        const monthsInRange = getMonthsInRange(startDateObj, endDateObj);

        // Build headers
        const sourceRow = worksheet.getRow(1);
        worksheet.mergeCells('A1:B1');
        sourceRow.getCell(1).value = 'CONTA';
        worksheet.mergeCells('C1:D1');
        sourceRow.getCell(3).value = 'ANAF';
        sourceRow.getCell(5).value = 'CONTA';

        const anafStartCol = 6;
        const anafEndCol = 5 + anafAccounts.length;
        if (anafAccounts.length > 0) {
          const startColLetter = getColumnLetter(anafStartCol);
          const endColLetter = getColumnLetter(anafEndCol);
          worksheet.mergeCells(`${startColLetter}1:${endColLetter}1`);
          sourceRow.getCell(anafStartCol).value = 'ANAF';
        }

        const diffCol = anafEndCol + 1;
        sourceRow.getCell(diffCol).value = '';
        const sumOfDiffCol = diffCol + 1;
        sourceRow.getCell(sumOfDiffCol).value = 'Sum of Differences';

        // Style source row
        for (let i = 1; i <= sumOfDiffCol; i++) {
          const cell = sourceRow.getCell(i);
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0D0D0' } };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Row 2: Column headers
        const headerRow = worksheet.getRow(2);
        headerRow.getCell(1).value = 'Interval Start';
        headerRow.getCell(2).value = 'Interval End';
        headerRow.getCell(3).value = 'Interval Start';
        headerRow.getCell(4).value = 'Interval End';
        headerRow.getCell(5).value = contaAccount;

        let colIndex = 6;
        anafAccounts.forEach((anafAccount) => {
          headerRow.getCell(colIndex).value = anafAccount;
          colIndex++;
        });

        const differenceColIndex = colIndex;
        headerRow.getCell(differenceColIndex).value = 'Difference';
        colIndex++;
        const sumOfDifferencesColIndex = colIndex;

        // Style header row (excluding Sum of Differences column)
        for (let i = 1; i < sumOfDifferencesColIndex; i++) {
          const cell = headerRow.getCell(i);
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Style Sum of Differences column in row 2
        const sumHeaderCell = headerRow.getCell(sumOfDifferencesColIndex);
        sumHeaderCell.font = { bold: true };
        sumHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0D0D0' } };
        sumHeaderCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        sumHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };

        let rowIndex = 3;
        let firstNonZeroMonth = null;
        let firstNonZeroIndex = -1;
        let hasSeenJuneInAnaf = false;

        // Track total sums for this relation
        let totalContaSum = 0;
        let totalAnafSumByAccount = {};
        anafAccounts.forEach(acc => totalAnafSumByAccount[acc] = 0);

        // First pass: Find the first non-null (non-zero) conta value in the date interval
        // Check FULL months without end-of-year exclusions to find any data
        for (let i = 0; i < monthsInRange.length; i++) {
          const { year, month } = monthsInRange[i];
          const monthStart = `01/${month.toString().padStart(2, '0')}/${year}`;

          // Always check the full month in the first pass (including Dec 31st)
          const monthEndDay = new Date(year, month, 0).getDate();
          const monthEndStr = `${monthEndDay.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;

          const contaSum = calculateContaAccountSum(contaAccount, monthStart, monthEndStr, params.processedContaFiles, params.accountConfigs);

          if (contaSum !== 0) {
            firstNonZeroMonth = month;
            firstNonZeroIndex = i;
            break;
          }
        }

        // Process each month starting from the first non-zero value
        for (let i = firstNonZeroIndex; i < monthsInRange.length; i++) {
          if (i === -1) break; // No non-zero values found

          const monthInfo = monthsInRange[i];
          const { year, month } = monthInfo;
          const monthStart = `01/${month.toString().padStart(2, '0')}/${year}`;

          // If December and end-of-year transactions enabled, end on Dec 30 instead of Dec 31
          let monthEndDay = new Date(year, month, 0).getDate();
          let actualMonthEndDay = monthEndDay; // For calculation
          if (month === 12 && params.includeEndOfYearTransactions) {
            actualMonthEndDay = 30; // Exclude Dec 31 from calculation
          }
          const monthEndStr = `${actualMonthEndDay.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;

          const contaSum = calculateContaAccountSum(contaAccount, monthStart, monthEndStr, params.processedContaFiles, params.accountConfigs);

          // Accumulate conta sum for this relation
          totalContaSum += contaSum;

          const nextMonth = month === 12 ? 1 : month + 1;
          const nextYear = month === 12 ? year + 1 : year;
          const anafMonthStart = `01/${nextMonth.toString().padStart(2, '0')}/${nextYear}`;
          const anafMonthEndDate = new Date(nextYear, nextMonth, 0);
          const anafMonthEnd = `${anafMonthEndDate.getDate().toString().padStart(2, '0')}/${nextMonth.toString().padStart(2, '0')}/${nextYear}`;

          const anafStartDate = new Date(nextYear, nextMonth - 1, 1);
          const anafEndDate = anafMonthEndDate;

          const anafAccountSums = [];
          let totalAnafSum = 0;

          // Check if this is the first June in anaf and first conta month was before June
          const isFirstJuneInAnaf = (nextMonth === 6 && !hasSeenJuneInAnaf);
          const shouldIncludeJune25 = (firstNonZeroMonth !== null && firstNonZeroMonth < 6 && isFirstJuneInAnaf && params.includeEndOfYearTransactions);

          // Check if we need to exclude June 25th (when conta is May and end-of-year toggle is on, but not if we should include it)
          const isJuneWithEOY = (month === 5 && nextMonth === 6 && params.includeEndOfYearTransactions && !shouldIncludeJune25);

          // Track that we've seen June in anaf
          if (nextMonth === 6) {
            hasSeenJuneInAnaf = true;
          }

          // Always calculate ANAF sums regardless of conta sum
          for (const anafAccount of anafAccounts) {
            const config = getAnafAccountConfig(anafAccount, params.anafAccountConfigs);

            let accountSum = 0;
            if (isJuneWithEOY) {
              // Split June: 1-24 and 26-30 (exclude 25th)
              const june1to24Start = `01/06/${nextYear}`;
              const june1to24End = `24/06/${nextYear}`;
              const june26to30Start = `26/06/${nextYear}`;
              const june26to30End = `30/06/${nextYear}`;

              const sum1to24 = calculateAnafAccountSum(anafAccount, june1to24Start, june1to24End, params.anafFiles, params.anafAccountFiles, config, `[Monthly: ${contaAccount} May->June part1]`);
              const sum26to30 = calculateAnafAccountSum(anafAccount, june26to30Start, june26to30End, params.anafFiles, params.anafAccountFiles, config, `[Monthly: ${contaAccount} May->June part2]`);
              accountSum = sum1to24 + sum26to30;
            } else if (shouldIncludeJune25) {
              // For first June when first conta month < June: include full month with June 25th
              accountSum = calculateAnafAccountSum(anafAccount, anafMonthStart, anafMonthEnd, params.anafFiles, params.anafAccountFiles, config, `[Monthly: ${contaAccount} ${year}/${month} (incl. June 25)]`);
            } else {
              // Normal calculation for all other months
              accountSum = calculateAnafAccountSum(anafAccount, anafMonthStart, anafMonthEnd, params.anafFiles, params.anafAccountFiles, config, `[Monthly: ${contaAccount} ${year}/${month}]`);
            }

            anafAccountSums.push(accountSum);
            totalAnafSum += accountSum;

            // Accumulate anaf sum for this relation
            totalAnafSumByAccount[anafAccount] += accountSum;
          }

          // Add row to worksheet
          const dataRow = worksheet.getRow(rowIndex);

          // Create conta dates for display
          // Set time to noon to avoid timezone boundary issues
          const contaStartDisplay = new Date(year, month - 1, 1, 12, 0, 0);
          // Display should match what we calculated (Dec 30 if end-of-year enabled, otherwise full month)
          const contaEndDisplay = new Date(year, month - 1, actualMonthEndDay, 12, 0, 0);

          // Create ANAF dates for display (first to last day of next month)
          const anafMonthLastDay = new Date(nextYear, nextMonth, 0).getDate();
          const anafStartDisplay = new Date(nextYear, nextMonth - 1, 1, 12, 0, 0);
          const anafEndDisplay = new Date(nextYear, nextMonth - 1, anafMonthLastDay, 12, 0, 0);

          dataRow.getCell(1).value = contaStartDisplay;
          dataRow.getCell(2).value = contaEndDisplay;
          dataRow.getCell(3).value = anafStartDisplay;
          dataRow.getCell(4).value = anafEndDisplay;
          dataRow.getCell(5).value = contaSum;

          let currentColIndex = 6;
          anafAccountSums.forEach((sum) => {
            dataRow.getCell(currentColIndex).value = sum;
            currentColIndex++;
          });

          const diffValue = contaSum - totalAnafSum;
          dataRow.getCell(differenceColIndex).value = diffValue;

          const diffCell = dataRow.getCell(differenceColIndex);
          if (diffValue >= -2 && diffValue <= 2) {
            diffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
          } else {
            diffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
          }

          rowIndex++;

          // If this is December and end-of-year transactions enabled, add Dec 31 row immediately
          if (month === 12 && params.includeEndOfYearTransactions) {
            // Conta: Only December 31st
            const contaDec31Start = `31/12/${year}`;
            const contaDec31End = `31/12/${year}`;
            const contaDec31Sum = calculateContaAccountSum(contaAccount, contaDec31Start, contaDec31End, params.processedContaFiles, params.accountConfigs);

            // Accumulate Dec 31 conta sum
            totalContaSum += contaDec31Sum;

            // ANAF: Only June 25th of next year (even if outside interval)
            const june25NextYear = year + 1;
            const anafJune25Start = `25/06/${june25NextYear}`;
            const anafJune25End = `25/06/${june25NextYear}`;

            const anafEOYAccountSums = [];
            let totalAnafEOYSum = 0;

            for (const anafAccount of anafAccounts) {
              const config = getAnafAccountConfig(anafAccount, params.anafAccountConfigs);
              const accountSum = calculateAnafAccountSum(anafAccount, anafJune25Start, anafJune25End, params.anafFiles, params.anafAccountFiles, config, `[Monthly EOY: ${contaAccount} Dec31->June25]`);
              anafEOYAccountSums.push(accountSum);
              totalAnafEOYSum += accountSum;

              // Accumulate June 25 anaf sum
              totalAnafSumByAccount[anafAccount] += accountSum;
            }

            // Add end-of-year row
            const eoyDataRow = worksheet.getRow(rowIndex);

            // Display dates (same date for start and end)
            const contaDec31Display = new Date(year, 11, 31, 12, 0, 0); // Dec 31
            const anafJune25Display = new Date(june25NextYear, 5, 25, 12, 0, 0); // June 25

            eoyDataRow.getCell(1).value = contaDec31Display;
            eoyDataRow.getCell(2).value = contaDec31Display;
            eoyDataRow.getCell(3).value = anafJune25Display;
            eoyDataRow.getCell(4).value = anafJune25Display;
            eoyDataRow.getCell(5).value = contaDec31Sum;

            let eoyColIndex = 6;
            anafEOYAccountSums.forEach((sum) => {
              eoyDataRow.getCell(eoyColIndex).value = sum;
              eoyColIndex++;
            });

            const eoyDiffValue = contaDec31Sum - totalAnafEOYSum;
            eoyDataRow.getCell(differenceColIndex).value = eoyDiffValue;

            const eoyDiffCell = eoyDataRow.getCell(differenceColIndex);
            if (eoyDiffValue >= -2 && eoyDiffValue <= 2) {
              eoyDiffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
            } else {
              eoyDiffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
            }

            rowIndex++;
          }
        }

        // Add sum of differences formula to row 2
        const differenceColLetter = getColumnLetter(differenceColIndex);
        const sumCell = worksheet.getCell(2, sumOfDifferencesColIndex);
        sumCell.value = { formula: `SUM($${differenceColLetter}$3:$${differenceColLetter}$${rowIndex - 1})` };

        // Format columns
        const totalColumns = 5 + anafAccounts.length + 2;
        const columnWidths = [
          { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }
        ];
        anafAccounts.forEach(() => columnWidths.push({ width: 12 }));
        columnWidths.push({ width: 12 });
        columnWidths.push({ width: 20 });
        worksheet.columns = columnWidths;

        // Set date formatting
        for (let row = 3; row <= rowIndex - 1; row++) {
          [1, 2, 3, 4].forEach(col => {
            const cell = worksheet.getCell(row, col);
            if (cell.value instanceof Date) {
              cell.numFmt = 'dd/mm/yyyy';
              cell.type = ExcelJS.ValueType.Date;
            }
          });
        }

        // Format number columns to show 2 decimal places
        for (let row = 3; row <= rowIndex - 1; row++) {
          // Format conta column (column 5)
          worksheet.getCell(row, 5).numFmt = '0.00';

          // Format ANAF account columns (columns 6 to 6+anafAccounts.length-1)
          for (let col = 6; col < 6 + anafAccounts.length; col++) {
            worksheet.getCell(row, col).numFmt = '0.00';
          }

          // Format difference column
          worksheet.getCell(row, differenceColIndex).numFmt = '0.00';
        }

        // Format sum of differences cell in row 2
        worksheet.getCell(2, sumOfDifferencesColIndex).numFmt = '0.00';

        // Freeze panes
        worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

        // Add autofilter
        if (rowIndex > 3) {
          const lastColumn = getColumnLetter(differenceColIndex);
          worksheet.autoFilter = { from: 'A2', to: `${lastColumn}${rowIndex - 1}` };
        }

        // Store the totals for this relation
        monthlyAnalysisSums[contaAccount] = {
          contaSum: totalContaSum,
          anafSums: totalAnafSumByAccount,
          totalAnafSum: Object.values(totalAnafSumByAccount).reduce((a, b) => a + b, 0)
        };
      }
    }

    // Helper function to format numbers with exactly 2 decimals if decimal part exists
    const formatNumber = (value) => {
      if (typeof value !== 'number') return value;
      // Round to 2 decimals
      const rounded = Math.round(value * 100) / 100;
      // Check if it has decimals
      if (rounded % 1 === 0) {
        return rounded; // Return integer if no decimal part
      }
      return parseFloat(rounded.toFixed(2)); // Return with exactly 2 decimals
    };

    // Update Relations Summary and Accounts Summary with monthly analysis sums
    if (Object.keys(monthlyAnalysisSums).length > 0) {
      // Update Relations Summary worksheet
      const relationsSummarySheet = workbook.getWorksheet('Relations Summary');
      if (relationsSummarySheet) {
        // Find and update each relation's row
        relationsSummarySheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row

          const contaAccount = row.getCell(1).value; // Column A: Conta Account
          if (contaAccount && monthlyAnalysisSums[contaAccount]) {
            const monthlyData = monthlyAnalysisSums[contaAccount];

            const contaSumCell = row.getCell(3);
            const anafSumCell = row.getCell(4);
            const diffCell = row.getCell(5);

            contaSumCell.value = formatNumber(monthlyData.contaSum); // Column C: Conta Sum
            anafSumCell.value = formatNumber(monthlyData.totalAnafSum); // Column D: ANAF Sum
            diffCell.value = formatNumber(monthlyData.contaSum - monthlyData.totalAnafSum); // Column E: Difference

            // Apply number format based on whether value has decimals
            if (typeof contaSumCell.value === 'number') {
              contaSumCell.numFmt = (contaSumCell.value % 1 === 0) ? '0' : '0.00';
            }
            if (typeof anafSumCell.value === 'number') {
              anafSumCell.numFmt = (anafSumCell.value % 1 === 0) ? '0' : '0.00';
            }
            if (typeof diffCell.value === 'number') {
              diffCell.numFmt = (diffCell.value % 1 === 0) ? '0' : '0.00';
            }

            // Update conditional formatting for difference cell
            const differenceCell = row.getCell(5);
            const diffValue = differenceCell.value;
            if (typeof diffValue === 'number') {
              if (diffValue >= -1 && diffValue <= 1) {
                differenceCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFE8F5E8' }
                };
              } else {
                differenceCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFFEAEA' }
                };
              }
            }
          }
        });
      }

      // Update Accounts Summary worksheet
      const accountsSummarySheet = workbook.getWorksheet('Accounts Summary');
      if (accountsSummarySheet) {
        // Update conta account sums
        accountsSummarySheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row

          const account = row.getCell(1).value; // Column A: Account
          const accountType = row.getCell(2).value; // Column B: Type

          const sumCell = row.getCell(3);

          if (accountType === 'Conta' && monthlyAnalysisSums[account]) {
            sumCell.value = formatNumber(monthlyAnalysisSums[account].contaSum); // Column C: Sum

            // Apply number format based on whether value has decimals
            if (typeof sumCell.value === 'number') {
              sumCell.numFmt = (sumCell.value % 1 === 0) ? '0' : '0.00';
            }
          } else if (accountType === 'ANAF') {
            // Find which conta account this anaf account belongs to
            for (const [contaAccount, monthlyData] of Object.entries(monthlyAnalysisSums)) {
              if (monthlyData.anafSums && monthlyData.anafSums[account] !== undefined) {
                sumCell.value = formatNumber(monthlyData.anafSums[account]); // Column C: Sum

                // Apply number format based on whether value has decimals
                if (typeof sumCell.value === 'number') {
                  sumCell.numFmt = (sumCell.value % 1 === 0) ? '0' : '0.00';
                }
                break;
              }
            }
          }
        });
      }
    }

    // Save the workbook
    await workbook.xlsx.writeFile(outputPath);

    return {
      success: true,
      outputPath: outputPath,
      message: 'Summary workbook created successfully',
      monthlyAnalysisSums: monthlyAnalysisSums
    };
  } catch (error) {
    console.error('Error creating summary workbook:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle merging ANAF data without saving to disk (returns data for worksheet inclusion)
ipcMain.handle('merge-anaf-data', async (event, { filesData, commonLines, dateColumnIndices = [], dateColumnsWithTime = [], columnNamesRow = 1 }) => {
  try {
    const mergedData = [];
    let totalDataRows = 0;

    const yRowIndex = (columnNamesRow || 1) - 1; // Convert to 0-based index

    // Add common header lines from first file
    for (let i = 0; i < commonLines; i++) {
      if (filesData[0].data[i]) {
        const headerRow = ['Source', ...filesData[0].data[i]];
        mergedData.push(headerRow);
      }
    }

    // Add data from all files
    filesData.forEach((fileData, fileIndex) => {
      const fileName = fileData.fileName || `File ${fileIndex + 1}`;

      // Add data rows (skip common header lines)
      for (let rowIndex = commonLines; rowIndex < fileData.data.length; rowIndex++) {
        const row = fileData.data[rowIndex];
        if (row && row.length > 0) {
          // Filter out completely empty rows
          const nonEmptyValues = row.filter(cell => cell !== null && cell !== undefined && cell !== '');
          if (nonEmptyValues.length > 0) {
            const dataRow = [fileName, ...row];
            mergedData.push(dataRow);
            totalDataRows++;
          }
        }
      }
    });

    return {
      success: true,
      mergedData: mergedData,
      summary: {
        totalFiles: filesData.length,
        totalDataRows: totalDataRows,
        totalRows: mergedData.length
      }
    };
  } catch (error) {
    console.error('Error merging ANAF data:', error);
    return {
      success: false,
      error: error.message,
      mergedData: null
    };
  }
});

// Helper function to get month boundaries
function getMonthBoundaries(year, month) {
  const startDate = new Date(year, month - 1, 1); // First day of month
  const endDate = new Date(year, month, 0); // Last day of month
  return { startDate, endDate };
}

// Helper function to get all months in date range
function getMonthsInRange(startDate, endDate) {
  const months = [];
  const current = new Date(startDate);
  current.setDate(1); // Start from first day of month

  while (current <= endDate) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth() + 1 // 1-based month
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

// Helper function to filter transactions by date range
function filterTransactionsByDateRange(transactions, startDate, endDate, dateColumnIndex, excludeDecember31st = false) {
  return transactions.filter(transaction => {
    const dateValue = transaction[dateColumnIndex];
    if (!dateValue) return false;

    let transactionDate;
    if (dateValue instanceof Date) {
      transactionDate = dateValue;
    } else if (typeof dateValue === 'number') {
      transactionDate = transformDateValue(dateValue, dateColumnIndex, [dateColumnIndex]);
    } else if (typeof dateValue === 'string') {
      transactionDate = transformDateValue(dateValue, dateColumnIndex, [dateColumnIndex]);
    }

    if (!transactionDate || !(transactionDate instanceof Date)) {
      return false;
    }

    // Exclude December 31st transactions if requested
    if (excludeDecember31st &&
        transactionDate.getMonth() === 11 && // December (0-based)
        transactionDate.getDate() === 31) {
      return false;
    }

    return transactionDate >= startDate && transactionDate <= endDate;
  });
}

// Helper function to get December 31st transactions
function getDecember31stTransactions(transactions, year, dateColumnIndex) {
  return transactions.filter(transaction => {
    const dateValue = transaction[dateColumnIndex];
    if (!dateValue) return false;

    let transactionDate;
    if (dateValue instanceof Date) {
      transactionDate = dateValue;
    } else if (typeof dateValue === 'number') {
      transactionDate = transformDateValue(dateValue, dateColumnIndex, [dateColumnIndex]);
    } else if (typeof dateValue === 'string') {
      transactionDate = transformDateValue(dateValue, dateColumnIndex, [dateColumnIndex]);
    }

    if (!transactionDate || !(transactionDate instanceof Date)) {
      return false;
    }

    return transactionDate.getFullYear() === year &&
           transactionDate.getMonth() === 11 && // December (0-based)
           transactionDate.getDate() === 31;
  });
}

// Helper function to get June 25th transactions for following year
function getJune25thTransactions(transactions, year, dateColumnIndex) {
  return transactions.filter(transaction => {
    const dateValue = transaction[dateColumnIndex];
    if (!dateValue) return false;

    let transactionDate;
    if (dateValue instanceof Date) {
      transactionDate = dateValue;
    } else if (typeof dateValue === 'number') {
      transactionDate = transformDateValue(dateValue, dateColumnIndex, [dateColumnIndex]);
    } else if (typeof dateValue === 'string') {
      transactionDate = transformDateValue(dateValue, dateColumnIndex, [dateColumnIndex]);
    }

    if (!transactionDate || !(transactionDate instanceof Date)) {
      return false;
    }

    return transactionDate.getFullYear() === (year + 1) &&
           transactionDate.getMonth() === 5 && // June (0-based)
           transactionDate.getDate() === 25;
  });
}

// Helper function to parse DD/MM/YYYY format dates
function parseDDMMYYYY(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;

  let parts;

  // Handle DD.MM.YYYY format (dots)
  if (dateString.includes('.')) {
    parts = dateString.split('.');
  }
  // Handle DD/MM/YYYY format (slashes)
  else if (dateString.includes('/')) {
    parts = dateString.split('/');
  }
  else {
    return null;
  }

  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Helper function to calculate conta account sums for a specific date range (same logic as frontend)
function calculateContaAccountSum(account, startDate, endDate, processedContaFiles, accountConfigs) {
  if (!processedContaFiles.length) return 0;

  let sum = 0;
  const startISO = parseDDMMYYYY(startDate);
  const endISO = parseDDMMYYYY(endDate);
  const start = startISO ? new Date(startISO + 'T00:00:00') : null;
  const end = endISO ? new Date(endISO + 'T23:59:59') : null;

  // Get account configuration
  const config = accountConfigs[account] || {
    filterColumn: 'cont',
    filterValue: '',
    sumColumn: 'suma_c'
  };

  for (const file of processedContaFiles) {
    for (let i = 0; i < file.data.length; i++) {
      const row = file.data[i];

      // Apply filtering based on account configuration
      let rowMatches = false;
      let filterValue;

      if (config.filterColumn === 'cont') {
        filterValue = row[3]; // cont column at index 3
      } else if (config.filterColumn === 'data') {
        filterValue = row[0]; // data column
      } else if (config.filterColumn === 'explicatie') {
        filterValue = row[2]; // explicatie column
      } else if (config.filterColumn === 'ndp') {
        filterValue = row[1]; // ndp column
      } else {
        filterValue = row[3]; // default to cont
      }

      // Check if the row matches the filter criteria
      if (config.filterColumn === 'cont') {
        if (filterValue === account) {
          rowMatches = true;
        } else if (file.accountNumber) {
          rowMatches = (file.accountNumber === account) ||
                      (account.startsWith(file.accountNumber + '.'));
        }
      } else {
        const targetFilterValue = config.filterValue || '';
        rowMatches = filterValue && filterValue.toString().includes(targetFilterValue);
      }

      if (rowMatches) {
        // Parse the date from the row
        const rowDateValue = row[0]; // data column
        let rowDate = null;

        if (rowDateValue) {
          if (rowDateValue instanceof Date) {
            rowDate = rowDateValue;
          } else if (typeof rowDateValue === 'number') {
            rowDate = new Date((rowDateValue - 25569) * 86400 * 1000);
          } else {
            rowDate = new Date(rowDateValue);
          }

          if (isNaN(rowDate.getTime())) {
            continue;
          }
        }

        // Check date range
        if (rowDate) {
          if (start && rowDate < start) continue;
          if (end && rowDate > end) continue;
        }

        // Apply sum rules based on account configuration
        let columnIndex;
        if (config.sumColumn === 'suma_c') {
          columnIndex = 6; // suma_c at index 6
        } else if (config.sumColumn === 'suma_d') {
          columnIndex = 5; // suma_d at index 5
        } else if (config.sumColumn === 'sold') {
          columnIndex = 7; // sold at index 7
        } else {
          columnIndex = 6; // Default to suma_c
        }

        const value = parseFloat(row[columnIndex]) || 0;
        sum += value;
      }
    }
  }

  return sum;
}

// Helper function to calculate ANAF account sums for a specific date range (same logic as frontend)
function calculateAnafAccountSum(account, startDate, endDate, anafFiles, anafAccountFiles, config = {}, debugContext = '') {
  const { filterColumn = 'CTG_SUME', filterValue = '', sumColumn = 'SUMA_PLATA', subtractConfig } = config;
  let sum = 0;
  let subtractSum = 0;

  const startISO = parseDDMMYYYY(startDate);
  const endISO = parseDDMMYYYY(endDate);
  const start = startISO ? new Date(startISO + 'T00:00:00') : null;
  const end = endISO ? new Date(endISO + 'T23:59:59') : null;

  // Get assigned files for this account, fallback to all files if none assigned
  const assignedFileIds = anafAccountFiles[account] || [];

  const filesToProcess = assignedFileIds.length > 0
    ? anafFiles.filter(file => assignedFileIds.includes(file.filePath || file.name))
    : anafFiles.filter(file => {
        const fileAccount = extractAccountFromFilename(file.filePath || file.name || '');

        // Exact match
        if (fileAccount === account) return true;

        // Handle sub-accounts (e.g., 446.CV -> 446)
        if (account.includes('.') && account.startsWith(fileAccount + '.')) return true;

        // Special cases for 1/4423 and 1/4424
        if ((account === '1/4423' || account === '1/4424') && fileAccount === '1') return true;

        // Handle common ANAF account patterns
        // Account 33 might be in a file like imp_411.xls or imp_416.xls for similar accounts
        if (account === '33') {
          // Try common related accounts for 33
          if (['411', '412', '416', '421', '422', '423'].includes(fileAccount)) {
            return true;
          }
        }

        return false;
      });

  filesToProcess.forEach((file) => {
    if (file.data && Array.isArray(file.data)) {
      file.data.forEach((row, index) => {
        // Skip company info row (0) and column header row (1)
        if (index === 0 || index === 1) {
          return;
        }

        // Get values from row
        const ctgSumeValue = row[6]; // CTG_SUME column
        const atributPlValue = row[12]; // ATRIBUT_PL column
        const imeCodeValue = row[0]; // IME_COD_IMPOZIT column
        const denumireValue = row[1]; // DENUMIRE_IMPOZIT column
        const sumaPlataValue = parseFloat(row[8]) || 0; // SUMA_PLATA column
        const incasariValue = parseFloat(row[13]) || 0; // INCASARI column
        const sumaNEValue = parseFloat(row[9]) || 0; // SUMA_NEACHITATA column
        const rambursariValue = parseFloat(row[14]) || 0; // RAMBURSARI column

        // Date filtering using SCADENTA and TERM_PLATA columns
        let rowDate = null;

        // First check SCADENTA column (index 4)
        const scadentaDate = row[4];
        if (scadentaDate && scadentaDate.trim() !== '') {
          const scadentaISO = parseDDMMYYYY(scadentaDate);
          if (scadentaISO) {
            rowDate = new Date(scadentaISO + 'T12:00:00');
          }
        }

        // If SCADENTA is null or unparseable, fall back to TERM_PLATA column (index 5)
        if (!rowDate) {
          const termPlataDate = row[5];
          if (termPlataDate && termPlataDate.trim() !== '') {
            const termISO = parseDDMMYYYY(termPlataDate);
            if (termISO) {
              rowDate = new Date(termISO + 'T12:00:00');
            }
          }
        }

        // If both SCADENTA and TERM_PLATA are null or unparseable, skip the row
        if (!rowDate) {
          return; // Skip rows with no valid date
        }

        // Apply interval filtering after selecting date source
        if ((start && rowDate < start) || (end && rowDate > end)) {
          return; // Skip rows outside the date interval
        }

        // Apply filter based on selected filter column
        if (filterValue) {
          let matchesFilter = false;
          switch (filterColumn) {
            case 'CTG_SUME':
              matchesFilter = ctgSumeValue === filterValue;
              break;
            case 'ATRIBUT_PL':
              matchesFilter = atributPlValue === filterValue;
              break;
            case 'IME_COD_IMPOZIT':
              matchesFilter = imeCodeValue === filterValue;
              break;
            case 'DENUMIRE_IMPOZIT':
              matchesFilter = denumireValue === filterValue;
              break;
            default:
              matchesFilter = true;
          }
          if (!matchesFilter) {
            return; // Skip rows that don't match the filter
          }
        }

        // Add to sum based on selected sum column
        let valueToAdd = 0;

        switch (sumColumn) {
          case 'SUMA_PLATA':
            valueToAdd = sumaPlataValue;
            break;
          case 'INCASARI':
            valueToAdd = incasariValue;
            break;
          case 'SUMA_NEACHITATA':
            valueToAdd = sumaNEValue;
            break;
          case 'RAMBURSARI':
            valueToAdd = rambursariValue;
            break;
          default:
            valueToAdd = sumaPlataValue;
        }

        sum += valueToAdd;
      });
    }
  });

  // Calculate subtraction if configured
  if (subtractConfig && subtractConfig.filterValue) {
    filesToProcess.forEach((file) => {
      if (file.data && Array.isArray(file.data)) {
        file.data.forEach((row, index) => {
          // Skip company info row (0) and column header row (1)
          if (index === 0 || index === 1) return;

          // Get values from row
          const ctgSumeValue = row[6]; // CTG_SUME column
          const atributPlValue = row[12]; // ATRIBUT_PL column
          const imeCodeValue = row[0]; // IME_COD_IMPOZIT column
          const denumireValue = row[1]; // DENUMIRE_IMPOZIT column
          const sumaPlataValue = parseFloat(row[8]) || 0; // SUMA_PLATA column
          const incasariValue = parseFloat(row[13]) || 0; // INCASARI column
          const sumaNEValue = parseFloat(row[9]) || 0; // SUMA_NEACHITATA column
          const rambursariValue = parseFloat(row[14]) || 0; // RAMBURSARI column

          // Date filtering using SCADENTA and TERM_PLATA columns - same as main calculation
          let rowDate = null;

          // First check SCADENTA column (index 4)
          const scadentaDate = row[4];
          if (scadentaDate && scadentaDate.trim() !== '') {
            const scadentaISO = parseDDMMYYYY(scadentaDate);
            if (scadentaISO) {
              rowDate = new Date(scadentaISO + 'T12:00:00');
            }
          }

          // If SCADENTA is null or unparseable, fall back to TERM_PLATA column (index 5)
          if (!rowDate) {
            const termPlataDate = row[5];
            if (termPlataDate && termPlataDate.trim() !== '') {
              const termISO = parseDDMMYYYY(termPlataDate);
              if (termISO) {
                rowDate = new Date(termISO + 'T12:00:00');
              }
            }
          }

          // If both SCADENTA and TERM_PLATA are null or unparseable, skip the row
          if (!rowDate) {
            return; // Skip rows with no valid date
          }

          // Apply interval filtering after selecting date source
          if ((start && rowDate < start) || (end && rowDate > end)) {
            return; // Skip rows outside the date interval
          }

          // Apply subtraction filter based on selected filter column
          let matchesSubtractFilter = false;
          switch (subtractConfig.filterColumn) {
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
              matchesSubtractFilter = false;
          }

          if (matchesSubtractFilter) {
            // Add to subtract sum based on selected sum column
            let valueToSubtract = 0;

            switch (subtractConfig.sumColumn) {
              case 'SUMA_PLATA':
                valueToSubtract = sumaPlataValue;
                break;
              case 'INCASARI':
                valueToSubtract = incasariValue;
                break;
              case 'SUMA_NEACHITATA':
                valueToSubtract = sumaNEValue;
                break;
              case 'RAMBURSARI':
                valueToSubtract = rambursariValue;
                break;
              default:
                valueToSubtract = sumaPlataValue;
            }

            subtractSum += valueToSubtract;
          }
        });
      }
    });
  }

  const finalSum = sum - subtractSum;

  return finalSum;
}

// Helper function to extract account from filename
function extractAccountFromFilename(filename) {
  if (!filename) return '';

  const cleanFilename = filename.replace(/\.(xlsx?|csv)$/i, '').toLowerCase();

  // Look for patterns like "fise_436" or "cont_444" etc.
  const patterns = [
    /fise[_\s]*(\d+)/,
    /cont[_\s]*(\d+)/,
    /account[_\s]*(\d+)/,
    /acc[_\s]*(\d+)/,
    /(\d+)$/,  // Number at end
    /^(\d+)/   // Number at start
  ];

  for (const pattern of patterns) {
    const match = cleanFilename.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return '';
}

// Helper function to get ANAF account config (same logic as frontend)
function getAnafAccountConfig(account, anafAccountConfigs) {
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

  // For accounts that need subtraction, add it back
  if (account !== '1/4423' && account !== '1/4424') {
    defaultConfig.subtractConfig = {
      filterColumn: 'ATRIBUT_PL',
      filterValue: 'DIM',
      sumColumn: 'INCASARI'
    };
  }

  // Special configs for accounts 1/4423 and 1/4424 (no subtraction)
  if (account === '1/4423' || account === '1/4424') {
    defaultConfig = {
      filterColumn: 'CTG_SUME',
      filterValue: account,
      sumColumn: 'SUMA_PLATA'
      // No subtractConfig
    };
  }

  return defaultConfig;
}

// Handle creating enhanced account relation analysis with monthly sums (using same logic as frontend)
ipcMain.handle('create-enhanced-relation-analysis', async (event, {
  contaData,
  anafData,
  accountMappings,
  dateInterval,
  processedContaFiles,
  anafFiles,
  accountConfigs = {},
  anafAccountFiles = {},
  anafAccountConfigs = {},
  outputPath
}) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // Convert date interval to proper format
    const startDate = dateInterval.startDate;
    const endDate = dateInterval.endDate;

    // Parse start and end dates
    const startDateObj = new Date(parseDDMMYYYY(startDate) + 'T00:00:00');
    const endDateObj = new Date(parseDDMMYYYY(endDate) + 'T23:59:59');

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error('Invalid date interval provided');
    }

    // Get all months in the date range
    const monthsInRange = getMonthsInRange(startDateObj, endDateObj);

    // Process each account relation
    for (const [contaAccount, anafAccounts] of Object.entries(accountMappings)) {
      const worksheetName = `Relation_${contaAccount}`;
      const worksheet = workbook.addWorksheet(worksheetName);

      // Helper function to convert column number to Excel column letter
      const getColumnLetter = (colNum) => {
        let letter = '';
        while (colNum > 0) {
          const remainder = (colNum - 1) % 26;
          letter = String.fromCharCode(65 + remainder) + letter;
          colNum = Math.floor((colNum - 1) / 26);
        }
        return letter;
      };

      // Row 1: Source type labels (CONTA/ANAF) with merged cells
      const sourceRow = worksheet.getRow(1);

      // Merge cells A1:B1 for "CONTA"
      worksheet.mergeCells('A1:B1');
      sourceRow.getCell(1).value = 'CONTA';

      // Merge cells C1:D1 for "ANAF"
      worksheet.mergeCells('C1:D1');
      sourceRow.getCell(3).value = 'ANAF';

      // Cell E1 for "CONTA"
      sourceRow.getCell(5).value = 'CONTA';

      // Merge cells for ANAF accounts section
      const anafStartCol = 6;
      const anafEndCol = 5 + anafAccounts.length;
      if (anafAccounts.length > 0) {
        const startColLetter = getColumnLetter(anafStartCol);
        const endColLetter = getColumnLetter(anafEndCol);
        worksheet.mergeCells(`${startColLetter}1:${endColLetter}1`);
        sourceRow.getCell(anafStartCol).value = 'ANAF';
      }

      // Difference column - leave empty
      const diffCol = anafEndCol + 1;
      sourceRow.getCell(diffCol).value = '';

      // Sum of Differences column - add label in row 1
      const sumOfDiffCol = diffCol + 1;
      sourceRow.getCell(sumOfDiffCol).value = 'Sum of Differences';

      // Style source row
      for (let i = 1; i <= sumOfDiffCol; i++) {
        const cell = sourceRow.getCell(i);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD0D0D0' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Row 2: Column headers
      const headerRow = worksheet.getRow(2);
      headerRow.getCell(1).value = 'Interval Start';
      headerRow.getCell(2).value = 'Interval End';
      headerRow.getCell(3).value = 'Interval Start';
      headerRow.getCell(4).value = 'Interval End';
      headerRow.getCell(5).value = contaAccount;

      colIndex = 6;
      anafAccounts.forEach((anafAccount) => {
        headerRow.getCell(colIndex).value = anafAccount;
        colIndex++;
      });

      headerRow.getCell(colIndex).value = 'Difference';
      const differenceColIndex = colIndex;
      colIndex++;

      // Sum of Differences column - will have the sum value in row 2
      const sumOfDifferencesColIndex = colIndex;
      // Don't set value yet, will be set after processing all months

      // Style header row (excluding Sum of Differences column)
      for (let i = 1; i < colIndex; i++) {
        const cell = headerRow.getCell(i);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Style Sum of Differences column in row 2 (same as row 1)
      const sumHeaderCell = headerRow.getCell(sumOfDifferencesColIndex);
      sumHeaderCell.font = { bold: true };
      sumHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD0D0D0' }
      };
      sumHeaderCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      sumHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };

      let rowIndex = 3;

      // Process each month
      for (const monthInfo of monthsInRange) {
        const { year, month } = monthInfo;

        // Create month start and end dates in DD/MM/YYYY format
        const monthStart = `01/${month.toString().padStart(2, '0')}/${year}`;
        const monthEnd = new Date(year, month, 0); // Last day of month
        const monthEndStr = `${monthEnd.getDate().toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;

        // Calculate conta sum for the full month (including all days)
        const contaSum = calculateContaAccountSum(contaAccount, monthStart, monthEndStr, processedContaFiles, accountConfigs);

        // ANAF period is next month (offset by one month into the future)
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;

        const anafMonthStart = `01/${nextMonth.toString().padStart(2, '0')}/${nextYear}`;
        const anafMonthEndDate = new Date(nextYear, nextMonth, 0); // Last day of next month
        const anafMonthEnd = `${anafMonthEndDate.getDate().toString().padStart(2, '0')}/${nextMonth.toString().padStart(2, '0')}/${nextYear}`;

        const anafStartDate = new Date(nextYear, nextMonth - 1, 1);
        const anafEndDate = anafMonthEndDate;

        // Calculate ANAF sum for each related account in the next month
        const anafAccountSums = [];
        let totalAnafSum = 0;
        for (const anafAccount of anafAccounts) {
          const config = getAnafAccountConfig(anafAccount, anafAccountConfigs);
          const accountSum = calculateAnafAccountSum(anafAccount, anafMonthStart, anafMonthEnd, anafFiles, anafAccountFiles, config);
          anafAccountSums.push(accountSum);
          totalAnafSum += accountSum;
        }

        // Add row to worksheet
        if (contaSum !== 0 || totalAnafSum !== 0) {
          const dataRow = worksheet.getRow(rowIndex);
          dataRow.getCell(1).value = new Date(year, month - 1, 1);
          dataRow.getCell(2).value = new Date(year, month, 0);
          dataRow.getCell(3).value = anafStartDate;
          dataRow.getCell(4).value = anafEndDate;
          dataRow.getCell(5).value = contaSum;

          // Add individual ANAF account sums
          let currentColIndex = 6;
          anafAccountSums.forEach((sum) => {
            dataRow.getCell(currentColIndex).value = sum;
            currentColIndex++;
          });

          // Add difference column
          const differenceColIndex = currentColIndex;
          dataRow.getCell(differenceColIndex).value = contaSum - totalAnafSum;

          // Apply conditional formatting to difference column
          const diffCell = dataRow.getCell(differenceColIndex);
          const diffValue = contaSum - totalAnafSum;
          if (diffValue >= -2 && diffValue <= 2) {
            diffCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF90EE90' } // Green
            };
          } else {
            diffCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFF6B6B' } // Red
            };
          }

          rowIndex++;
        }
      }

      // Add sum of differences formula to row 2
      const differenceColLetter = getColumnLetter(differenceColIndex);
      const sumCell = worksheet.getCell(2, sumOfDifferencesColIndex);
      sumCell.value = { formula: `SUM($${differenceColLetter}$3:$${differenceColLetter}$${rowIndex - 1})` };
      // Style is already applied above

      // Format date columns and add filters
      const totalColumns = 5 + anafAccounts.length + 2; // 4 date cols + 1 conta + N anaf + 1 diff + 1 sum of diff
      const columnWidths = [
        { width: 15, style: { numFmt: 'dd/mm/yyyy' } }, // Conta Interval Start
        { width: 15, style: { numFmt: 'dd/mm/yyyy' } }, // Conta Interval End
        { width: 15, style: { numFmt: 'dd/mm/yyyy' } }, // ANAF Interval Start
        { width: 15, style: { numFmt: 'dd/mm/yyyy' } }, // ANAF Interval End
        { width: 12 } // Conta account
      ];

      // Add widths for ANAF accounts
      anafAccounts.forEach(() => {
        columnWidths.push({ width: 12 });
      });

      // Add width for Difference column
      columnWidths.push({ width: 12 });

      // Add width for Sum of Differences column
      columnWidths.push({ width: 20 });

      worksheet.columns = columnWidths;

      // Set date formatting for date columns
      for (let row = 3; row <= rowIndex - 1; row++) {
        [1, 2, 3, 4].forEach(col => {
          const cell = worksheet.getCell(row, col);
          if (cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy';
            cell.type = ExcelJS.ValueType.Date;
          }
        });
      }

      // Freeze the first 2 rows
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 2 }
      ];

      // Add autofilter starting from row 2 (exclude Sum of Differences column)
      if (rowIndex > 3) {
        const lastColumn = getColumnLetter(differenceColIndex); // Only up to Difference column
        worksheet.autoFilter = {
          from: 'A2',
          to: `${lastColumn}${rowIndex - 1}`
        };
      }
    }

    // Save the workbook
    await workbook.xlsx.writeFile(outputPath);

    return {
      success: true,
      outputPath: outputPath,
      message: 'Enhanced relation analysis workbook created successfully'
    };
  } catch (error) {
    console.error('Error creating enhanced relation analysis:', error);
    return {
      success: false,
      error: error.message
    };
  }
});