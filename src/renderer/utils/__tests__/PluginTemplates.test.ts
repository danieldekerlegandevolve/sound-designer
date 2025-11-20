/**
 * Comprehensive Test Suite for Plugin Templates
 *
 * Tests all templates including:
 * - Synth templates
 * - Effect templates
 * - Utility templates
 * - Dynamics templates
 * - Modulation templates
 *
 * Tests cover:
 * - Template structure validation
 * - UI component creation
 * - DSP graph configuration
 * - Code generation
 * - Parameter mappings
 * - Export functionality
 */

import {
  pluginTemplates,
  getTemplatesByCategory,
  getAllCategories,
  searchTemplates,
  createProjectFromTemplate,
  PluginTemplate,
} from '../PluginTemplates';

describe('Plugin Templates', () => {
  describe('Template Structure', () => {
    it('should have at least 7 templates (including utility and modulation)', () => {
      expect(pluginTemplates.length).toBeGreaterThanOrEqual(7);
    });

    it('should have all required template fields', () => {
      pluginTemplates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('tags');
        expect(template).toHaveProperty('project');

        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(Array.isArray(template.tags)).toBe(true);
      });
    });

    it('should have valid project structure in each template', () => {
      pluginTemplates.forEach((template) => {
        const project = template.project;

        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('version');
        expect(project).toHaveProperty('description');
        expect(project).toHaveProperty('uiComponents');
        expect(project).toHaveProperty('dspGraph');
        expect(project).toHaveProperty('code');
        expect(project).toHaveProperty('settings');

        expect(Array.isArray(project.uiComponents)).toBe(true);
        expect(project.dspGraph).toHaveProperty('nodes');
        expect(project.dspGraph).toHaveProperty('connections');
        expect(Array.isArray(project.dspGraph.nodes)).toBe(true);
        expect(Array.isArray(project.dspGraph.connections)).toBe(true);
      });
    });
  });

  describe('Category Coverage', () => {
    it('should include at least one synth template', () => {
      const synths = getTemplatesByCategory('synth');
      expect(synths.length).toBeGreaterThanOrEqual(1);
    });

    it('should include at least one effect template', () => {
      const effects = getTemplatesByCategory('effect');
      expect(effects.length).toBeGreaterThanOrEqual(1);
    });

    it('should include at least one utility template', () => {
      const utilities = getTemplatesByCategory('utility');
      expect(utilities.length).toBeGreaterThanOrEqual(1);
      expect(utilities.some(t => t.name.includes('Analyzer') || t.name.includes('Utility'))).toBe(true);
    });

    it('should include at least one dynamics template', () => {
      const dynamics = getTemplatesByCategory('dynamics');
      expect(dynamics.length).toBeGreaterThanOrEqual(1);
    });

    it('should include at least one modulation template', () => {
      const modulation = getTemplatesByCategory('modulation');
      expect(modulation.length).toBeGreaterThanOrEqual(1);
      expect(modulation.some(t => t.name.includes('LFO') || t.name.includes('Modula'))).toBe(true);
    });

    it('should return all 5 categories', () => {
      const categories = getAllCategories();
      expect(categories).toEqual(['synth', 'effect', 'utility', 'dynamics', 'modulation']);
    });
  });

  describe('UI Components', () => {
    it('should have valid UI components in each template', () => {
      pluginTemplates.forEach((template) => {
        template.project.uiComponents.forEach((component) => {
          expect(component).toHaveProperty('id');
          expect(component).toHaveProperty('type');
          expect(component).toHaveProperty('x');
          expect(component).toHaveProperty('y');
          expect(component).toHaveProperty('width');
          expect(component).toHaveProperty('height');
          expect(component).toHaveProperty('label');

          expect(typeof component.x).toBe('number');
          expect(typeof component.y).toBe('number');
          expect(component.width).toBeGreaterThan(0);
          expect(component.height).toBeGreaterThan(0);
        });
      });
    });

    it('should have at least one UI component in each template', () => {
      pluginTemplates.forEach((template) => {
        expect(template.project.uiComponents.length).toBeGreaterThan(0);
      });
    });

    it('should have components with valid types', () => {
      const validTypes = ['knob', 'slider', 'button', 'toggle', 'display', 'waveform', 'keyboard', 'xy-pad'];

      pluginTemplates.forEach((template) => {
        template.project.uiComponents.forEach((component) => {
          expect(validTypes).toContain(component.type);
        });
      });
    });
  });

  describe('DSP Graph', () => {
    it('should have valid DSP nodes in each template', () => {
      pluginTemplates.forEach((template) => {
        template.project.dspGraph.nodes.forEach((node) => {
          expect(node).toHaveProperty('id');
          expect(node).toHaveProperty('type');
          expect(node).toHaveProperty('label');
          expect(node).toHaveProperty('x');
          expect(node).toHaveProperty('y');
          expect(node).toHaveProperty('parameters');

          expect(typeof node.x).toBe('number');
          expect(typeof node.y).toBe('number');
        });
      });
    });

    it('should have at least one DSP node in each template', () => {
      pluginTemplates.forEach((template) => {
        expect(template.project.dspGraph.nodes.length).toBeGreaterThan(0);
      });
    });

    it('should have valid node types', () => {
      const validTypes = [
        'oscillator', 'filter', 'envelope', 'lfo', 'gain', 'delay',
        'reverb', 'distortion', 'compressor', 'eq', 'mixer', 'noise',
        'ringmod', 'bitcrusher', 'input', 'output'
      ];

      pluginTemplates.forEach((template) => {
        template.project.dspGraph.nodes.forEach((node) => {
          expect(validTypes).toContain(node.type);
        });
      });
    });
  });

  describe('Code Generation', () => {
    it('should have DSP processing code in each template', () => {
      pluginTemplates.forEach((template) => {
        expect(template.project.code.dsp).toBeTruthy();
        expect(typeof template.project.code.dsp).toBe('string');
        expect(template.project.code.dsp.length).toBeGreaterThan(0);
      });
    });

    it('should have UI customization code in each template', () => {
      pluginTemplates.forEach((template) => {
        expect(template.project.code).toHaveProperty('ui');
        expect(typeof template.project.code.ui).toBe('string');
      });
    });

    it('should have helper functions code in each template', () => {
      pluginTemplates.forEach((template) => {
        expect(template.project.code).toHaveProperty('helpers');
        expect(typeof template.project.code.helpers).toBe('string');
      });
    });
  });

  describe('Project Creation', () => {
    it('should create a valid project from each template', () => {
      pluginTemplates.forEach((template) => {
        const project = createProjectFromTemplate(template);

        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('version');
        expect(project).toHaveProperty('uiComponents');
        expect(project).toHaveProperty('dspGraph');
        expect(project).toHaveProperty('code');
        expect(project).toHaveProperty('settings');

        expect(project.id).toBeTruthy();
        expect(project.name).toBe(template.project.name);
      });
    });

    it('should create unique project IDs', () => {
      const template = pluginTemplates[0];
      const project1 = createProjectFromTemplate(template);
      const project2 = createProjectFromTemplate(template);

      expect(project1.id).not.toBe(project2.id);
    });

    it('should deep clone UI components', () => {
      const template = pluginTemplates[0];
      const project1 = createProjectFromTemplate(template);
      const project2 = createProjectFromTemplate(template);

      expect(project1.uiComponents).not.toBe(project2.uiComponents);
      if (project1.uiComponents.length > 0) {
        expect(project1.uiComponents[0]).not.toBe(project2.uiComponents[0]);
      }
    });

    it('should deep clone DSP graph', () => {
      const template = pluginTemplates[0];
      const project1 = createProjectFromTemplate(template);
      const project2 = createProjectFromTemplate(template);

      expect(project1.dspGraph).not.toBe(project2.dspGraph);
      expect(project1.dspGraph.nodes).not.toBe(project2.dspGraph.nodes);
    });
  });

  describe('Search Functionality', () => {
    it('should find templates by name', () => {
      const results = searchTemplates('synth');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.name.toLowerCase().includes('synth'))).toBe(true);
    });

    it('should find templates by description', () => {
      const results = searchTemplates('compressor');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find templates by tags', () => {
      const results = searchTemplates('effect');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const results1 = searchTemplates('SYNTH');
      const results2 = searchTemplates('synth');
      expect(results1.length).toBe(results2.length);
    });

    it('should return empty array for non-existent search', () => {
      const results = searchTemplates('nonexistenttemplatename12345');
      expect(results).toEqual([]);
    });
  });

  describe('Specific Templates', () => {
    describe('Basic Synthesizer', () => {
      let synthTemplate: PluginTemplate | undefined;

      beforeAll(() => {
        synthTemplate = pluginTemplates.find(t => t.id === 'template-synth-basic');
      });

      it('should exist', () => {
        expect(synthTemplate).toBeDefined();
      });

      it('should have synth category', () => {
        expect(synthTemplate?.category).toBe('synth');
      });

      it('should have oscillator, filter, and envelope nodes', () => {
        const nodeTypes = synthTemplate?.project.dspGraph.nodes.map(n => n.type);
        expect(nodeTypes).toContain('oscillator');
        expect(nodeTypes).toContain('filter');
        expect(nodeTypes).toContain('envelope');
      });
    });

    describe('Dynamic Compressor', () => {
      let compressorTemplate: PluginTemplate | undefined;

      beforeAll(() => {
        compressorTemplate = pluginTemplates.find(t => t.id === 'template-compressor');
      });

      it('should exist', () => {
        expect(compressorTemplate).toBeDefined();
      });

      it('should have dynamics category', () => {
        expect(compressorTemplate?.category).toBe('dynamics');
      });

      it('should have compressor node', () => {
        const nodeTypes = compressorTemplate?.project.dspGraph.nodes.map(n => n.type);
        expect(nodeTypes).toContain('compressor');
      });
    });

    describe('Spectrum Analyzer (Utility)', () => {
      let analyzerTemplate: PluginTemplate | undefined;

      beforeAll(() => {
        analyzerTemplate = pluginTemplates.find(t => t.id === 'template-spectrum-analyzer');
      });

      it('should exist', () => {
        expect(analyzerTemplate).toBeDefined();
      });

      it('should have utility category', () => {
        expect(analyzerTemplate?.category).toBe('utility');
      });

      it('should have waveform display for spectrum', () => {
        const hasSpectrumDisplay = analyzerTemplate?.project.uiComponents.some(
          c => c.type === 'waveform' && c.properties?.type === 'spectrum'
        );
        expect(hasSpectrumDisplay).toBe(true);
      });

      it('should have FFT-related code', () => {
        const code = analyzerTemplate?.project.code.dsp;
        expect(code).toContain('FFT');
      });
    });

    describe('LFO Modulator (Modulation)', () => {
      let lfoTemplate: PluginTemplate | undefined;

      beforeAll(() => {
        lfoTemplate = pluginTemplates.find(t => t.id === 'template-lfo-modulator');
      });

      it('should exist', () => {
        expect(lfoTemplate).toBeDefined();
      });

      it('should have modulation category', () => {
        expect(lfoTemplate?.category).toBe('modulation');
      });

      it('should have LFO node', () => {
        const nodeTypes = lfoTemplate?.project.dspGraph.nodes.map(n => n.type);
        expect(nodeTypes).toContain('lfo');
      });

      it('should have waveform selection buttons', () => {
        const waveformButtons = lfoTemplate?.project.uiComponents.filter(
          c => c.type === 'button' && ['Sine', 'Triangle', 'Square', 'Saw'].includes(c.label)
        );
        expect(waveformButtons?.length).toBeGreaterThanOrEqual(4);
      });

      it('should have tempo sync toggle', () => {
        const tempoSync = lfoTemplate?.project.uiComponents.some(
          c => c.label === 'Tempo Sync'
        );
        expect(tempoSync).toBe(true);
      });
    });
  });

  describe('Settings Validation', () => {
    it('should have valid dimensions in each template', () => {
      pluginTemplates.forEach((template) => {
        const settings = template.project.settings;

        expect(settings.width).toBeGreaterThan(0);
        expect(settings.height).toBeGreaterThan(0);
        expect(typeof settings.resizable).toBe('boolean');
      });
    });

    it('should have valid audio settings', () => {
      pluginTemplates.forEach((template) => {
        const settings = template.project.settings;

        expect([44100, 48000, 96000]).toContain(settings.sampleRate);
        expect([256, 512, 1024, 2048]).toContain(settings.bufferSize);
      });
    });

    it('should have valid background color', () => {
      pluginTemplates.forEach((template) => {
        const settings = template.project.settings;

        expect(settings.backgroundColor).toBeTruthy();
        expect(settings.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('Parameter Mappings', () => {
    it('should have UI components with parameter mappings', () => {
      pluginTemplates.forEach((template) => {
        const componentsWithParams = template.project.uiComponents.filter(
          c => c.properties?.parameter
        );

        // At least some components should have parameter mappings
        if (template.category !== 'utility') {
          expect(componentsWithParams.length).toBeGreaterThan(0);
        }
      });
    });

    it('should have consistent parameter names', () => {
      pluginTemplates.forEach((template) => {
        template.project.uiComponents.forEach((component) => {
          if (component.properties?.parameter) {
            const paramName = component.properties.parameter as string;
            // Parameter names should be lowercase with underscores
            expect(paramName).toMatch(/^[a-z_]+$/);
          }
        });
      });
    });
  });
});
