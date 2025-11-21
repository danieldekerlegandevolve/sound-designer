import { PluginProject, DSPNode, DSPParameter, UIComponent } from '@shared/types';

interface JUCEParameter {
  id: string;
  name: string;
  min: number;
  max: number;
  default: number;
  unit: string;
  type: 'float' | 'int' | 'bool';
}

/**
 * Enhanced JUCE code generation with full parameter automation,
 * MIDI support, and proper state management
 */

export function generateEnhancedProcessorHeader(project: PluginProject): string {
  const className = project.name.replace(/\s+/g, '') + 'AudioProcessor';
  const parameters = extractParameters(project);

  return `#pragma once

#include <JuceHeader.h>

class ${className} : public juce::AudioProcessor
{
public:
    ${className}();
    ~${className}() override;

    //==============================================================================
    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

   #ifndef JucePlugin_PreferredChannelConfigurations
    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;
   #endif

    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    //==============================================================================
    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override;

    //==============================================================================
    const juce::String getName() const override;

    bool acceptsMidi() const override;
    bool producesMidi() const override;
    bool isMidiEffect() const override;
    double getTailLengthSeconds() const override;

    //==============================================================================
    int getNumPrograms() override;
    int getCurrentProgram() override;
    void setCurrentProgram (int index) override;
    const juce::String getProgramName (int index) override;
    void changeProgramName (int index, const juce::String& newName) override;

    //==============================================================================
    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    //==============================================================================
    // Parameter access
    juce::AudioProcessorValueTreeState& getParameters() { return parameters; }

private:
    //==============================================================================
    // Parameter state
    juce::AudioProcessorValueTreeState parameters;

    ${generateParameterAtomics(parameters)}

    // DSP processors
    ${generateDSPProcessors(project)}

    // Sample rate
    double currentSampleRate = 44100.0;

    //==============================================================================
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (${className})
};
`;
}

export function generateEnhancedProcessorImplementation(project: PluginProject): string {
  const className = project.name.replace(/\s+/g, '') + 'AudioProcessor';
  const pluginName = project.name.replace(/\s+/g, '');
  const parameters = extractParameters(project);
  const hasMidi = checkMidiUsage(project);

  return `#include "${pluginName}Processor.h"
#include "${pluginName}Editor.h"

//==============================================================================
${className}::${className}()
#ifndef JucePlugin_PreferredChannelConfigurations
     : AudioProcessor (BusesProperties()
                     #if ! JucePlugin_IsMidiEffect
                      #if ! JucePlugin_IsSynth
                       .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                      #endif
                       .withOutput ("Output", juce::AudioChannelSet::stereo(), true)
                     #endif
                       ),
#else
    :
#endif
      parameters (*this, nullptr, juce::Identifier ("${project.name}Parameters"),
                  {
                      ${generateParameterLayout(parameters)}
                  })
{
    // Initialize parameter listeners
    ${generateParameterListeners(parameters)}
}

${className}::~${className}()
{
}

//==============================================================================
const juce::String ${className}::getName() const
{
    return JucePlugin_Name;
}

bool ${className}::acceptsMidi() const
{
   #if JucePlugin_WantsMidiInput
    return true;
   #else
    return ${hasMidi ? 'true' : 'false'};
   #endif
}

bool ${className}::producesMidi() const
{
   #if JucePlugin_ProducesMidiOutput
    return true;
   #else
    return false;
   #endif
}

bool ${className}::isMidiEffect() const
{
   #if JucePlugin_IsMidiEffect
    return true;
   #else
    return false;
   #endif
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
}

const juce::String ${className}::getProgramName (int index)
{
    return {};
}

void ${className}::changeProgramName (int index, const juce::String& newName)
{
}

//==============================================================================
void ${className}::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    currentSampleRate = sampleRate;

    ${generatePrepareToPlayCode(project)}
}

void ${className}::releaseResources()
{
    ${generateReleaseResourcesCode(project)}
}

#ifndef JucePlugin_PreferredChannelConfigurations
bool ${className}::isBusesLayoutSupported (const BusesLayout& layouts) const
{
  #if JucePlugin_IsMidiEffect
    juce::ignoreUnused (layouts);
    return true;
  #else
    // Stereo in/out support
    if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::mono()
     && layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo())
        return false;

    // Input and output must match
   #if ! JucePlugin_IsSynth
    if (layouts.getMainOutputChannelSet() != layouts.getMainInputChannelSet())
        return false;
   #endif

    return true;
  #endif
}
#endif

void ${className}::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    auto totalNumInputChannels  = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    // Clear any extra output channels
    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear (i, 0, buffer.getNumSamples());

    ${generateProcessBlockCode(project, hasMidi)}
}

//==============================================================================
bool ${className}::hasEditor() const
{
    return true;
}

juce::AudioProcessorEditor* ${className}::createEditor()
{
    return new juce::GenericAudioProcessorEditor (*this);
}

//==============================================================================
void ${className}::getStateInformation (juce::MemoryBlock& destData)
{
    auto state = parameters.copyState();
    std::unique_ptr<juce::XmlElement> xml (state.createXml());
    copyXmlToBinary (*xml, destData);
}

void ${className}::setStateInformation (const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xmlState (getXmlFromBinary (data, sizeInBytes));

    if (xmlState.get() != nullptr)
        if (xmlState->hasTagName (parameters.state.getType()))
            parameters.replaceState (juce::ValueTree::fromXml (*xmlState));
}

//==============================================================================
// This creates new instances of the plugin..
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new ${className}();
}
`;
}

// Helper functions

function extractParameters(project: PluginProject): JUCEParameter[] {
  const params: JUCEParameter[] = [];

  // Extract from DSP nodes
  project.dspGraph.nodes.forEach(node => {
    node.parameters?.forEach(param => {
      params.push({
        id: `${node.id}_${param.id}`,
        name: `${node.label || node.type} ${param.name}`,
        min: param.min ?? 0,
        max: param.max ?? 1,
        default: param.default,
        unit: param.unit || '',
        type: param.type as 'float' | 'int' | 'bool',
      });
    });
  });

  // Extract from UI components
  project.uiComponents.forEach(comp => {
    if (comp.properties.parameter && !params.find(p => p.id === comp.properties.parameter)) {
      params.push({
        id: comp.properties.parameter,
        name: comp.label,
        min: comp.properties.min ?? 0,
        max: comp.properties.max ?? 100,
        default: comp.properties.value ?? 50,
        unit: comp.properties.unit || '',
        type: 'float',
      });
    }
  });

  return params;
}

function generateParameterLayout(parameters: JUCEParameter[]): string {
  return parameters.map(param => {
    const paramId = sanitizeId(param.id);
    const paramName = param.name;

    if (param.type === 'bool') {
      return `std::make_unique<juce::AudioParameterBool> ("${paramId}", "${paramName}", ${param.default ? 'true' : 'false'})`;
    } else if (param.type === 'int') {
      return `std::make_unique<juce::AudioParameterInt> ("${paramId}", "${paramName}", ${Math.floor(param.min)}, ${Math.floor(param.max)}, ${Math.floor(param.default)})`;
    } else {
      const unit = param.unit ? ` "${param.unit}"` : '';
      return `std::make_unique<juce::AudioParameterFloat> ("${paramId}", "${paramName}", ${param.min}f, ${param.max}f, ${param.default}f)`;
    }
  }).join(',\n                      ');
}

function generateParameterAtomics(parameters: JUCEParameter[]): string {
  return parameters.map(param => {
    const paramId = sanitizeId(param.id);
    return `std::atomic<float> ${paramId}Value { ${param.default}f };`;
  }).join('\n    ');
}

function generateParameterListeners(parameters: JUCEParameter[]): string {
  return parameters.map(param => {
    const paramId = sanitizeId(param.id);
    return `parameters.addParameterListener ("${paramId}", this);`;
  }).join('\n    ');
}

function generateDSPProcessors(project: PluginProject): string {
  const processors: string[] = [];

  project.dspGraph.nodes.forEach(node => {
    switch (node.type) {
      case 'filter':
        processors.push('juce::dsp::StateVariableTPTFilter<float> filter;');
        break;
      case 'delay':
        processors.push('juce::dsp::DelayLine<float> delayLine { 192000 };');
        break;
      case 'reverb':
        processors.push('juce::dsp::Reverb reverb;');
        break;
      case 'compressor':
        processors.push('juce::dsp::Compressor<float> compressor;');
        break;
      case 'gain':
        processors.push('juce::dsp::Gain<float> gain;');
        break;
    }
  });

  return processors.join('\n    ');
}

function generatePrepareToPlayCode(project: PluginProject): string {
  const code: string[] = [];

  project.dspGraph.nodes.forEach(node => {
    switch (node.type) {
      case 'filter':
        code.push('filter.prepare ({ sampleRate, (juce::uint32) samplesPerBlock, 2 });');
        code.push('filter.setType (juce::dsp::StateVariableTPTFilterType::lowpass);');
        break;
      case 'delay':
        code.push('delayLine.prepare ({ sampleRate, (juce::uint32) samplesPerBlock, 2 });');
        break;
      case 'reverb':
        code.push('reverb.prepare ({ sampleRate, (juce::uint32) samplesPerBlock, 2 });');
        break;
      case 'compressor':
        code.push('compressor.prepare ({ sampleRate, (juce::uint32) samplesPerBlock, 2 });');
        break;
    }
  });

  return code.join('\n    ');
}

function generateReleaseResourcesCode(project: PluginProject): string {
  return '// Release resources if needed';
}

function generateProcessBlockCode(project: PluginProject, hasMidi: boolean): string {
  const code: string[] = [];

  if (hasMidi) {
    code.push(`
    // Process MIDI
    for (const auto metadata : midiMessages) {
        auto message = metadata.getMessage();
        if (message.isNoteOn()) {
            // Handle note on
        } else if (message.isNoteOff()) {
            // Handle note off
        }
    }`);
  }

  code.push(`
    // Process audio through DSP chain
    juce::dsp::AudioBlock<float> block (buffer);
    juce::dsp::ProcessContextReplacing<float> context (block);
    `);

  // Generate DSP chain processing
  project.dspGraph.nodes.forEach((node, index) => {
    switch (node.type) {
      case 'filter':
        code.push('filter.process (context);');
        break;
      case 'gain':
        code.push('gain.process (context);');
        break;
      case 'compressor':
        code.push('compressor.process (context);');
        break;
      case 'reverb':
        code.push('reverb.process (context);');
        break;
    }
  });

  return code.join('\n    ');
}

function checkMidiUsage(project: PluginProject): boolean {
  return project.dspGraph.nodes.some(node =>
    node.type === 'oscillator' ||
    node.type === 'envelope' ||
    project.uiComponents.some(comp => comp.type === 'keyboard')
  );
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

export function generateCMakeFile(project: PluginProject): string {
  const pluginName = project.name.replace(/\s+/g, '');

  return `cmake_minimum_required(VERSION 3.15)
project(${pluginName} VERSION ${project.version})

set(CMAKE_CXX_STANDARD 17)

# Add JUCE
add_subdirectory(JUCE)

# Create plugin target
juce_add_plugin(${pluginName}
    COMPANY_NAME "SoundDesigner"
    IS_SYNTH ${checkMidiUsage(project) ? 'TRUE' : 'FALSE'}
    NEEDS_MIDI_INPUT ${checkMidiUsage(project) ? 'TRUE' : 'FALSE'}
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS FALSE
    COPY_PLUGIN_AFTER_BUILD TRUE
    PLUGIN_MANUFACTURER_CODE Sdgn
    PLUGIN_CODE ${project.id.substring(0, 4).toUpperCase()}
    FORMATS VST3 AU Standalone
    PRODUCT_NAME "${project.name}"
)

# Source files
target_sources(${pluginName}
    PRIVATE
        ${pluginName}/${pluginName}Processor.cpp
        ${pluginName}/${pluginName}Editor.cpp
)

# JUCE modules
target_link_libraries(${pluginName}
    PRIVATE
        juce::juce_audio_basics
        juce::juce_audio_devices
        juce::juce_audio_formats
        juce::juce_audio_plugin_client
        juce::juce_audio_processors
        juce::juce_audio_utils
        juce::juce_core
        juce::juce_data_structures
        juce::juce_dsp
        juce::juce_events
        juce::juce_graphics
        juce::juce_gui_basics
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# Compile definitions
target_compile_definitions(${pluginName}
    PUBLIC
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
)
`;
}
