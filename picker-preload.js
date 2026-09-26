const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pickerAPI', {
  onSources: (callback) => ipcRenderer.on('sources', (_event, sources) => callback(sources)),
  select: (id) => ipcRenderer.send('picker-select', id),
  cancel: () => ipcRenderer.send('picker-cancel'),
});