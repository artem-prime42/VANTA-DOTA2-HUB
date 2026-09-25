const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vanta', {
  call: (channel, payload) => ipcRenderer.invoke(channel, payload),
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
    close: () => ipcRenderer.invoke('window:close'),
  },
  onDownloadProgress: (listener) => ipcRenderer.on('download:progress', (_event, data) => listener(data)),
  onUpdateEvent: (listener) => ipcRenderer.on('update:event', (_event, data) => listener(data)),
});