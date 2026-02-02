const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');

// On remplace electron-is-dev par une vérification native d'Electron
const isDev = !app.isPackaged;

let mainWindow;
let serverProcess;

function startServer() {
    const serverPath = path.join(__dirname, 'server/index.js');
    const serverDir = path.join(__dirname, 'server');

    console.log("🚀 Lancement du serveur depuis :", serverPath);

    serverProcess = fork(serverPath, [], {
        silent: true, // On capture nous-mêmes pour rediriger vers la console Electron
        cwd: serverDir, // TRÈS IMPORTANT : définit le dossier de travail sur /server
        env: { ...process.env, PORT: 5000 }
    });

    serverProcess.stdout.on('data', (data) => {
        console.log(`[SERVEUR] ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`[SERVEUR-ERREUR] ${data.toString().trim()}`);
    });

    serverProcess.on('error', (err) => {
        console.error('❌ Erreur critique serveur:', err);
    });

    serverProcess.on('exit', (code) => {
        console.log(`⚠️ Serveur arrêté (Code: ${code}). Tentative de relance dans 2s...`);
        if (code !== 0) {
            setTimeout(startServer, 2000);
        }
    });
}

function createWindow() {
    startServer();

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "DownAnime Desktop",
        icon: path.join(__dirname, 'build/icon.png'), // Important pour l'exe
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
            webSecurity: false, // Autoriser le chargement des fichiers locaux
        },
        backgroundColor: '#0f172a',
        autoHideMenuBar: true,
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        // En prod, on cherche index.html dans le dossier web_build (ex-dist)
        mainWindow.loadFile(path.join(__dirname, 'client/web_build/index.html'));
    }

    // On laisse les DevTools ouverts pour comprendre le problème
    mainWindow.webContents.openDevTools();

    // --- LE RADAR SECRET ---
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const url = details.url;
        if ((url.includes('.m3u8') || url.includes('.mp4')) &&
            !url.includes('pixel') && !url.includes('.gif') && !url.includes('.png') &&
            !url.includes('analytics') && !url.includes('vast') && !url.includes('segment')) {

            const pageUrl = details.referrer || details.initiator || "";
            console.log("🕵️ RADAR : Flux détecté sur", pageUrl);

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('video-detected', {
                    url: url,
                    title: "Vidéo détectée",
                    referer: pageUrl // TRÈS IMPORTANT pour VoirAnime
                });
            }
        }
        callback({ cancel: false });
    });

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // Tuer le serveur quand on ferme l'app
    if (serverProcess) {
        serverProcess.kill();
    }
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
