# Sound Designer - Integration Guide

This guide explains how all the modules in Sound Designer are integrated together to create a cohesive application.

## Architecture Overview

Sound Designer follows a modular architecture with clear separation of concerns:

```
Sound Designer Application
├── Core Systems (Singleton Managers)
│   ├── HelpContentManager
│   ├── UndoManager
│   ├── KeyboardShortcutManager
│   ├── PerformanceMonitor
│   └── MemoryProfiler
├── Context Providers
│   ├── DragDropProvider
│   └── ErrorBoundary
├── Modules
│   ├── Preset Management
│   ├── MIDI & Piano Roll
│   ├── Modulation & Automation
│   ├── Sample Management
│   ├── Performance Monitoring
│   ├── Help & Documentation
│   └── UI/UX Components
└── Main Application (SoundDesigner.tsx)
```

## Application Initialization

The main application (`SoundDesigner.tsx`) initializes all systems in the correct order:

### 1. Help System Initialization

```typescript
import { initializeHelpContent } from './content/initializeHelpContent';

// Initialize help content
initializeHelpContent();
```

This loads:
- Help articles
- Interactive tutorials
- FAQ items
- Keyboard shortcuts documentation
- Contextual help
- Tips of the day

### 2. Keyboard Shortcuts Registration

```typescript
import { getKeyboardShortcutManager, DEFAULT_SHORTCUTS } from './utils/keyboardShortcuts';
import { getUndoManager } from './utils/undoManager';

const shortcutManager = getKeyboardShortcutManager();
const undoManager = getUndoManager();

shortcutManager.start();

shortcutManager.registerAll([
  { ...DEFAULT_SHORTCUTS.UNDO, action: () => undoManager.undo() },
  { ...DEFAULT_SHORTCUTS.REDO, action: () => undoManager.redo() },
  // ... more shortcuts
]);
```

Global shortcuts registered:
- `Ctrl+Z` - Undo
- `Ctrl+Shift+Z` - Redo
- `F1` - Open Help Center
- `?` - Show Keyboard Shortcuts
- `Ctrl+P` - Open Performance Dashboard

### 3. Performance Monitoring

```typescript
import { getPerformanceMonitor } from './utils/performanceMonitor';

const perfMonitor = getPerformanceMonitor();
perfMonitor.start();
```

This begins tracking:
- CPU usage
- Memory consumption
- Audio buffer performance
- Frame times

### 4. First-Time User Experience

```typescript
const hasSeenWelcome = localStorage.getItem('sound-designer-welcome-seen');
if (!hasSeenWelcome) {
  setShowWelcome(true);
  localStorage.setItem('sound-designer-welcome-seen', 'true');
}
```

## Context Providers

### Drag & Drop Context

Wraps the entire application to enable drag-and-drop functionality:

```typescript
<DragDropProvider>
  <App />
</DragDropProvider>
```

Features:
- Preset drag & drop
- Sample drag & drop
- Modulation source routing
- MIDI note manipulation

### Error Boundary

Catches and handles React component errors:

```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Provides:
- Graceful error handling
- Error reporting
- Fallback UI
- Recovery options

## Module Integration

### Undo/Redo Integration

All modules can integrate with the undo/redo system:

```typescript
import { getUndoManager } from './utils/undoManager';
import { ParameterChangeCommand } from './commands/parameterCommands';

const undoManager = getUndoManager();

// Execute undoable command
const command = new ParameterChangeCommand(
  { parameterId, oldValue, newValue },
  (id, value) => setParameter(id, value)
);

await undoManager.execute(command);
```

Available command types:
- Parameter changes
- Preset operations
- MIDI note edits
- Automation point edits
- Modulation routing changes

### Help System Integration

Components can provide contextual help:

```typescript
import { ContextualHelpPanel, HelpButton } from './modules/help';

<div>
  <MyComponent />
  <HelpButton context="my-component" />
</div>
```

Or open the help center:

```typescript
import { HelpCenter } from './modules/help';

<HelpCenter
  onClose={() => setShowHelp(false)}
  initialTab="tutorials"
  initialQuery="modulation"
/>
```

### Performance Monitoring Integration

Monitor specific operations:

```typescript
import { getPerformanceMonitor } from './utils/performanceMonitor';

const monitor = getPerformanceMonitor();

// Record audio callback time
monitor.recordAudioCallback(duration);

// Record buffer underrun
monitor.recordBufferUnderrun();

// Subscribe to metrics
const unsubscribe = monitor.subscribe((metrics) => {
  console.log('CPU:', metrics.cpuUsage);
  console.log('Memory:', metrics.memoryUsed);
});
```

### Drag & Drop Integration

Make items draggable:

```typescript
import { useDraggable, DragItemType } from './modules/uiux';

const { isDragging, dragHandleProps } = useDraggable(
  {
    type: DragItemType.PRESET,
    id: preset.id,
    data: preset,
  },
  `preset-${preset.id}`
);

<div {...dragHandleProps}>
  Drag me!
</div>
```

Create drop zones:

```typescript
import { useDropZone, DragItemType } from './modules/uiux';

const { isOver, canDrop, dropZoneProps } = useDropZone({
  id: 'drop-zone',
  accepts: [DragItemType.PRESET],
  onDrop: (item) => loadPreset(item.data),
});

<div {...dropZoneProps}>
  Drop here
</div>
```

## UI/UX Components

### Loading States

```typescript
import { LoadingSpinner, Skeleton, ProgressBar } from './modules/uiux';

// Spinner
<LoadingSpinner size="medium" message="Loading..." />

// Skeleton placeholder
<Skeleton width={200} height={20} count={3} />

// Progress bar
<ProgressBar progress={75} message="Processing..." />
```

### Tooltips

```typescript
import { Tooltip } from './modules/uiux';

<Tooltip content="This is helpful info" position="top">
  <button>Hover me</button>
</Tooltip>
```

### Context Menus

```typescript
import { useContextMenu, ContextMenu } from './modules/uiux';

const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

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
```

## Styling Integration

### Import Order

```typescript
// 1. Base animations
import './styles/animations.css';

// 2. UI/UX components
import './styles/uiux.css';

// 3. Help system
import './styles/help.css';

// 4. Main application
import './styles/app.css';
```

### Theme System

All components use consistent color variables:

```css
:root {
  --primary-color: #6496ff;
  --background-dark: #1a1a2e;
  --background-light: rgba(255, 255, 255, 0.05);
  --text-primary: rgba(255, 255, 255, 0.9);
  --text-secondary: rgba(255, 255, 255, 0.6);
  --border-color: rgba(255, 255, 255, 0.1);
}
```

## Data Flow

### State Management

```
User Action
    ↓
Component Event Handler
    ↓
Command Creation
    ↓
UndoManager.execute()
    ↓
State Update
    ↓
Component Re-render
```

### Performance Monitoring Flow

```
Application Start
    ↓
PerformanceMonitor.start()
    ↓
Interval Sampling (100ms)
    ↓
Metric Collection
    ↓
Subscriber Notification
    ↓
UI Update
```

### Help System Flow

```
User Opens Help (F1)
    ↓
HelpCenter Component
    ↓
Search / Browse
    ↓
HelpContentManager
    ↓
Display Content
```

## Best Practices

### 1. Always Use Commands for State Changes

```typescript
// ❌ Bad - Direct state change
setParameter(id, newValue);

// ✅ Good - Use command for undo/redo
const command = new ParameterChangeCommand(...);
undoManager.execute(command);
```

### 2. Subscribe to Performance Metrics

```typescript
useEffect(() => {
  const monitor = getPerformanceMonitor();
  const unsubscribe = monitor.subscribe(handleMetrics);
  return unsubscribe; // Clean up!
}, []);
```

### 3. Wrap Components in Error Boundaries

```typescript
<ErrorBoundary onError={logError}>
  <MyFeature />
</ErrorBoundary>
```

### 4. Provide Contextual Help

```typescript
<div>
  <ComplexFeature />
  <HelpButton context="complex-feature" />
</div>
```

### 5. Use Drag & Drop Provider

```typescript
<DragDropProvider config={{ enableFeedback: true }}>
  <App />
</DragDropProvider>
```

## Module Communication

Modules communicate through:

1. **Singleton Managers** - Shared state
2. **Context Providers** - React Context API
3. **Events** - Custom events where needed
4. **Commands** - For undoable operations

## Testing Integration

When testing integrated features:

1. Initialize all required systems
2. Mock singleton managers if needed
3. Provide context providers
4. Test cross-module interactions

Example:

```typescript
import { getUndoManager, resetUndoManager } from './utils/undoManager';
import { initializeHelpContent } from './content/initializeHelpContent';

beforeAll(() => {
  initializeHelpContent();
});

afterEach(() => {
  resetUndoManager();
});

test('integration test', () => {
  // Test cross-module functionality
});
```

## Performance Considerations

1. **Lazy Load Modules** - Load features on demand
2. **Memoize Expensive Computations** - Use React.memo and useMemo
3. **Debounce User Input** - Especially for undo/redo
4. **Monitor Performance** - Use PerformanceMonitor
5. **Optimize Re-renders** - Use React DevTools

## Troubleshooting

### System Not Initializing

Check console for initialization errors:
```typescript
console.log('🎵 Initializing Sound Designer...');
```

### Shortcuts Not Working

Ensure KeyboardShortcutManager is started:
```typescript
shortcutManager.start();
```

### Undo/Redo Not Working

Check that commands are being executed through UndoManager:
```typescript
await undoManager.execute(command);
```

### Drag & Drop Not Working

Ensure DragDropProvider wraps your components:
```typescript
<DragDropProvider>
  <YourComponent />
</DragDropProvider>
```

## Next Steps

With integration complete, you can:

1. **Add Custom Modules** - Follow the patterns established
2. **Extend Features** - Use the integrated systems
3. **Optimize Performance** - Use PerformanceMonitor insights
4. **Enhance UX** - Add more contextual help and tooltips
5. **Build & Deploy** - Package the integrated application

---

**The integrated application is now ready for use!** All systems work together seamlessly to provide a professional, polished user experience.
