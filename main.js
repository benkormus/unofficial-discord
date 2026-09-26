const { app, BrowserWindow, ipcMain, Menu, desktopCapturer } = require('electron');
const path = require('path');

// Standardmenü entfernen (enthält u.a. "Entwicklertools umschalten")
Menu.setApplicationMenu(null);

let pickerWindow = null;

// Öffnet ein kleines Auswahlfenster, in dem der Nutzer Bildschirm/Fenster wählt
function openSourcePicker(sources, parentWindow) {
  return new Promise((resolve) => {
    pickerWindow = new BrowserWindow({
      width: 640,
      height: 460,
      parent: parentWindow,
      modal: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      frame: false,
      title: 'Bildschirm freigeben',
      backgroundColor: '#1e1f22',
      webPreferences: {
        preload: path.join(__dirname, 'picker-preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    pickerWindow.setMenuBarVisibility(false);
    pickerWindow.loadFile('picker.html');

    pickerWindow.webContents.on('devtools-opened', () => {
      pickerWindow.webContents.closeDevTools();
    });
    pickerWindow.webContents.on('before-input-event', (event, input) => {
      const key = input.key.toLowerCase();
      const blockCombo =
        key === 'f12' ||
        ((input.control || input.meta) && input.shift && ['i', 'j', 'c'].includes(key));
      if (blockCombo) {
        event.preventDefault();
      }
    });

    pickerWindow.webContents.once('did-finish-load', () => {
      pickerWindow.webContents.send(
        'sources',
        sources.map((s) => ({
          id: s.id,
          name: s.name,
          thumbnail: s.thumbnail.toDataURL(),
          type: s.id.startsWith('screen:') ? 'screen' : 'window',
        }))
      );
    });

    const finish = (chosenId) => {
      ipcMain.removeListener('picker-select', onSelect);
      ipcMain.removeListener('picker-cancel', onCancel);
      if (pickerWindow) {
        const w = pickerWindow;
        pickerWindow = null;
        w.removeAllListeners('closed');
        w.close();
      }
      resolve(sources.find((s) => s.id === chosenId) || null);
    };

    const onSelect = (_event, id) => finish(id);
    const onCancel = () => finish(null);

    ipcMain.once('picker-select', onSelect);
    ipcMain.once('picker-cancel', onCancel);
    pickerWindow.once('closed', () => finish(null));
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Entfernt den Standard-Rahmen
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // WICHTIG: Erlaubt das <webview>-Tag für discord.com
    },
  });

  mainWindow.loadFile('index.html');

  // DevTools für das Hauptfenster komplett blockieren
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools();
  });

  // Tastenkombinationen abfangen (F12, Strg+Shift+I/J/C, Cmd+Alt+I auf Mac)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    const blockCombo =
      key === 'f12' ||
      ((input.control || input.meta) && input.shift && ['i', 'j', 'c'].includes(key));
    if (blockCombo) {
      event.preventDefault();
    }
  });

  // DevTools auch für den <webview> (Discord) blockieren
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    webContents.on('devtools-opened', () => {
      webContents.closeDevTools();
    });
    webContents.on('before-input-event', (event, input) => {
      const key = input.key.toLowerCase();
      const blockCombo =
        key === 'f12' ||
        ((input.control || input.meta) && input.shift && ['i', 'j', 'c'].includes(key));
      if (blockCombo) {
        event.preventDefault();
      }
    });

    // ---- Bildschirmfreigabe (Screen Share) für Discord im webview ----
    const guestSession = webContents.session;

    // Mikrofon/Kamera/Display-Capture-Anfragen von Discord erlauben
    guestSession.setPermissionRequestHandler((_wc, permission, callback) => {
      const allowed = ['media', 'display-capture', 'notifications'];
      callback(allowed.includes(permission));
    });
    if (guestSession.setPermissionCheckHandler) {
      guestSession.setPermissionCheckHandler((_wc, permission) => {
        const allowed = ['media', 'display-capture', 'notifications'];
        return allowed.includes(permission);
      });
    }

    // Wird aufgerufen, sobald Discord im Call auf "Bildschirm freigeben" klickt
    guestSession.setDisplayMediaRequestHandler(
      async (request, callback) => {
        try {
          const sources = await desktopCapturer.getSources({
            types: ['screen', 'window'],
            thumbnailSize: { width: 300, height: 200 },
            fetchWindowIcons: true,
          });

          if (!sources.length) {
            callback({});
            return;
          }

          const chosen = await openSourcePicker(sources, mainWindow);

          if (!chosen) {
            callback({}); // Nutzer hat abgebrochen
            return;
          }

          // Systemton nur unter Windows via WASAPI-Loopback mitschneiden
          if (process.platform === 'win32') {
            callback({ video: chosen, audio: 'loopback' });
          } else {
            callback({ video: chosen });
          }
        } catch (err) {
          console.error('Bildschirmfreigabe fehlgeschlagen:', err);
          callback({});
        }
      },
      { useSystemPicker: true } // nutzt ab macOS 15 den nativen Picker; sonst wird der Handler oben verwendet
    );
  });

  // Fenster-Steuerung
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow.close());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});