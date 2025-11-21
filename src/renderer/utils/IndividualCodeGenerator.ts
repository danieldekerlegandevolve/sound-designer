import { DSPNode, UIComponent, DSPParameter } from '@shared/types';

/**
 * Generate default code template for a DSP node
 */
export function generateDSPNodeCode(node: DSPNode): string {
  const nodeType = node.type;
  const params = node.parameters || [];
  const nodeName = node.label || nodeType;

  switch (nodeType) {
    case 'oscillator':
      return generateOscillatorCode(nodeName, params);

    case 'filter':
      return generateFilterCode(nodeName, params);

    case 'gain':
      return generateGainCode(nodeName, params);

    case 'delay':
      return generateDelayCode(nodeName, params);

    case 'reverb':
      return generateReverbCode(nodeName, params);

    case 'distortion':
      return generateDistortionCode(nodeName, params);

    case 'compressor':
      return generateCompressorCode(nodeName, params);

    case 'envelope':
      return generateEnvelopeCode(nodeName, params);

    case 'lfo':
      return generateLFOCode(nodeName, params);

    case 'eq':
      return generateEQCode(nodeName, params);

    default:
      return generateGenericNodeCode(nodeName, nodeType, params);
  }
}

/**
 * Generate default code template for a UI component
 */
export function generateUIComponentCode(component: UIComponent): string {
  const compType = component.type;
  const compName = component.label;

  switch (compType) {
    case 'knob':
      return generateKnobCode(component);

    case 'slider':
      return generateSliderCode(component);

    case 'button':
      return generateButtonCode(component);

    case 'toggle':
      return generateToggleCode(component);

    case 'display':
      return generateDisplayCode(component);

    case 'waveform':
      return generateWaveformCode(component);

    case 'keyboard':
      return generateKeyboardCode(component);

    case 'xy-pad':
      return generateXYPadCode(component);

    default:
      return generateGenericComponentCode(component);
  }
}

// DSP Node Code Generators

function generateOscillatorCode(name: string, params: DSPParameter[]): string {
  const waveParam = params.find(p => p.name === 'waveform');
  const freqParam = params.find(p => p.name === 'frequency');

  return `// ${name} - Oscillator Node
// Generates audio waveforms

class ${sanitizeName(name)}Oscillator {
private:
  float phase = 0.0f;
  float frequency = ${freqParam?.value || 440.0}f;
  String waveform = "${waveParam?.value || 'sine'}";

public:
  float process(float sampleRate) {
    // Generate waveform based on current phase
    float output = 0.0f;

    if (waveform == "sine") {
      output = sin(2.0f * M_PI * phase);
    } else if (waveform == "square") {
      output = (phase < 0.5f) ? 1.0f : -1.0f;
    } else if (waveform == "saw") {
      output = 2.0f * phase - 1.0f;
    } else if (waveform == "triangle") {
      output = (phase < 0.5f) ? (4.0f * phase - 1.0f) : (3.0f - 4.0f * phase);
    }

    // Update phase
    phase += frequency / sampleRate;
    if (phase >= 1.0f) phase -= 1.0f;

    return output;
  }

  void setFrequency(float freq) {
    frequency = freq;
  }

  void setWaveform(const String& wave) {
    waveform = wave;
  }
};`;
}

function generateFilterCode(name: string, params: DSPParameter[]): string {
  const freqParam = params.find(p => p.name === 'frequency' || p.name === 'cutoff');
  const qParam = params.find(p => p.name === 'Q' || p.name === 'resonance');
  const typeParam = params.find(p => p.name === 'type');

  return `// ${name} - Filter Node
// Filters audio frequencies

class ${sanitizeName(name)}Filter {
private:
  float cutoff = ${freqParam?.value || 1000.0}f;
  float Q = ${qParam?.value || 1.0}f;
  String filterType = "${typeParam?.value || 'lowpass'}";

  // State variables for biquad filter
  float z1 = 0.0f, z2 = 0.0f;
  float a0, a1, a2, b1, b2;

  void updateCoefficients(float sampleRate) {
    float omega = 2.0f * M_PI * cutoff / sampleRate;
    float alpha = sin(omega) / (2.0f * Q);
    float cosw = cos(omega);

    if (filterType == "lowpass") {
      b1 = 1.0f - cosw;
      b2 = b1 / 2.0f;
      a0 = 1.0f + alpha;
      a1 = -2.0f * cosw;
      a2 = 1.0f - alpha;
    }
    // Add more filter types as needed
  }

public:
  float process(float input, float sampleRate) {
    updateCoefficients(sampleRate);

    // Biquad filter implementation
    float output = (input - a1 * z1 - a2 * z2) / a0;
    z2 = z1;
    z1 = output;

    return output;
  }

  void setCutoff(float freq) {
    cutoff = freq;
  }

  void setResonance(float resonance) {
    Q = resonance;
  }
};`;
}

function generateGainCode(name: string, params: DSPParameter[]): string {
  const gainParam = params.find(p => p.name === 'gain' || p.name === 'level');

  return `// ${name} - Gain Node
// Adjusts audio level

class ${sanitizeName(name)}Gain {
private:
  float gainValue = ${gainParam?.value || 1.0}f;

public:
  float process(float input) {
    return input * gainValue;
  }

  void setGain(float gain) {
    gainValue = gain;
  }

  void setGainDB(float gainDB) {
    gainValue = pow(10.0f, gainDB / 20.0f);
  }
};`;
}

function generateDelayCode(name: string, params: DSPParameter[]): string {
  const timeParam = params.find(p => p.name === 'time' || p.name === 'delayTime');
  const feedbackParam = params.find(p => p.name === 'feedback');

  return `// ${name} - Delay Node
// Creates echo/delay effect

class ${sanitizeName(name)}Delay {
private:
  static const int MAX_DELAY_SAMPLES = 96000; // 2 seconds at 48kHz
  float delayBuffer[MAX_DELAY_SAMPLES] = {0};
  int writePos = 0;
  float delayTime = ${timeParam?.value || 0.25}f; // in seconds
  float feedback = ${feedbackParam?.value || 0.5}f;

public:
  float process(float input, float sampleRate) {
    // Calculate delay in samples
    int delaySamples = (int)(delayTime * sampleRate);
    delaySamples = min(delaySamples, MAX_DELAY_SAMPLES - 1);

    // Read from delay buffer
    int readPos = writePos - delaySamples;
    if (readPos < 0) readPos += MAX_DELAY_SAMPLES;

    float delayed = delayBuffer[readPos];

    // Write to delay buffer with feedback
    delayBuffer[writePos] = input + (delayed * feedback);

    // Advance write position
    writePos = (writePos + 1) % MAX_DELAY_SAMPLES;

    return input + delayed;
  }

  void setDelayTime(float time) {
    delayTime = time;
  }

  void setFeedback(float fb) {
    feedback = fb;
  }
};`;
}

function generateReverbCode(name: string, params: DSPParameter[]): string {
  return `// ${name} - Reverb Node
// Creates reverb/room effect

class ${sanitizeName(name)}Reverb {
private:
  float roomSize = 0.5f;
  float damping = 0.5f;
  float wetDry = 0.33f;

public:
  float process(float input, float sampleRate) {
    // Simple reverb algorithm (placeholder)
    // TODO: Implement full reverb (Freeverb, etc.)
    float wet = input * wetDry * roomSize;
    float dry = input * (1.0f - wetDry);
    return wet + dry;
  }

  void setRoomSize(float size) {
    roomSize = size;
  }

  void setDamping(float damp) {
    damping = damp;
  }

  void setWetDry(float mix) {
    wetDry = mix;
  }
};`;
}

function generateDistortionCode(name: string, params: DSPParameter[]): string {
  const driveParam = params.find(p => p.name === 'drive' || p.name === 'gain');

  return `// ${name} - Distortion Node
// Adds distortion/overdrive

class ${sanitizeName(name)}Distortion {
private:
  float drive = ${driveParam?.value || 1.0}f;

public:
  float process(float input) {
    // Apply drive
    float driven = input * drive;

    // Soft clipping using tanh
    float output = tanh(driven);

    return output;
  }

  void setDrive(float driveAmount) {
    drive = driveAmount;
  }
};`;
}

function generateCompressorCode(name: string, params: DSPParameter[]): string {
  return `// ${name} - Compressor Node
// Dynamic range compression

class ${sanitizeName(name)}Compressor {
private:
  float threshold = -20.0f;
  float ratio = 4.0f;
  float attack = 0.001f;
  float release = 0.1f;
  float envelope = 0.0f;

public:
  float process(float input, float sampleRate) {
    // Calculate envelope
    float inputLevel = abs(input);
    float attackCoeff = exp(-1.0f / (attack * sampleRate));
    float releaseCoeff = exp(-1.0f / (release * sampleRate));

    if (inputLevel > envelope) {
      envelope = attackCoeff * envelope + (1.0f - attackCoeff) * inputLevel;
    } else {
      envelope = releaseCoeff * envelope + (1.0f - releaseCoeff) * inputLevel;
    }

    // Calculate gain reduction
    float envelopeDB = 20.0f * log10(envelope + 0.0001f);
    float gainReduction = 0.0f;

    if (envelopeDB > threshold) {
      gainReduction = (envelopeDB - threshold) * (1.0f - 1.0f / ratio);
    }

    float gain = pow(10.0f, -gainReduction / 20.0f);
    return input * gain;
  }
};`;
}

function generateEnvelopeCode(name: string, params: DSPParameter[]): string {
  return `// ${name} - Envelope Generator
// ADSR envelope for modulation

class ${sanitizeName(name)}Envelope {
private:
  float attack = 0.01f;
  float decay = 0.1f;
  float sustain = 0.7f;
  float release = 0.3f;

  enum State { IDLE, ATTACK, DECAY, SUSTAIN, RELEASE };
  State state = IDLE;
  float level = 0.0f;

public:
  void trigger() {
    state = ATTACK;
    level = 0.0f;
  }

  void release() {
    state = RELEASE;
  }

  float process(float sampleRate) {
    float delta = 1.0f / sampleRate;

    switch (state) {
      case ATTACK:
        level += delta / attack;
        if (level >= 1.0f) {
          level = 1.0f;
          state = DECAY;
        }
        break;

      case DECAY:
        level -= delta * (1.0f - sustain) / decay;
        if (level <= sustain) {
          level = sustain;
          state = SUSTAIN;
        }
        break;

      case SUSTAIN:
        level = sustain;
        break;

      case RELEASE:
        level -= delta * sustain / release;
        if (level <= 0.0f) {
          level = 0.0f;
          state = IDLE;
        }
        break;

      default:
        level = 0.0f;
    }

    return level;
  }
};`;
}

function generateLFOCode(name: string, params: DSPParameter[]): string {
  return `// ${name} - LFO (Low Frequency Oscillator)
// Modulation source

class ${sanitizeName(name)}LFO {
private:
  float phase = 0.0f;
  float frequency = 1.0f; // Hz
  String waveform = "sine";

public:
  float process(float sampleRate) {
    float output = 0.0f;

    if (waveform == "sine") {
      output = sin(2.0f * M_PI * phase);
    } else if (waveform == "triangle") {
      output = (phase < 0.5f) ? (4.0f * phase - 1.0f) : (3.0f - 4.0f * phase);
    } else if (waveform == "square") {
      output = (phase < 0.5f) ? 1.0f : -1.0f;
    }

    phase += frequency / sampleRate;
    if (phase >= 1.0f) phase -= 1.0f;

    return output;
  }

  void setFrequency(float freq) {
    frequency = freq;
  }
};`;
}

function generateEQCode(name: string, params: DSPParameter[]): string {
  return `// ${name} - EQ Node
// Parametric equalizer

class ${sanitizeName(name)}EQ {
private:
  float lowGain = 0.0f;
  float midGain = 0.0f;
  float highGain = 0.0f;
  float lowFreq = 200.0f;
  float highFreq = 2000.0f;

public:
  float process(float input, float sampleRate) {
    // Three-band EQ (simplified)
    // TODO: Implement proper biquad filters for each band
    return input * (1.0f + (lowGain + midGain + highGain) / 3.0f);
  }

  void setLowGain(float gain) {
    lowGain = gain;
  }

  void setMidGain(float gain) {
    midGain = gain;
  }

  void setHighGain(float gain) {
    highGain = gain;
  }
};`;
}

function generateGenericNodeCode(name: string, type: string, params: DSPParameter[]): string {
  const paramList = params.map(p => `  float ${p.name} = ${p.value}f;`).join('\n');

  return `// ${name} - ${capitalize(type)} Node

class ${sanitizeName(name)}${capitalize(type)} {
private:
${paramList || '  // No parameters'}

public:
  float process(float input) {
    // TODO: Implement ${type} processing
    return input;
  }
};`;
}

// UI Component Code Generators

function generateKnobCode(component: UIComponent): string {
  const { label, properties } = component;
  const min = properties?.min || 0;
  const max = properties?.max || 1;
  const value = properties?.value || 0.5;

  return `// ${label} - Knob Component

function ${sanitizeName(label)}Knob() {
  const [value, setValue] = useState(${value});

  const handleChange = (newValue) => {
    setValue(newValue);

    // Update linked parameter
    ${component.parameterId ? `processor.setParameter("${component.parameterId}", newValue);` : '// No parameter linked'}
  };

  return {
    type: 'knob',
    id: '${component.id}',
    label: '${label}',
    min: ${min},
    max: ${max},
    value: value,
    onChange: handleChange
  };
}`;
}

function generateSliderCode(component: UIComponent): string {
  const { label, properties } = component;
  const min = properties?.min || 0;
  const max = properties?.max || 1;
  const value = properties?.value || 0.5;

  return `// ${label} - Slider Component

function ${sanitizeName(label)}Slider() {
  const [value, setValue] = useState(${value});

  const handleChange = (newValue) => {
    setValue(newValue);

    // Update linked parameter
    ${component.parameterId ? `processor.setParameter("${component.parameterId}", newValue);` : '// No parameter linked'}
  };

  return {
    type: 'slider',
    id: '${component.id}',
    label: '${label}',
    min: ${min},
    max: ${max},
    value: value,
    onChange: handleChange
  };
}`;
}

function generateButtonCode(component: UIComponent): string {
  const { label } = component;

  return `// ${label} - Button Component

function ${sanitizeName(label)}Button() {
  const handleClick = () => {
    // Button action
    ${component.parameterId ? `processor.trigger("${component.parameterId}");` : '// Add your button action here'}
  };

  return {
    type: 'button',
    id: '${component.id}',
    label: '${label}',
    onClick: handleClick
  };
}`;
}

function generateToggleCode(component: UIComponent): string {
  const { label, properties } = component;
  const value = properties?.value || false;

  return `// ${label} - Toggle Component

function ${sanitizeName(label)}Toggle() {
  const [enabled, setEnabled] = useState(${value});

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);

    // Update linked parameter
    ${component.parameterId ? `processor.setParameter("${component.parameterId}", newValue ? 1.0 : 0.0);` : '// No parameter linked'}
  };

  return {
    type: 'toggle',
    id: '${component.id}',
    label: '${label}',
    enabled: enabled,
    onToggle: handleToggle
  };
}`;
}

function generateDisplayCode(component: UIComponent): string {
  const { label } = component;

  return `// ${label} - Display Component

function ${sanitizeName(label)}Display() {
  const [displayValue, setDisplayValue] = useState('0.00');

  // Update display when parameter changes
  const updateDisplay = (value) => {
    setDisplayValue(value.toFixed(2));
  };

  return {
    type: 'display',
    id: '${component.id}',
    label: '${label}',
    value: displayValue,
    update: updateDisplay
  };
}`;
}

function generateWaveformCode(component: UIComponent): string {
  const { label } = component;

  return `// ${label} - Waveform Display

function ${sanitizeName(label)}Waveform() {
  const [waveformData, setWaveformData] = useState([]);

  const updateWaveform = (audioBuffer) => {
    // Update waveform visualization
    setWaveformData(audioBuffer);
  };

  const renderWaveform = () => {
    // Canvas rendering logic
    // TODO: Implement waveform drawing
  };

  return {
    type: 'waveform',
    id: '${component.id}',
    label: '${label}',
    data: waveformData,
    update: updateWaveform,
    render: renderWaveform
  };
}`;
}

function generateKeyboardCode(component: UIComponent): string {
  const { label } = component;

  return `// ${label} - MIDI Keyboard

function ${sanitizeName(label)}Keyboard() {
  const handleNoteOn = (note, velocity) => {
    // Trigger note
    processor.noteOn(note, velocity);
  };

  const handleNoteOff = (note) => {
    // Release note
    processor.noteOff(note);
  };

  return {
    type: 'keyboard',
    id: '${component.id}',
    label: '${label}',
    onNoteOn: handleNoteOn,
    onNoteOff: handleNoteOff
  };
}`;
}

function generateXYPadCode(component: UIComponent): string {
  const { label } = component;

  return `// ${label} - XY Pad

function ${sanitizeName(label)}XYPad() {
  const [x, setX] = useState(0.5);
  const [y, setY] = useState(0.5);

  const handleMove = (newX, newY) => {
    setX(newX);
    setY(newY);

    // Update linked parameters
    ${component.parameterId ? `processor.setParameter("${component.parameterId}_x", newX);
    processor.setParameter("${component.parameterId}_y", newY);` : '// No parameters linked'}
  };

  return {
    type: 'xy-pad',
    id: '${component.id}',
    label: '${label}',
    x: x,
    y: y,
    onMove: handleMove
  };
}`;
}

function generateGenericComponentCode(component: UIComponent): string {
  return `// ${component.label} - ${capitalize(component.type)} Component

function ${sanitizeName(component.label)}Component() {
  // TODO: Implement ${component.type} component

  return {
    type: '${component.type}',
    id: '${component.id}',
    label: '${component.label}'
  };
}`;
}

// Helper functions

function sanitizeName(name: string): string {
  // Remove special characters and spaces, capitalize first letter
  return name
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^./, (str) => str.toUpperCase());
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
