/**
 * Help Content
 *
 * All help articles, tutorials, FAQs, shortcuts, and contextual help
 */

import {
  HelpArticle,
  Tutorial,
  FAQItem,
  ContextualHelp,
  ShortcutDoc,
  HelpCategory,
  Tip,
} from '../../shared/helpTypes';

// ============================================================================
// Help Articles
// ============================================================================

export const helpArticles: HelpArticle[] = [
  // Getting Started
  {
    id: 'getting-started',
    title: 'Getting Started with Sound Designer',
    category: HelpCategory.GETTING_STARTED,
    tags: ['beginner', 'introduction', 'basics'],
    difficulty: 'beginner',
    content: `
      <h1>Welcome to Sound Designer!</h1>
      <p>Sound Designer is a powerful audio plugin creation tool that lets you build custom synthesizers, effects, and audio processors.</p>

      <h2>Key Features</h2>
      <ul>
        <li><strong>Visual Programming</strong> - Build audio graphs with drag-and-drop nodes</li>
        <li><strong>Preset Management</strong> - Save and load your creations</li>
        <li><strong>MIDI Support</strong> - Full piano roll and MIDI editing</li>
        <li><strong>Modulation Matrix</strong> - Route LFOs and envelopes to any parameter</li>
        <li><strong>Sample Editor</strong> - Import and edit audio samples</li>
        <li><strong>Export</strong> - Build standalone plugins or export audio</li>
      </ul>

      <h2>Quick Start</h2>
      <ol>
        <li>Start with a preset or create a new project</li>
        <li>Add audio nodes to your graph</li>
        <li>Connect nodes to create signal flow</li>
        <li>Adjust parameters and add modulation</li>
        <li>Preview your sound in real-time</li>
        <li>Save as a preset or export</li>
      </ol>

      <p>Ready to dive in? Check out our tutorials or explore the interface!</p>
    `,
    relatedArticles: ['presets-basics', 'audio-graph-basics'],
  },

  {
    id: 'presets-basics',
    title: 'Working with Presets',
    category: HelpCategory.PRESETS,
    tags: ['presets', 'save', 'load', 'organize'],
    difficulty: 'beginner',
    content: `
      <h1>Working with Presets</h1>
      <p>Presets allow you to save and recall your sound designs instantly.</p>

      <h2>Creating a Preset</h2>
      <ol>
        <li>Design your sound by adjusting parameters</li>
        <li>Click the "Save Preset" button in the preset panel</li>
        <li>Enter a name and optional tags</li>
        <li>Choose a category for organization</li>
        <li>Click "Save"</li>
      </ol>

      <h2>Loading a Preset</h2>
      <p>Simply click on any preset in the preset browser to load it instantly.</p>

      <h2>Organizing Presets</h2>
      <ul>
        <li>Use categories to group similar sounds</li>
        <li>Add tags for better searchability</li>
        <li>Create folders for different projects</li>
        <li>Use the search function to find presets quickly</li>
      </ul>

      <h2>Sharing Presets</h2>
      <p>Export presets as .sdp files to share with others or backup your work.</p>
    `,
    relatedArticles: ['preset-management-advanced'],
  },

  {
    id: 'midi-basics',
    title: 'MIDI and Piano Roll',
    category: HelpCategory.MIDI,
    tags: ['midi', 'piano roll', 'notes', 'sequencing'],
    difficulty: 'beginner',
    content: `
      <h1>MIDI and Piano Roll</h1>
      <p>Create melodies and sequences with the built-in piano roll editor.</p>

      <h2>Adding Notes</h2>
      <ol>
        <li>Click in the piano roll grid to add a note</li>
        <li>Drag to adjust note length</li>
        <li>Drag vertically to change pitch</li>
        <li>Use the velocity editor to adjust note dynamics</li>
      </ol>

      <h2>Editing Notes</h2>
      <ul>
        <li><strong>Move</strong>: Click and drag notes</li>
        <li><strong>Resize</strong>: Drag note edges</li>
        <li><strong>Delete</strong>: Select and press Delete key</li>
        <li><strong>Duplicate</strong>: Ctrl+D (Cmd+D on Mac)</li>
      </ul>

      <h2>Keyboard Shortcuts</h2>
      <ul>
        <li>Space: Play/Pause</li>
        <li>Ctrl+A: Select all notes</li>
        <li>Ctrl+C/V: Copy/Paste notes</li>
        <li>Ctrl+Z: Undo</li>
      </ul>
    `,
    relatedArticles: ['automation-basics', 'midi-advanced'],
  },

  {
    id: 'modulation-basics',
    title: 'Modulation and Automation',
    category: HelpCategory.MODULATION,
    tags: ['modulation', 'lfo', 'envelope', 'automation'],
    difficulty: 'intermediate',
    content: `
      <h1>Modulation and Automation</h1>
      <p>Add movement and dynamics to your sounds with modulation.</p>

      <h2>Modulation Matrix</h2>
      <p>The modulation matrix lets you route modulation sources to any parameter.</p>

      <h3>Modulation Sources</h3>
      <ul>
        <li><strong>LFOs</strong> - Low Frequency Oscillators for cyclic modulation</li>
        <li><strong>Envelopes</strong> - ADSR envelopes for dynamic control</li>
        <li><strong>Macros</strong> - User-assignable controls</li>
      </ul>

      <h2>Creating Modulation Routings</h2>
      <ol>
        <li>Drag a modulation source from the matrix</li>
        <li>Drop it onto a parameter to create a routing</li>
        <li>Adjust the modulation amount with the slider</li>
        <li>Fine-tune LFO rate, envelope times, etc.</li>
      </ol>

      <h2>Automation</h2>
      <p>Automate parameters over time by drawing automation curves in the timeline.</p>
    `,
    relatedArticles: ['modulation-advanced', 'lfo-guide'],
  },

  {
    id: 'performance-tips',
    title: 'Performance Optimization Tips',
    category: HelpCategory.PERFORMANCE,
    tags: ['performance', 'optimization', 'cpu', 'memory'],
    difficulty: 'advanced',
    content: `
      <h1>Performance Optimization</h1>
      <p>Keep your audio processing efficient with these tips.</p>

      <h2>CPU Optimization</h2>
      <ul>
        <li>Use freeze/bounce to render complex processing</li>
        <li>Disable unused nodes and effects</li>
        <li>Increase buffer size if experiencing dropouts</li>
        <li>Use mono processing where stereo isn't needed</li>
      </ul>

      <h2>Memory Management</h2>
      <ul>
        <li>Trim unused sample data</li>
        <li>Use lower sample rates for non-critical samples</li>
        <li>Clear undo history when not needed</li>
        <li>Close unused projects</li>
      </ul>

      <h2>Monitoring Performance</h2>
      <p>Open the Performance Dashboard (View > Performance) to monitor:</p>
      <ul>
        <li>CPU usage in real-time</li>
        <li>Memory consumption</li>
        <li>Audio buffer status</li>
        <li>Optimization recommendations</li>
      </ul>
    `,
    relatedArticles: ['troubleshooting-audio'],
  },
];

// ============================================================================
// Tutorials
// ============================================================================

export const tutorials: Tutorial[] = [
  {
    id: 'first-synth',
    title: 'Build Your First Synthesizer',
    description: 'Learn the basics by creating a simple subtractive synthesizer.',
    category: HelpCategory.GETTING_STARTED,
    difficulty: 'beginner',
    estimatedTime: 10,
    steps: [
      {
        id: 'step1',
        title: 'Create a New Project',
        description: 'Click the "New Project" button to start fresh.',
        targetElement: '.new-project-button',
        position: 'bottom',
        action: 'click',
        actionDescription: 'Click the New Project button',
      },
      {
        id: 'step2',
        title: 'Add an Oscillator',
        description: 'Drag an Oscillator node from the node palette onto the canvas.',
        targetElement: '.node-palette',
        position: 'right',
        action: 'drag',
        actionDescription: 'Drag the Oscillator node to the canvas',
      },
      {
        id: 'step3',
        title: 'Add a Filter',
        description: 'Add a Filter node and connect it to the oscillator output.',
        targetElement: '.audio-graph-canvas',
        position: 'top',
        action: 'drag',
        actionDescription: 'Add and connect a Filter node',
      },
      {
        id: 'step4',
        title: 'Connect to Output',
        description: 'Connect the filter to the audio output node.',
        action: 'drag',
        actionDescription: 'Drag a cable from filter output to audio output',
      },
      {
        id: 'step5',
        title: 'Play a Note',
        description: 'Click a key on the virtual keyboard or press keys on your computer keyboard.',
        targetElement: '.virtual-keyboard',
        position: 'top',
        action: 'click',
        actionDescription: 'Play a note to hear your synth!',
      },
      {
        id: 'step6',
        title: 'Adjust Parameters',
        description: 'Experiment with the oscillator waveform and filter cutoff to shape your sound.',
        action: 'observe',
        actionDescription: 'Try different parameter values',
      },
      {
        id: 'step7',
        title: 'Save Your Preset',
        description: 'Save your first synth as a preset for later use.',
        targetElement: '.save-preset-button',
        position: 'bottom',
        action: 'click',
        actionDescription: 'Click Save Preset',
      },
    ],
  },

  {
    id: 'modulation-routing',
    title: 'Create Your First Modulation Routing',
    description: 'Learn how to add movement to your sounds with modulation.',
    category: HelpCategory.MODULATION,
    difficulty: 'beginner',
    estimatedTime: 5,
    steps: [
      {
        id: 'step1',
        title: 'Open Modulation Matrix',
        description: 'Navigate to the Modulation tab to access the modulation matrix.',
        targetElement: '.modulation-tab',
        position: 'bottom',
        action: 'click',
      },
      {
        id: 'step2',
        title: 'Select an LFO',
        description: 'Choose LFO 1 from the modulation sources panel.',
        targetElement: '.modulation-sources',
        position: 'right',
      },
      {
        id: 'step3',
        title: 'Drag to Parameter',
        description: 'Drag the LFO to a parameter like filter cutoff.',
        action: 'drag',
        actionDescription: 'Create your first modulation routing',
      },
      {
        id: 'step4',
        title: 'Adjust Amount',
        description: 'Use the amount slider to control how much modulation is applied.',
        action: 'observe',
      },
      {
        id: 'step5',
        title: 'Customize LFO',
        description: 'Adjust LFO rate and waveform to shape the modulation.',
        action: 'observe',
      },
    ],
  },
];

// ============================================================================
// FAQ Items
// ============================================================================

export const faqItems: FAQItem[] = [
  {
    id: 'faq1',
    question: 'How do I export my plugin?',
    answer: 'Navigate to <strong>File > Export</strong> and choose your desired format (VST3, AU, or Standalone). Select an output location and click Export. The build process may take a few minutes.',
    category: HelpCategory.EXPORT,
    tags: ['export', 'build', 'plugin'],
    helpful: 42,
  },

  {
    id: 'faq2',
    question: 'Why is my audio crackling or dropping out?',
    answer: 'Audio dropouts are usually caused by high CPU usage. Try increasing your buffer size in <strong>Settings > Audio</strong>, or simplify your audio graph. Check the Performance Dashboard for specific recommendations.',
    category: HelpCategory.TROUBLESHOOTING,
    tags: ['audio', 'crackling', 'performance', 'cpu'],
    helpful: 38,
  },

  {
    id: 'faq3',
    question: 'Can I use external MIDI controllers?',
    answer: 'Yes! Connect your MIDI controller and enable it in <strong>Settings > MIDI</strong>. Sound Designer will automatically map incoming MIDI notes to the virtual keyboard.',
    category: HelpCategory.MIDI,
    tags: ['midi', 'controller', 'hardware'],
    helpful: 35,
  },

  {
    id: 'faq4',
    question: 'How do I undo/redo changes?',
    answer: 'Use <strong>Ctrl+Z</strong> (Cmd+Z on Mac) to undo and <strong>Ctrl+Shift+Z</strong> to redo. You can also use the undo/redo toolbar buttons. The history keeps up to 100 actions.',
    category: HelpCategory.GETTING_STARTED,
    tags: ['undo', 'redo', 'history'],
    helpful: 29,
  },

  {
    id: 'faq5',
    question: 'What audio file formats are supported?',
    answer: 'Sound Designer supports WAV, MP3, FLAC, OGG, and AIFF file formats for sample import. For best quality, use WAV or FLAC.',
    category: HelpCategory.SAMPLES,
    tags: ['samples', 'import', 'formats'],
    helpful: 24,
  },

  {
    id: 'faq6',
    question: 'How do I reset a parameter to its default value?',
    answer: 'Double-click any parameter knob or slider to reset it to its default value instantly.',
    category: HelpCategory.GETTING_STARTED,
    tags: ['parameters', 'reset', 'default'],
    helpful: 31,
  },
];

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export const keyboardShortcuts: ShortcutDoc[] = [
  // File Operations
  {
    id: 'new-project',
    category: 'file',
    action: 'New Project',
    keys: 'Ctrl+N',
    description: 'Create a new project',
  },
  {
    id: 'save',
    category: 'file',
    action: 'Save',
    keys: 'Ctrl+S',
    description: 'Save current project or preset',
  },
  {
    id: 'open',
    category: 'file',
    action: 'Open',
    keys: 'Ctrl+O',
    description: 'Open an existing project',
  },

  // Edit Operations
  {
    id: 'undo',
    category: 'edit',
    action: 'Undo',
    keys: 'Ctrl+Z',
    description: 'Undo last action',
  },
  {
    id: 'redo',
    category: 'edit',
    action: 'Redo',
    keys: 'Ctrl+Shift+Z',
    description: 'Redo previously undone action',
  },
  {
    id: 'copy',
    category: 'edit',
    action: 'Copy',
    keys: 'Ctrl+C',
    description: 'Copy selected items',
  },
  {
    id: 'paste',
    category: 'edit',
    action: 'Paste',
    keys: 'Ctrl+V',
    description: 'Paste copied items',
  },
  {
    id: 'cut',
    category: 'edit',
    action: 'Cut',
    keys: 'Ctrl+X',
    description: 'Cut selected items',
  },
  {
    id: 'delete',
    category: 'edit',
    action: 'Delete',
    keys: 'Delete',
    description: 'Delete selected items',
  },
  {
    id: 'select-all',
    category: 'edit',
    action: 'Select All',
    keys: 'Ctrl+A',
    description: 'Select all items',
  },

  // Transport
  {
    id: 'play-pause',
    category: 'transport',
    action: 'Play/Pause',
    keys: 'Space',
    description: 'Toggle playback',
  },
  {
    id: 'stop',
    category: 'transport',
    action: 'Stop',
    keys: 'Escape',
    description: 'Stop playback',
  },

  // View
  {
    id: 'help',
    category: 'view',
    action: 'Help Center',
    keys: 'F1',
    description: 'Open help center',
  },
  {
    id: 'shortcuts',
    category: 'view',
    action: 'Shortcuts Panel',
    keys: '?',
    description: 'Show keyboard shortcuts',
  },
  {
    id: 'performance',
    category: 'view',
    action: 'Performance Dashboard',
    keys: 'Ctrl+P',
    description: 'Open performance monitor',
  },

  // Piano Roll
  {
    id: 'add-note',
    category: 'piano-roll',
    action: 'Add Note',
    keys: 'Click',
    description: 'Click in piano roll to add note',
    context: 'Piano Roll',
  },
  {
    id: 'duplicate-notes',
    category: 'piano-roll',
    action: 'Duplicate Notes',
    keys: 'Ctrl+D',
    description: 'Duplicate selected notes',
    context: 'Piano Roll',
  },
];

// ============================================================================
// Contextual Help
// ============================================================================

export const contextualHelp: ContextualHelp[] = [
  {
    id: 'preset-manager',
    context: 'preset-manager',
    title: 'Preset Manager',
    description: 'Browse, create, and manage your sound presets. Organize presets by category and use tags for easy searching.',
    quickTips: [
      'Double-click a preset to load it instantly',
      'Right-click for additional options',
      'Use the search bar to find presets by name or tag',
      'Drag presets to reorder or organize',
    ],
    relatedArticles: ['presets-basics'],
  },

  {
    id: 'modulation-matrix',
    context: 'modulation-matrix',
    title: 'Modulation Matrix',
    description: 'Create dynamic modulation routings by connecting sources (LFOs, envelopes) to parameters.',
    quickTips: [
      'Drag modulation sources to parameters to create routings',
      'Adjust the amount slider to control modulation depth',
      'Right-click a routing to remove it',
      'Use multiple sources on one parameter for complex modulation',
    ],
    relatedArticles: ['modulation-basics', 'modulation-advanced'],
  },

  {
    id: 'piano-roll',
    context: 'piano-roll',
    title: 'Piano Roll Editor',
    description: 'Create and edit MIDI notes in the piano roll. Perfect for composing melodies and testing your sounds.',
    quickTips: [
      'Click to add notes, drag to adjust length',
      'Use Ctrl+D to duplicate selected notes',
      'Adjust velocity in the bottom panel',
      'Grid snapping can be toggled with the magnet icon',
    ],
    relatedArticles: ['midi-basics'],
  },
];

// ============================================================================
// Tips
// ============================================================================

export const tips: Tip[] = [
  {
    id: 'tip1',
    title: 'Quick Parameter Reset',
    description: 'Double-click any knob or slider to instantly reset it to its default value.',
    category: HelpCategory.GETTING_STARTED,
  },
  {
    id: 'tip2',
    title: 'Undo is Your Friend',
    description: 'Don\'t be afraid to experiment! You can undo up to 100 actions with Ctrl+Z.',
    category: HelpCategory.GETTING_STARTED,
    learnMoreArticle: 'getting-started',
  },
  {
    id: 'tip3',
    title: 'Use Tags for Organization',
    description: 'Add tags to your presets to make them easier to find later. Tags like "bass", "lead", or "pad" are great starting points.',
    category: HelpCategory.PRESETS,
    learnMoreArticle: 'presets-basics',
  },
  {
    id: 'tip4',
    title: 'Monitor Performance',
    description: 'Keep an eye on the Performance Dashboard (Ctrl+P) to optimize your audio processing and avoid dropouts.',
    category: HelpCategory.PERFORMANCE,
    learnMoreArticle: 'performance-tips',
  },
  {
    id: 'tip5',
    title: 'Modulation Adds Life',
    description: 'Even subtle modulation can make static sounds come alive. Try adding a slow LFO to filter cutoff or oscillator pitch.',
    category: HelpCategory.MODULATION,
    learnMoreArticle: 'modulation-basics',
  },
];
