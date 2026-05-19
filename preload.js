const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getTabs: () => ipcRenderer.invoke('get-tabs'),
  getActiveTabId: () => ipcRenderer.invoke('get-active-tab-id'),
  saveTabContent: (tabId, content) => ipcRenderer.invoke('save-tab-content', { tabId, content }),
  saveActiveTabId: (tabId) => ipcRenderer.invoke('save-active-tab-id', tabId),
  addTab: () => ipcRenderer.invoke('add-tab'),
  removeTab: (tabId) => ipcRenderer.invoke('remove-tab', tabId),
  onWindowShown: (callback) => ipcRenderer.on('window-shown', callback)
});
