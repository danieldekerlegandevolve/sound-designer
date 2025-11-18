# Sound Designer

A comprehensive audio plugin designer for creating VST, VST3, AU (Component), and other audio plugins.

## Features

- **Visual UI Designer**: Drag-and-drop interface builder for plugin UIs
- **DSP Graph Designer**: Visual audio processing chain editor
- **Code Editor**: Direct code access for advanced customization
- **Real-time Preview**: Test your plugin in real-time with Web Audio API
- **Plugin Combination**: Combine multiple processing stages (synth + effects, etc.)
- **Multiple Export Formats**:
  - VST/VST3/AU plugins for DAWs
  - Web applications
  - Standalone desktop apps
  - Mobile plugins/apps
  - DSP programs for hardware (guitar pedals, etc.)

## Tech Stack

- **Frontend**: React + TypeScript
- **Desktop**: Electron
- **UI Designer**: HTML5 Canvas with React
- **DSP Graph**: React Flow
- **Code Editor**: Monaco Editor (VS Code)
- **Audio Engine**: Web Audio API (preview), JUCE (native compilation)
- **Build System**: Custom pipeline for multi-format export

## Project Structure

```
sound-designer/
├── src/
│   ├── main/              # Electron main process
│   ├── renderer/          # React app (renderer process)
│   │   ├── components/    # React components
│   │   ├── modules/       # Core modules
│   │   │   ├── ui-designer/      # Visual UI design tool
│   │   │   ├── dsp-designer/     # Audio processing graph
│   │   │   ├── code-editor/      # Code editing interface
│   │   │   ├── preview/          # Real-time audio preview
│   │   │   └── export/           # Export system
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Utility functions
│   ├── shared/            # Shared code between main/renderer
│   └── templates/         # Plugin code templates
├── build-tools/           # Export and build utilities
│   ├── juce-builder/     # JUCE plugin compilation
│   ├── web-builder/      # Web app export
│   └── mobile-builder/   # Mobile export
└── examples/              # Example plugins
```

## Getting Started

```bash
npm install
npm run dev
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linter

## License

MIT
