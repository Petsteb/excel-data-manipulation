const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectExcelFiles: () => ipcRenderer.invoke('select-excel-files'),
  readExcelFiles: (filePaths) => ipcRenderer.invoke('read-excel-files', filePaths),
  mergeAndSaveExcel: (data) => ipcRenderer.invoke('merge-and-save-excel', data),
  mergeAnafData: (data) => ipcRenderer.invoke('merge-anaf-data', data),
  createSummaryWorkbook: (data) => ipcRenderer.invoke('create-summary-workbook', data),
  saveFileDialog: () => ipcRenderer.invoke('save-file-dialog'),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getColumnNames: (data) => ipcRenderer.invoke('get-column-names', data),
  createEnhancedRelationAnalysis: (data) => ipcRenderer.invoke('create-enhanced-relation-analysis', data),
  // New config system APIs
  loadPanelsConfig: () => ipcRenderer.invoke('load-panels-config'),
  savePanelsConfig: (config) => ipcRenderer.invoke('save-panels-config', config),
  loadAppConfig: () => ipcRenderer.invoke('load-app-config'),
  saveAppConfig: (config) => ipcRenderer.invoke('save-app-config', config),
  loadAccountsConfig: () => ipcRenderer.invoke('load-accounts-config'),
  saveAccountsConfig: (config) => ipcRenderer.invoke('save-accounts-config', config)
});