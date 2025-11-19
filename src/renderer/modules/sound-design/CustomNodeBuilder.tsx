import React, { useState } from 'react';
import { Code, Plus, Trash2, Save, Play } from 'lucide-react';
import './CustomNodeBuilder.css';

interface NodeParameter {
  id: string;
  name: string;
  type: 'float' | 'int' | 'bool' | 'enum';
  min?: number;
  max?: number;
  default: any;
  options?: string[];
}

interface CustomNode {
  id: string;
  name: string;
  category: 'generator' | 'effect' | 'filter' | 'utility';
  description: string;
  parameters: NodeParameter[];
  inputs: string[];
  outputs: string[];
  code: {
    init: string;
    process: string;
    helpers: string;
  };
  color: string;
}

interface CustomNodeBuilderProps {
  onSave?: (node: CustomNode) => void;
  initialNode?: CustomNode;
}

export function CustomNodeBuilder({ onSave, initialNode }: CustomNodeBuilderProps) {
  const [node, setNode] = useState<CustomNode>(
    initialNode || {
      id: Date.now().toString(),
      name: 'Custom Node',
      category: 'effect',
      description: 'A custom DSP node',
      parameters: [],
      inputs: ['input'],
      outputs: ['output'],
      code: {
        init: '// Initialize node state\n',
        process: '// Process audio sample\nreturn input;\n',
        helpers: '// Helper functions\n',
      },
      color: '#4a9eff',
    }
  );

  const [activeTab, setActiveTab] = useState<'init' | 'process' | 'helpers'>('process');

  const updateNode = (updates: Partial<CustomNode>) => {
    setNode({ ...node, ...updates });
  };

  const updateCode = (key: keyof CustomNode['code'], value: string) => {
    setNode({
      ...node,
      code: { ...node.code, [key]: value },
    });
  };

  const addParameter = () => {
    const newParam: NodeParameter = {
      id: Date.now().toString(),
      name: `param${node.parameters.length + 1}`,
      type: 'float',
      min: 0,
      max: 1,
      default: 0.5,
    };
    updateNode({ parameters: [...node.parameters, newParam] });
  };

  const updateParameter = (id: string, updates: Partial<NodeParameter>) => {
    updateNode({
      parameters: node.parameters.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  };

  const removeParameter = (id: string) => {
    updateNode({
      parameters: node.parameters.filter((p) => p.id !== id),
    });
  };

  const addInput = () => {
    updateNode({ inputs: [...node.inputs, `input${node.inputs.length + 1}`] });
  };

  const addOutput = () => {
    updateNode({ outputs: [...node.outputs, `output${node.outputs.length + 1}`] });
  };

  const removeInput = (index: number) => {
    const newInputs = [...node.inputs];
    newInputs.splice(index, 1);
    updateNode({ inputs: newInputs });
  };

  const removeOutput = (index: number) => {
    const newOutputs = [...node.outputs];
    newOutputs.splice(index, 1);
    updateNode({ outputs: newOutputs });
  };

  const testNode = () => {
    try {
      // Create a simple test function
      const testFunc = new Function('input', node.code.process);
      const result = testFunc(0.5);
      alert(`Test successful! Output: ${result}`);
    } catch (error: any) {
      alert(`Test failed: ${error.message}`);
    }
  };

  const saveNode = () => {
    if (onSave) {
      onSave(node);
    }

    // Also export as JSON
    const dataStr = JSON.stringify(node, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${node.name.replace(/\s+/g, '_')}_node.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const categoryColors = {
    generator: '#4ade80',
    effect: '#4a9eff',
    filter: '#8b5cf6',
    utility: '#fbbf24',
  };

  return (
    <div className="custom-node-builder">
      <div className="builder-header">
        <div className="header-left">
          <Code size={24} />
          <input
            type="text"
            className="node-name-input"
            value={node.name}
            onChange={(e) => updateNode({ name: e.target.value })}
            placeholder="Node name"
          />
        </div>
        <div className="header-right">
          <button className="test-btn" onClick={testNode}>
            <Play size={16} />
            Test
          </button>
          <button className="save-btn" onClick={saveNode}>
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      <div className="builder-content">
        <div className="node-config">
          <div className="config-section">
            <h3>Basic Info</h3>
            <div className="config-row">
              <label>Category</label>
              <select
                value={node.category}
                onChange={(e) =>
                  updateNode({
                    category: e.target.value as CustomNode['category'],
                    color: categoryColors[e.target.value as CustomNode['category']],
                  })
                }
              >
                <option value="generator">Generator</option>
                <option value="effect">Effect</option>
                <option value="filter">Filter</option>
                <option value="utility">Utility</option>
              </select>
            </div>
            <div className="config-row">
              <label>Description</label>
              <textarea
                value={node.description}
                onChange={(e) => updateNode({ description: e.target.value })}
                placeholder="Describe what this node does..."
                rows={3}
              />
            </div>
            <div className="config-row">
              <label>Color</label>
              <input
                type="color"
                value={node.color}
                onChange={(e) => updateNode({ color: e.target.value })}
              />
            </div>
          </div>

          <div className="config-section">
            <div className="section-header">
              <h3>Parameters</h3>
              <button className="add-btn" onClick={addParameter}>
                <Plus size={14} />
                Add
              </button>
            </div>
            <div className="parameters-list">
              {node.parameters.length === 0 ? (
                <p className="empty-message">No parameters defined</p>
              ) : (
                node.parameters.map((param) => (
                  <div key={param.id} className="parameter-item">
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => updateParameter(param.id, { name: e.target.value })}
                      placeholder="Parameter name"
                    />
                    <select
                      value={param.type}
                      onChange={(e) =>
                        updateParameter(param.id, {
                          type: e.target.value as NodeParameter['type'],
                        })
                      }
                    >
                      <option value="float">Float</option>
                      <option value="int">Int</option>
                      <option value="bool">Bool</option>
                      <option value="enum">Enum</option>
                    </select>
                    {(param.type === 'float' || param.type === 'int') && (
                      <>
                        <input
                          type="number"
                          value={param.min}
                          onChange={(e) =>
                            updateParameter(param.id, { min: parseFloat(e.target.value) })
                          }
                          placeholder="Min"
                        />
                        <input
                          type="number"
                          value={param.max}
                          onChange={(e) =>
                            updateParameter(param.id, { max: parseFloat(e.target.value) })
                          }
                          placeholder="Max"
                        />
                      </>
                    )}
                    <button
                      className="remove-param-btn"
                      onClick={() => removeParameter(param.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="config-section">
            <div className="section-header">
              <h3>I/O Ports</h3>
            </div>
            <div className="io-config">
              <div className="io-group">
                <label>Inputs</label>
                <div className="ports-list">
                  {node.inputs.map((input, i) => (
                    <div key={i} className="port-item">
                      <span>{input}</span>
                      {node.inputs.length > 1 && (
                        <button onClick={() => removeInput(i)}>×</button>
                      )}
                    </div>
                  ))}
                  <button className="add-port-btn" onClick={addInput}>
                    + Add Input
                  </button>
                </div>
              </div>
              <div className="io-group">
                <label>Outputs</label>
                <div className="ports-list">
                  {node.outputs.map((output, i) => (
                    <div key={i} className="port-item">
                      <span>{output}</span>
                      {node.outputs.length > 1 && (
                        <button onClick={() => removeOutput(i)}>×</button>
                      )}
                    </div>
                  ))}
                  <button className="add-port-btn" onClick={addOutput}>
                    + Add Output
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="code-editor-panel">
          <div className="code-tabs">
            <button
              className={activeTab === 'init' ? 'active' : ''}
              onClick={() => setActiveTab('init')}
            >
              Initialize
            </button>
            <button
              className={activeTab === 'process' ? 'active' : ''}
              onClick={() => setActiveTab('process')}
            >
              Process
            </button>
            <button
              className={activeTab === 'helpers' ? 'active' : ''}
              onClick={() => setActiveTab('helpers')}
            >
              Helpers
            </button>
          </div>

          <div className="code-content">
            {activeTab === 'init' && (
              <div className="code-section">
                <p className="code-help">
                  Initialize node state (runs once when node is created)
                </p>
                <textarea
                  className="code-textarea"
                  value={node.code.init}
                  onChange={(e) => updateCode('init', e.target.value)}
                  placeholder="// Initialize state variables"
                  spellCheck={false}
                />
              </div>
            )}

            {activeTab === 'process' && (
              <div className="code-section">
                <p className="code-help">
                  Process audio sample (called for each audio sample)
                  <br />
                  Available: input (audio sample), parameters (object)
                </p>
                <textarea
                  className="code-textarea"
                  value={node.code.process}
                  onChange={(e) => updateCode('process', e.target.value)}
                  placeholder="// Process audio\nreturn input;"
                  spellCheck={false}
                />
              </div>
            )}

            {activeTab === 'helpers' && (
              <div className="code-section">
                <p className="code-help">Helper functions and utilities</p>
                <textarea
                  className="code-textarea"
                  value={node.code.helpers}
                  onChange={(e) => updateCode('helpers', e.target.value)}
                  placeholder="// Helper functions"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          <div className="code-examples">
            <h4>Examples</h4>
            <button
              onClick={() =>
                updateCode('process', 'return input * parameters.gain;')
              }
            >
              Simple Gain
            </button>
            <button
              onClick={() =>
                updateCode(
                  'process',
                  'return Math.tanh(input * parameters.drive);'
                )
              }
            >
              Saturation
            </button>
            <button
              onClick={() =>
                updateCode(
                  'process',
                  'const wet = input * parameters.amount;\nconst dry = input * (1 - parameters.amount);\nreturn wet + dry;'
                )
              }
            >
              Wet/Dry Mix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
