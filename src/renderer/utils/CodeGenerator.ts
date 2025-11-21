import { PluginProject, UIComponent, DSPNode, DSPParameter } from '@shared/types';

/**
 * Auto-generate DSP processing code based on the DSP graph
 */
export function generateDSPCode(project: PluginProject): string {
  const { dspGraph } = project;

  // Generate parameter declarations
  const paramDeclarations = dspGraph.nodes
    .flatMap((node) => node.parameters || [])
    .map((param) => `  float ${param.name}; // ${param.min} - ${param.max}${param.unit ? ` ${param.unit}` : ''}`)
    .join('\n');

  // Generate node processing functions
  const nodeProcessing = dspGraph.nodes
    .map((node) => generateNodeProcessing(node))
    .filter(Boolean)
    .join('\n\n');

  // Generate main processing function
  const processingChain = dspGraph.nodes
    .map((node, i) => `    // ${node.label || node.type}\n    processedSample = process${capitalize(node.type)}(processedSample, ${i});`)
    .join('\n');

  return `// Auto-generated DSP Processing Code
// This code is generated from your DSP Graph

class AudioProcessor {
private:
${paramDeclarations || '  // No parameters yet'}

public:
  void processBlock(float** outputs, int numSamples, int numChannels) {
    for (int i = 0; i < numSamples; ++i) {
      for (int ch = 0; ch < numChannels; ++ch) {
        float processedSample = outputs[ch][i];

${processingChain || '        // No DSP nodes yet'}

        outputs[ch][i] = processedSample;
      }
    }
  }

${nodeProcessing}

  // Update parameter value
  void setParameter(const String& paramName, float value) {
${generateParameterSetters(dspGraph.nodes)}
  }
};

// Initialize processor
AudioProcessor processor;`;
}

/**
 * Auto-generate UI interaction code based on UI components
 */
export function generateUICode(project: PluginProject): string {
  const { uiComponents, dspGraph } = project;

  // Find components with parameter mappings
  const mappedComponents = uiComponents.filter((comp) => comp.parameterId);

  // Generate component initialization
  const componentInit = uiComponents
    .map((comp) => `  // ${comp.label} (${comp.type})
  ${generateComponentInit(comp)}`)
    .join('\n\n');

  // Generate parameter change handlers
  const parameterHandlers = mappedComponents
    .map((comp) => {
      const param = findParameterById(dspGraph.nodes, comp.parameterId!);
      if (!param) return '';

      return `  // ${comp.label} controls ${param.name}
  on${capitalize(comp.id)}Change((value) => {
    processor.setParameter("${param.name}", value);
    updateDisplay("${comp.id}", value);
  });`;
    })
    .filter(Boolean)
    .join('\n\n');

  return `// Auto-generated UI Interaction Code
// This code handles UI component interactions

class UIController {
  constructor() {
    this.initializeComponents();
    this.setupParameterHandlers();
  }

  initializeComponents() {
${componentInit || '    // No UI components yet'}
  }

  setupParameterHandlers() {
${parameterHandlers || '    // No parameter mappings yet'}
  }

  // Update UI component display
  updateDisplay(componentId, value) {
    const component = document.getElementById(componentId);
    if (component) {
      component.textContent = value.toFixed(2);
    }
  }
}

// Initialize UI controller
const uiController = new UIController();`;
}

/**
 * Generate complete plugin preview code
 */
export function generatePluginPreviewCode(project: PluginProject): string {
  const dspCode = generateDSPCode(project);
  const uiCode = generateUICode(project);

  return `/**
 * ${project.name} - Audio Plugin
 * Version: ${project.version}
 * ${project.description}
 *
 * This is a preview of the generated plugin code.
 * Edit in the Code Editor to customize.
 */

// ============================================
// DSP PROCESSING
// ============================================

${dspCode}

// ============================================
// UI INTERACTION
// ============================================

${uiCode}

// ============================================
// PLUGIN INITIALIZATION
// ============================================

class ${project.name.replace(/\s+/g, '')}Plugin {
  constructor(audioContext) {
    this.context = audioContext;
    this.processor = new AudioProcessor();
    this.uiController = new UIController();
  }

  process(inputs, outputs, parameters) {
    this.processor.processBlock(outputs, outputs[0].length, outputs.length);
    return true;
  }
}

export default ${project.name.replace(/\s+/g, '')}Plugin;`;
}

// Helper functions

function generateNodeProcessing(node: DSPNode): string {
  const nodeType = node.type;
  const params = node.parameters || [];

  switch (nodeType) {
    case 'oscillator':
      return `  float processOscillator(float input, int nodeId) {
    // Generate oscillator waveform
    float phase = getPhase(nodeId);
    return generateWaveform(phase, ${params.find((p) => p.name === 'waveform')?.value || 'sine'});
  }`;

    case 'filter':
      return `  float processFilter(float input, int nodeId) {
    // Apply filter
    float freq = ${params.find((p) => p.name === 'frequency')?.value || 1000.0};
    float q = ${params.find((p) => p.name === 'Q')?.value || 1.0};
    return applyFilter(input, freq, q);
  }`;

    case 'gain':
      return `  float processGain(float input, int nodeId) {
    float gainValue = ${params.find((p) => p.name === 'gain')?.value || 1.0};
    return input * gainValue;
  }`;

    case 'delay':
      return `  float processDelay(float input, int nodeId) {
    float delayTime = ${params.find((p) => p.name === 'delayTime')?.value || 0.25};
    float feedback = ${params.find((p) => p.name === 'feedback')?.value || 0.5};
    return applyDelay(input, delayTime, feedback);
  }`;

    default:
      return `  float process${capitalize(nodeType)}(float input, int nodeId) {
    // Process ${nodeType}
    return input; // TODO: Implement ${nodeType} processing
  }`;
  }
}

function generateComponentInit(comp: UIComponent): string {
  switch (comp.type) {
    case 'knob':
      return `createKnob({
    id: "${comp.id}",
    label: "${comp.label}",
    x: ${comp.x}, y: ${comp.y},
    min: ${comp.properties.min || 0},
    max: ${comp.properties.max || 1},
    value: ${comp.properties.value || 0.5}
  });`;

    case 'slider':
      return `createSlider({
    id: "${comp.id}",
    label: "${comp.label}",
    x: ${comp.x}, y: ${comp.y},
    min: ${comp.properties.min || 0},
    max: ${comp.properties.max || 1},
    value: ${comp.properties.value || 0.5}
  });`;

    case 'button':
      return `createButton({
    id: "${comp.id}",
    label: "${comp.label}",
    x: ${comp.x}, y: ${comp.y}
  });`;

    case 'toggle':
      return `createToggle({
    id: "${comp.id}",
    label: "${comp.label}",
    x: ${comp.x}, y: ${comp.y},
    value: ${comp.properties.value || false}
  });`;

    default:
      return `// ${comp.type} component`;
  }
}

function generateParameterSetters(nodes: DSPNode[]): string {
  const params = nodes.flatMap((node) => node.parameters || []);
  if (params.length === 0) {
    return '    // No parameters to set';
  }

  return params
    .map((param) => `    if (paramName == "${param.name}") {
      ${param.name} = jlimit(${param.min || 0.0}f, ${param.max || 1.0}f, value);
    }`)
    .join(' else ');
}

function findParameterById(nodes: DSPNode[], parameterId: string): DSPParameter | null {
  for (const node of nodes) {
    if (node.parameters) {
      const param = node.parameters.find((p) => p.id === parameterId);
      if (param) return param;
    }
  }
  return null;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
