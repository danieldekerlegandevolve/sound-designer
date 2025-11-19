import fs from 'fs/promises';
import path from 'path';
import { PluginProject, ExportConfig } from '@shared/types';
import { validateProjectForExport, generateValidationReport } from './exportValidation';
import { generateEnhancedProcessorHeader, generateEnhancedProcessorImplementation, generateCMakeFile } from './enhancedJUCEExport';
import { generateWebAudioPlugin } from './webAudioExport';
import { exportStandaloneApp as exportStandaloneElectronApp } from './standaloneExport';
import { exportLV2Plugin } from './lv2Export';

export async function exportPlugin(config: {
  project: PluginProject;
  config: ExportConfig;
}): Promise<{ outputPath: string; validationReport?: string }> {
  const { project, config: exportConfig } = config;

  // Validate project before export
  const validation = validateProjectForExport(project);
  const validationReport = generateValidationReport(validation);

  if (!validation.isValid) {
    throw new Error(`Export validation failed:\n${validationReport}`);
  }

  // Create output directory
  const outputDir = exportConfig.outputPath;
  await fs.mkdir(outputDir, { recursive: true });

  // Write validation report
  await fs.writeFile(
    path.join(outputDir, 'VALIDATION_REPORT.md'),
    validationReport,
    'utf-8'
  );

  // Generate based on format
  let result;
  switch (exportConfig.format) {
    case 'vst':
    case 'vst3':
    case 'au':
      result = await exportNativePlugin(project, exportConfig, outputDir);
      break;

    case 'lv2':
      result = await exportLV2Plugin(project, exportConfig, outputDir);
      break;

    case 'web':
      result = await exportWebPlugin(project, exportConfig, outputDir);
      break;

    case 'standalone':
      result = await exportStandaloneElectronApp(project, exportConfig, outputDir);
      break;

    case 'mobile':
      result = await exportMobilePlugin(project, exportConfig, outputDir);
      break;

    case 'hardware':
      result = await exportHardwareDSP(project, exportConfig, outputDir);
      break;

    default:
      throw new Error(`Unsupported export format: ${exportConfig.format}`);
  }

  return { ...result, validationReport };
}

// Export native plugin (VST/VST3/AU) using JUCE
async function exportNativePlugin(
  project: PluginProject,
  config: ExportConfig,
  outputDir: string
): Promise<{ outputPath: string }> {
  // Generate JUCE project using enhanced generator
  const juceProject = generateJUCEProject(project, config);

  // Write JUCE project files
  const projectPath = path.join(outputDir, `${project.name}.jucer`);
  await fs.writeFile(projectPath, juceProject.jucer, 'utf-8');

  // Write source files
  const srcDir = path.join(outputDir, 'Source');
  await fs.mkdir(srcDir, { recursive: true });

  // Use enhanced code generation
  const processorHeader = generateEnhancedProcessorHeader(project);
  const processorImpl = generateEnhancedProcessorImplementation(project);

  await fs.writeFile(
    path.join(srcDir, 'PluginProcessor.h'),
    processorHeader,
    'utf-8'
  );
  await fs.writeFile(
    path.join(srcDir, 'PluginProcessor.cpp'),
    processorImpl,
    'utf-8'
  );
  await fs.writeFile(
    path.join(srcDir, 'PluginEditor.h'),
    juceProject.editorHeader,
    'utf-8'
  );
  await fs.writeFile(
    path.join(srcDir, 'PluginEditor.cpp'),
    juceProject.editorImpl,
    'utf-8'
  );

  // Write CMake file for modern build system
  const cmake = generateCMakeFile(project);
  await fs.writeFile(path.join(outputDir, 'CMakeLists.txt'), cmake, 'utf-8');

  // Write build instructions
  const buildInstructions = generateBuildInstructions(config);
  await fs.writeFile(
    path.join(outputDir, 'BUILD.md'),
    buildInstructions,
    'utf-8'
  );

  return { outputPath: outputDir };
}

// Generate JUCE project files
function generateJUCEProject(project: PluginProject, config: ExportConfig) {
  const pluginName = project.name.replace(/\s+/g, '');

  // Generate .jucer project file
  const jucer = `<?xml version="1.0" encoding="UTF-8"?>
<JUCERPROJECT id="${project.id}" name="${project.name}" projectType="audioplug"
              version="${project.version}" bundleIdentifier="com.sounddesigner.${pluginName}"
              includeBinaryInAppConfig="1" cppLanguageStandard="17">
  <MAINGROUP id="MainGroup" name="${project.name}">
    <GROUP id="Source" name="Source">
      <FILE id="PluginProcessor" name="PluginProcessor.cpp" compile="1" resource="0"/>
      <FILE id="PluginProcessor2" name="PluginProcessor.h" compile="0" resource="0"/>
      <FILE id="PluginEditor" name="PluginEditor.cpp" compile="1" resource="0"/>
      <FILE id="PluginEditor2" name="PluginEditor.h" compile="0" resource="0"/>
    </GROUP>
  </MAINGROUP>
  <EXPORTFORMATS>
    <XCODE_MAC targetFolder="Builds/MacOSX">
      <CONFIGURATIONS>
        <CONFIGURATION name="Debug" isDebug="1"/>
        <CONFIGURATION name="Release" isDebug="0"/>
      </CONFIGURATIONS>
    </XCODE_MAC>
    <VS2022 targetFolder="Builds/VisualStudio2022">
      <CONFIGURATIONS>
        <CONFIGURATION name="Debug" isDebug="1"/>
        <CONFIGURATION name="Release" isDebug="0"/>
      </CONFIGURATIONS>
    </VS2022>
  </EXPORTFORMATS>
  <MODULES>
    <MODULE id="juce_audio_basics" showAllCode="1"/>
    <MODULE id="juce_audio_devices" showAllCode="1"/>
    <MODULE id="juce_audio_formats" showAllCode="1"/>
    <MODULE id="juce_audio_plugin_client" showAllCode="1"/>
    <MODULE id="juce_audio_processors" showAllCode="1"/>
    <MODULE id="juce_audio_utils" showAllCode="1"/>
    <MODULE id="juce_core" showAllCode="1"/>
    <MODULE id="juce_data_structures" showAllCode="1"/>
    <MODULE id="juce_events" showAllCode="1"/>
    <MODULE id="juce_graphics" showAllCode="1"/>
    <MODULE id="juce_gui_basics" showAllCode="1"/>
    <MODULE id="juce_gui_extra" showAllCode="1"/>
  </MODULES>
</JUCERPROJECT>`;

  // Generate processor header
  const processorHeader = generateProcessorHeader(project);

  // Generate processor implementation
  const processorImpl = generateProcessorImplementation(project);

  // Generate editor header
  const editorHeader = generateEditorHeader(project);

  // Generate editor implementation
  const editorImpl = generateEditorImplementation(project);

  return {
    jucer,
    processorHeader,
    processorImpl,
    editorHeader,
    editorImpl,
  };
}

function generateProcessorHeader(project: PluginProject): string {
  const className = project.name.replace(/\s+/g, '') + 'AudioProcessor';

  return `#pragma once

#include <JuceHeader.h>

class ${className} : public juce::AudioProcessor
{
public:
    ${className}();
    ~${className}() override;

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;

    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override;

    const juce::String getName() const override;

    bool acceptsMidi() const override;
    bool producesMidi() const override;
    bool isMidiEffect() const override;
    double getTailLengthSeconds() const override;

    int getNumPrograms() override;
    int getCurrentProgram() override;
    void setCurrentProgram (int index) override;
    const juce::String getProgramName (int index) override;
    void changeProgramName (int index, const juce::String& newName) override;

    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

private:
    // DSP state
    ${generateDSPStateVariables(project)}

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (${className})
};`;
}

function generateProcessorImplementation(project: PluginProject): string {
  const className = project.name.replace(/\s+/g, '') + 'AudioProcessor';

  return `#include "PluginProcessor.h"
#include "PluginEditor.h"

${className}::${className}()
    : AudioProcessor (BusesProperties()
                          .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                          .withOutput ("Output", juce::AudioChannelSet::stereo(), true))
{
}

${className}::~${className}()
{
}

const juce::String ${className}::getName() const
{
    return JucePlugin_Name;
}

bool ${className}::acceptsMidi() const
{
    return false;
}

bool ${className}::producesMidi() const
{
    return false;
}

bool ${className}::isMidiEffect() const
{
    return false;
}

double ${className}::getTailLengthSeconds() const
{
    return 0.0;
}

int ${className}::getNumPrograms()
{
    return 1;
}

int ${className}::getCurrentProgram()
{
    return 0;
}

void ${className}::setCurrentProgram (int index)
{
    juce::ignoreUnused (index);
}

const juce::String ${className}::getProgramName (int index)
{
    juce::ignoreUnused (index);
    return {};
}

void ${className}::changeProgramName (int index, const juce::String& newName)
{
    juce::ignoreUnused (index, newName);
}

void ${className}::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    juce::ignoreUnused (sampleRate, samplesPerBlock);
    ${generatePrepareToPlayCode(project)}
}

void ${className}::releaseResources()
{
}

bool ${className}::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::mono()
     && layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo())
        return false;

    if (layouts.getMainOutputChannelSet() != layouts.getMainInputChannelSet())
        return false;

    return true;
}

void ${className}::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ignoreUnused (midiMessages);

    juce::ScopedNoDenormals noDenormals;
    auto totalNumInputChannels  = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear (i, 0, buffer.getNumSamples());

    ${generateProcessBlockCode(project)}
}

bool ${className}::hasEditor() const
{
    return true;
}

juce::AudioProcessorEditor* ${className}::createEditor()
{
    return new ${project.name.replace(/\s+/g, '')}AudioProcessorEditor (*this);
}

void ${className}::getStateInformation (juce::MemoryBlock& destData)
{
    juce::ignoreUnused (destData);
}

void ${className}::setStateInformation (const void* data, int sizeInBytes)
{
    juce::ignoreUnused (data, sizeInBytes);
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new ${className}();
}`;
}

function generateEditorHeader(project: PluginProject): string {
  const className = project.name.replace(/\s+/g, '') + 'AudioProcessorEditor';
  const processorClass = project.name.replace(/\s+/g, '') + 'AudioProcessor';

  return `#pragma once

#include <JuceHeader.h>
#include "PluginProcessor.h"

class ${className} : public juce::AudioProcessorEditor
{
public:
    ${className} (${processorClass}&);
    ~${className}() override;

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    ${processorClass}& audioProcessor;

    ${generateUIComponents(project)}

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (${className})
};`;
}

function generateEditorImplementation(project: PluginProject): string {
  const className = project.name.replace(/\s+/g, '') + 'AudioProcessorEditor';
  const processorClass = project.name.replace(/\s+/g, '') + 'AudioProcessor';

  return `#include "PluginProcessor.h"
#include "PluginEditor.h"

${className}::${className} (${processorClass}& p)
    : AudioProcessorEditor (&p), audioProcessor (p)
{
    setSize (${project.settings.width}, ${project.settings.height});
    ${generateUISetup(project)}
}

${className}::~${className}()
{
}

void ${className}::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour::fromString("${project.settings.backgroundColor}"));
    ${generatePaintCode(project)}
}

void ${className}::resized()
{
    ${generateResizedCode(project)}
}`;
}

// Helper functions for code generation
function generateDSPStateVariables(project: PluginProject): string {
  return '// DSP state variables\n    double sampleRate = 44100.0;';
}

function generatePrepareToPlayCode(project: PluginProject): string {
  return '// Initialize DSP';
}

function generateProcessBlockCode(project: PluginProject): string {
  return `// Process audio
    for (int channel = 0; channel < totalNumInputChannels; ++channel)
    {
        auto* channelData = buffer.getWritePointer (channel);
        for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
        {
            // Apply processing
            channelData[sample] = channelData[sample];
        }
    }`;
}

function generateUIComponents(project: PluginProject): string {
  return project.uiComponents
    .map((comp) => `juce::Label ${comp.id};`)
    .join('\n    ');
}

function generateUISetup(project: PluginProject): string {
  return '';
}

function generatePaintCode(project: PluginProject): string {
  return '';
}

function generateResizedCode(project: PluginProject): string {
  return project.uiComponents
    .map((comp) => `${comp.id}.setBounds(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height});`)
    .join('\n    ');
}

function generateBuildInstructions(config: ExportConfig): string {
  return `# Build Instructions

## Requirements

- JUCE Framework (v7.0+)
- CMake or Projucer
- C++ compiler (MSVC 2022, Xcode, or GCC)

## Building

### Using Projucer

1. Open the .jucer file in Projucer
2. Set JUCE modules path
3. Save and open in IDE (Xcode/Visual Studio)
4. Build the project

### Using CMake

\`\`\`bash
mkdir build
cd build
cmake ..
cmake --build . --config ${config.optimizationLevel === 'debug' ? 'Debug' : 'Release'}
\`\`\`

## Output

The compiled plugin will be in:
- macOS: ~/Library/Audio/Plug-Ins/${config.format.toUpperCase()}
- Windows: C:\\Program Files\\Common Files\\VST3
- Linux: ~/.vst3
`;
}

// Export as web plugin
async function exportWebPlugin(
  project: PluginProject,
  config: ExportConfig,
  outputDir: string
): Promise<{ outputPath: string }> {
  // Generate Web Audio plugin using enhanced generator
  const webPlugin = generateWebAudioPlugin(project);
  const pluginName = project.name.replace(/\s+/g, '');

  // Write JavaScript module
  await fs.writeFile(path.join(outputDir, `${pluginName}.js`), webPlugin.js, 'utf-8');

  // Write HTML demo
  await fs.writeFile(path.join(outputDir, 'index.html'), webPlugin.html, 'utf-8');

  // Write package.json
  await fs.writeFile(path.join(outputDir, 'package.json'), webPlugin.package, 'utf-8');

  // Write README
  const readme = generateWebReadme(project);
  await fs.writeFile(path.join(outputDir, 'README.md'), readme, 'utf-8');

  return { outputPath: outputDir };
}

function generateWebReadme(project: PluginProject): string {
  const pluginName = project.name.replace(/\s+/g, '');

  return `# ${project.name}

${project.description}

## Web Audio Plugin

This is a Web Audio API plugin that can run directly in the browser.

### Installation

\`\`\`bash
npm install
\`\`\`

### Usage

#### HTML

\`\`\`html
<script type="module">
  import ${pluginName}Plugin from './${pluginName}.js';

  const audioContext = new AudioContext();
  const plugin = new ${pluginName}Plugin(audioContext);
  plugin.connect(audioContext.destination);
</script>
\`\`\`

#### Quick Test

Open \`index.html\` in a modern web browser to test the plugin.

Or start a local server:

\`\`\`bash
npm start
# Then open http://localhost:8000
\`\`\`

### API

#### Constructor

\`\`\`javascript
const plugin = new ${pluginName}Plugin(audioContext);
\`\`\`

#### Methods

- \`connect(destination)\` - Connect plugin output to destination
- \`disconnect()\` - Disconnect plugin output
- \`setParameter(name, value, time)\` - Set parameter value with optional ramp time
- \`getParameter(name)\` - Get current parameter value
- \`getState()\` - Get all parameter values as object
- \`setState(state)\` - Set all parameters from state object
- \`dispose()\` - Clean up resources

### Parameters

${Object.keys(project.dspGraph.nodes).length} DSP parameters available for automation.

### License

Generated by Sound Designer v${project.version}
`;
}

function generateWebAudioCode(project: PluginProject): string {
  return `// Web Audio plugin implementation
class ${project.name.replace(/\s+/g, '')}Plugin {
  constructor(audioContext) {
    this.context = audioContext;
    this.input = this.context.createGain();
    this.output = this.context.createGain();

    // Initialize DSP nodes
    this.setupDSP();
  }

  setupDSP() {
    // Connect DSP graph
    this.input.connect(this.output);
  }

  connect(destination) {
    this.output.connect(destination);
  }
}`;
}

function generateWebHTML(project: PluginProject): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${project.name}</title>
  <style>
    body { background: ${project.settings.backgroundColor}; }
  </style>
</head>
<body>
  <h1>${project.name}</h1>
  <script src="plugin.js"></script>
</body>
</html>`;
}

// Export as standalone app
async function exportStandaloneApp(
  project: PluginProject,
  config: ExportConfig,
  outputDir: string
): Promise<{ outputPath: string }> {
  // Similar to native plugin but as standalone
  return exportNativePlugin(project, config, outputDir);
}

// Export mobile plugin
async function exportMobilePlugin(
  project: PluginProject,
  config: ExportConfig,
  outputDir: string
): Promise<{ outputPath: string }> {
  throw new Error('Mobile export not yet implemented');
}

// Export hardware DSP
async function exportHardwareDSP(
  project: PluginProject,
  config: ExportConfig,
  outputDir: string
): Promise<{ outputPath: string }> {
  throw new Error('Hardware export not yet implemented');
}
