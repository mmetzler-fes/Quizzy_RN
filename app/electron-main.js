const { app, BrowserWindow } = require('electron');
const serve = require('electron-serve').default;
const express = require('express');
const path = require('path');

// Provide the path to the web build output folder ('dist')
const loadURL = serve({ directory: 'dist' });

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		title: "Quizzy App",
		// Make sure we have decent defaults for web content
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		}
	});

	// Load the web build
	loadURL(mainWindow);

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

// When Electron has finished initialization, create window
app.whenReady().then(() => {
	createWindow();

	// Start local server for external access (Students)
	try {
		const serverApp = express();
		const isPackaged = __dirname.includes('app.asar');
		const distPath = isPackaged
			? path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'dist')
			: path.join(__dirname, 'dist');

		serverApp.use(express.static(distPath));

		// Fallback for SPA routing - using .use() to avoid Express 5 path-to-regexp issues with '*'
		serverApp.use((req, res) => {
			res.sendFile(path.join(distPath, 'index.html'));
		});

		serverApp.listen(3000, '0.0.0.0', () => {
			console.log('Local Server running on port 3000 (0.0.0.0)');
		});
	} catch (err) {
		console.error('Failed to start local web server:', err);
	}
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// macOS typically leaves apps open until Cmd+Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// on macOS, re-create the window when dock icon is clicked
	if (mainWindow === null) {
		createWindow();
	}
});
