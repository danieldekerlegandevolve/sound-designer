import { UIComponent } from '@shared/types';

export interface ComponentPreset {
  id: string;
  name: string;
  category: 'control' | 'display' | 'keyboard' | 'custom';
  description: string;
  thumbnail?: string;
  component: Omit<UIComponent, 'id' | 'x' | 'y'>;
}

export const componentLibrary: ComponentPreset[] = [
  // CONTROL KNOBS
  {
    id: 'knob-standard',
    name: 'Standard Knob',
    category: 'control',
    description: 'Classic rotary knob for precise control',
    component: {
      type: 'knob',
      width: 80,
      height: 100,
      label: 'Knob',
      properties: {
        min: 0,
        max: 100,
        value: 50,
        parameter: '',
      },
      style: {},
    },
  },
  {
    id: 'knob-large',
    name: 'Large Knob',
    category: 'control',
    description: 'Large knob for main parameters',
    component: {
      type: 'knob',
      width: 120,
      height: 140,
      label: 'Main',
      properties: {
        min: 0,
        max: 100,
        value: 50,
        parameter: '',
      },
      style: {},
    },
  },
  {
    id: 'knob-small',
    name: 'Small Knob',
    category: 'control',
    description: 'Compact knob for secondary controls',
    component: {
      type: 'knob',
      width: 60,
      height: 80,
      label: 'Trim',
      properties: {
        min: 0,
        max: 100,
        value: 50,
        parameter: '',
      },
      style: {},
    },
  },

  // SLIDERS
  {
    id: 'slider-horizontal',
    name: 'Horizontal Slider',
    category: 'control',
    description: 'Horizontal fader control',
    component: {
      type: 'slider',
      width: 200,
      height: 60,
      label: 'Level',
      properties: {
        min: 0,
        max: 100,
        value: 50,
        parameter: '',
        orientation: 'horizontal',
      },
      style: {},
    },
  },
  {
    id: 'slider-vertical',
    name: 'Vertical Slider',
    category: 'control',
    description: 'Vertical fader control',
    component: {
      type: 'slider',
      width: 60,
      height: 200,
      label: 'Volume',
      properties: {
        min: 0,
        max: 100,
        value: 75,
        parameter: '',
        orientation: 'vertical',
      },
      style: {},
    },
  },

  // BUTTONS
  {
    id: 'button-standard',
    name: 'Standard Button',
    category: 'control',
    description: 'Push button for triggering actions',
    component: {
      type: 'button',
      width: 100,
      height: 40,
      label: 'Trigger',
      properties: {
        parameter: '',
        momentary: true,
      },
      style: {},
    },
  },
  {
    id: 'button-power',
    name: 'Power Button',
    category: 'control',
    description: 'On/Off power button',
    component: {
      type: 'button',
      width: 60,
      height: 60,
      label: 'Power',
      properties: {
        parameter: 'power',
        momentary: false,
      },
      style: {
        borderRadius: 30,
      },
    },
  },

  // TOGGLES
  {
    id: 'toggle-standard',
    name: 'Standard Toggle',
    category: 'control',
    description: 'Standard toggle switch',
    component: {
      type: 'toggle',
      width: 120,
      height: 60,
      label: 'Enable',
      properties: {
        parameter: '',
        value: false,
      },
      style: {},
    },
  },
  {
    id: 'toggle-small',
    name: 'Small Toggle',
    category: 'control',
    description: 'Compact toggle switch',
    component: {
      type: 'toggle',
      width: 80,
      height: 40,
      label: 'On',
      properties: {
        parameter: '',
        value: false,
      },
      style: {},
    },
  },

  // DISPLAYS
  {
    id: 'display-value',
    name: 'Value Display',
    category: 'display',
    description: 'Numeric value display',
    component: {
      type: 'display',
      width: 120,
      height: 80,
      label: 'Output',
      properties: {
        parameter: '',
        precision: 2,
        unit: 'dB',
      },
      style: {},
    },
  },
  {
    id: 'display-large',
    name: 'Large Display',
    category: 'display',
    description: 'Large numeric display',
    component: {
      type: 'display',
      width: 200,
      height: 100,
      label: 'Level',
      properties: {
        parameter: '',
        precision: 1,
        unit: 'dB',
      },
      style: {
        fontSize: 24,
      },
    },
  },

  // WAVEFORM DISPLAYS
  {
    id: 'waveform-standard',
    name: 'Waveform Display',
    category: 'display',
    description: 'Audio waveform visualization',
    component: {
      type: 'waveform',
      width: 300,
      height: 150,
      label: 'Waveform',
      properties: {
        backgroundColor: '#1a1a1a',
        waveColor: '#00ff88',
      },
      style: {},
    },
  },
  {
    id: 'waveform-compact',
    name: 'Compact Waveform',
    category: 'display',
    description: 'Smaller waveform display',
    component: {
      type: 'waveform',
      width: 200,
      height: 80,
      label: 'Wave',
      properties: {
        backgroundColor: '#1a1a1a',
        waveColor: '#4a9eff',
      },
      style: {},
    },
  },

  // KEYBOARDS
  {
    id: 'keyboard-1-octave',
    name: '1 Octave Keyboard',
    category: 'keyboard',
    description: 'Single octave MIDI keyboard',
    component: {
      type: 'keyboard',
      width: 400,
      height: 100,
      label: '',
      properties: {
        startNote: 48, // C3
        numOctaves: 1,
      },
      style: {},
    },
  },
  {
    id: 'keyboard-2-octave',
    name: '2 Octave Keyboard',
    category: 'keyboard',
    description: 'Two octave MIDI keyboard',
    component: {
      type: 'keyboard',
      width: 600,
      height: 100,
      label: '',
      properties: {
        startNote: 48, // C3
        numOctaves: 2,
      },
      style: {},
    },
  },

  // XY PADS
  {
    id: 'xypad-standard',
    name: 'XY Pad',
    category: 'control',
    description: '2D control pad',
    component: {
      type: 'xy-pad',
      width: 200,
      height: 200,
      label: 'XY',
      properties: {
        xParameter: '',
        yParameter: '',
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
      },
      style: {},
    },
  },
  {
    id: 'xypad-large',
    name: 'Large XY Pad',
    category: 'control',
    description: 'Large 2D control surface',
    component: {
      type: 'xy-pad',
      width: 300,
      height: 300,
      label: 'Control',
      properties: {
        xParameter: '',
        yParameter: '',
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
      },
      style: {},
    },
  },

  // THEMED PRESETS
  {
    id: 'knob-vintage',
    name: 'Vintage Knob',
    category: 'custom',
    description: 'Retro-styled knob',
    component: {
      type: 'knob',
      width: 90,
      height: 110,
      label: 'Vintage',
      properties: {
        min: 0,
        max: 100,
        value: 50,
        parameter: '',
      },
      style: {
        color: '#ff8800',
        backgroundColor: '#1a1a1a',
      },
    },
  },
  {
    id: 'slider-modern',
    name: 'Modern Slider',
    category: 'custom',
    description: 'Sleek modern slider',
    component: {
      type: 'slider',
      width: 180,
      height: 50,
      label: 'Modern',
      properties: {
        min: 0,
        max: 100,
        value: 50,
        parameter: '',
        orientation: 'horizontal',
      },
      style: {
        borderRadius: 25,
        backgroundColor: '#2a2a2a',
      },
    },
  },
  {
    id: 'button-danger',
    name: 'Danger Button',
    category: 'custom',
    description: 'Red warning/danger button',
    component: {
      type: 'button',
      width: 100,
      height: 50,
      label: 'Reset',
      properties: {
        parameter: '',
        momentary: true,
      },
      style: {
        backgroundColor: '#cc0000',
        color: '#ffffff',
      },
    },
  },
  {
    id: 'display-led',
    name: 'LED Display',
    category: 'custom',
    description: 'LED-style numeric display',
    component: {
      type: 'display',
      width: 150,
      height: 60,
      label: 'LED',
      properties: {
        parameter: '',
        precision: 1,
        unit: '',
      },
      style: {
        backgroundColor: '#000000',
        color: '#00ff00',
        fontFamily: 'monospace',
      },
    },
  },
];

// Filter functions
export function getComponentsByCategory(category: ComponentPreset['category']): ComponentPreset[] {
  return componentLibrary.filter((c) => c.category === category);
}

export function getAllCategories(): ComponentPreset['category'][] {
  return ['control', 'display', 'keyboard', 'custom'];
}

export function searchComponents(query: string): ComponentPreset[] {
  const lowerQuery = query.toLowerCase();
  return componentLibrary.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.component.type.toLowerCase().includes(lowerQuery)
  );
}

// Create UI component from preset
export function createComponentFromPreset(
  preset: ComponentPreset,
  x: number,
  y: number
): Omit<UIComponent, 'id'> {
  return {
    ...preset.component,
    x,
    y,
  };
}

// Component storage (localStorage)
const CUSTOM_COMPONENTS_KEY = 'sound-designer-custom-components';

export function saveCustomComponent(preset: ComponentPreset): void {
  const components = getCustomComponents();
  components.push(preset);
  localStorage.setItem(CUSTOM_COMPONENTS_KEY, JSON.stringify(components));
}

export function getCustomComponents(): ComponentPreset[] {
  try {
    const stored = localStorage.getItem(CUSTOM_COMPONENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function deleteCustomComponent(presetId: string): void {
  const components = getCustomComponents().filter((c) => c.id !== presetId);
  localStorage.setItem(CUSTOM_COMPONENTS_KEY, JSON.stringify(components));
}

export function getAllComponents(): ComponentPreset[] {
  return [...componentLibrary, ...getCustomComponents()];
}
