import fs from 'fs/promises';
import path from 'path';
import { PluginProject, ExportConfig } from '@shared/types';

/**
 * Export standalone desktop application using Electron
 */
export async function exportStandaloneApp(
  project: PluginProject,
  config: ExportConfig,
  outputDir: string
): Promise<{ outputPath: string }> {
  const appName = project.name.replace(/\s+/g, '');

  // Create app structure
  await fs.mkdir(path.join(outputDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'assets'), { recursive: true });

  // Generate package.json for Electron app
  const packageJson = generateStandalonePackageJson(project);
  await fs.writeFile(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf-8'
  );

  // Generate main Electron process
  const mainJs = generateElectronMain(project);
  await fs.writeFile(path.join(outputDir, 'src', 'main.js'), mainJs, 'utf-8');

  // Generate renderer HTML
  const indexHtml = generateRendererHTML(project);
  await fs.writeFile(path.join(outputDir, 'src', 'index.html'), indexHtml, 'utf-8');

  // Generate renderer JavaScript
  const rendererJs = generateRendererJS(project);
  await fs.writeFile(path.join(outputDir, 'src', 'renderer.js'), rendererJs, 'utf-8');

  // Generate CSS
  const appCss = generateAppCSS(project);
  await fs.writeFile(path.join(outputDir, 'src', 'styles.css'), appCss, 'utf-8');

  // Generate audio processor
  const audioProcessor = generateStandaloneAudioProcessor(project);
  await fs.writeFile(path.join(outputDir, 'src', 'audioProcessor.js'), audioProcessor, 'utf-8');

  // Generate build scripts
  const buildScript = generateBuildScript(project, config);
  await fs.writeFile(path.join(outputDir, 'build.sh'), buildScript, 'utf-8');

  // Make build script executable
  await fs.chmod(path.join(outputDir, 'build.sh'), 0o755);

  // Generate README
  const readme = generateStandaloneReadme(project);
  await fs.writeFile(path.join(outputDir, 'README.md'), readme, 'utf-8');

  return { outputPath: outputDir };
}

function generateStandalonePackageJson(project: PluginProject) {
  return {
    name: project.name.toLowerCase().replace(/\s+/g, '-'),
    version: project.version,
    description: project.description,
    main: 'src/main.js',
    scripts: {
      start: 'electron .',
      'build:mac': 'electron-builder --mac',
      'build:win': 'electron-builder --win',
      'build:linux': 'electron-builder --linux',
      'build:all': 'electron-builder -mwl',
    },
    keywords: ['audio', 'plugin', 'synthesizer', 'effect'],
    author: project.author,
    license: 'MIT',
    dependencies: {},
    devDependencies: {
      electron: '^28.0.0',
      'electron-builder': '^24.0.0',
    },
    build: {
      appId: `com.sounddesigner.${project.name.toLowerCase().replace(/\s+/g, '')}`,
      productName: project.name,
      directories: {
        output: 'dist',
      },
      mac: {
        category: 'public.app-category.music',
        target: ['dmg', 'zip'],
      },
      win: {
        target: ['nsis', 'portable'],
      },
      linux: {
        target: ['AppImage', 'deb'],
        category: 'Audio',
      },
    },
  };
}

function generateElectronMain(project: PluginProject): string {
  return `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: ${project.settings.width + 100},
    height: ${project.settings.height + 150},
    resizable: ${project.settings.resizable},
    backgroundColor: '${project.settings.backgroundColor}',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('src/index.html');

  // Uncomment to open DevTools
  // mainWindow.webContents.openDevTools();
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
`;
}

function generateRendererHTML(project: PluginProject): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'">
  <title>${project.name}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <header class="app-header">
      <h1>${project.name}</h1>
      <p>${project.description}</p>
    </header>

    <main class="app-main">
      <div class="plugin-interface" style="width: ${project.settings.width}px; height: ${project.settings.height}px">
        ${generateUIComponentsHTML(project)}
      </div>

      <div class="transport-controls">
        <button id="playBtn" class="transport-btn">▶ Play</button>
        <button id="stopBtn" class="transport-btn">⏹ Stop</button>
        <input type="range" id="masterVolume" min="0" max="100" value="70" class="volume-slider">
        <span id="volumeLabel">70%</span>
      </div>

      <div class="visualizer-section">
        <canvas id="waveform" width="600" height="120"></canvas>
      </div>
    </main>

    <footer class="app-footer">
      <span>v${project.version}</span>
      <span>${project.author || 'Sound Designer'}</span>
    </footer>
  </div>

  <script src="audioProcessor.js"></script>
  <script src="renderer.js"></script>
</body>
</html>
`;
}

function generateUIComponentsHTML(project: PluginProject): string {
  return project.uiComponents
    .map((comp) => {
      if (comp.type === 'knob') {
        return `
        <div class="ui-component knob-component" style="left: ${comp.x}px; top: ${comp.y}px; width: ${comp.width}px; height: ${comp.height}px">
          <div class="knob" id="${comp.id}"></div>
          <label>${comp.label}</label>
        </div>`;
      } else if (comp.type === 'slider') {
        return `
        <div class="ui-component slider-component" style="left: ${comp.x}px; top: ${comp.y}px; width: ${comp.width}px; height: ${comp.height}px">
          <label>${comp.label}</label>
          <input type="range" id="${comp.id}" class="slider">
        </div>`;
      } else if (comp.type === 'button') {
        return `
        <button class="ui-component button-component" id="${comp.id}" style="left: ${comp.x}px; top: ${comp.y}px; width: ${comp.width}px; height: ${comp.height}px">
          ${comp.label}
        </button>`;
      }
      return '';
    })
    .join('\n        ');
}

function generateRendererJS(project: PluginProject): string {
  return `// Audio context and processor
let audioContext;
let audioProcessor;
let isPlaying = false;

// Initialize audio on user interaction
document.getElementById('playBtn').addEventListener('click', async () => {
  if (!audioContext) {
    audioContext = new AudioContext({ sampleRate: ${project.settings.sampleRate} });
    audioProcessor = new AudioProcessor(audioContext);
    initializeVisualizer();
  }

  if (!isPlaying) {
    await audioContext.resume();
    audioProcessor.start();
    isPlaying = true;
    document.getElementById('playBtn').textContent = '⏸ Pause';
  } else {
    audioContext.suspend();
    isPlaying = false;
    document.getElementById('playBtn').textContent = '▶ Play';
  }
});

document.getElementById('stopBtn').addEventListener('click', () => {
  if (audioProcessor) {
    audioProcessor.stop();
    audioContext.suspend();
    isPlaying = false;
    document.getElementById('playBtn').textContent = '▶ Play';
  }
});

// Master volume control
document.getElementById('masterVolume').addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  document.getElementById('volumeLabel').textContent = value + '%';
  if (audioProcessor) {
    audioProcessor.setMasterVolume(value / 100);
  }
});

// Initialize visualizer
function initializeVisualizer() {
  const canvas = document.getElementById('waveform');
  const ctx = canvas.getContext('2d');

  function draw() {
    if (!isPlaying) {
      requestAnimationFrame(draw);
      return;
    }

    const waveformData = audioProcessor.getWaveformData();
    if (!waveformData) {
      requestAnimationFrame(draw);
      return;
    }

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = canvas.width / waveformData.length;
    let x = 0;

    for (let i = 0; i < waveformData.length; i++) {
      const v = waveformData[i] / 128.0;
      const y = v * canvas.height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
    requestAnimationFrame(draw);
  }

  draw();
}

// UI component handlers
${generateUIComponentHandlers(project)}
`;
}

function generateUIComponentHandlers(project: PluginProject): string {
  return project.uiComponents
    .map((comp) => {
      const paramId = comp.properties?.parameter || comp.id;
      return `
// Handler for ${comp.label}
const ${comp.id}Element = document.getElementById('${comp.id}');
if (${comp.id}Element) {
  ${comp.id}Element.addEventListener('${comp.type === 'button' ? 'click' : 'input'}', (e) => {
    const value = ${comp.type === 'button' ? 'true' : 'e.target.value'};
    if (audioProcessor) {
      audioProcessor.setParameter('${paramId}', value);
    }
  });
}`;
    })
    .join('\n');
}

function generateAppCSS(project: PluginProject): string {
  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  color: #ffffff;
  overflow: hidden;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  padding: 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-header h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

.app-header p {
  font-size: 14px;
  color: #888;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 20px;
}

.plugin-interface {
  position: relative;
  background: ${project.settings.backgroundColor};
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.ui-component {
  position: absolute;
}

.knob-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.knob {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
  border-radius: 50%;
  border: 3px solid #4a4a4a;
  cursor: pointer;
}

.slider-component {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slider {
  width: 100%;
}

.button-component {
  background: linear-gradient(180deg, #3a3a3a, #2a2a2a);
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.button-component:hover {
  background: linear-gradient(180deg, #4a4a4a, #3a3a3a);
}

.transport-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.transport-btn {
  padding: 10px 20px;
  background: #4a9eff;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.transport-btn:hover {
  background: #3a8ee6;
  transform: translateY(-1px);
}

.volume-slider {
  width: 150px;
}

.visualizer-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
}

#waveform {
  border-radius: 4px;
  background: #1a1a1a;
}

.app-footer {
  padding: 16px;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: #666;
  display: flex;
  justify-content: space-between;
}
`;
}

function generateStandaloneAudioProcessor(project: PluginProject): string {
  return `class AudioProcessor {
  constructor(audioContext) {
    this.context = audioContext;
    this.masterGain = this.context.createGain();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.nodes = new Map();
    this.isRunning = false;

    this.setupDSP();
  }

  setupDSP() {
    // Create DSP nodes based on project configuration
${project.dspGraph.nodes
  .map(
    (node) => `    // ${node.type} node
    this.create${node.type.charAt(0).toUpperCase() + node.type.slice(1)}Node('${node.id}');`
  )
  .join('\n')}
  }

  createOscillatorNode(id) {
    const osc = this.context.createOscillator();
    osc.frequency.value = 440;
    osc.type = 'sine';
    this.nodes.set(id, osc);
    return osc;
  }

  createFilterNode(id) {
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;
    this.nodes.set(id, filter);
    return filter;
  }

  createGainNode(id) {
    const gain = this.context.createGain();
    gain.gain.value = 0.5;
    this.nodes.set(id, gain);
    return gain;
  }

  start() {
    if (this.isRunning) return;

    this.nodes.forEach((node) => {
      if (node instanceof OscillatorNode) {
        try {
          node.connect(this.masterGain);
          node.start();
        } catch (e) {
          console.warn('Node already started:', e);
        }
      }
    });

    this.isRunning = true;
  }

  stop() {
    this.nodes.forEach((node) => {
      if (node instanceof OscillatorNode) {
        try {
          node.stop();
          node.disconnect();
        } catch (e) {
          // Node may already be stopped
        }
      }
    });

    this.isRunning = false;
  }

  setMasterVolume(value) {
    this.masterGain.gain.setTargetAtTime(value, this.context.currentTime, 0.01);
  }

  setParameter(name, value) {
    // Parameter routing logic
    console.log('Setting parameter:', name, value);
  }

  getWaveformData() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }
}
`;
}

function generateBuildScript(project: PluginProject, config: ExportConfig): string {
  return `#!/bin/bash

echo "Building ${project.name} standalone application..."

# Install dependencies
npm install

# Build for current platform
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Building for macOS..."
  npm run build:mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "Building for Linux..."
  npm run build:linux
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
  echo "Building for Windows..."
  npm run build:win
fi

echo "Build complete! Check the 'dist' directory for the output."
`;
}

function generateStandaloneReadme(project: PluginProject): string {
  return `# ${project.name} - Standalone Application

${project.description}

## About

This is a standalone desktop application version of the ${project.name} audio plugin.
It can run independently without a DAW or host application.

## Requirements

- Node.js 16+
- npm or yarn

## Installation

\`\`\`bash
npm install
\`\`\`

## Running in Development

\`\`\`bash
npm start
\`\`\`

## Building for Distribution

### Build for current platform
\`\`\`bash
./build.sh
\`\`\`

### Build for specific platforms
\`\`\`bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux

# All platforms
npm run build:all
\`\`\`

## Built With

- Electron - Desktop application framework
- Web Audio API - Audio processing
- Generated by Sound Designer v${project.version}

## Version

${project.version}

## Author

${project.author || 'Sound Designer User'}

## License

MIT
`;
}
