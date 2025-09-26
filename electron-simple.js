const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const isDev = process.env.NODE_ENV === 'development';

// Simple file-based storage
const storePath = path.join(os.homedir(), '.sanguivia', 'user-data.json');

// Ensure directory exists
const storeDir = path.dirname(storePath);
if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, { recursive: true });
}

const store = {
  get: (key, defaultValue) => {
    try {
      if (fs.existsSync(storePath)) {
        const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        return data[key] || defaultValue;
      }
      return defaultValue;
    } catch (error) {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      let data = {};
      if (fs.existsSync(storePath)) {
        data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      }
      data[key] = value;
      fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  },
  delete: (key) => {
    try {
      if (fs.existsSync(storePath)) {
        const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        delete data[key];
        fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  }
};

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'build', 'preload.js'),
      webSecurity: false
    },
    icon: path.join(__dirname, '../public/icon.png')
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'build', 'index.html')}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
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

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Secure data storage handlers
ipcMain.handle('store-user-data', async (event, data) => {
  try {
    store.set('userData', data);
    return { success: true };
  } catch (error) {
    console.error('Error storing user data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-user-data', async () => {
  try {
    const userData = store.get('userData', null);
    return { success: true, data: userData };
  } catch (error) {
    console.error('Error getting user data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-user-data', async () => {
  try {
    store.delete('userData');
    return { success: true };
  } catch (error) {
    console.error('Error clearing user data:', error);
    return { success: false, error: error.message };
  }
});

// Menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('menu-new');
        }
      },
      {
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          mainWindow.webContents.send('menu-open');
        }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
