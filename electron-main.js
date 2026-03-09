const { app, BrowserWindow, session } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const setupApi = require('./server-api');

// --- LINUX SANDBOX FIX (SELF-RELAUNCH) ---
if (process.platform === 'linux' && !process.argv.includes('--no-sandbox')) {
  const args = [...process.argv.slice(1), '--no-sandbox', '--disable-setuid-sandbox'];
  spawn(process.execPath, args, { stdio: 'inherit', detached: true }).unref();
  app.exit(0);
}

// Backup switches
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
