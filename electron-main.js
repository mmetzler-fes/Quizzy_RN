const { spawn } = require('child_process');
const path = require('path');

// --- LINUX SANDBOX FIX (MUST BE AT THE VERY TOP) ---
if (process.platform === 'linux') {
  process.env.ELECTRON_DISABLE_SANDBOX = '1';

  if (!process.argv.includes('--no-sandbox')) {
    // If running as AppImage, use the APPIMAGE env var for the relaunch
    const executable = process.env.APPIMAGE || process.execPath;
    const args = [...process.argv.slice(1), '--no-sandbox', '--disable-setuid-sandbox'];

    spawn(executable, args, {
      stdio: 'inherit',
      detached: true,
      env: { ...process.env, ALREADY_RELAUNCHED: '1' }
    }).unref();
    process.exit(0);
  }
}

const { app, BrowserWindow, session } = require('electron');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const setupApi = require('./server-api');

// Backup switches in case relaunch is skipped
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-setuid-sandbox');
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Quizzy App",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.loadURL('http://localhost:3000/');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  try {
    const serverApp = express();
    serverApp.use(cors());
    serverApp.use(express.json());

    // Database in user data path
    setupApi(serverApp, app.getPath('userData'));

    const distPath = path.join(__dirname, 'dist');
    serverApp.use(express.static(distPath));

    // Fallback for SPA routing
    serverApp.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });

    serverApp.listen(3000, '0.0.0.0', () => {
      console.log('Local Server running on port 3000');
      createWindow();
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
