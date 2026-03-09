const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');

// Fix for Linux AppImage: disable the Chromium sandbox when the SUID helper
// is not available (common on many distributions without root access).
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 800,
    minWidth: 320,
    minHeight: 600,
    title: 'Quizzy',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Apply a Content Security Policy for all responses in this session.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'",
        ],
      },
    });
  });

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(
      `[Quizzy] Web build not found at "${indexPath}".\n` +
        'Run "npm run electron:web" first to build the web app.'
    );
    app.quit();
    return;
  }

  win.loadFile(indexPath);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
