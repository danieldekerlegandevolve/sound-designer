import { PluginProject, ExportConfig } from '@shared/types';

/**
 * Enhanced Audio Unit (AU) Export
 * macOS-specific configurations and optimizations
 */

export interface AUConfiguration {
  type: 'aufx' | 'aumu' | 'aumf' | 'auol'; // Effect, Music Device, MIDI Effect, Offline
  subtype: string; // 4-character code
  manufacturer: string; // 4-character code
  name: string;
  description: string;
  version: string;
  factoryPresets?: boolean;
  cocoaUI?: boolean;
  carbonUI?: boolean;
  midiInput?: boolean;
  midiOutput?: boolean;
  latency?: number;
  tailTime?: number;
  supportedChannelLayouts?: string[];
}

export function generateAUConfiguration(project: PluginProject): AUConfiguration {
  const isSynth = project.dspGraph.nodes.some(n =>
    n.type === 'oscillator'
  );

  const hasMidi = project.dspGraph.nodes.some(n =>
    n.type === 'oscillator' || n.type === 'envelope'
  ) || project.uiComponents.some(c => c.type === 'keyboard');

  return {
    type: isSynth ? 'aumu' : 'aufx',
    subtype: generateSubtype(project),
    manufacturer: generateManufacturerCode(project),
    name: project.name,
    description: project.description,
    version: project.version,
    factoryPresets: true,
    cocoaUI: true,
    carbonUI: false,
    midiInput: hasMidi,
    midiOutput: false,
    latency: 0,
    tailTime: calculateTailTime(project),
    supportedChannelLayouts: ['stereo', 'mono'],
  };
}

export function generateAUInfoPlist(project: PluginProject, config: AUConfiguration): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>English</string>
    <key>CFBundleExecutable</key>
    <string>\${EXECUTABLE_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.sounddesigner.${project.name.replace(/\s+/g, '')}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>${config.name}</string>
    <key>CFBundlePackageType</key>
    <string>BNDL</string>
    <key>CFBundleShortVersionString</key>
    <string>${config.version}</string>
    <key>CFBundleVersion</key>
    <string>${config.version}</string>
    <key>CSResourcesFileMapped</key>
    <true/>

    <!-- Audio Unit Configuration -->
    <key>AudioComponents</key>
    <array>
        <dict>
            <key>type</key>
            <string>${config.type}</string>
            <key>subtype</key>
            <string>${config.subtype}</string>
            <key>manufacturer</key>
            <string>${config.manufacturer}</string>
            <key>name</key>
            <string>${config.name}</string>
            <key>description</key>
            <string>${config.description}</string>
            <key>version</key>
            <integer>${versionToInteger(config.version)}</integer>
            <key>factoryFunction</key>
            <string>${project.name.replace(/\s+/g, '')}Factory</string>
            <key>sandboxSafe</key>
            <true/>
            ${config.factoryPresets ? `
            <key>hasCustomView</key>
            <true/>
            ` : ''}
            <key>resourceUsage</key>
            <dict>
                <key>network.client</key>
                <false/>
                <key>temporary-exception.files.all.read-write</key>
                <false/>
            </dict>
            <key>tags</key>
            <array>
                ${generateAUTags(project).map(tag => `<string>${tag}</string>`).join('\n                ')}
            </array>
        </dict>
    </array>

    <!-- Code Signing -->
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © ${new Date().getFullYear()} ${project.author || 'Sound Designer'}. All rights reserved.</string>

    <!-- Privacy and Security -->
    <key>NSMicrophoneUsageDescription</key>
    <string>This plugin processes audio input</string>
    <key>NSAppleEventsUsageDescription</key>
    <string>This plugin uses Apple Events for automation</string>
</dict>
</plist>
`;
}

export function generateAUFactoryCode(project: PluginProject, config: AUConfiguration): string {
  const className = project.name.replace(/\s+/g, '');
  const pluginName = project.name.replace(/\s+/g, '');

  return `// Audio Unit Factory
// macOS-specific AU component entry point

#include <AudioUnit/AudioUnit.h>
#include "${pluginName}Processor.h"

// Factory function
extern "C" void* ${className}Factory(const AudioComponentDescription* inDesc)
{
    return new ${className}AudioProcessor();
}

// AU Component Entry Point
extern "C" OSStatus ${className}Entry(
    ComponentParameters* params,
    ${className}AudioProcessor* obj)
{
    return AUBase::ComponentEntryDispatch(params, obj);
}

// AU View Factory (Cocoa)
${config.cocoaUI ? `
extern "C" void* ${className}ViewFactory(
    const AudioComponentDescription* inDesc)
{
    return [[${className}CocoaView alloc] init];
}

@interface ${className}CocoaView : NSView <AUCocoaUIBase>
{
    ${className}AudioProcessor* processor;
}
@end

@implementation ${className}CocoaView

- (instancetype)initWithFrame:(NSRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        [self setupUI];
    }
    return self;
}

- (void)setupUI
{
    // Create Cocoa UI controls
    self.wantsLayer = YES;
    self.layer.backgroundColor = [[NSColor darkGrayColor] CGColor];

    // Add parameter controls here
    ${generateCocoaUIControls(project)}
}

- (NSUInteger)interfaceVersion
{
    return 0;
}

- (NSString*)description
{
    return @"${config.description}";
}

@end
` : ''}
`;
}

export function generateAUValidationScript(project: PluginProject): string {
  return `#!/bin/bash
# Audio Unit Validation Script
# Validates AU plugin installation and functionality

set -e

PLUGIN_NAME="${project.name.replace(/\s+/g, '')}"
AU_PATH="/Library/Audio/Plug-Ins/Components/$PLUGIN_NAME.component"

echo "==================================="
echo "Audio Unit Validation"
echo "==================================="
echo ""

# Check if plugin exists
if [ -d "$AU_PATH" ]; then
    echo "✓ Plugin found at: $AU_PATH"
else
    echo "✗ Plugin not found at: $AU_PATH"
    exit 1
fi

# Check code signature
echo ""
echo "Checking code signature..."
codesign -dv "$AU_PATH" 2>&1

# Run auval
echo ""
echo "Running auval (Audio Unit Validation)..."
echo "This may take a few minutes..."
echo ""

# Determine AU type and codes
AU_TYPE="aufx"  # or aumu, aumf, etc.
AU_SUBTYPE="$(echo '${generateSubtype(project)}' | xxd -r -p | od -An -tx4 | tr -d ' ')"
AU_MANU="$(echo '${generateManufacturerCode(project)}' | xxd -r -p | od -An -tx4 | tr -d ' ')"

auval -v "$AU_TYPE" "$AU_SUBTYPE" "$AU_MANU" -strict

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Audio Unit validation passed!"
    echo ""
    echo "Plugin is ready to use in:"
    echo "  - Logic Pro"
    echo "  - GarageBand"
    echo "  - Ableton Live"
    echo "  - Other AU-compatible hosts"
else
    echo ""
    echo "✗ Audio Unit validation failed"
    echo "Please review the errors above"
    exit 1
fi
`;
}

export function generateAUEntitlements(project: PluginProject): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Audio Unit Entitlements -->
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.audio-input</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.files.downloads.read-write</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <false/>
</dict>
</plist>
`;
}

export function generateCodesignScript(project: PluginProject): string {
  const pluginName = project.name.replace(/\s+/g, '');

  return `#!/bin/bash
# Code Signing Script for ${project.name}
# Signs the Audio Unit component for distribution

set -e

PLUGIN_NAME="${pluginName}"
COMPONENT_PATH="/Library/Audio/Plug-Ins/Components/$PLUGIN_NAME.component"
IDENTITY="Developer ID Application: Your Name (XXXXXXXXXX)"
ENTITLEMENTS="./entitlements.plist"

echo "Signing $PLUGIN_NAME.component..."

# Sign the component
codesign --force \\
         --sign "$IDENTITY" \\
         --entitlements "$ENTITLEMENTS" \\
         --options runtime \\
         --timestamp \\
         "$COMPONENT_PATH"

# Verify signature
echo ""
echo "Verifying signature..."
codesign --verify --deep --strict --verbose=2 "$COMPONENT_PATH"

# Check notarization readiness
echo ""
echo "Checking notarization readiness..."
codesign -dvvv "$COMPONENT_PATH"

echo ""
echo "✓ Code signing complete!"
echo ""
echo "Next steps for distribution:"
echo "1. Compress the component: ditto -c -k --keepParent \"$COMPONENT_PATH\" \"$PLUGIN_NAME.zip\""
echo "2. Submit for notarization: xcrun notarytool submit \"$PLUGIN_NAME.zip\" --keychain-profile \"AC_PASSWORD\""
echo "3. Staple the ticket: xcrun stapler staple \"$COMPONENT_PATH\""
`;
}

// Helper functions

function generateSubtype(project: PluginProject): string {
  // Generate 4-character subtype code from project name
  const name = project.name.replace(/\s+/g, '').substring(0, 4).padEnd(4, 'X');
  return name.substring(0, 4);
}

function generateManufacturerCode(project: PluginProject): string {
  // Generate 4-character manufacturer code
  // Default to 'Sdgn' for Sound Designer
  return project.author?.substring(0, 4).padEnd(4, ' ') || 'Sdgn';
}

function versionToInteger(version: string): number {
  // Convert version string (e.g., "1.0.0") to integer
  const parts = version.split('.').map(p => parseInt(p) || 0);
  return (parts[0] << 16) | (parts[1] << 8) | parts[2];
}

function calculateTailTime(project: PluginProject): number {
  // Calculate tail time based on effects used
  let maxTail = 0;

  project.dspGraph.nodes.forEach(node => {
    switch (node.type) {
      case 'reverb':
        maxTail = Math.max(maxTail, 5.0);
        break;
      case 'delay':
        const delayParam = node.parameters?.find(p => p.name === 'time');
        if (delayParam) {
          maxTail = Math.max(maxTail, delayParam.max || 2.0);
        }
        break;
    }
  });

  return maxTail;
}

function generateAUTags(project: PluginProject): string[] {
  const tags: string[] = [];

  // Determine categories based on DSP nodes
  const hasFilter = project.dspGraph.nodes.some(n => n.type === 'filter');
  const hasReverb = project.dspGraph.nodes.some(n => n.type === 'reverb');
  const hasDelay = project.dspGraph.nodes.some(n => n.type === 'delay');
  const hasDistortion = project.dspGraph.nodes.some(n => n.type === 'distortion');
  const isInstrument = project.dspGraph.nodes.some(n => n.type === 'oscillator');

  if (isInstrument) {
    tags.push('Synth');
  }

  if (hasFilter) {
    tags.push('Filter');
  }

  if (hasReverb) {
    tags.push('Reverb');
  }

  if (hasDelay) {
    tags.push('Delay');
  }

  if (hasDistortion) {
    tags.push('Distortion');
  }

  // Always add Effect if not an instrument
  if (!isInstrument) {
    tags.push('Effect');
  }

  return tags.length > 0 ? tags : ['Effect'];
}

function generateCocoaUIControls(project: PluginProject): string {
  const controls: string[] = [];

  project.uiComponents.forEach((comp, index) => {
    const yPos = 20 + (index * 60);

    switch (comp.type) {
      case 'knob':
      case 'slider':
        controls.push(`
    // ${comp.label}
    NSSlider* slider${index} = [[NSSlider alloc] initWithFrame:NSMakeRect(20, ${yPos}, 200, 30)];
    [slider${index} setMinValue:${comp.properties.min || 0}];
    [slider${index} setMaxValue:${comp.properties.max || 100}];
    [slider${index} setDoubleValue:${comp.properties.value || 50}];
    [self addSubview:slider${index}];

    NSTextField* label${index} = [[NSTextField alloc] initWithFrame:NSMakeRect(20, ${yPos + 35}, 200, 20)];
    [label${index} setStringValue:@"${comp.label}"];
    [label${index} setBezeled:NO];
    [label${index} setDrawsBackground:NO];
    [label${index} setEditable:NO];
    [label${index} setSelectable:NO];
    [self addSubview:label${index}];`);
        break;

      case 'button':
        controls.push(`
    // ${comp.label}
    NSButton* button${index} = [[NSButton alloc] initWithFrame:NSMakeRect(20, ${yPos}, 120, 32)];
    [button${index} setTitle:@"${comp.label}"];
    [button${index} setBezelStyle:NSBezelStyleRounded];
    [self addSubview:button${index}];`);
        break;
    }
  });

  return controls.join('\n');
}
