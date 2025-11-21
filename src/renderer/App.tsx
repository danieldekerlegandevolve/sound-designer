import React from 'react';
import { useProjectStore } from './store/projectStore';
import { useToastStore } from './store/toastStore';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import { UIDesigner } from './modules/ui-designer/UIDesigner';
import { DSPDesigner } from './modules/dsp-designer/DSPDesigner';
import { CodeEditor } from './modules/code-editor/CodeEditor';
import { Preview } from './modules/preview/Preview';
import { DAW } from './modules/daw/DAW';
import { KeyboardShortcuts } from './utils/keyboardShortcuts';
import './App.css';

export function App() {
  const selectedMode = useProjectStore((state) => state.selectedMode);
  const isDirty = useProjectStore((state) => state.isDirty);
  const autoSaveEnabled = useProjectStore((state) => state.autoSaveEnabled);
  const saveProject = useProjectStore((state) => state.saveProject);
  const currentFilePath = useProjectStore((state) => state.currentFilePath);
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  // Autosave every 30 seconds if enabled and dirty
  React.useEffect(() => {
    if (!autoSaveEnabled || !isDirty || !currentFilePath) {
      return;
    }

    const timer = setTimeout(() => {
      saveProject();
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [autoSaveEnabled, isDirty, currentFilePath, saveProject]);

  const renderEditor = () => {
    switch (selectedMode) {
      case 'ui':
        return <UIDesigner />;
      case 'dsp':
        return <DSPDesigner />;
      case 'code':
        return <CodeEditor />;
      case 'preview':
        return <Preview />;
      case 'daw':
        return <DAW />;
      default:
        return <UIDesigner />;
    }
  };

  return (
    <div className="app">
      <KeyboardShortcuts />
      <Toolbar />
      <div className="app-content">
        <Sidebar />
        <main className="editor-area">
          {renderEditor()}
        </main>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
