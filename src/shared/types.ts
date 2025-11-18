// Shared types between main and renderer processes

export interface PluginProject {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  uiComponents: UIComponent[];
  dspGraph: DSPGraph;
  code: CodeFiles;
  settings: PluginSettings;
  metadata?: ProjectMetadata;
}

export interface ProjectMetadata {
  version: string;
  createdAt: string;
  updatedAt: string;
  application: string;
  isTemplate?: boolean;
  filePath?: string;
}

export interface UIComponent {
  id: string;
  type: 'knob' | 'slider' | 'button' | 'toggle' | 'display' | 'waveform' | 'keyboard' | 'xy-pad' | 'custom';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  properties: Record<string, any>;
  style: ComponentStyle;
  parameterId?: string; // Links to DSP parameter
}

export interface ComponentStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface DSPGraph {
  nodes: DSPNode[];
  connections: DSPConnection[];
}

export interface DSPNode {
  id: string;
  type: 'oscillator' | 'filter' | 'envelope' | 'lfo' | 'gain' | 'delay' | 'reverb' |
        'distortion' | 'compressor' | 'eq' | 'mixer' | 'custom';
  x: number;
  y: number;
  parameters: DSPParameter[];
  inputs: string[]; // Input port IDs
  outputs: string[]; // Output port IDs
}

export interface DSPParameter {
  id: string;
  name: string;
  type: 'float' | 'int' | 'bool' | 'enum';
  min?: number;
  max?: number;
  default: any;
  value: any;
  unit?: string;
  options?: string[]; // For enum type
}

export interface DSPConnection {
  id: string;
  sourceNodeId: string;
  sourcePort: string;
  targetNodeId: string;
  targetPort: string;
}

export interface CodeFiles {
  dsp: string; // C++ or JavaScript DSP code
  ui: string; // UI customization code
  helpers: string; // Helper functions
}

export interface PluginSettings {
  width: number;
  height: number;
  resizable: boolean;
  backgroundColor: string;
  sampleRate: number;
  bufferSize: number;
}

export interface ExportConfig {
  format: 'vst' | 'vst3' | 'au' | 'web' | 'standalone' | 'mobile' | 'hardware';
  platform: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'web';
  outputPath: string;
  optimizationLevel: 'debug' | 'release';
}

export type EditorMode = 'ui' | 'dsp' | 'code' | 'preview';
