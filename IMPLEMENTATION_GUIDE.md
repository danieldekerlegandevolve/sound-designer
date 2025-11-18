# Sound Designer Implementation Guide

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Git
- C++ compiler (for native plugin builds)
  - Windows: Visual Studio 2019+
  - macOS: Xcode Command Line Tools
  - Linux: GCC/Clang

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sound-designer

# Install dependencies
npm install

# Start development server
npm run dev
```

This will start:
- Vite dev server on http://localhost:3000
- Electron app with hot reload

## Project Structure

```
sound-designer/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # App entry point
│   │   └── preload.ts          # IPC bridge
│   ├── renderer/                # React application
│   │   ├── components/         # Shared components
│   │   │   ├── Toolbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── modules/            # Feature modules
│   │   │   ├── ui-designer/    # UI design tool
│   │   │   ├── dsp-designer/   # DSP graph tool
│   │   │   ├── code-editor/    # Code editing
│   │   │   ├── preview/        # Audio preview
│   │   │   └── export/         # Plugin export
│   │   ├── store/              # State management
│   │   │   └── projectStore.ts
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # React entry point
│   └── shared/                 # Shared types
│       └── types.ts
├── build-tools/                # Export utilities
├── examples/                   # Example plugins
├── index.html                  # HTML template
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Core Concepts

### 1. Plugin Projects

A plugin project contains:
- **UI Components** - Visual elements (knobs, sliders, etc.)
- **DSP Graph** - Audio processing nodes and connections
- **Code Files** - Custom DSP and UI code
- **Settings** - Plugin configuration

### 2. UI Designer

The UI Designer provides a canvas for visually designing the plugin interface.

**Adding a Component:**
1. Click a component in the sidebar
2. Component appears on canvas
3. Drag to reposition
4. Drag resize handle to change size
5. Edit properties in properties panel

**Component Types:**
- Knob - Rotary control
- Slider - Linear control
- Button - Push button
- Toggle - On/off switch
- Display - Value display
- Waveform - Audio visualization
- Keyboard - MIDI keyboard
- XY Pad - 2D control surface

### 3. DSP Designer

Visual graph editor for audio processing chains.

**Creating a DSP Graph:**
1. Add nodes from sidebar
2. Drag nodes to position
3. Connect outputs to inputs
4. Configure node parameters

**DSP Node Types:**
- Oscillator - Tone generation
- Filter - Frequency filtering
- Envelope - Amplitude shaping
- LFO - Modulation source
- Gain - Volume control
- Delay - Time-based effect
- Reverb - Spatial effect
- Distortion - Harmonic saturation
- Compressor - Dynamics processing
- EQ - Frequency equalization
- Mixer - Signal combination

### 4. Code Editor

Direct code access for advanced customization.

**File Types:**
- **DSP Code** (C++) - Core audio processing
- **UI Code** (JavaScript) - UI interactions
- **Helpers** - Utility functions

Example DSP code:
```cpp
void process(float** inputs, float** outputs, int numSamples) {
    for (int i = 0; i < numSamples; ++i) {
        float input = inputs[0][i];

        // Apply processing
        float output = input * gain;

        outputs[0][i] = output;
    }
}
```

### 5. Preview

Real-time plugin testing with Web Audio API.

**Features:**
- Live audio processing
- Waveform visualization
- Volume control
- Performance monitoring

### 6. Export

Generate production-ready plugins.

**Export Options:**
- **Format:** VST, VST3, AU, Web, Standalone, Mobile
- **Platform:** Windows, macOS, Linux, iOS, Android
- **Optimization:** Debug or Release build

## State Management

The application uses Zustand with Immer for state management.

### Adding a New Action

```typescript
// In projectStore.ts
export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    // ... existing state

    // New action
    myNewAction: (param) => set((state) => {
      // Update state immutably with Immer
      state.someProperty = param;
      state.isDirty = true;
    }),
  }))
);
```

### Using State in Components

```typescript
function MyComponent() {
  // Subscribe to specific state
  const { project, myNewAction } = useProjectStore();

  // Call action
  const handleClick = () => {
    myNewAction('value');
  };

  return <div onClick={handleClick}>{project.name}</div>;
}
```

## Adding New Features

### Adding a New UI Component Type

1. **Add type to types.ts:**
```typescript
export interface UIComponent {
  type: 'knob' | 'slider' | 'myNewType';
  // ...
}
```

2. **Add to sidebar component list:**
```typescript
const uiComponentTypes = [
  // ...
  { type: 'myNewType', label: 'My New Type', icon: '🎨' },
];
```

3. **Add rendering in UIDesigner.tsx:**
```typescript
function renderComponent(component: UIComponent) {
  switch (component.type) {
    case 'myNewType':
      return <div className="my-new-component">...</div>;
    // ...
  }
}
```

### Adding a New DSP Node Type

1. **Add to types.ts:**
```typescript
export interface DSPNode {
  type: 'oscillator' | 'filter' | 'myDSPNode';
  // ...
}
```

2. **Add to sidebar:**
```typescript
const dspNodeTypes = [
  // ...
  { type: 'myDSPNode', label: 'My DSP', color: '#ff00ff' },
];
```

3. **Add color to DSPNodeComponent:**
```typescript
const nodeColors: Record<string, string> = {
  // ...
  myDSPNode: '#ff00ff',
};
```

## Building for Production

```bash
# Build renderer
npm run build:renderer

# Build main process
npm run build:main

# Package application
npm run build
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run type-check
```

## Debugging

### Renderer Process
1. Open Chrome DevTools in Electron (Ctrl+Shift+I / Cmd+Opt+I)
2. Set breakpoints in Sources tab
3. Use React DevTools extension

### Main Process
1. Add `--inspect` flag to Electron launch
2. Connect Chrome DevTools to Node.js debugger
3. Use VS Code debugger configuration

## Export Implementation

### JUCE Integration

The export system generates JUCE-compatible C++ code:

1. **Convert DSP Graph** - Nodes → JUCE AudioProcessor
2. **Generate UI** - Components → JUCE Component hierarchy
3. **Create Project** - Projucer configuration
4. **Build** - Compile native binaries

### Web Export

For web apps:
1. Generate JavaScript/TypeScript
2. Use Web Audio API nodes
3. Bundle with Vite
4. Deploy as static site

## Performance Tips

1. **Minimize State Updates** - Only update what changed
2. **Use React.memo** - Prevent unnecessary re-renders
3. **Optimize Canvas** - Use requestAnimationFrame
4. **Web Audio** - Use AudioWorklet for better performance
5. **Large Graphs** - Enable React Flow viewport optimization

## Common Issues

### Electron doesn't start
- Check Node.js version (18+)
- Clear node_modules and reinstall
- Check for port conflicts (3000)

### Hot reload not working
- Restart dev server
- Clear browser cache
- Check Vite configuration

### Type errors
- Run `npm run type-check`
- Update tsconfig.json
- Ensure all imports have types

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [JUCE Framework](https://juce.com)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
