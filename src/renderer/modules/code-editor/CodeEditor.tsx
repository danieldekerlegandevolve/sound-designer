import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../../store/projectStore';
import './CodeEditor.css';

type CodeType = 'dsp' | 'ui' | 'helpers';

export function CodeEditor() {
  const { project, updateCode } = useProjectStore();
  const [selectedFile, setSelectedFile] = useState<CodeType>('dsp');

  const files = [
    { id: 'dsp' as CodeType, label: 'DSP Processing', language: 'cpp' },
    { id: 'ui' as CodeType, label: 'UI Customization', language: 'javascript' },
    { id: 'helpers' as CodeType, label: 'Helper Functions', language: 'javascript' },
  ];

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateCode(selectedFile, value);
    }
  };

  return (
    <div className="code-editor">
      <div className="code-tabs">
        {files.map((file) => (
          <button
            key={file.id}
            className={`code-tab ${selectedFile === file.id ? 'active' : ''}`}
            onClick={() => setSelectedFile(file.id)}
          >
            {file.label}
          </button>
        ))}
      </div>

      <div className="editor-container">
        <Editor
          height="100%"
          language={files.find((f) => f.id === selectedFile)?.language || 'cpp'}
          value={project.code[selectedFile]}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 13,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            rulers: [80, 120],
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      <div className="code-info">
        <div className="info-section">
          <h4>DSP Processing</h4>
          <p>
            Write C++ code for audio processing. This code will be compiled into the final
            plugin. Use JUCE framework APIs for audio processing.
          </p>
        </div>

        <div className="info-section">
          <h4>UI Customization</h4>
          <p>
            Add custom JavaScript logic for UI interactions and animations. This code runs
            in the plugin's UI thread.
          </p>
        </div>

        <div className="info-section">
          <h4>Helper Functions</h4>
          <p>
            Create reusable utility functions that can be used in both DSP and UI code.
          </p>
        </div>
      </div>
    </div>
  );
}
