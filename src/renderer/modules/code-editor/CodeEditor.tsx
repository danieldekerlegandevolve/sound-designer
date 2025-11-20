import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../../store/projectStore';
import { UIComponent, DSPNode } from '@shared/types';
import './CodeEditor.css';

type CodeType = 'dsp' | 'ui' | 'helpers';

export function CodeEditor() {
  const { project, updateCode, selectUIComponent, selectDSPNode } = useProjectStore();
  const [selectedFile, setSelectedFile] = useState<CodeType>('dsp');
  const [showComponentPanel, setShowComponentPanel] = useState(true);
  const [codeHints, setCodeHints] = useState<string>('');

  const files = [
    { id: 'dsp' as CodeType, label: 'DSP Processing', language: 'cpp' },
    { id: 'ui' as CodeType, label: 'UI Customization', language: 'javascript' },
    { id: 'helpers' as CodeType, label: 'Helper Functions', language: 'javascript' },
  ];

  // Generate code hints based on selected file and components
  useEffect(() => {
    if (selectedFile === 'dsp') {
      setCodeHints(generateDSPCodeHints(project.dspGraph.nodes));
    } else if (selectedFile === 'ui') {
      setCodeHints(generateUICodeHints(project.uiComponents));
    } else {
      setCodeHints('// Create reusable helper functions here');
    }
  }, [selectedFile, project.dspGraph.nodes, project.uiComponents]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateCode(selectedFile, value);
    }
  };

  const handleComponentClick = (component: UIComponent | DSPNode, type: 'ui' | 'dsp') => {
    if (type === 'ui') {
      selectUIComponent(component.id);
      setSelectedFile('ui');
    } else {
      selectDSPNode(component.id);
      setSelectedFile('dsp');
    }
  };

  const insertCodeSnippet = (snippet: string) => {
    const currentCode = project.code[selectedFile];
    const newCode = currentCode + '\n\n' + snippet;
    updateCode(selectedFile, newCode);
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
        <button
          className="code-tab toggle-panel"
          onClick={() => setShowComponentPanel(!showComponentPanel)}
          title={showComponentPanel ? 'Hide component panel' : 'Show component panel'}
        >
          {showComponentPanel ? '◀' : '▶'} Components
        </button>
      </div>

      <div className="code-editor-content">
        {showComponentPanel && (
          <div className="component-panel">
            <div className="component-section">
              <h4>UI Components ({project.uiComponents.length})</h4>
              <div className="component-list">
                {project.uiComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="component-item"
                    onClick={() => handleComponentClick(comp, 'ui')}
                    title={`Click to view ${comp.label} code`}
                  >
                    <span className="component-icon">{getUIComponentIcon(comp.type)}</span>
                    <span className="component-name">{comp.label}</span>
                    <span className="component-type">{comp.type}</span>
                  </div>
                ))}
                {project.uiComponents.length === 0 && (
                  <div className="empty-message">No UI components yet</div>
                )}
              </div>
            </div>

            <div className="component-section">
              <h4>DSP Nodes ({project.dspGraph.nodes.length})</h4>
              <div className="component-list">
                {project.dspGraph.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="component-item"
                    onClick={() => handleComponentClick(node, 'dsp')}
                    title={`Click to view ${node.label || node.type} code`}
                  >
                    <span className="dsp-color" style={{ backgroundColor: getDSPNodeColor(node.type) }} />
                    <span className="component-name">{node.label || node.type}</span>
                    <span className="component-type">{node.type}</span>
                  </div>
                ))}
                {project.dspGraph.nodes.length === 0 && (
                  <div className="empty-message">No DSP nodes yet</div>
                )}
              </div>
            </div>

            <div className="component-section">
              <h4>Code Snippets</h4>
              <button
                className="snippet-button"
                onClick={() => insertCodeSnippet(getParameterAccessSnippet(selectedFile))}
              >
                + Parameter Access
              </button>
              <button
                className="snippet-button"
                onClick={() => insertCodeSnippet(getComponentIterationSnippet(selectedFile))}
              >
                + Iterate Components
              </button>
              <button
                className="snippet-button"
                onClick={() => insertCodeSnippet(getAudioProcessingSnippet())}
              >
                + Audio Processing
              </button>
            </div>
          </div>
        )}

        <div className="editor-main">
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

          {codeHints && (
            <div className="code-hints">
              <h4>💡 Code Hints</h4>
              <pre>{codeHints}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions for code generation
function generateDSPCodeHints(nodes: DSPNode[]): string {
  if (nodes.length === 0) {
    return '// No DSP nodes in the graph yet.\n// Add nodes in the DSP Designer to generate code hints.';
  }

  let hints = '// Available DSP nodes:\n';
  nodes.forEach((node) => {
    hints += `//   - ${node.label || node.type} (${node.type})\n`;
    if (node.parameters && Object.keys(node.parameters).length > 0) {
      hints += `//     Parameters: ${Object.keys(node.parameters).join(', ')}\n`;
    }
  });
  hints += '\n// Example DSP processing:\n';
  hints += 'void processBlock(float** outputs, int numSamples) {\n';
  hints += '  for (int i = 0; i < numSamples; ++i) {\n';
  hints += '    // Process audio sample by sample\n';
  hints += '    float sample = outputs[0][i];\n';
  nodes.forEach((node) => {
    hints += `    // ${node.type} processing\n`;
  });
  hints += '    outputs[0][i] = sample;\n';
  hints += '    outputs[1][i] = sample;\n';
  hints += '  }\n';
  hints += '}';
  return hints;
}

function generateUICodeHints(components: UIComponent[]): string {
  if (components.length === 0) {
    return '// No UI components yet.\n// Add components in the UI Designer to generate code hints.';
  }

  let hints = '// Available UI components:\n';
  components.forEach((comp) => {
    hints += `//   - ${comp.label} (${comp.type}) at (${comp.x}, ${comp.y})\n`;
    if (comp.properties?.parameter) {
      hints += `//     Controls parameter: ${comp.properties.parameter}\n`;
    }
  });
  hints += '\n// Example UI interaction:\n';
  hints += 'function onComponentChange(componentId, value) {\n';
  hints += '  // Handle component value changes\n';
  components.forEach((comp) => {
    if (comp.properties?.parameter) {
      hints += `  if (componentId === '${comp.id}') {\n`;
      hints += `    setParameter('${comp.properties.parameter}', value);\n`;
      hints += `  }\n`;
    }
  });
  hints += '}';
  return hints;
}

function getUIComponentIcon(type: string): string {
  const icons: Record<string, string> = {
    knob: '⚙️',
    slider: '🎚️',
    button: '🔘',
    toggle: '🔲',
    display: '📊',
    waveform: '〰️',
    keyboard: '🎹',
    'xy-pad': '⊞',
  };
  return icons[type] || '📦';
}

function getDSPNodeColor(type: string): string {
  const colors: Record<string, string> = {
    oscillator: '#4ade80',
    filter: '#4a9eff',
    envelope: '#fb923c',
    lfo: '#a78bfa',
    gain: '#fbbf24',
    delay: '#ec4899',
    reverb: '#8b5cf6',
    distortion: '#ef4444',
    compressor: '#14b8a6',
    eq: '#06b6d4',
    mixer: '#64748b',
    noise: '#f59e0b',
    ringmod: '#10b981',
    bitcrusher: '#f97316',
  };
  return colors[type] || '#64748b';
}

function getParameterAccessSnippet(fileType: CodeType): string {
  if (fileType === 'dsp') {
    return `// Access parameter value
float paramValue = getParameter("parameter_name");

// Set parameter value
setParameter("parameter_name", 0.5f);`;
  }
  return `// Access parameter value
const value = getParameter('parameter_name');

// Update UI when parameter changes
onParameterChange('parameter_name', (value) => {
  updateComponentValue('component_id', value);
});`;
}

function getComponentIterationSnippet(fileType: CodeType): string {
  if (fileType === 'dsp') {
    return `// Iterate through all parameters
for (const auto& param : parameters) {
  float value = param.getValue();
  // Process parameter
}`;
  }
  return `// Iterate through all UI components
components.forEach((component) => {
  if (component.type === 'knob') {
    // Handle knob component
  }
});`;
}

function getAudioProcessingSnippet(): string {
  return `// Process audio buffer
void processAudio(float* leftChannel, float* rightChannel, int numSamples) {
  for (int i = 0; i < numSamples; ++i) {
    // Get input samples
    float left = leftChannel[i];
    float right = rightChannel[i];

    // Process audio
    // ... your DSP code here ...

    // Write output samples
    leftChannel[i] = left;
    rightChannel[i] = right;
  }
}`;
}
