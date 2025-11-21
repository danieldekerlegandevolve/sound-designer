import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../../store/projectStore';
import { UIComponent, DSPNode } from '@shared/types';
import { generatePluginPreviewCode } from '../../utils/CodeGenerator';
import { generateDSPNodeCode, generateUIComponentCode } from '../../utils/IndividualCodeGenerator';
import './CodeEditor.css';

type CodeTab = 'dsp' | 'ui' | 'helpers' | 'preview';

export function CodeEditor() {
  const {
    project,
    updateCode,
    updateDSPNodeCode,
    updateUIComponentCode,
    selectedDSPNode: storeSelectedDSPNode,
    selectedUIComponent: storeSelectedUIComponent
  } = useProjectStore();

  const [selectedTab, setSelectedTab] = useState<CodeTab>('dsp');
  const [selectedDSPNodeId, setSelectedDSPNodeId] = useState<string | null>(null);
  const [selectedUIComponentId, setSelectedUIComponentId] = useState<string | null>(null);
  const [showItemList, setShowItemList] = useState(true);

  const tabs = [
    { id: 'dsp' as CodeTab, label: 'DSP Processing', language: 'cpp' },
    { id: 'ui' as CodeTab, label: 'UI Customization', language: 'javascript' },
    { id: 'helpers' as CodeTab, label: 'Helper Functions', language: 'javascript' },
    { id: 'preview' as CodeTab, label: 'Plugin Preview', language: 'cpp' },
  ];

  // Auto-select first item when tab changes
  useEffect(() => {
    if (selectedTab === 'dsp' && project.dspGraph.nodes.length > 0 && !selectedDSPNodeId) {
      setSelectedDSPNodeId(project.dspGraph.nodes[0].id);
    } else if (selectedTab === 'ui' && project.uiComponents.length > 0 && !selectedUIComponentId) {
      setSelectedUIComponentId(project.uiComponents[0].id);
    }
  }, [selectedTab, project.dspGraph.nodes, project.uiComponents]);

  // Sync with store selections
  useEffect(() => {
    if (storeSelectedDSPNode && selectedTab === 'dsp') {
      setSelectedDSPNodeId(storeSelectedDSPNode);
    }
  }, [storeSelectedDSPNode, selectedTab]);

  useEffect(() => {
    if (storeSelectedUIComponent && selectedTab === 'ui') {
      setSelectedUIComponentId(storeSelectedUIComponent);
    }
  }, [storeSelectedUIComponent, selectedTab]);

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;

    // Prevent updates during programmatic changes
    // Only update if the value actually differs from current state
    if (selectedTab === 'helpers') {
      if (value !== project.code.helpers) {
        updateCode('helpers', value);
      }
    } else if (selectedTab === 'dsp' && selectedDSPNodeId) {
      const node = project.dspGraph.nodes.find(n => n.id === selectedDSPNodeId);
      const currentCode = node?.code || generateDSPNodeCode(node!);
      if (value !== currentCode) {
        updateDSPNodeCode(selectedDSPNodeId, value);
      }
    } else if (selectedTab === 'ui' && selectedUIComponentId) {
      const component = project.uiComponents.find(c => c.id === selectedUIComponentId);
      const currentCode = component?.code || generateUIComponentCode(component!);
      if (value !== currentCode) {
        updateUIComponentCode(selectedUIComponentId, value);
      }
    }
    // Preview is read-only, no updates
  };

  const getEditorValue = (): string => {
    switch (selectedTab) {
      case 'dsp': {
        if (!selectedDSPNodeId) return '// Select a DSP node to view its code';
        const node = project.dspGraph.nodes.find(n => n.id === selectedDSPNodeId);
        if (!node) return '// Node not found';
        // Return custom code if available, otherwise generate default
        return node.code || generateDSPNodeCode(node);
      }

      case 'ui': {
        if (!selectedUIComponentId) return '// Select a UI component to view its code';
        const component = project.uiComponents.find(c => c.id === selectedUIComponentId);
        if (!component) return '// Component not found';
        // Return custom code if available, otherwise generate default
        return component.code || generateUIComponentCode(component);
      }

      case 'helpers':
        return project.code.helpers || '// Create reusable helper functions here\n';

      case 'preview':
        return generatePluginPreviewCode(project);

      default:
        return '';
    }
  };

  const getEditorLanguage = (): string => {
    const tab = tabs.find(t => t.id === selectedTab);
    return tab?.language || 'cpp';
  };

  const isEditorReadOnly = (): boolean => {
    if (selectedTab === 'preview') return true;
    if (selectedTab === 'dsp' && !selectedDSPNodeId) return true;
    if (selectedTab === 'ui' && !selectedUIComponentId) return true;
    return false;
  };

  // Generate unique key for editor to force remount when switching items
  const getEditorKey = (): string => {
    if (selectedTab === 'dsp') {
      return `dsp-${selectedDSPNodeId || 'none'}`;
    } else if (selectedTab === 'ui') {
      return `ui-${selectedUIComponentId || 'none'}`;
    } else {
      return selectedTab;
    }
  };

  const handleDSPNodeClick = (nodeId: string) => {
    setSelectedDSPNodeId(nodeId);
  };

  const handleUIComponentClick = (componentId: string) => {
    setSelectedUIComponentId(componentId);
  };

  const renderItemList = () => {
    if (!showItemList) return null;

    if (selectedTab === 'dsp') {
      return (
        <div className="item-list">
          <div className="item-list-header">
            <h4>DSP Nodes ({project.dspGraph.nodes.length})</h4>
          </div>
          <div className="item-list-content">
            {project.dspGraph.nodes.map((node) => {
              // Only show checkmark if custom code exists and differs from generated default
              const hasCustomCode = node.code && node.code.trim().length > 0 &&
                                   node.code !== generateDSPNodeCode(node);
              return (
                <div
                  key={node.id}
                  className={`item-list-item ${selectedDSPNodeId === node.id ? 'active' : ''}`}
                  onClick={() => handleDSPNodeClick(node.id)}
                  title={`Click to edit ${node.label || node.type} code`}
                >
                  <span className="dsp-color" style={{ backgroundColor: getDSPNodeColor(node.type) }} />
                  <div className="item-info">
                    <span className="item-name">{node.label || node.type}</span>
                    <span className="item-type">{node.type}</span>
                  </div>
                  {hasCustomCode && <span className="item-badge">✓</span>}
                </div>
              );
            })}
            {project.dspGraph.nodes.length === 0 && (
              <div className="empty-message">
                No DSP nodes yet.<br />
                Add nodes in the DSP Designer.
              </div>
            )}
          </div>
        </div>
      );
    }

    if (selectedTab === 'ui') {
      return (
        <div className="item-list">
          <div className="item-list-header">
            <h4>UI Components ({project.uiComponents.length})</h4>
          </div>
          <div className="item-list-content">
            {project.uiComponents.map((comp) => {
              // Only show checkmark if custom code exists and differs from generated default
              const hasCustomCode = comp.code && comp.code.trim().length > 0 &&
                                   comp.code !== generateUIComponentCode(comp);
              return (
                <div
                  key={comp.id}
                  className={`item-list-item ${selectedUIComponentId === comp.id ? 'active' : ''}`}
                  onClick={() => handleUIComponentClick(comp.id)}
                  title={`Click to edit ${comp.label} code`}
                >
                  <span className="component-icon">{getUIComponentIcon(comp.type)}</span>
                  <div className="item-info">
                    <span className="item-name">{comp.label}</span>
                    <span className="item-type">{comp.type}</span>
                  </div>
                  {hasCustomCode && <span className="item-badge">✓</span>}
                </div>
              );
            })}
            {project.uiComponents.length === 0 && (
              <div className="empty-message">
                No UI components yet.<br />
                Add components in the UI Designer.
              </div>
            )}
          </div>
        </div>
      );
    }

    // For helpers and preview, don't show item list
    return null;
  };

  const getCodeHints = (): string => {
    if (selectedTab === 'dsp' && selectedDSPNodeId) {
      const node = project.dspGraph.nodes.find(n => n.id === selectedDSPNodeId);
      if (!node) return '';
      return generateDSPNodeHints(node);
    }

    if (selectedTab === 'ui' && selectedUIComponentId) {
      const component = project.uiComponents.find(c => c.id === selectedUIComponentId);
      if (!component) return '';
      return generateUIComponentHints(component, project);
    }

    if (selectedTab === 'helpers') {
      return `// Helper Functions
// Create reusable utility functions that can be used across your DSP nodes and UI components.
// These functions will be available in the Plugin Preview.`;
    }

    if (selectedTab === 'preview') {
      const nodeCount = project.dspGraph.nodes.length;
      const componentCount = project.uiComponents.length;
      const customNodeCodes = project.dspGraph.nodes.filter(n =>
        n.code && n.code.trim().length > 0 && n.code !== generateDSPNodeCode(n)
      ).length;
      const customComponentCodes = project.uiComponents.filter(c =>
        c.code && c.code.trim().length > 0 && c.code !== generateUIComponentCode(c)
      ).length;

      return `// Plugin Preview (Read-Only)
//
// This preview combines all your individual node and component code
// into a complete plugin implementation.
//
// Statistics:
//   - ${nodeCount} DSP node${nodeCount !== 1 ? 's' : ''} (${customNodeCodes} customized)
//   - ${componentCount} UI component${componentCount !== 1 ? 's' : ''} (${customComponentCodes} customized)
//
// To edit code, switch to the DSP Processing or UI Customization tabs.`;
    }

    return '';
  };

  return (
    <div className="code-editor">
      <div className="code-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`code-tab ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        {(selectedTab === 'dsp' || selectedTab === 'ui') && (
          <button
            className="code-tab toggle-panel"
            onClick={() => setShowItemList(!showItemList)}
            title={showItemList ? 'Hide item list' : 'Show item list'}
          >
            {showItemList ? '◀' : '▶'}
          </button>
        )}
      </div>

      <div className="code-editor-content">
        {renderItemList()}

        <div className="editor-main">
          <div className="editor-container">
            <Editor
              key={getEditorKey()}
              height="100%"
              language={getEditorLanguage()}
              value={getEditorValue()}
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
                readOnly: isEditorReadOnly(),
              }}
            />
          </div>

          {getCodeHints() && (
            <div className="code-hints">
              <h4>💡 Code Hints</h4>
              <pre>{getCodeHints()}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions

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

function generateDSPNodeHints(node: DSPNode): string {
  let hints = `// ${node.label || node.type} - ${capitalize(node.type)} Node\n`;
  hints += `//\n`;

  if (node.parameters && node.parameters.length > 0) {
    hints += `// Parameters:\n`;
    node.parameters.forEach((param) => {
      hints += `//   - ${param.name}: `;
      if (param.type === 'enum' && param.options) {
        hints += `${param.options.join('|')} (current: ${param.value})\n`;
      } else {
        hints += `${param.min || 0} - ${param.max || 1}`;
        if (param.unit) hints += ` ${param.unit}`;
        hints += ` (current: ${param.value})\n`;
      }
    });
    hints += `//\n`;
  }

  hints += `// This code defines the processing behavior for this DSP node.\n`;
  hints += `// The code will be integrated into the final plugin preview.\n`;
  hints += `//\n`;
  hints += `// Tip: You can use the parameters above in your processing code.`;

  return hints;
}

function generateUIComponentHints(component: UIComponent, project: any): string {
  let hints = `// ${component.label} - ${capitalize(component.type)} Component\n`;
  hints += `// Type: ${component.type}\n`;
  hints += `// Position: (${component.x}, ${component.y})\n`;
  hints += `// Size: ${component.width} x ${component.height}\n`;
  hints += `//\n`;

  if (component.parameterId) {
    const mappedParam = project.dspGraph.nodes
      .flatMap((node: DSPNode) => node.parameters || [])
      .find((p: any) => p.id === component.parameterId);

    if (mappedParam) {
      hints += `// Linked to parameter: ${mappedParam.name}\n`;
      hints += `// Range: ${mappedParam.min || 0} - ${mappedParam.max || 1}\n`;
    }
  } else {
    hints += `// Not linked to any parameter\n`;
    hints += `// To link, use the Properties Panel in UI Designer\n`;
  }

  hints += `//\n`;
  hints += `// This code defines the behavior and interaction for this UI component.\n`;
  hints += `// It will be integrated into the final plugin preview.`;

  return hints;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
