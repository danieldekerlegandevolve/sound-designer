import fs from 'fs/promises';
import path from 'path';
import { PluginProject, ExportConfig } from '@shared/types';

/**
 * Export LV2 plugin format (Linux audio plugin standard)
 */
export async function exportLV2Plugin(
  project: PluginProject,
  config: ExportConfig,
  outputDir: string
): Promise<{ outputPath: string }> {
  const pluginName = project.name.replace(/\s+/g, '_');
  const pluginURI = `http://sounddesigner.audio/${pluginName.toLowerCase()}`;

  // Create LV2 bundle directory
  const bundleDir = path.join(outputDir, `${pluginName}.lv2`);
  await fs.mkdir(bundleDir, { recursive: true });

  // Generate manifest.ttl
  const manifest = generateManifestTTL(project, pluginURI);
  await fs.writeFile(path.join(bundleDir, 'manifest.ttl'), manifest, 'utf-8');

  // Generate plugin TTL
  const pluginTTL = generatePluginTTL(project, pluginURI);
  await fs.writeFile(path.join(bundleDir, `${pluginName}.ttl`), pluginTTL, 'utf-8');

  // Generate C++ source
  const sourceCode = generateLV2Source(project, pluginURI);
  await fs.writeFile(path.join(bundleDir, `${pluginName}.cpp`), sourceCode, 'utf-8');

  // Generate Makefile
  const makefile = generateMakefile(project);
  await fs.writeFile(path.join(bundleDir, 'Makefile'), makefile, 'utf-8');

  // Generate README
  const readme = generateLV2Readme(project);
  await fs.writeFile(path.join(bundleDir, 'README.md'), readme, 'utf-8');

  return { outputPath: bundleDir };
}

function generateManifestTTL(project: PluginProject, pluginURI: string): string {
  const pluginName = project.name.replace(/\s+/g, '_');

  return `@prefix lv2:  <http://lv2plug.in/ns/lv2core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix doap: <http://usefulinc.com/ns/doap#> .

<${pluginURI}>
    a lv2:Plugin ;
    lv2:binary <${pluginName}.so> ;
    rdfs:seeAlso <${pluginName}.ttl> .
`;
}

function generatePluginTTL(project: PluginProject, pluginURI: string): string {
  const pluginName = project.name.replace(/\s+/g, '_');

  // Determine plugin class based on DSP graph
  const hasOscillator = project.dspGraph.nodes.some((n) => n.type === 'oscillator');
  const pluginClass = hasOscillator ? 'lv2:InstrumentPlugin' : 'lv2:Plugin';

  // Generate port definitions
  const ports = generateLV2Ports(project);

  return `@prefix lv2:   <http://lv2plug.in/ns/lv2core#> .
@prefix doap:  <http://usefulinc.com/ns/doap#> .
@prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#> .
@prefix units: <http://lv2plug.in/ns/extensions/units#> .
@prefix atom:  <http://lv2plug.in/ns/ext/atom#> .
@prefix midi:  <http://lv2plug.in/ns/ext/midi#> .

<${pluginURI}>
    a ${pluginClass} ;
    doap:name "${project.name}" ;
    doap:description "${project.description}" ;
    doap:license <http://opensource.org/licenses/MIT> ;
    lv2:project <${pluginURI}#project> ;
    lv2:port [
        a lv2:InputPort, lv2:AudioPort ;
        lv2:index 0 ;
        lv2:symbol "in_l" ;
        lv2:name "Audio Input Left" ;
    ] , [
        a lv2:InputPort, lv2:AudioPort ;
        lv2:index 1 ;
        lv2:symbol "in_r" ;
        lv2:name "Audio Input Right" ;
    ] , [
        a lv2:OutputPort, lv2:AudioPort ;
        lv2:index 2 ;
        lv2:symbol "out_l" ;
        lv2:name "Audio Output Left" ;
    ] , [
        a lv2:OutputPort, lv2:AudioPort ;
        lv2:index 3 ;
        lv2:symbol "out_r" ;
        lv2:name "Audio Output Right" ;
    ]${ports.length > 0 ? ' ,' : ''} ${ports.join(' , ')} .

<${pluginURI}#project>
    a doap:Project ;
    doap:name "${project.name}" ;
    doap:homepage <http://sounddesigner.audio> ;
    doap:maintainer [
        a foaf:Person ;
        foaf:name "${project.author || 'Sound Designer User'}" ;
    ] .
`;
}

function generateLV2Ports(project: PluginProject): string[] {
  const ports: string[] = [];
  let portIndex = 4; // Start after audio I/O ports

  // Extract unique parameters from all DSP nodes
  const parameters = new Map<string, any>();
  project.dspGraph.nodes.forEach((node) => {
    node.parameters.forEach((param) => {
      if (!parameters.has(param.name)) {
        parameters.set(param.name, param);
      }
    });
  });

  parameters.forEach((param, name) => {
    const symbol = name.toLowerCase().replace(/\s+/g, '_');
    const min = param.min ?? 0;
    const max = param.max ?? 1;
    const defaultVal = param.default ?? ((min + max) / 2);

    ports.push(`[
        a lv2:InputPort, lv2:ControlPort ;
        lv2:index ${portIndex} ;
        lv2:symbol "${symbol}" ;
        lv2:name "${name}" ;
        lv2:default ${defaultVal} ;
        lv2:minimum ${min} ;
        lv2:maximum ${max} ;
    ]`);

    portIndex++;
  });

  return ports;
}

function generateLV2Source(project: PluginProject, pluginURI: string): string {
  const className = project.name.replace(/\s+/g, '');

  return `#include <lv2.h>
#include <cmath>
#include <cstring>

#define ${className.toUpperCase()}_URI "${pluginURI}"

// Port indices
enum {
    PORT_IN_L = 0,
    PORT_IN_R,
    PORT_OUT_L,
    PORT_OUT_R,
    ${generatePortEnums(project)}
};

class ${className} {
public:
    ${className}(double sample_rate) : sampleRate(sample_rate) {
        // Initialize DSP state
        ${generateDSPInitialization(project)}
    }

    void connect_port(uint32_t port, void* data) {
        switch (port) {
            case PORT_IN_L: inputL = (const float*)data; break;
            case PORT_IN_R: inputR = (const float*)data; break;
            case PORT_OUT_L: outputL = (float*)data; break;
            case PORT_OUT_R: outputR = (float*)data; break;
            ${generatePortConnections(project)}
        }
    }

    void run(uint32_t n_samples) {
        for (uint32_t i = 0; i < n_samples; ++i) {
            float inL = inputL[i];
            float inR = inputR[i];

            // DSP processing
            ${generateDSPProcessing(project)}

            outputL[i] = inL;
            outputR[i] = inR;
        }
    }

private:
    double sampleRate;
    const float* inputL = nullptr;
    const float* inputR = nullptr;
    float* outputL = nullptr;
    float* outputR = nullptr;

    // Parameter pointers
    ${generateParameterDeclarations(project)}

    // DSP state
    ${generateDSPState(project)}
};

// LV2 C interface
extern "C" {

static LV2_Handle instantiate(
    const LV2_Descriptor* descriptor,
    double sample_rate,
    const char* bundle_path,
    const LV2_Feature* const* features)
{
    return new ${className}(sample_rate);
}

static void connect_port(
    LV2_Handle instance,
    uint32_t port,
    void* data)
{
    ${className}* plugin = static_cast<${className}*>(instance);
    plugin->connect_port(port, data);
}

static void activate(LV2_Handle instance)
{
    // Plugin activation
}

static void run(LV2_Handle instance, uint32_t n_samples)
{
    ${className}* plugin = static_cast<${className}*>(instance);
    plugin->run(n_samples);
}

static void deactivate(LV2_Handle instance)
{
    // Plugin deactivation
}

static void cleanup(LV2_Handle instance)
{
    ${className}* plugin = static_cast<${className}*>(instance);
    delete plugin;
}

static const void* extension_data(const char* uri)
{
    return nullptr;
}

static const LV2_Descriptor descriptor = {
    ${className.toUpperCase()}_URI,
    instantiate,
    connect_port,
    activate,
    run,
    deactivate,
    cleanup,
    extension_data
};

LV2_SYMBOL_EXPORT
const LV2_Descriptor* lv2_descriptor(uint32_t index)
{
    return index == 0 ? &descriptor : nullptr;
}

} // extern "C"
`;
}

function generatePortEnums(project: PluginProject): string {
  const parameters = new Map<string, any>();
  project.dspGraph.nodes.forEach((node) => {
    node.parameters.forEach((param) => {
      if (!parameters.has(param.name)) {
        parameters.set(param.name, param);
      }
    });
  });

  let portIndex = 4;
  const enums: string[] = [];

  parameters.forEach((param, name) => {
    const symbol = name.toUpperCase().replace(/\s+/g, '_');
    enums.push(`PORT_${symbol} = ${portIndex}`);
    portIndex++;
  });

  return enums.join(',\n    ');
}

function generateDSPInitialization(project: PluginProject): string {
  return '// Initialize DSP components\n        // TODO: Add specific initialization';
}

function generatePortConnections(project: PluginProject): string {
  const parameters = new Map<string, any>();
  project.dspGraph.nodes.forEach((node) => {
    node.parameters.forEach((param) => {
      if (!parameters.has(param.name)) {
        parameters.set(param.name, param);
      }
    });
  });

  const connections: string[] = [];
  parameters.forEach((param, name) => {
    const symbol = name.toUpperCase().replace(/\s+/g, '_');
    const varName = name.toLowerCase().replace(/\s+/g, '_');
    connections.push(`case PORT_${symbol}: ${varName} = (const float*)data; break;`);
  });

  return connections.join('\n            ');
}

function generateParameterDeclarations(project: PluginProject): string {
  const parameters = new Map<string, any>();
  project.dspGraph.nodes.forEach((node) => {
    node.parameters.forEach((param) => {
      if (!parameters.has(param.name)) {
        parameters.set(param.name, param);
      }
    });
  });

  const declarations: string[] = [];
  parameters.forEach((param, name) => {
    const varName = name.toLowerCase().replace(/\s+/g, '_');
    declarations.push(`const float* ${varName} = nullptr;`);
  });

  return declarations.join('\n    ');
}

function generateDSPState(project: PluginProject): string {
  return '// DSP state variables\n    float phase = 0.0f;';
}

function generateDSPProcessing(project: PluginProject): string {
  return `// Apply DSP processing
            // TODO: Implement DSP graph processing`;
}

function generateMakefile(project: PluginProject): string {
  const pluginName = project.name.replace(/\s+/g, '_');

  return `# Makefile for ${project.name} LV2 plugin

CXX = g++
CXXFLAGS = -fPIC -O3 -Wall -std=c++17
LDFLAGS = -shared -Wl,--no-undefined

TARGET = ${pluginName}.so
SOURCES = ${pluginName}.cpp

all: \$(TARGET)

\$(TARGET): \$(SOURCES)
\t\$(CXX) \$(CXXFLAGS) \$(SOURCES) -o \$(TARGET) \$(LDFLAGS)

clean:
\trm -f \$(TARGET)

install: \$(TARGET)
\tmkdir -p ~/.lv2/${pluginName}.lv2
\tcp \$(TARGET) *.ttl ~/.lv2/${pluginName}.lv2/

.PHONY: all clean install
`;
}

function generateLV2Readme(project: PluginProject): string {
  return `# ${project.name} - LV2 Plugin

${project.description}

## LV2 Plugin Format

This is an LV2 (Linux Audio Plugin) format implementation of ${project.name}.
LV2 is an open standard for audio plugins used primarily on Linux systems.

## Building

### Requirements

- g++ or clang++ with C++17 support
- LV2 development headers
- make

### Compile

\`\`\`bash
make
\`\`\`

### Install

\`\`\`bash
make install
\`\`\`

This will install the plugin to \`~/.lv2/\`.

For system-wide installation:

\`\`\`bash
sudo make install PREFIX=/usr
\`\`\`

## Usage

After installation, the plugin will be available in any LV2-compatible host:

- Ardour
- Carla
- Qtractor
- And many more...

## Plugin URI

\`\`\`
http://sounddesigner.audio/${project.name.toLowerCase().replace(/\s+/g, '_')}
\`\`\`

## Parameters

${project.dspGraph.nodes.length} DSP nodes with various controllable parameters.

## Version

${project.version}

## Author

${project.author || 'Sound Designer User'}

## License

MIT

## Generated By

Sound Designer v${project.version}
`;
}
