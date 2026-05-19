const { app, nativeImage, ipcMain, Menu } = require('electron');
const { menubar } = require('menubar');
const Store = require('electron-store');
const path = require('path');

const TAB_COLORS = [
  '#ff6b35', '#f7c948', '#48bb78', '#38b2ac',
  '#4299e1', '#9f7aea', '#ed64a6', '#e53e3e',
  '#dd6b20', '#d69e2e', '#319795', '#3182ce',
  '#805ad5', '#d53f8c', '#718096'
];

const store = new Store({
  defaults: {
    tabs: [
      { id: '1', color: '#ff6b35', content: '' },
      { id: '2', color: '#f7c948', content: '' },
      { id: '3', color: '#48bb78', content: '' },
      { id: '4', color: '#38b2ac', content: '' },
      { id: '5', color: '#4299e1', content: '' },
      { id: '6', color: '#9f7aea', content: '' },
      { id: '7', color: '#ed64a6', content: '' }
    ],
    activeTabId: '1'
  }
});

function createTrayIcon() {
  const iconPath = path.join(__dirname, 'assets', 'iconTemplate.png');
  try {
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      icon.setTemplateImage(true);
      return icon;
    }
  } catch (e) {
    // fallback below
  }

  const size = 22;
  const canvas = Buffer.alloc(size * size * 4, 0);
  const cx = 11, cy = 11, r = 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        const idx = (y * size + x) * 4;
        canvas[idx] = 0; canvas[idx + 1] = 0; canvas[idx + 2] = 0; canvas[idx + 3] = 255;
      }
    }
  }
  const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });
  icon.setTemplateImage(true);
  return icon;
}

const mb = menubar({
  index: `file://${path.join(__dirname, 'renderer', 'index.html')}`,
  icon: createTrayIcon(),
  preloadWindow: true,
  showDockIcon: false,
  browserWindow: {
    width: 440,
    height: 420,
    backgroundColor: '#1a1a2e',
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  }
});

mb.on('ready', () => {
  if (app.dock) app.dock.hide();

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Quit MenuDot', click: () => app.quit() }
  ]);

  mb.tray.on('right-click', () => {
    mb.tray.popUpContextMenu(contextMenu);
  });
});

mb.on('after-show', () => {
  if (mb.window) {
    mb.window.webContents.send('window-shown');
  }
});

// Flush pending note from renderer before quit
app.on('before-quit', async (e) => {
  if (mb.window && !mb.window.isDestroyed()) {
    try {
      const pending = await mb.window.webContents.executeJavaScript(
        'window.__getPendingNote ? window.__getPendingNote() : null'
      );
      if (pending && pending.tabId) {
        const tabs = store.get('tabs');
        const tab = tabs.find(t => t.id === pending.tabId);
        if (tab) {
          tab.content = pending.content;
          store.set('tabs', tabs);
        }
        store.set('activeTabId', pending.tabId);
      }
    } catch (err) {
      // Window already closed
    }
  }
});

// IPC handlers
ipcMain.handle('get-tabs', () => {
  return store.get('tabs');
});

ipcMain.handle('get-active-tab-id', () => {
  return store.get('activeTabId');
});

ipcMain.handle('save-tab-content', (_event, { tabId, content }) => {
  const tabs = store.get('tabs');
  const tab = tabs.find(t => t.id === tabId);
  if (tab) {
    tab.content = content;
    store.set('tabs', tabs);
  }
});

ipcMain.handle('save-active-tab-id', (_event, tabId) => {
  store.set('activeTabId', tabId);
});

ipcMain.handle('add-tab', () => {
  const tabs = store.get('tabs');
  const usedColors = new Set(tabs.map(t => t.color));
  const nextColor = TAB_COLORS.find(c => !usedColors.has(c)) || TAB_COLORS[tabs.length % TAB_COLORS.length];
  const newTab = {
    id: Date.now().toString(),
    color: nextColor,
    content: ''
  };
  tabs.push(newTab);
  store.set('tabs', tabs);
  return newTab;
});

ipcMain.handle('remove-tab', (_event, tabId) => {
  let tabs = store.get('tabs');
  if (tabs.length <= 1) return null; // Don't remove last tab
  const idx = tabs.findIndex(t => t.id === tabId);
  if (idx === -1) return null;
  tabs.splice(idx, 1);
  store.set('tabs', tabs);
  // Return new active tab (previous or first)
  const newActiveIdx = Math.min(idx, tabs.length - 1);
  store.set('activeTabId', tabs[newActiveIdx].id);
  return { tabs, activeTabId: tabs[newActiveIdx].id };
});
