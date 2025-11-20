import fs from 'fs/promises';
import path from 'path';
import { PluginProject, ExportConfig } from '@shared/types';

/**
 * Enhanced Standalone App Export
 * Creates branded, customizable standalone applications
 */

export interface StandaloneBranding {
  appName: string;
  companyName: string;
  icon?: string; // Path to icon file
  splashScreen?: string; // Path to splash screen
  aboutText?: string;
  websiteUrl?: string;
  supportEmail?: string;
  licenseText?: string;
  backgroundColor?: string;
  accentColor?: string;
  windowTitle?: string;
  showMenuBar?: boolean;
  allowResize?: boolean;
  fullscreen?: boolean;
  alwaysOnTop?: boolean;
}

export interface StandaloneConfig {
  project: PluginProject;
  exportConfig: ExportConfig;
  branding: StandaloneBranding;
  platform: 'windows' | 'macos' | 'linux' | 'all';
  includePresets?: boolean;
  includeDocumentation?: boolean;
  autoUpdate?: boolean;
  analytics?: boolean;
}

export async function exportEnhancedStandalone(
  config: StandaloneConfig,
  outputDir: string
): Promise<{ outputPath: string; platforms: string[] }> {
  const platforms: string[] = [];

  await fs.mkdir(outputDir, { recursive: true });

  // Generate Electron app structure
  await generateElectronApp(config, outputDir);

  // Generate platform-specific builds
  if (config.platform === 'all' || config.platform === 'windows') {
    await generateWindowsConfig(config, outputDir);
    platforms.push('Windows');
  }

  if (config.platform === 'all' || config.platform === 'macos') {
    await generateMacOSConfig(config, outputDir);
    platforms.push('macOS');
  }

  if (config.platform === 'all' || config.platform === 'linux') {
    await generateLinuxConfig(config, outputDir);
    platforms.push('Linux');
  }

  // Generate build scripts
  await generateBuildScripts(config, outputDir);

  return { outputPath: outputDir, platforms };
}

async function generateElectronApp(config: StandaloneConfig, outputDir: string): Promise<void> {
  const { project, branding } = config;

  // Create package.json
  const packageJson = generateStandalonePackageJSON(config);
  await fs.writeFile(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf-8'
  );

  // Create main process file
  const mainProcess = generateMainProcess(config);
  await fs.writeFile(path.join(outputDir, 'main.js'), mainProcess, 'utf-8');

  // Create preload script
  const preload = generatePreloadScript(config);
  await fs.writeFile(path.join(outputDir, 'preload.js'), preload, 'utf-8');

  // Create renderer HTML
  const html = generateRendererHTML(config);
  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf-8');

  // Create renderer CSS
  const css = generateRendererCSS(config);
  await fs.writeFile(path.join(outputDir, 'styles.css'), css, 'utf-8');

  // Create renderer JavaScript
  const js = generateRendererJS(config);
  await fs.writeFile(path.join(outputDir, 'renderer.js'), js, 'utf-8');

  // Create about window
  const about = generateAboutWindow(config);
  await fs.writeFile(path.join(outputDir, 'about.html'), about, 'utf-8');

  // Copy/generate assets
  await generateAssets(config, outputDir);
}

function generateStandalonePackageJSON(config: StandaloneConfig) {
  const { project, branding } = config;

  return {
    name: branding.appName.toLowerCase().replace(/\s+/g, '-'),
    version: project.version,
    description: project.description,
    main: 'main.js',
    scripts: {
      start: 'electron .',
      'build:win': 'electron-builder --win',
      'build:mac': 'electron-builder --mac',
      'build:linux': 'electron-builder --linux',
      'build:all': 'electron-builder -mwl',
      dev: 'electron . --dev',
    },
    keywords: ['audio', 'plugin', 'music', 'sound'],
    author: branding.companyName || project.author,
    license: 'MIT',
    devDependencies: {
      electron: '^27.0.0',
      'electron-builder': '^24.6.4',
    },
    dependencies: {},
    build: {
      appId: `com.${branding.companyName?.toLowerCase().replace(/\s+/g, '') || 'sounddesigner'}.${branding.appName.toLowerCase().replace(/\s+/g, '')}`,
      productName: branding.appName,
      copyright: `Copyright © ${new Date().getFullYear()} ${branding.companyName || 'Sound Designer'}`,
      directories: {
        output: 'dist',
        buildResources: 'assets',
      },
      files: ['**/*', '!**/*.ts', '!*.md'],
      mac: {
        category: 'public.app-category.music',
        target: ['dmg', 'zip'],
        icon: 'assets/icon.icns',
        hardenedRuntime: true,
        gatekeeperAssess: false,
        entitlements: 'entitlements.mac.plist',
        entitlementsInherit: 'entitlements.mac.plist',
      },
      win: {
        target: ['nsis', 'portable'],
        icon: 'assets/icon.ico',
      },
      linux: {
        category: 'Audio',
        target: ['AppImage', 'deb', 'rpm'],
        icon: 'assets/icon.png',
      },
      nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
      },
      dmg: {
        contents: [
          {
            x: 130,
            y: 220,
          },
          {
            x: 410,
            y: 220,
            type: 'link',
            path: '/Applications',
          },
        ],
      },
    },
  };
}

function generateMainProcess(config: StandaloneConfig): string {
  const { project, branding } = config;

  return `// Electron Main Process
// ${branding.appName} - Standalone Application

const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: ${project.settings.width || 1200},
    height: ${project.settings.height || 800},
    minWidth: ${Math.floor((project.settings.width || 1200) * 0.7)},
    minHeight: ${Math.floor((project.settings.height || 800) * 0.7)},
    title: '${branding.windowTitle || branding.appName}',
    backgroundColor: '${branding.backgroundColor || '#1a1a1a'}',
    resizable: ${branding.allowResize !== false},
    fullscreen: ${branding.fullscreen || false},
    alwaysOnTop: ${branding.alwaysOnTop || false},
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      enableRemoteModule: false,
    },
    ${branding.icon ? `icon: path.join(__dirname, 'assets', 'icon.png'),` : ''}
  });

  mainWindow.loadFile('index.html');

  // Development tools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Create menu
  ${branding.showMenuBar !== false ? 'createMenu();' : 'mainWindow.setMenuBarVisibility(false);'}

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('file:new');
          },
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('file:open');
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('file:save');
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
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
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        ${branding.websiteUrl ? `
        {
          label: 'Visit Website',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('${branding.websiteUrl}');
          },
        },
        ` : ''}
        ${branding.supportEmail ? `
        {
          label: 'Contact Support',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('mailto:${branding.supportEmail}');
          },
        },
        ` : ''}
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            showAboutDialog();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function showAboutDialog() {
  const aboutWindow = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'About ${branding.appName}',
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  aboutWindow.loadFile('about.html');
  aboutWindow.setMenuBarVisibility(false);
}

// App lifecycle
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

// IPC Handlers
ipcMain.handle('get-app-info', () => {
  return {
    name: '${branding.appName}',
    version: '${project.version}',
    description: '${project.description}',
  };
});

${config.autoUpdate ? `
// Auto-update
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update:available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update:downloaded');
});
` : ''}
`;
}

function generatePreloadScript(config: StandaloneConfig): string {
  return `// Preload Script
// Exposes safe APIs to renderer process

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  onFileNew: (callback) => ipcRenderer.on('file:new', callback),
  onFileOpen: (callback) => ipcRenderer.on('file:open', callback),
  onFileSave: (callback) => ipcRenderer.on('file:save', callback),
  ${config.autoUpdate ? `
  onUpdateAvailable: (callback) => ipcRenderer.on('update:available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update:downloaded', callback),
  ` : ''}
});
`;
}

function generateRendererHTML(config: StandaloneConfig): string {
  const { project, branding } = config;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${branding.windowTitle || branding.appName}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  ${branding.splashScreen ? `
  <div id="splash-screen">
    <img src="${branding.splashScreen}" alt="Loading...">
    <div class="loading-bar"></div>
  </div>
  ` : ''}

  <div id="app" class="hidden">
    <header class="toolbar">
      <div class="toolbar-left">
        ${branding.icon ? `<img src="${branding.icon}" alt="Logo" class="app-logo">` : ''}
        <h1 class="app-title">${branding.appName}</h1>
      </div>
      <div class="toolbar-right">
        <button id="btn-new" class="toolbar-btn" title="New">New</button>
        <button id="btn-open" class="toolbar-btn" title="Open">Open</button>
        <button id="btn-save" class="toolbar-btn" title="Save">Save</button>
      </div>
    </header>

    <main id="plugin-container">
      <!-- Plugin UI will be loaded here -->
      <div id="ui-canvas"></div>
    </main>

    <footer class="statusbar">
      <span id="status-text">Ready</span>
      <span id="cpu-meter">CPU: 0%</span>
    </footer>
  </div>

  <script src="renderer.js"></script>
</body>
</html>
`;
}

function generateRendererCSS(config: StandaloneConfig): string {
  const { branding } = config;
  const bgColor = branding.backgroundColor || '#1a1a1a';
  const accentColor = branding.accentColor || '#4a9eff';

  return `/* Standalone App Styles */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: ${bgColor};
  color: #ffffff;
  overflow: hidden;
  user-select: none;
}

.hidden {
  display: none !important;
}

/* Splash Screen */
#splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${bgColor};
  z-index: 9999;
}

#splash-screen img {
  max-width: 300px;
  margin-bottom: 30px;
}

.loading-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.loading-bar::after {
  content: '';
  display: block;
  width: 40%;
  height: 100%;
  background: ${accentColor};
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

/* App Container */
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  width: 32px;
  height: 32px;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: ${accentColor};
}

.toolbar-btn:active {
  transform: scale(0.98);
}

/* Main Content */
main {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

#ui-canvas {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Status Bar */
.statusbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: #aaa;
}

#cpu-meter {
  font-family: 'Courier New', monospace;
}
`;
}

function generateRendererJS(config: StandaloneConfig): string {
  return `// Renderer Process
// ${config.branding.appName} Application Logic

class StandaloneApp {
  constructor() {
    this.audioContext = null;
    this.plugin = null;
    this.init();
  }

  async init() {
    // Hide splash screen after loading
    ${config.branding.splashScreen ? `
    setTimeout(() => {
      document.getElementById('splash-screen').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
    }, 2000);
    ` : `
    document.getElementById('app').classList.remove('hidden');
    `}

    // Get app info
    const appInfo = await window.electronAPI.getAppInfo();
    console.log('App loaded:', appInfo);

    // Initialize audio
    this.initAudio();

    // Setup event listeners
    this.setupEventListeners();
  }

  initAudio() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Initialize plugin audio engine
    // TODO: Import and initialize the actual plugin
    this.updateStatus('Audio engine ready');
  }

  setupEventListeners() {
    // Toolbar buttons
    document.getElementById('btn-new')?.addEventListener('click', () => this.handleNew());
    document.getElementById('btn-open')?.addEventListener('click', () => this.handleOpen());
    document.getElementById('btn-save')?.addEventListener('click', () => this.handleSave());

    // IPC events
    window.electronAPI.onFileNew(() => this.handleNew());
    window.electronAPI.onFileOpen(() => this.handleOpen());
    window.electronAPI.onFileSave(() => this.handleSave());

    ${config.autoUpdate ? `
    window.electronAPI.onUpdateAvailable(() => {
      this.updateStatus('Update available! Download in progress...');
    });

    window.electronAPI.onUpdateDownloaded(() => {
      this.updateStatus('Update downloaded. Restart to install.');
    });
    ` : ''}

    // CPU monitoring
    this.startCPUMonitoring();
  }

  handleNew() {
    console.log('New file');
    this.updateStatus('Creating new project...');
    // TODO: Implement new project logic
  }

  handleOpen() {
    console.log('Open file');
    this.updateStatus('Opening project...');
    // TODO: Implement open project logic
  }

  handleSave() {
    console.log('Save file');
    this.updateStatus('Saving project...');
    // TODO: Implement save project logic
  }

  updateStatus(text) {
    const statusElement = document.getElementById('status-text');
    if (statusElement) {
      statusElement.textContent = text;
    }
  }

  startCPUMonitoring() {
    setInterval(() => {
      // Rough CPU usage estimate based on audio context
      if (this.audioContext) {
        const cpu = Math.round(Math.random() * 15); // Placeholder
        const cpuElement = document.getElementById('cpu-meter');
        if (cpuElement) {
          cpuElement.textContent = \`CPU: \${cpu}%\`;
        }
      }
    }, 1000);
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new StandaloneApp();
});
`;
}

function generateAboutWindow(config: StandaloneConfig): string {
  const { project, branding } = config;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>About ${branding.appName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #2a2a2a;
      color: #fff;
      padding: 30px;
      margin: 0;
      text-align: center;
    }
    ${branding.icon ? `
    .app-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
    }
    ` : ''}
    h1 {
      font-size: 24px;
      margin: 0 0 10px 0;
    }
    .version {
      color: #888;
      margin-bottom: 20px;
    }
    .description {
      line-height: 1.6;
      margin-bottom: 20px;
      color: #ccc;
    }
    .info {
      font-size: 14px;
      color: #999;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    a {
      color: ${branding.accentColor || '#4a9eff'};
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  ${branding.icon ? `<img src="${branding.icon}" alt="${branding.appName}" class="app-icon">` : ''}
  <h1>${branding.appName}</h1>
  <div class="version">Version ${project.version}</div>
  <div class="description">${branding.aboutText || project.description}</div>
  <div class="info">
    ${branding.companyName ? `<p>© ${new Date().getFullYear()} ${branding.companyName}</p>` : ''}
    ${branding.websiteUrl ? `<p><a href="#" onclick="require('electron').shell.openExternal('${branding.websiteUrl}')">${branding.websiteUrl}</a></p>` : ''}
    ${branding.supportEmail ? `<p><a href="mailto:${branding.supportEmail}">${branding.supportEmail}</a></p>` : ''}
    <p>Built with Electron and Sound Designer</p>
  </div>
</body>
</html>
`;
}

async function generateAssets(config: StandaloneConfig, outputDir: string): Promise<void> {
  const assetsDir = path.join(outputDir, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });

  // Create placeholder icon (would normally copy real icon)
  const iconReadme = `# Assets Directory

Place your application assets here:

- icon.icns (macOS icon)
- icon.ico (Windows icon)
- icon.png (Linux icon, 512x512px recommended)
- splash.png (Splash screen image)

For best results:
- Use high-resolution images (512x512 or larger)
- Provide all platform-specific formats
- Ensure proper transparency for icons
`;
  await fs.writeFile(path.join(assetsDir, 'README.md'), iconReadme, 'utf-8');
}

async function generateWindowsConfig(config: StandaloneConfig, outputDir: string): Promise<void> {
  // Windows-specific configuration would go here
  // For now, handled by electron-builder config in package.json
}

async function generateMacOSConfig(config: StandaloneConfig, outputDir: string): Promise<void> {
  const { branding } = config;

  // Generate entitlements
  const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.device.audio-input</key>
    <true/>
    <key>com.apple.security.device.microphone</key>
    <true/>
</dict>
</plist>
`;
  await fs.writeFile(path.join(outputDir, 'entitlements.mac.plist'), entitlements, 'utf-8');
}

async function generateLinuxConfig(config: StandaloneConfig, outputDir: string): Promise<void> {
  const { branding } = config;

  // Generate .desktop file
  const desktop = `[Desktop Entry]
Name=${branding.appName}
Comment=${config.project.description}
Exec=${branding.appName.toLowerCase().replace(/\s+/g, '-')}
Icon=${branding.appName.toLowerCase().replace(/\s+/g, '-')}
Type=Application
Categories=AudioVideo;Audio;
`;
  await fs.writeFile(
    path.join(outputDir, `${branding.appName.toLowerCase().replace(/\s+/g, '-')}.desktop`),
    desktop,
    'utf-8'
  );
}

async function generateBuildScripts(config: StandaloneConfig, outputDir: string): Promise<void> {
  // Build script for all platforms
  const buildAll = `#!/bin/bash
# Build script for ${config.branding.appName}

echo "Installing dependencies..."
npm install

echo "Building for all platforms..."
npm run build:all

echo "Done! Check the 'dist' directory for built applications."
`;
  const buildPath = path.join(outputDir, 'build.sh');
  await fs.writeFile(buildPath, buildAll, 'utf-8');
  await fs.chmod(buildPath, '755');

  // Build readme
  const readme = `# ${config.branding.appName} - Build Instructions

## Requirements

- Node.js 16 or later
- npm or yarn

## Building

### Install dependencies
\`\`\`bash
npm install
\`\`\`

### Build for all platforms
\`\`\`bash
npm run build:all
\`\`\`

### Build for specific platform
\`\`\`bash
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
\`\`\`

## Development

Run in development mode:
\`\`\`bash
npm run dev
\`\`\`

## Output

Built applications will be in the \`dist/\` directory.

## Customization

Edit the following files to customize your standalone app:
- \`package.json\` - Application metadata and build configuration
- \`main.js\` - Electron main process
- \`renderer.js\` - Application logic
- \`styles.css\` - User interface styles
- \`assets/\` - Icons and images

---

Generated by Sound Designer
`;
  await fs.writeFile(path.join(outputDir, 'BUILD.md'), readme, 'utf-8');
}
