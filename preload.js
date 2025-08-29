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
  
  // Storage methods
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  saveState: (state) => ipcRenderer.invoke('save-state', state),
  loadState: () => ipcRenderer.invoke('load-state'),
  clearState: () => ipcRenderer.invoke('clear-state')
});