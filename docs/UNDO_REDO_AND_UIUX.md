# Undo/Redo System and UI/UX Enhancements

This document describes the comprehensive undo/redo system, drag & drop functionality, and UI/UX enhancements implemented in Sound Designer.

## Table of Contents

1. [Undo/Redo System](#undoredo-system)
2. [Drag and Drop](#drag-and-drop)
3. [Keyboard Shortcuts](#keyboard-shortcuts)
4. [UI Components](#ui-components)
5. [Animations](#animations)
6. [Usage Examples](#usage-examples)

---

## Undo/Redo System

The undo/redo system implements the Command Pattern, allowing all user actions to be undone and redone.

### Architecture

- **Command Pattern**: Each action is encapsulated in a Command object
- **History Stack**: Commands are stored in a history with configurable size
- **Command Merging**: Similar consecutive commands can be merged (e.g., parameter adjustments)
- **Async Support**: Commands can be synchronous or asynchronous

### Core Components

#### UndoManager

The central manager for undo/redo operations.

```typescript
import { getUndoManager } from './modules/undoredo';

const undoManager = getUndoManager({
  maxHistorySize: 100,      // Maximum undo steps
  enableMerging: true,       // Merge similar commands
  mergeWindowMs: 500,        // Time window for merging
  persistHistory: false,     // Save history to storage
});

// Execute a command
await undoManager.execute(command);

// Undo/Redo
await undoManager.undo();
await undoManager.redo();

// Subscribe to state changes
const unsubscribe = undoManager.subscribe((state) => {
  console.log('Can undo:', state.canUndo);
  console.log('Can redo:', state.canRedo);
});
```

### Command Types

#### Parameter Commands

```typescript
import { ParameterChangeCommand } from './commands/parameterCommands';

const command = new ParameterChangeCommand(
  {
    parameterId: 'filter-cutoff',
    parameterName: 'Filter Cutoff',
    oldValue: 1000,
    newValue: 2000,
  },
  (id, value) => {
    // Update parameter value
    setParameter(id, value);
  }
);

await undoManager.execute(command);
```

#### Preset Commands

```typescript
import { PresetCreateCommand } from './commands/presetCommands';

const command = new PresetCreateCommand(
  {
    presetId: 'preset-123',
    presetName: 'My Preset',
    newState: presetData,
  },
  (id, name, data) => createPreset(id, name, data),
  (id) => deletePreset(id)
);
```

#### MIDI Commands

```typescript
import { MidiNoteAddCommand } from './commands/midiAutomationCommands';

const command = new MidiNoteAddCommand(
  {
    type: 'add',
    noteId: 'note-123',
    note: 60,
    startTime: 0.0,
    duration: 1.0,
    velocity: 100,
  },
  addNote,
  deleteNote
);
```

### Batch Commands

Group multiple commands into a single undoable action:

```typescript
const transaction = undoManager.beginTransaction('Randomize Parameters');

transaction.add(new ParameterChangeCommand(...));
transaction.add(new ParameterChangeCommand(...));
transaction.add(new ParameterChangeCommand(...));

await transaction.commit();
```

---

## Drag and Drop

A comprehensive drag and drop system with visual feedback and drop zone validation.

### Setup

Wrap your app in the DragDropProvider:

```tsx
import { DragDropProvider } from './modules/uiux';

function App() {
  return (
    <DragDropProvider
      config={{
        enableFeedback: true,
        snapToGrid: false,
        gridSize: 10,
      }}
    >
      {/* Your app */}
    </DragDropProvider>
  );
}
```

### Making Elements Draggable

```tsx
import { useDraggable, DragItemType } from './modules/uiux';

function PresetItem({ preset }) {
  const { isDragging, dragHandleProps } = useDraggable(
    {
      type: DragItemType.PRESET,
      id: preset.id,
      data: {
        presetId: preset.id,
        presetName: preset.name,
        presetData: preset.data,
      },
    },
    `preset-${preset.id}`
  );

  return (
    <div
      {...dragHandleProps}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {preset.name}
    </div>
  );
}
```

### Creating Drop Zones

```tsx
import { useDropZone, DragItemType } from './modules/uiux';

function PresetDropZone() {
  const { isOver, canDrop, dropZoneProps } = useDropZone({
    id: 'preset-drop-zone',
    accepts: [DragItemType.PRESET],
    onDrop: (item) => {
      console.log('Dropped:', item.data.presetName);
      loadPreset(item.data.presetData);
    },
    canDrop: (item) => {
      // Custom validation
      return item.data.presetData !== null;
    },
  });

  return (
    <div
      {...dropZoneProps}
      style={{
        minHeight: 100,
        border: isOver && canDrop ? '2px dashed blue' : '1px solid gray',
      }}
    >
      Drop preset here
    </div>
  );
}
```

---

## Keyboard Shortcuts

A flexible keyboard shortcut system with automatic conflict detection.

### Basic Usage

```typescript
import { getKeyboardShortcutManager } from './modules/uiux';

const shortcutManager = getKeyboardShortcutManager();

// Start listening
shortcutManager.start();

// Register shortcuts
const unregister = shortcutManager.register({
  key: 's',
  ctrlKey: true,
  description: 'Save preset',
  category: 'file',
  action: () => {
    savePreset();
  },
});

// Unregister when done
unregister();

// Stop listening
shortcutManager.stop();
```

### Default Shortcuts

```typescript
import { DEFAULT_SHORTCUTS } from './modules/uiux';

shortcutManager.registerAll([
  { ...DEFAULT_SHORTCUTS.UNDO, action: () => undoManager.undo() },
  { ...DEFAULT_SHORTCUTS.REDO, action: () => undoManager.redo() },
  { ...DEFAULT_SHORTCUTS.SAVE, action: () => saveProject() },
]);
```

### Formatting Shortcuts for Display

```typescript
import { KeyboardShortcutManager } from './modules/uiux';

const shortcut = { key: 'z', ctrlKey: true };
const formatted = KeyboardShortcutManager.formatShortcut(shortcut);
// Returns: "Ctrl+Z" on Windows/Linux, "⌃Z" on Mac
```

---

## UI Components

### Context Menu

```tsx
import { useContextMenu, ContextMenu } from './modules/uiux';

function MyComponent() {
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  const items = [
    {
      id: 'copy',
      label: 'Copy',
      shortcut: 'Ctrl+C',
      onClick: () => copy(),
    },
    {
      id: 'paste',
      label: 'Paste',
      shortcut: 'Ctrl+V',
      onClick: () => paste(),
    },
    { id: 'sep1', separator: true },
    {
      id: 'delete',
      label: 'Delete',
      danger: true,
      onClick: () => deleteItem(),
    },
  ];

  return (
    <>
      <div onContextMenu={(e) => showContextMenu(items, e)}>
        Right-click me
      </div>

      {contextMenu && (
        <ContextMenu
          items={contextMenu.items}
          position={contextMenu.position}
          onClose={hideContextMenu}
        />
      )}
    </>
  );
}
```

### Tooltip

```tsx
import { Tooltip } from './modules/uiux';

function MyButton() {
  return (
    <Tooltip
      content="This button does something cool"
      position="top"
      delay={500}
    >
      <button>Hover me</button>
    </Tooltip>
  );
}
```

### Loading States

```tsx
import { LoadingSpinner, ProgressBar, Skeleton } from './modules/uiux';

// Spinner
<LoadingSpinner size="medium" message="Loading..." />

// Progress bar
<ProgressBar progress={75} message="Processing..." showPercentage />

// Skeleton loader
<Skeleton width={200} height={20} count={3} />
```

### Error Boundary

```tsx
import { ErrorBoundary, ErrorDisplay } from './modules/uiux';

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logError(error, errorInfo);
      }}
      fallback={(error, errorInfo, reset) => (
        <div>
          <h1>Oops!</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    >
      <MyApp />
    </ErrorBoundary>
  );
}
```

### Undo/Redo Toolbar

```tsx
import { UndoRedoToolbar } from './modules/uiux';

function App() {
  return (
    <div>
      <UndoRedoToolbar showHistory compact={false} />
      {/* Your app */}
    </div>
  );
}
```

---

## Animations

Import the animations CSS:

```typescript
import './styles/animations.css';
```

### Available Animations

```tsx
// Fade
<div className="animate-fade-in">...</div>

// Slide
<div className="animate-slide-in-up">...</div>
<div className="animate-slide-in-down">...</div>

// Scale
<div className="animate-scale-in">...</div>

// Spin (for loaders)
<div className="animate-spin">...</div>

// Pulse
<div className="animate-pulse">...</div>

// Hover effects
<button className="hover-lift">Lift on hover</button>
<button className="hover-scale">Scale on hover</button>
<button className="hover-glow">Glow on hover</button>
```

---

## Usage Examples

### Complete Undo/Redo Integration

```tsx
import { useEffect } from 'react';
import { getUndoManager, ParameterChangeCommand, UndoRedoToolbar } from './modules/undoredo';
import { getKeyboardShortcutManager, DEFAULT_SHORTCUTS } from './modules/uiux';

function SynthesizerApp() {
  const undoManager = getUndoManager();
  const shortcutManager = getKeyboardShortcutManager();

  useEffect(() => {
    // Setup keyboard shortcuts
    shortcutManager.start();
    shortcutManager.registerAll([
      { ...DEFAULT_SHORTCUTS.UNDO, action: () => undoManager.undo() },
      { ...DEFAULT_SHORTCUTS.REDO, action: () => undoManager.redo() },
    ]);

    return () => {
      shortcutManager.stop();
    };
  }, []);

  const handleParameterChange = (id: string, oldValue: number, newValue: number) => {
    const command = new ParameterChangeCommand(
      { parameterId: id, oldValue, newValue },
      (id, value) => setParameter(id, value)
    );
    undoManager.execute(command);
  };

  return (
    <div>
      <UndoRedoToolbar showHistory />
      {/* Rest of your app */}
    </div>
  );
}
```

### Drag and Drop Preset Management

```tsx
import { DragDropProvider, useDraggable, useDropZone, DragItemType } from './modules/uiux';

function PresetManager() {
  return (
    <DragDropProvider>
      <div style={{ display: 'flex', gap: 20 }}>
        <PresetList />
        <PresetDropZone />
      </div>
    </DragDropProvider>
  );
}

function PresetList() {
  const presets = usePresets();

  return (
    <div>
      {presets.map(preset => (
        <DraggablePreset key={preset.id} preset={preset} />
      ))}
    </div>
  );
}

function DraggablePreset({ preset }) {
  const { isDragging, dragHandleProps } = useDraggable(
    {
      type: DragItemType.PRESET,
      id: preset.id,
      data: preset,
    },
    `preset-${preset.id}`
  );

  return (
    <div
      {...dragHandleProps}
      style={{
        padding: 10,
        margin: 5,
        backgroundColor: '#333',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {preset.name}
    </div>
  );
}

function PresetDropZone() {
  const { isOver, dropZoneProps } = useDropZone({
    id: 'main-drop-zone',
    accepts: [DragItemType.PRESET],
    onDrop: (item) => {
      loadPreset(item.data);
    },
  });

  return (
    <div
      {...dropZoneProps}
      style={{
        width: 300,
        height: 200,
        border: isOver ? '2px dashed blue' : '2px dashed gray',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      Drop preset here to load
    </div>
  );
}
```

---

## Best Practices

1. **Command Design**
   - Keep commands focused on a single operation
   - Store all necessary data for undo/redo
   - Implement merge() for frequently adjusted parameters

2. **Drag and Drop**
   - Use meaningful drag item types
   - Provide visual feedback during drag
   - Validate drops with canDrop()

3. **Keyboard Shortcuts**
   - Use standard shortcuts when possible
   - Avoid conflicts with browser shortcuts
   - Provide visual indicators (tooltips)

4. **Error Handling**
   - Wrap top-level components in ErrorBoundary
   - Log errors for debugging
   - Provide user-friendly error messages

5. **Performance**
   - Limit undo history size
   - Use command merging for continuous actions
   - Debounce rapid parameter changes

---

## File Structure

```
src/
├── shared/
│   ├── undoRedoTypes.ts       # Undo/redo type definitions
│   └── dragDropTypes.ts       # Drag/drop type definitions
├── renderer/
│   ├── commands/
│   │   ├── parameterCommands.ts
│   │   ├── presetCommands.ts
│   │   ├── midiAutomationCommands.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── ContextMenu.tsx
│   │   ├── Tooltip.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── UndoRedoToolbar.tsx
│   │   └── index.ts
│   ├── contexts/
│   │   └── DragDropContext.tsx
│   ├── utils/
│   │   ├── undoManager.ts
│   │   └── keyboardShortcuts.ts
│   ├── modules/
│   │   ├── undoredo/
│   │   │   └── index.ts
│   │   └── uiux/
│   │       └── index.ts
│   └── styles/
│       ├── animations.css
│       └── uiux.css
└── docs/
    └── UNDO_REDO_AND_UIUX.md
```

---

## API Reference

See inline documentation in source files for detailed API information.
