import React from 'react';
import { useProjectStore } from './store/projectStore';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { UIDesigner } from './modules/ui-designer/UIDesigner';
import { DSPDesigner } from './modules/dsp-designer/DSPDesigner';
import { CodeEditor } from './modules/code-editor/CodeEditor';
import { Preview } from './modules/preview/Preview';
import { KeyboardShortcuts } from './utils/keyboardShortcuts';
import './App.css';

export function App() {
  const selectedMode = useProjectStore((state) => state.selectedMode);

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
    </div>
  );
}
