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
      }
    });
    
    // Save the workbook
    await workbook.xlsx.writeFile(outputPath);
    
    return {
      success: true,
      outputPath: outputPath,
      message: 'Summary workbook created successfully'
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

  const parts = dateString.split('/');
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
function calculateAnafAccountSum(account, startDate, endDate, anafFiles, anafAccountFiles, config = {}) {
  const { filterColumn = 'CTG_SUME', filterValue = account, sumColumn = 'SUMA_PLATA' } = config;
  let sum = 0;

  console.log(`Calculating ANAF sum for account: ${account}, dates: ${startDate} - ${endDate}`);
  console.log(`Config: filterColumn=${filterColumn}, filterValue=${filterValue}, sumColumn=${sumColumn}`);

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
        if (fileAccount === account) return true;
        if (account.startsWith(fileAccount + '.')) return true;
        if ((account === '1/4423' || account === '1/4424') && fileAccount === '1') return true;
        return false;
      });

  console.log(`Found ${filesToProcess.length} files to process for account ${account}`);

  filesToProcess.forEach((file) => {
    const fileName = file.filePath || file.name || 'Unknown';
    console.log(`Processing file: ${fileName} for account ${account}`);

    if (file.data && Array.isArray(file.data)) {
      let matchingRows = 0;
      let processedRows = 0;

      file.data.forEach((row, index) => {
        // Skip company info row (0) and column header row (1)
        if (index === 0 || index === 1) return;

        processedRows++;

        // Get values from row
        const termPlataValue = row[5]; // TERM_PLATA column
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
        matchingRows++;
      });

      console.log(`File ${fileName}: processed ${processedRows} rows, found ${matchingRows} matching rows for account ${account}`);
    }
  });

  console.log(`Total sum for account ${account}: ${sum}`);
  return sum;
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
  outputPath
}) => {
  try {
    console.log('Enhanced analysis inputs:');
    console.log('Account mappings:', accountMappings);
    console.log('Date interval:', dateInterval);
    console.log('Processed conta files count:', processedContaFiles?.length || 0);
    console.log('ANAF files count:', anafFiles?.length || 0);
    console.log('Account configs:', Object.keys(accountConfigs));
    console.log('ANAF account files:', Object.keys(anafAccountFiles));
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

      // Set up headers
      const headers = [
        'Conta Month Start',
        'Conta Month End',
        'ANAF Period Start',
        'ANAF Period End',
        'Conta Sum',
        'ANAF Sum',
        'Difference'
      ];

      const headerRow = worksheet.getRow(1);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
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
      });

      let rowIndex = 2;

      // Process each month
      for (const monthInfo of monthsInRange) {
        const { year, month } = monthInfo;

        // Create month start and end dates in DD/MM/YYYY format
        const monthStart = `01/${month.toString().padStart(2, '0')}/${year}`;
        const monthEnd = new Date(year, month, 0); // Last day of month
        const monthEndStr = `${monthEnd.getDate().toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;

        let contaSum = 0;
        let anafSum = 0;
        let anafStartDate, anafEndDate;

        if (month === 12) {
          // December: handle regular December (1-30) and December 31st separately
          const regularDecemberEnd = `30/${month.toString().padStart(2, '0')}/${year}`;

          // Calculate conta sum for December 1-30
          contaSum = calculateContaAccountSum(contaAccount, monthStart, regularDecemberEnd, processedContaFiles, accountConfigs);

          // For ANAF, get sum from June 25th of next year
          const june25NextYear = `25/06/${year + 1}`;
          anafStartDate = new Date(year + 1, 5, 25); // June 25th next year
          anafEndDate = new Date(year + 1, 5, 25); // Same day

          // Calculate ANAF sum for all related accounts on June 25th next year
          anafSum = 0;
          for (const anafAccount of anafAccounts) {
            const config = { filterColumn: 'CTG_SUME', filterValue: anafAccount, sumColumn: 'SUMA_PLATA' };
            anafSum += calculateAnafAccountSum(anafAccount, june25NextYear, june25NextYear, anafFiles, anafAccountFiles, config);
          }

          // Add separate row for December 31st if there are transactions
          const dec31Sum = calculateContaAccountSum(contaAccount, `31/12/${year}`, `31/12/${year}`, processedContaFiles, accountConfigs);

          if (dec31Sum !== 0) {
            const dec31Row = worksheet.getRow(rowIndex);
            dec31Row.getCell(1).value = new Date(year, 11, 31); // Dec 31st
            dec31Row.getCell(2).value = new Date(year, 11, 31); // Dec 31st
            dec31Row.getCell(3).value = anafStartDate;
            dec31Row.getCell(4).value = anafEndDate;
            dec31Row.getCell(5).value = dec31Sum;
            dec31Row.getCell(6).value = anafSum;
            dec31Row.getCell(7).value = dec31Sum - anafSum;

            // Apply conditional formatting
            const diffCell = dec31Row.getCell(7);
            const diffValue = dec31Sum - anafSum;
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
        } else {
          // Regular month processing
          contaSum = calculateContaAccountSum(contaAccount, monthStart, monthEndStr, processedContaFiles, accountConfigs);

          // ANAF period is next month
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextYear = month === 12 ? year + 1 : year;

          const anafMonthStart = `01/${nextMonth.toString().padStart(2, '0')}/${nextYear}`;
          const anafMonthEndDate = new Date(nextYear, nextMonth, 0); // Last day of next month
          const anafMonthEnd = `${anafMonthEndDate.getDate().toString().padStart(2, '0')}/${nextMonth.toString().padStart(2, '0')}/${nextYear}`;

          anafStartDate = new Date(nextYear, nextMonth - 1, 1);
          anafEndDate = anafMonthEndDate;

          // Calculate ANAF sum for all related accounts in the next month
          anafSum = 0;
          for (const anafAccount of anafAccounts) {
            const config = { filterColumn: 'CTG_SUME', filterValue: anafAccount, sumColumn: 'SUMA_PLATA' };
            anafSum += calculateAnafAccountSum(anafAccount, anafMonthStart, anafMonthEnd, anafFiles, anafAccountFiles, config);
          }
        }

        // Add row to worksheet for regular month (or December 1-30)
        if (contaSum !== 0 || anafSum !== 0) {
          const dataRow = worksheet.getRow(rowIndex);
          dataRow.getCell(1).value = new Date(year, month - 1, 1);
          dataRow.getCell(2).value = new Date(year, month, 0);
          dataRow.getCell(3).value = anafStartDate;
          dataRow.getCell(4).value = anafEndDate;
          dataRow.getCell(5).value = contaSum;
          dataRow.getCell(6).value = anafSum;
          dataRow.getCell(7).value = contaSum - anafSum;

          // Apply conditional formatting to difference column
          const diffCell = dataRow.getCell(7);
          const diffValue = contaSum - anafSum;
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

      // Format date columns and add filters
      worksheet.columns = [
        { width: 15, style: { numFmt: 'dd/mm/yyyy' } }, // Conta Month Start
        { width: 15, style: { numFmt: 'dd/mm/yyyy' } }, // Conta Month End
        { width: 15, style: { numFmt: 'dd/mm/yyyy' } }, // ANAF Period Start
        { width: 15, style: { numFmt: 'dd/mm/yyyy' } }, // ANAF Period End
        { width: 12 }, // Conta Sum
        { width: 12 }, // ANAF Sum
        { width: 12 }  // Difference
      ];

      // Set date formatting for date columns
      for (let row = 2; row <= rowIndex - 1; row++) {
        [1, 2, 3, 4].forEach(col => {
          const cell = worksheet.getCell(row, col);
          if (cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy';
            cell.type = ExcelJS.ValueType.Date;
          }
        });
      }

      // Add autofilter
      if (rowIndex > 2) {
        worksheet.autoFilter = {
          from: 'A1',
          to: `G${rowIndex - 1}`
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