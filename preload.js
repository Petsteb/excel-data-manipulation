const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectExcelFiles: () => ipcRenderer.invoke('select-excel-files'),
  readExcelFiles: (filePaths) => ipcRenderer.invoke('read-excel-files', filePaths),
  mergeAndSaveExcel: (data) => ipcRenderer.invoke('merge-and-save-excel', data),
  saveFileDialog: () => ipcRenderer.invoke('save-file-dialog'),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getColumnNames: (data) => ipcRenderer.invoke('get-column-names', data)
});