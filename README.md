# Sound Designer - Audio Plugin Designer

<div align="center">

**A professional audio plugin designer for creating VST3, AU, and Web Audio plugins with visual DSP and UI design tools.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-Latest-47848F.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![JUCE](https://img.shields.io/badge/JUCE-Export-orange.svg)](https://juce.com/)

[Features](#features) • [Getting Started](#getting-started) • [Documentation](#documentation) • [Export Formats](#export-formats)

</div>

---

## Overview

Sound Designer is a complete visual development environment for creating audio plugins. Design your DSP signal chain, create a custom UI, write code enhancements, and export to multiple formats including native VST3/AU plugins and Web Audio applications.

### Key Highlights

- 🎛️ **Visual UI Designer** - Drag-and-drop interface builder with 25+ component presets
- 🔊 **DSP Graph Designer** - Node-based audio processing with real-time preview
- 💻 **Code Editor** - Direct access to DSP, UI, and helper code
- 📦 **Multi-Format Export** - VST3, AU, Web Audio, Standalone apps
- 🎨 **5 Production Templates** - Synth, Compressor, Delay, EQ, Reverb
- ✅ **Export Validation** - Comprehensive pre-export checks
- 🔄 **50-Level Undo/Redo** - Full history management
- ⌨️ **Keyboard Shortcuts** - Professional workflow support

---

## Features

### Visual UI Designer

- **Component Library**: 25+ pre-built UI components
  - Knobs (standard, large, small)
  - Sliders (horizontal, vertical)
  - Buttons, toggles, XY pads
  - Waveform displays, value displays
  - MIDI keyboards (1-octave, 2-octave)
- **Grid Snapping**: Configurable snap-to-grid (5-50px)
- **Multi-Selection**: Ctrl+Click or drag-to-select multiple components
- **Component Grouping**: Group components for unified manipulation
- **Real-time Preview**: See your plugin UI as you build

### DSP Graph Designer

- **16 Node Types**:
  - **Synthesis**: Oscillator, Envelope, LFO
  - **Filters**: Low-pass, High-pass, Band-pass, Notch, Shelving
  - **Effects**: Reverb, Delay, Chorus, Flanger, Phaser
  - **Dynamics**: Compressor, Gain
  - **Special**: Distortion, EQ, Mixer, Vocoder
- **Connection Validation**: Prevents circular dependencies and invalid connections
- **20+ DSP Presets**: Pre-configured effect chains
- **Visual Flow**: React Flow-based graph editing
- **Real-time Audio Preview**: Test your DSP chain in the app

### Code Editor

- **Monaco Editor**: VS Code-style editing experience
- **Three Code Sections**:
  - DSP Code: Custom audio processing algorithms
  - UI Code: Interface customization and theming
  - Helper Code: Utility functions and shared code
- **Syntax Highlighting**: Full TypeScript/JavaScript support

### Templates System

**5 Production-Ready Templates**:

1. **Basic Synthesizer** - Subtractive synth with oscillator, filter, and envelope
2. **Dynamic Compressor** - Professional dynamics processor
3. **Stereo Delay** - Ping-pong delay with independent L/R timing
4. **3-Band EQ** - Parametric equalizer with low/mid/high bands
5. **Algorithmic Reverb** - Room/hall reverb with modulation

Each template includes:
- Complete UI layout with controls
- Fully connected DSP graph
- Sample C++ implementation code
- JUCE project configuration

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Git**
- For native plugin compilation (optional):
  - **JUCE Framework** 7.0+
  - **CMake** 3.15+
  - **C++ Compiler** (Xcode on macOS, Visual Studio on Windows, GCC/Clang on Linux)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sound-designer.git
cd sound-designer

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will open automatically in Electron.

### Quick Start

1. **Create a New Project**:
   - File → New from Template... → Choose "Basic Synthesizer"
   - Or start with File → New Blank Project

2. **Design Your UI**:
   - Switch to "UI Designer" mode
   - Add knobs, sliders, and displays from the component library
   - Configure grid snapping in Settings (⚙️)

3. **Build DSP Chain**:
   - Switch to "DSP Graph" mode
   - Add nodes from the library (oscillator, filter, etc.)
   - Connect nodes by dragging from outputs to inputs
   - Configure parameters in the properties panel

4. **Preview & Test**:
   - Switch to "Preview" mode
   - Test your plugin in real-time
   - Adjust parameters and hear changes immediately

5. **Export**:
   - File → Export → Choose format (VST3/AU or Web Audio)
   - Validation report will be generated
   - Build with CMake (native) or deploy to web

---

## Export Formats

### Native Plugins (VST3/AU/Standalone)

**Generated Files**:
- `PluginProcessor.h/cpp` - Full parameter automation, MIDI support, state management
- `PluginEditor.h/cpp` - Generic UI (JUCE GenericAudioProcessorEditor)
- `CMakeLists.txt` - Modern build system configuration
- `.jucer` project file - JUCE Projucer compatibility
- `BUILD.md` - Build instructions
- `VALIDATION_REPORT.md` - Pre-export validation results

**Build Process**:
```bash
cd export_folder
cmake -B build
cmake --build build --config Release
# Plugins will be in: build/YourPlugin_artefacts/Release/
```

**Features**:
- ✅ AudioProcessorValueTreeState parameter automation
- ✅ MIDI input handling (auto-detected from DSP graph)
- ✅ XML-based state save/load for DAW sessions
- ✅ Thread-safe parameter updates with atomics
- ✅ juce::dsp module integration (filters, delays, reverb, compressor)
- ✅ Cross-platform support (macOS, Windows, Linux)

### Web Audio Plugin

**Generated Files**:
- `YourPlugin.js` - ES6 module with Web Audio API implementation
- `index.html` - Interactive demo with real-time controls
- `package.json` - npm configuration
- `README.md` - Usage documentation and API reference

**Features**:
- ✅ Clean class-based API
- ✅ Parameter automation with ramp support
- ✅ State management (getState/setState for presets)
- ✅ All DSP node types supported
- ✅ No build step required - runs directly in browser

**Usage Example**:
```javascript
import YourPluginPlugin from './YourPlugin.js';

const audioContext = new AudioContext();
const plugin = new YourPluginPlugin(audioContext);
plugin.connect(audioContext.destination);

// Set parameters
plugin.setParameter('filter_frequency', 1000, 0.5); // Ramp over 0.5s

// Save/restore presets
const preset = plugin.getState();
plugin.setState(preset);
```

---

## Project Structure

```
sound-designer/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── main.ts                # App initialization, IPC handlers
│   │   ├── fileSystem.ts          # Project save/load, templates
│   │   ├── exportSystem.ts        # Export orchestration
│   │   ├── enhancedJUCEExport.ts  # JUCE C++ code generation
│   │   ├── webAudioExport.ts      # Web Audio plugin generation
│   │   └── exportValidation.ts    # Pre-export validation
│   │
│   ├── renderer/                  # React UI
│   │   ├── App.tsx                # Main application component
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Toolbar.tsx        # Top toolbar with mode switcher
│   │   │   ├── Sidebar.tsx        # Component/node library
│   │   │   ├── SettingsDialog.tsx # Application settings
│   │   │   └── TemplateBrowser.tsx # Project template browser
│   │   │
│   │   ├── modules/               # Main editor modules
│   │   │   ├── ui-designer/       # Visual UI designer
│   │   │   ├── dsp-designer/      # DSP graph designer
│   │   │   ├── code-editor/       # Monaco code editor
│   │   │   └── preview/           # Real-time audio preview
│   │   │
│   │   ├── store/                 # State management (Zustand)
│   │   │   ├── projectStore.ts    # Main project state
│   │   │   └── settingsStore.ts   # User settings
│   │   │
│   │   ├── utils/                 # Utilities
│   │   │   ├── HistoryManager.ts  # Undo/redo system (50 levels)
│   │   │   ├── KeyboardShortcuts.tsx # Global shortcuts
│   │   │   ├── ConnectionValidator.ts # DSP validation
│   │   │   ├── NodePresets.ts     # DSP node presets (20+)
│   │   │   ├── PluginTemplates.ts # Project templates (5)
│   │   │   └── ComponentLibrary.ts # UI component presets (25+)
│   │   │
│   │   └── audio/                 # Web Audio processing
│   │       └── AudioEngine.ts     # Real-time audio preview
│   │
│   └── shared/                    # Shared types
│       └── types.ts               # TypeScript interfaces
│
├── public/                        # Static assets
│   └── audio-processors.js        # AudioWorklet processors
│
└── package.json                   # Dependencies and scripts
```

---

## Development Phases Completed

### ✅ Phase 1: Core Foundation
- Electron + React + TypeScript setup
- Project structure with main/renderer processes
- Basic UI Designer, DSP Designer, Code Editor, Preview modules
- Toolbar, Sidebar, and component scaffolding

### ✅ Phase 2: Backend Implementation
- Complete file system integration (save/load/templates)
- JUCE code generation for native exports
- Web Audio API preview engine
- IPC communication between processes
- Auto-save functionality

### ✅ Phase 3: Enhanced Features
- 50-level undo/redo system
- Global keyboard shortcuts (save, undo, copy/paste, etc.)
- Grid snapping with configurable size
- DSP connection validation
- Component multi-selection and grouping
- Settings dialog with persistence
- Node presets library (10 built-in)

### ✅ Phase 4: Advanced Features
- Plugin templates system (5 production templates)
- Template browser UI with search
- Enhanced DSP node types (reverb, chorus, flanger, phaser, vocoder)
- Component library (25+ UI presets)
- LocalStorage integration for custom presets

### ✅ Phase 5: Export & Build System
- Enhanced JUCE code generation with parameter automation
- CMake build system generation
- Web Audio export with ES6 modules
- Comprehensive export validation (errors, warnings, info)
- README generation for exports
- Validation reports

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Zustand + Immer** - State management
- **React Flow** - Visual graph editor
- **Monaco Editor** - Code editing (VS Code engine)
- **Lucide React** - Icons

### Backend (Electron)
- **Electron** - Desktop application framework
- **Node.js** - JavaScript runtime
- **fs/promises** - File system operations

### Audio
- **Web Audio API** - Browser-based audio processing
- **AudioWorklet** - Advanced DSP processing

### Build & Export
- **JUCE Framework** - Native plugin framework (target)
- **CMake** - Build system generation
- **Vite** - Development server and bundling

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save project |
| `Ctrl/Cmd + Shift + S` | Save project as... |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + C` | Copy selected component/node |
| `Ctrl/Cmd + V` | Paste component/node |
| `Ctrl/Cmd + D` | Duplicate selected component/node |
| `Delete` or `Backspace` | Delete selected component/node |
| `Ctrl/Cmd + Click` | Multi-select components |
| `Drag` | Selection box (UI Designer) |

---

## Configuration

### Settings (⚙️ Settings Button)

**UI Designer**:
- Grid enabled/disabled
- Grid size (5-50px)
- Snap to grid
- Show rulers
- Show alignment guides

**DSP Designer**:
- Auto-arrange nodes
- Show mini-map

**General**:
- Theme (dark/light)
- Auto-save enabled
- Auto-save interval (1-30 minutes)

**Audio**:
- Sample rate (44.1kHz, 48kHz, 88.2kHz, 96kHz)
- Buffer size (128-2048 samples)

Settings are persisted in localStorage.

---

## Export Validation

Before every export, the system performs comprehensive validation:

### Errors (Block Export)
- Empty or invalid project name
- Circular dependencies in DSP graph
- Invalid parameter ranges (min >= max)
- Non-existent node references in connections

### Warnings (Allow Export)
- Disconnected nodes in DSP graph
- Overlapping UI components
- Components outside plugin window bounds
- Missing parameter units
- Invalid UI parameter bindings

### Info (Suggestions)
- Large DSP graphs (20+ nodes)
- Very small UI components
- Non-standard sample rates
- Non-standard buffer sizes
- Missing MIDI keyboard for synth plugins

A detailed `VALIDATION_REPORT.md` is included with every export.

---

## Building Native Plugins

### Requirements

1. **Install JUCE**:
   ```bash
   git clone https://github.com/juce-framework/JUCE.git
   cd JUCE
   git checkout 7.0.0
   ```

2. **Place JUCE in Export Folder**:
   ```
   export_folder/
   ├── JUCE/              # JUCE framework here
   ├── Source/            # Generated C++ files
   ├── CMakeLists.txt     # Build configuration
   └── BUILD.md           # Instructions
   ```

3. **Build**:
   ```bash
   # macOS
   cmake -B build -G Xcode
   cmake --build build --config Release

   # Windows
   cmake -B build -G "Visual Studio 17 2022"
   cmake --build build --config Release

   # Linux
   cmake -B build
   cmake --build build --config Release
   ```

4. **Find Plugins**:
   - **macOS**: `build/YourPlugin_artefacts/Release/VST3/` and `AU/`
   - **Windows**: `build/YourPlugin_artefacts/Release/VST3/`
   - **Linux**: `build/YourPlugin_artefacts/Release/VST3/`

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linter
```

---

## License

MIT License - see LICENSE file for details.

---

## Acknowledgments

- **JUCE Framework** - Audio plugin framework
- **Web Audio API** - Browser audio processing
- **React Flow** - Visual graph editing
- **Monaco Editor** - Code editing
- **Electron** - Desktop application framework

---

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

<div align="center">

**Built with ❤️ for audio developers**

</div>
