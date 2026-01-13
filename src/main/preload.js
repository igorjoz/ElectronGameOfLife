const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFile: (data, defaultName) => 
    ipcRenderer.invoke('save-file', { data, defaultName }),
  
  loadFile: () => 
    ipcRenderer.invoke('load-file'),
  
  saveImage: (dataUrl, defaultName) => 
    ipcRenderer.invoke('save-image', { dataUrl, defaultName }),
  
  saveImageSequence: (frames, baseName) => 
    ipcRenderer.invoke('save-image-sequence', { frames, baseName }),
});
