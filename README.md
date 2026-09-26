# Discord Chat App

Ein inoffizieller Desktop-Client für [Discord](https://discord.com), gebaut mit [Electron](https://www.electronjs.org/). Die App lädt `discord.com/app` in einem eingebetteten `<webview>` und ergänzt native Fenstersteuerung (Minimieren/Maximieren/Schließen) sowie funktionierendes Screen-Sharing in Calls.

> ⚠️ **Hinweis:** Dies ist ein inoffizielles, privates Projekt und steht in keiner Verbindung zu Discord Inc. Nicht öffentlich unter dem Namen "Discord" verteilen.

## Features

- Rahmenloses Fenster mit eigener Titelleiste (Minimieren, Maximieren, Schließen)
- Discord läuft in einem `<webview>` mit eigenem User-Agent
- Ausblenden einzelner Discord-UI-Elemente (z. B. Posteingang, Hilfe-Links) per CSS-Injection
- Screen-Sharing in Calls funktioniert (inkl. eigenem Auswahlfenster für Bildschirm/Anwendungsfenster, getrennt in zwei Tabs)
- Systemton-Freigabe unter Windows (WASAPI-Loopback)
- DevTools sind deaktiviert (Hauptfenster, Webview und Picker-Fenster)
- Fertig konfiguriert für den Build zu einer Windows-`.exe` via `electron-builder`

## Voraussetzungen

- [Node.js](https://nodejs.org/) (LTS-Version empfohlen)
- npm (wird mit Node.js installiert)
- Windows 10/11 für den `.exe`-Build

## Installation

```bash
git clone <repo-url>
cd discord-chat-app
npm install
```

## Starten (Entwicklung)

```bash
npm start
```

## Als Windows-`.exe` bauen

```bash
npm run dist
```

Der fertige Installer liegt danach im Ordner `dist/` (z. B. `Discord Chat App Setup 1.0.0.exe`).

### Bekanntes Problem: "Cannot create symbolic link"

`electron-builder` lädt beim ersten Build ein Hilfspaket (`winCodeSign`) herunter, das auch macOS-Dateien mit symbolischen Links enthält. Windows verweigert das Erstellen dieser Links ohne besondere Rechte. Abhilfe:

1. **Entwicklermodus aktivieren** (empfohlen): Einstellungen → Datenschutz & Sicherheit → Für Entwickler → Entwicklermodus aktivieren, danach ggf. neu starten.
2. Falls bereits ein fehlgeschlagener Download im Cache liegt, diesen vorher löschen:
   ```bash
   rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
   ```
3. `npm run dist` erneut ausführen.

Alternativ: Terminal einmalig als Administrator ausführen.

## Projektstruktur

```
.
├── main.js              # Electron Hauptprozess (Fenster, Menü, Screen-Share-Handler)
├── preload.js           # Preload-Skript für das Hauptfenster (Fenstersteuerung)
├── index.html           # UI des Hauptfensters inkl. <webview> für Discord
├── picker.html           # Auswahlfenster für Bildschirm-/App-Freigabe
├── picker-preload.js     # Preload-Skript für das Picker-Fenster
├── logo.png              # App-Icon (mind. 256×256 px, quadratisch)
└── package.json          # Projekt- und Build-Konfiguration (electron-builder)
```

## Icon anpassen

Einfach `logo.png` (mind. 256×256 px, quadratisch) im Projekt-Root ersetzen. `electron-builder` erzeugt daraus beim Build automatisch die passende `.ico`.

## Lizenz

Privates Projekt – keine Lizenz für die Veröffentlichung vorgesehen.
