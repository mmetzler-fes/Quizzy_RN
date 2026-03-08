const { app, BrowserWindow } = require('electron');
const serve = require('electron-serve').default;

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
app.whenReady().then(createWindow);

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
