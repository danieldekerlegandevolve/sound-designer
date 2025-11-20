import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import './CustomNodeCreator.css';

/**
 * Custom Node Creator
 * Allows users to create custom DSP nodes with code editor integration
 */

interface CustomNodeCreatorProps {
  onSave: (node: CustomNodeDefinition) => void;
  onCancel: () => void;
}

export interface CustomNodeDefinition {
  name: string;
  category: string;
  inputs: number;
  outputs: number;
  parameters: CustomParameter[];
  code: string;
  codeLanguage: 'javascript' | 'audioworklet' | 'webaudio';
}

interface CustomParameter {
  id: string;
  name: string;
  min: number;
  max: number;
  default: number;
  unit?: string;
}

export const CustomNodeCreator: React.FC<CustomNodeCreatorProps> = ({ onSave, onCancel }) => {
  const [nodeName, setNodeName] = useState('CustomNode');
  const [category, setCategory] = useState('Custom');
  const [inputs, setInputs] = useState(1);
  const [outputs, setOutputs] = useState(1);
  const [parameters, setParameters] = useState<CustomParameter[]>([]);
  const [code, setCode] = useState(getTemplateCode('javascript'));
  const [codeLanguage, setCodeLanguage] = useState<'javascript' | 'audioworklet' | 'webaudio'>(
    'javascript'
  );

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        id: `param${parameters.length + 1}`,
        name: `Parameter ${parameters.length + 1}`,
        min: 0,
        max: 1,
        default: 0.5,
        unit: '',
      },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleUpdateParameter = (index: number, field: keyof CustomParameter, value: any) => {
    const newParams = [...parameters];
    newParams[index] = { ...newParams[index], [field]: value };
    setParameters(newParams);
  };

  const handleLanguageChange = (lang: 'javascript' | 'audioworklet' | 'webaudio') => {
    setCodeLanguage(lang);
    setCode(getTemplateCode(lang));
  };

  const handleSave = () => {
    const nodeDefinition: CustomNodeDefinition = {
      name: nodeName,
      category,
      inputs,
      outputs,
      parameters,
      code,
      codeLanguage,
    };
    onSave(nodeDefinition);
  };

  return (
    <div className="custom-node-creator">
      <div className="creator-header">
        <h2>Create Custom Node</h2>
        <div className="header-actions">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Node
          </button>
        </div>
      </div>

      <div className="creator-content">
        {/* Configuration Panel */}
        <div className="config-panel">
          <h3>Node Configuration</h3>

          <div className="config-section">
            <label>Node Name</label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="Enter node name"
            />
          </div>

          <div className="config-section">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Custom">Custom</option>
              <option value="Synthesis">Synthesis</option>
              <option value="Filters">Filters</option>
              <option value="Effects">Effects</option>
              <option value="Dynamics">Dynamics</option>
              <option value="Utilities">Utilities</option>
            </select>
          </div>

          <div className="config-row">
            <div className="config-section">
              <label>Inputs</label>
              <input
                type="number"
                min="0"
                max="8"
                value={inputs}
                onChange={(e) => setInputs(parseInt(e.target.value))}
              />
            </div>

            <div className="config-section">
              <label>Outputs</label>
              <input
                type="number"
                min="0"
                max="8"
                value={outputs}
                onChange={(e) => setOutputs(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="config-section">
            <div className="section-header">
              <h4>Parameters</h4>
              <button onClick={handleAddParameter} className="btn-small">
                + Add Parameter
              </button>
            </div>

            <div className="parameters-list">
              {parameters.map((param, index) => (
                <div key={index} className="parameter-item">
                  <input
                    type="text"
                    value={param.name}
                    onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                    placeholder="Name"
                  />
                  <input
                    type="number"
                    value={param.min}
                    onChange={(e) =>
                      handleUpdateParameter(index, 'min', parseFloat(e.target.value))
                    }
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={param.max}
                    onChange={(e) =>
                      handleUpdateParameter(index, 'max', parseFloat(e.target.value))
                    }
                    placeholder="Max"
                  />
                  <input
                    type="number"
                    value={param.default}
                    onChange={(e) =>
                      handleUpdateParameter(index, 'default', parseFloat(e.target.value))
                    }
                    placeholder="Default"
                  />
                  <input
                    type="text"
                    value={param.unit || ''}
                    onChange={(e) => handleUpdateParameter(index, 'unit', e.target.value)}
                    placeholder="Unit"
                  />
                  <button
                    onClick={() => handleRemoveParameter(index)}
                    className="btn-danger-small"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="config-section">
            <label>Code Language</label>
            <div className="language-tabs">
              <button
                className={codeLanguage === 'javascript' ? 'active' : ''}
                onClick={() => handleLanguageChange('javascript')}
              >
                JavaScript
              </button>
              <button
                className={codeLanguage === 'audioworklet' ? 'active' : ''}
                onClick={() => handleLanguageChange('audioworklet')}
              >
                AudioWorklet
              </button>
              <button
                className={codeLanguage === 'webaudio' ? 'active' : ''}
                onClick={() => handleLanguageChange('webaudio')}
              >
                Web Audio
              </button>
            </div>
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="code-panel">
          <h3>DSP Code</h3>
          <div className="code-editor">
            <MonacoEditor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Template code generators
function getTemplateCode(language: string): string {
  switch (language) {
    case 'javascript':
      return `// Custom DSP Node
class CustomNode {
  constructor(context) {
    this.context = context;
    this.input = context.createGain();
    this.output = context.createGain();

    // Initialize your DSP here
    this.setupDSP();
  }

  setupDSP() {
    // Create and connect Web Audio nodes
    this.input.connect(this.output);
  }

  setParameter(name, value) {
    // Handle parameter changes
    switch (name) {
      case 'gain':
        this.output.gain.value = value;
        break;
    }
  }

  process() {
    // Called each audio block if needed
  }

  dispose() {
    this.input.disconnect();
    this.output.disconnect();
  }
}

export default CustomNode;
`;

    case 'audioworklet':
      return `// AudioWorklet Processor
class CustomProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'gain',
        defaultValue: 1,
        minValue: 0,
        maxValue: 2,
      },
    ];
  }

  constructor() {
    super();
    // Initialize state
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const gain = parameters.gain;

    for (let channel = 0; channel < output.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      for (let i = 0; i < outputChannel.length; ++i) {
        // Your DSP processing here
        outputChannel[i] = inputChannel[i] * (gain.length > 1 ? gain[i] : gain[0]);
      }
    }

    return true;
  }
}

registerProcessor('custom-processor', CustomProcessor);
`;

    case 'webaudio':
      return `// Web Audio API Node
class CustomWebAudioNode {
  constructor(context) {
    this.context = context;

    // Create native Web Audio nodes
    this.input = context.createGain();
    this.output = context.createGain();
    this.processor = context.createBiquadFilter();

    // Connect nodes
    this.input.connect(this.processor);
    this.processor.connect(this.output);
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }

  setParameter(name, value) {
    switch (name) {
      case 'frequency':
        this.processor.frequency.value = value;
        break;
      case 'Q':
        this.processor.Q.value = value;
        break;
    }
  }
}

export default CustomWebAudioNode;
`;

    default:
      return '';
  }
}

export default CustomNodeCreator;
