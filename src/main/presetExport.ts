import fs from 'fs/promises';
import path from 'path';
import { PluginProject } from '@shared/types';

export interface PresetData {
  name: string;
  category: string;
  author: string;
  description: string;
  parameters: Record<string, any>;
  dspGraph: {
    nodes: Array<{ id: string; type: string; parameters: any[] }>;
    connections: Array<{ sourceNodeId: string; targetNodeId: string }>;
  };
  metadata: {
    created: string;
    version: string;
    pluginName: string;
    pluginVersion: string;
  };
}

export interface PresetBank {
  name: string;
  author: string;
  description: string;
  presets: PresetData[];
  metadata: {
    created: string;
    version: string;
    presetCount: number;
  };
}

/**
 * Export a single preset
 */
export async function exportPreset(
  project: PluginProject,
  presetName: string,
  outputPath: string,
  options?: {
    category?: string;
    description?: string;
  }
): Promise<{ outputPath: string }> {
  const preset: PresetData = {
    name: presetName,
    category: options?.category || 'User',
    author: project.author,
    description: options?.description || `Preset for ${project.name}`,
    parameters: extractParameters(project),
    dspGraph: {
      nodes: project.dspGraph.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        parameters: node.parameters,
      })),
      connections: project.dspGraph.connections.map((conn) => ({
        sourceNodeId: conn.sourceNodeId,
        targetNodeId: conn.targetNodeId,
      })),
    },
    metadata: {
      created: new Date().toISOString(),
      version: '1.0.0',
      pluginName: project.name,
      pluginVersion: project.version,
    },
  };

  // Write as JSON
  await fs.writeFile(outputPath, JSON.stringify(preset, null, 2), 'utf-8');

  // Also generate user-friendly text format
  const textFormat = generatePresetText(preset);
  const textPath = outputPath.replace('.json', '.txt');
  await fs.writeFile(textPath, textFormat, 'utf-8');

  return { outputPath };
}

/**
 * Export a bank of presets
 */
export async function exportPresetBank(
  presets: PresetData[],
  bankName: string,
  outputPath: string,
  options?: {
    author?: string;
    description?: string;
  }
): Promise<{ outputPath: string }> {
  const bank: PresetBank = {
    name: bankName,
    author: options?.author || 'Sound Designer User',
    description: options?.description || `Preset bank: ${bankName}`,
    presets,
    metadata: {
      created: new Date().toISOString(),
      version: '1.0.0',
      presetCount: presets.length,
    },
  };

  // Write bank as JSON
  await fs.writeFile(outputPath, JSON.stringify(bank, null, 2), 'utf-8');

  // Generate markdown documentation
  const documentation = generateBankDocumentation(bank);
  const docPath = outputPath.replace('.json', '.md');
  await fs.writeFile(docPath, documentation, 'utf-8');

  return { outputPath };
}

/**
 * Export presets in VST3 format
 */
export async function exportVST3Presets(
  project: PluginProject,
  presets: PresetData[],
  outputDir: string
): Promise<{ outputPath: string }> {
  await fs.mkdir(outputDir, { recursive: true });

  for (const preset of presets) {
    const vst3Preset = generateVST3PresetXML(project, preset);
    const filename = `${preset.name.replace(/\s+/g, '_')}.vstpreset`;
    await fs.writeFile(path.join(outputDir, filename), vst3Preset, 'utf-8');
  }

  return { outputPath: outputDir };
}

/**
 * Export presets in Audio Unit (AU) format
 */
export async function exportAUPresets(
  project: PluginProject,
  presets: PresetData[],
  outputDir: string
): Promise<{ outputPath: string }> {
  await fs.mkdir(outputDir, { recursive: true });

  for (const preset of presets) {
    const auPreset = generateAUPresetPlist(project, preset);
    const filename = `${preset.name.replace(/\s+/g, '_')}.aupreset`;
    await fs.writeFile(path.join(outputDir, filename), auPreset, 'utf-8');
  }

  return { outputPath: outputDir };
}

/**
 * Import a preset from file
 */
export async function importPreset(presetPath: string): Promise<PresetData> {
  const content = await fs.readFile(presetPath, 'utf-8');
  const preset: PresetData = JSON.parse(content);

  // Validate preset structure
  if (!preset.name || !preset.parameters || !preset.metadata) {
    throw new Error('Invalid preset file format');
  }

  return preset;
}

/**
 * Import a preset bank from file
 */
export async function importPresetBank(bankPath: string): Promise<PresetBank> {
  const content = await fs.readFile(bankPath, 'utf-8');
  const bank: PresetBank = JSON.parse(content);

  // Validate bank structure
  if (!bank.name || !bank.presets || !Array.isArray(bank.presets)) {
    throw new Error('Invalid preset bank file format');
  }

  return bank;
}

// Helper functions

function extractParameters(project: PluginProject): Record<string, any> {
  const parameters: Record<string, any> = {};

  project.dspGraph.nodes.forEach((node) => {
    node.parameters.forEach((param) => {
      const key = `${node.id}_${param.name}`;
      parameters[key] = param.value;
    });
  });

  return parameters;
}

function generatePresetText(preset: PresetData): string {
  return `Preset: ${preset.name}
Category: ${preset.category}
Author: ${preset.author}
Description: ${preset.description}

Created: ${preset.metadata.created}
Plugin: ${preset.metadata.pluginName} v${preset.metadata.pluginVersion}

Parameters:
${Object.entries(preset.parameters)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\n')}

DSP Configuration:
  Nodes: ${preset.dspGraph.nodes.length}
  Connections: ${preset.dspGraph.connections.length}

Node Details:
${preset.dspGraph.nodes
  .map(
    (node, i) =>
      `  ${i + 1}. ${node.type} (${node.id})
     Parameters: ${node.parameters.length}`
  )
  .join('\n')}
`;
}

function generateBankDocumentation(bank: PresetBank): string {
  return `# ${bank.name}

${bank.description}

**Author:** ${bank.author}
**Created:** ${bank.metadata.created}
**Presets:** ${bank.metadata.presetCount}

## Presets

${bank.presets
  .map(
    (preset, i) => `### ${i + 1}. ${preset.name}

**Category:** ${preset.category}
**Description:** ${preset.description}

#### Parameters
${Object.entries(preset.parameters)
  .slice(0, 10)
  .map(([key, value]) => `- \`${key}\`: ${value}`)
  .join('\n')}
${Object.keys(preset.parameters).length > 10 ? `\n*... and ${Object.keys(preset.parameters).length - 10} more parameters*` : ''}

#### DSP Configuration
- **Nodes:** ${preset.dspGraph.nodes.length}
- **Connections:** ${preset.dspGraph.connections.length}
`
  )
  .join('\n---\n\n')}

## Installation

### Sound Designer
1. Open Sound Designer
2. File → Import Preset Bank
3. Select this .json file

### Other DAWs
Individual preset files are available in the respective DAW formats (VST3, AU).

## License

Presets are provided as-is for use with ${bank.presets[0]?.metadata.pluginName || 'the plugin'}.
`;
}

function generateVST3PresetXML(project: PluginProject, preset: PresetData): string {
  const pluginId = project.id.replace(/-/g, '').toUpperCase().substring(0, 8);

  return `<?xml version="1.0" encoding="UTF-8"?>
<VST3Preset>
    <MetaInfo>
        <Attribute id="plugInCategory" value="Instrument|Synth" type="string"/>
        <Attribute id="plugInName" value="${project.name}" type="string"/>
        <Attribute id="plugInVersion" value="${project.version}" type="string"/>
        <Attribute id="presetName" value="${preset.name}" type="string"/>
        <Attribute id="category" value="${preset.category}" type="string"/>
    </MetaInfo>
    <PlugInParameters>
${Object.entries(preset.parameters)
  .map(
    ([key, value], i) =>
      `        <Param id="${i}" value="${normalizeParameterValue(value)}"/>`
  )
  .join('\n')}
    </PlugInParameters>
    <ControllerState>
        <Data>
            <!-- Parameter automation data -->
        </Data>
    </ControllerState>
    <ProgramListState>
        <Program id="0" name="${preset.name}"/>
    </ProgramListState>
</VST3Preset>`;
}

function generateAUPresetPlist(project: PluginProject, preset: PresetData): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>AU version</key>
    <real>${parseFloat(project.version) || 1.0}</real>
    <key>manufacturer</key>
    <integer>1936483188</integer>
    <key>name</key>
    <string>${preset.name}</string>
    <key>subtype</key>
    <integer>1634758764</integer>
    <key>type</key>
    <integer>1635085685</integer>
    <key>version</key>
    <integer>${Math.floor((parseFloat(project.version) || 1.0) * 10000)}</integer>
    <key>data</key>
    <dict>
${Object.entries(preset.parameters)
  .map(
    ([key, value]) =>
      `        <key>${key}</key>
        <real>${normalizeParameterValue(value)}</real>`
  )
  .join('\n')}
    </dict>
</dict>
</plist>`;
}

function normalizeParameterValue(value: any): number {
  if (typeof value === 'number') {
    return Math.max(0, Math.min(1, value));
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return 0;
}
