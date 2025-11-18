# Sound Designer Architecture

## Overview

Sound Designer is an Electron-based desktop application for creating audio plugins. The application uses React and TypeScript for the UI, and provides a visual workflow for designing both the user interface and DSP processing chains.

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Zustand** - State management with Immer middleware
- **React Flow** - Visual graph editor for DSP chains
- **Monaco Editor** - Code editor (VS Code's editor)
- **Web Audio API** - Real-time audio preview

### Desktop
- **Electron** - Cross-platform desktop framework
- **Node.js** - Runtime environment

### Build & Development
- **Vite** - Fast build tool and dev server
- **Vitest** - Unit testing
- **ESLint** - Code linting

## Architecture Layers

### 1. Main Process (Electron)
Located in `src/main/`

- **main.ts** - Application entry point, window management
- **preload.ts** - Secure bridge between main and renderer processes
- Handles file I/O, native dialogs, and plugin compilation

### 2. Renderer Process (React App)
Located in `src/renderer/`

#### State Management (`store/`)
- **projectStore.ts** - Central state using Zustand
  - Plugin project data
  - UI components
  - DSP graph
  - Code files
  - Project settings

#### Core Modules (`modules/`)

**UI Designer** (`ui-designer/`)
- Canvas-based drag-and-drop interface
- Component library (knobs, sliders, buttons, etc.)
- Real-time visual editing
- Properties panel for customization

**DSP Designer** (`dsp-designer/`)
- Visual node graph editor using React Flow
- DSP node library (oscillators, filters, effects, etc.)
- Connection management
- Parameter configuration

**Code Editor** (`code-editor/`)
- Monaco Editor integration
- Syntax highlighting for C++ and JavaScript
- Multiple file tabs (DSP, UI, helpers)
- Live code editing

**Preview** (`preview/`)
- Real-time audio processing with Web Audio API
- Visual plugin rendering
- Waveform visualization
- Audio controls

**Export** (`export/`)
- Plugin export configuration
- Multiple format support (VST, VST3, AU, etc.)
- Platform targeting (Windows, macOS, Linux, mobile)
- Build optimization settings

#### Components (`components/`)
- **Toolbar** - Top navigation and mode switching
- **Sidebar** - Component/node library

### 3. Shared Types (`shared/`)
Type definitions used across main and renderer processes

## Data Flow

```
User Interaction
     ↓
React Component
     ↓
Zustand Action
     ↓
State Update (Immer)
     ↓
Component Re-render
     ↓
IPC Communication (if needed)
     ↓
Main Process
     ↓
File System / Plugin Compiler
```

## Plugin Project Structure

```typescript
PluginProject {
  id: string
  name: string
  version: string
  description: string
  author: string

  uiComponents: UIComponent[]     // Visual UI elements
  dspGraph: DSPGraph              // Audio processing nodes
  code: CodeFiles                 // Custom code
  settings: PluginSettings        // Plugin configuration
}
```

## Module Communication

### Inter-Process Communication (IPC)
- **save-project** - Save project to disk
- **load-project** - Load project from disk
- **export-plugin** - Compile and export plugin

### State Management
All UI state is managed through Zustand store with Immer for immutability.

```typescript
// Example action
addUIComponent: (component) => set((state) => {
  state.project.uiComponents.push({ ...component, id: nanoid() });
  state.isDirty = true;
});
```

## Export Pipeline

1. **User Configuration** - Select format, platform, optimization
2. **Code Generation** - Convert visual design to code
3. **JUCE Integration** - Generate JUCE project files
4. **Compilation** - Build native plugin binary
5. **Packaging** - Create distributable plugin file

## Plugin Formats

### Native Plugins (JUCE-based)
- **VST 2** - Legacy Steinberg format
- **VST 3** - Modern Steinberg format
- **AU** - Apple Audio Units

### Other Formats
- **Web App** - WebAudio-based browser plugin
- **Standalone** - Desktop application
- **Mobile** - iOS/Android audio apps
- **Hardware** - DSP code for embedded systems

## Development Workflow

### Hot Reload
Vite provides instant hot module replacement during development.

### Type Safety
TypeScript ensures type safety across the entire application.

### Testing
Vitest for unit and integration tests.

## Security

### Context Isolation
Electron's context isolation ensures renderer process cannot directly access Node.js APIs.

### IPC Security
All IPC communication goes through defined, validated channels.

## Performance Optimization

### State Updates
Immer provides efficient immutable updates.

### React Flow
Virtualized rendering for large DSP graphs.

### Monaco Editor
Web Worker-based parsing for smooth editing.

### Web Audio
ScriptProcessor/AudioWorklet for low-latency audio processing.

## Future Enhancements

1. **Collaborative Editing** - Real-time multi-user editing
2. **Plugin Marketplace** - Share and download plugins
3. **AI-Assisted Design** - ML-powered plugin generation
4. **Cloud Compilation** - Server-side plugin building
5. **Advanced DSP** - More sophisticated processing algorithms
6. **Template Library** - Pre-built plugin templates
7. **Testing Framework** - Automated plugin testing
8. **Performance Profiler** - CPU/memory usage analysis
