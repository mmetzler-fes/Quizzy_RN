const express = require('express');
const cors = require('cors');
const path = require('path');
const setupApi = require('./server-api');
const os = require('os');
const fs = require('fs');

const serverApp = express();
serverApp.use(cors());
serverApp.use(express.json());

// Verwende denselben Pfad wie die Electron-App (falls vorhanden)
const userDataPath = path.join(os.homedir(), '.config', 'quizzy-rn');

if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// API Routes installieren
setupApi(serverApp, userDataPath);

// Statische Dateien der gebauten Web-App (dist) ausliefern
const distPath = path.join(__dirname, 'dist');
serverApp.use(express.static(distPath));

// Fallback für SPA-Routing
serverApp.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

serverApp.listen(3000, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('🧠 Quizzy API-Server läuft auf http://localhost:3000');
  console.log('📂 Datenbank-Pfad: ' + path.join(userDataPath, 'quizzy_database.json'));
  console.log('====================================================');
  console.log('Du kannst dich nun in der App (Expo) anmelden.');
});
