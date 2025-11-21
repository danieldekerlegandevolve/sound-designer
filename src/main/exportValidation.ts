import { PluginProject, DSPGraph, DSPNode, DSPConnection } from '@shared/types';

export interface ValidationError {
  severity: 'error' | 'warning' | 'info';
  category: 'graph' | 'parameters' | 'ui' | 'general';
  message: string;
  nodeId?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
}

/**
 * Comprehensive validation before export
 */
export function validateProjectForExport(project: PluginProject): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const info: ValidationError[] = [];

  // Validate project metadata
  validateProjectMetadata(project, errors, warnings);

  // Validate DSP graph
  validateDSPGraph(project.dspGraph, errors, warnings, info);

  // Validate parameters
  validateParameters(project, errors, warnings);

  // Validate UI components
  validateUIComponents(project, warnings, info);

  // Check for best practices
  checkBestPractices(project, info);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
  };
}

function validateProjectMetadata(
  project: PluginProject,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  // Project name
  if (!project.name || project.name.trim().length === 0) {
    errors.push({
      severity: 'error',
      category: 'general',
      message: 'Project must have a name',
      suggestion: 'Set a name for your plugin in the project settings',
    });
  }

  if (project.name.length > 64) {
    warnings.push({
      severity: 'warning',
      category: 'general',
      message: 'Project name is very long (>64 characters)',
      suggestion: 'Consider using a shorter name for better compatibility',
    });
  }

  // Invalid characters in name
  if (/[^a-zA-Z0-9\s_-]/.test(project.name)) {
    warnings.push({
      severity: 'warning',
      category: 'general',
      message: 'Project name contains special characters',
      suggestion: 'Use only letters, numbers, spaces, underscores, and hyphens',
    });
  }

  // Version
  if (!project.version || !/^\d+\.\d+\.\d+$/.test(project.version)) {
    warnings.push({
      severity: 'warning',
      category: 'general',
      message: 'Version should follow semver format (e.g., 1.0.0)',
      suggestion: 'Update version to match semantic versioning',
    });
  }

  // Description
  if (!project.description || project.description.trim().length === 0) {
    warnings.push({
      severity: 'warning',
      category: 'general',
      message: 'Project has no description',
      suggestion: 'Add a description to help users understand the plugin',
    });
  }
}

function validateDSPGraph(
  graph: DSPGraph,
  errors: ValidationError[],
  warnings: ValidationError[],
  info: ValidationError[]
): void {
  // Check if graph is empty
  if (graph.nodes.length === 0) {
    warnings.push({
      severity: 'warning',
      category: 'graph',
      message: 'DSP graph is empty',
      suggestion: 'Add DSP nodes to create audio processing',
    });
    return;
  }

  // Check for disconnected nodes
  const connectedNodes = new Set<string>();
  graph.connections.forEach(conn => {
    connectedNodes.add(conn.sourceNodeId);
    connectedNodes.add(conn.targetNodeId);
  });

  graph.nodes.forEach(node => {
    if (!connectedNodes.has(node.id) && graph.nodes.length > 1) {
      warnings.push({
        severity: 'warning',
        category: 'graph',
        message: `Node "${node.label || node.type}" is not connected`,
        nodeId: node.id,
        suggestion: 'Connect this node to the signal chain or remove it',
      });
    }
  });

  // Check for circular dependencies
  const circularPaths = findCircularDependencies(graph);
  if (circularPaths.length > 0) {
    errors.push({
      severity: 'error',
      category: 'graph',
      message: 'DSP graph contains circular dependencies (feedback loops without delay)',
      suggestion: 'Add a delay node in feedback paths to prevent infinite loops',
    });
  }

  // Check for invalid connections
  graph.connections.forEach(conn => {
    const sourceNode = graph.nodes.find(n => n.id === conn.sourceNodeId);
    const targetNode = graph.nodes.find(n => n.id === conn.targetNodeId);

    if (!sourceNode) {
      errors.push({
        severity: 'error',
        category: 'graph',
        message: `Connection references non-existent source node`,
        suggestion: 'Remove invalid connections',
      });
    }

    if (!targetNode) {
      errors.push({
        severity: 'error',
        category: 'graph',
        message: `Connection references non-existent target node`,
        suggestion: 'Remove invalid connections',
      });
    }
  });

  // Check for output nodes
  const hasOutput = graph.nodes.some(n => n.type === 'output') ||
                   graph.nodes.some(n => graph.connections.some(c => c.sourceNodeId === n.id));

  if (!hasOutput) {
    warnings.push({
      severity: 'warning',
      category: 'graph',
      message: 'No output node or final connection detected',
      suggestion: 'Add an output node or ensure the signal chain reaches an output',
    });
  }

  // Info: Suggest optimization
  if (graph.nodes.length > 20) {
    info.push({
      severity: 'info',
      category: 'graph',
      message: `Large DSP graph (${graph.nodes.length} nodes)`,
      suggestion: 'Consider optimizing the graph for better performance',
    });
  }
}

function validateParameters(
  project: PluginProject,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const parameterIds = new Set<string>();

  // Collect all parameters from DSP nodes
  project.dspGraph.nodes.forEach(node => {
    node.parameters?.forEach(param => {
      const paramId = `${node.id}_${param.id}`;

      // Check for duplicate IDs
      if (parameterIds.has(paramId)) {
        warnings.push({
          severity: 'warning',
          category: 'parameters',
          message: `Duplicate parameter ID: ${paramId}`,
          nodeId: node.id,
          suggestion: 'Ensure each parameter has a unique ID',
        });
      }
      parameterIds.add(paramId);

      // Validate parameter ranges
      if (param.type === 'float' || param.type === 'int') {
        if (param.min !== undefined && param.max !== undefined && param.min >= param.max) {
          errors.push({
            severity: 'error',
            category: 'parameters',
            message: `Parameter "${param.name}" has invalid range (min >= max)`,
            nodeId: node.id,
            suggestion: 'Ensure min < max for numeric parameters',
          });
        }

        if (param.default < (param.min ?? 0) || param.default > (param.max ?? 1)) {
          warnings.push({
            severity: 'warning',
            category: 'parameters',
            message: `Parameter "${param.name}" default value is outside valid range`,
            nodeId: node.id,
            suggestion: 'Set default within min/max range',
          });
        }
      }

      // Check for missing units
      if ((param.type === 'float' || param.type === 'int') && !param.unit) {
        warnings.push({
          severity: 'warning',
          category: 'parameters',
          message: `Parameter "${param.name}" has no unit specified`,
          nodeId: node.id,
          suggestion: 'Add units (Hz, dB, ms, etc.) for better UX',
        });
      }
    });
  });

  // Check UI component parameter bindings
  project.uiComponents.forEach(comp => {
    if (comp.properties.parameter && !parameterIds.has(comp.properties.parameter)) {
      warnings.push({
        severity: 'warning',
        category: 'parameters',
        message: `UI component "${comp.label}" references non-existent parameter`,
        suggestion: 'Update parameter binding or remove the reference',
      });
    }
  });
}

function validateUIComponents(
  project: PluginProject,
  warnings: ValidationError[],
  info: ValidationError[]
): void {
  // Check for overlapping components
  for (let i = 0; i < project.uiComponents.length; i++) {
    for (let j = i + 1; j < project.uiComponents.length; j++) {
      const comp1 = project.uiComponents[i];
      const comp2 = project.uiComponents[j];

      if (componentsOverlap(comp1, comp2)) {
        warnings.push({
          severity: 'warning',
          category: 'ui',
          message: `Components "${comp1.label}" and "${comp2.label}" overlap`,
          suggestion: 'Reposition components to avoid overlap',
        });
      }
    }
  }

  // Check for components outside bounds
  project.uiComponents.forEach(comp => {
    if (comp.x < 0 || comp.y < 0 ||
        comp.x + comp.width > project.settings.width ||
        comp.y + comp.height > project.settings.height) {
      warnings.push({
        severity: 'warning',
        category: 'ui',
        message: `Component "${comp.label}" is partially outside the plugin window`,
        suggestion: 'Reposition component within plugin bounds',
      });
    }
  });

  // Check for very small components
  project.uiComponents.forEach(comp => {
    if (comp.width < 20 || comp.height < 20) {
      info.push({
        severity: 'info',
        category: 'ui',
        message: `Component "${comp.label}" is very small (might be hard to use)`,
        suggestion: 'Consider increasing component size for better usability',
      });
    }
  });

  // Suggest keyboard for MIDI input
  const hasMidiNodes = project.dspGraph.nodes.some(n =>
    n.type === 'oscillator' || n.type === 'envelope'
  );
  const hasKeyboard = project.uiComponents.some(c => c.type === 'keyboard');

  if (hasMidiNodes && !hasKeyboard) {
    info.push({
      severity: 'info',
      category: 'ui',
      message: 'Plugin uses MIDI but has no keyboard component',
      suggestion: 'Add a keyboard component for easier testing',
    });
  }
}

function checkBestPractices(project: PluginProject, info: ValidationError[]): void {
  // Check sample rate
  if (project.settings.sampleRate < 44100) {
    info.push({
      severity: 'info',
      category: 'general',
      message: 'Sample rate is below 44.1kHz',
      suggestion: 'Consider using 44100Hz or higher for better audio quality',
    });
  }

  // Check buffer size
  if (project.settings.bufferSize < 64 || project.settings.bufferSize > 2048) {
    info.push({
      severity: 'info',
      category: 'general',
      message: 'Unusual buffer size',
      suggestion: 'Standard buffer sizes are 128, 256, 512, or 1024 samples',
    });
  }

  // Check plugin size
  if (project.settings.width < 400 || project.settings.height < 300) {
    info.push({
      severity: 'info',
      category: 'general',
      message: 'Plugin window is quite small',
      suggestion: 'Consider larger dimensions for better usability',
    });
  }
}

// Helper functions

function findCircularDependencies(graph: DSPGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const outgoing = graph.connections.filter(c => c.sourceNodeId === nodeId);

    for (const conn of outgoing) {
      if (!visited.has(conn.targetNodeId)) {
        dfs(conn.targetNodeId, [...path]);
      } else if (recursionStack.has(conn.targetNodeId)) {
        // Found a cycle
        cycles.push([...path, conn.targetNodeId]);
      }
    }

    recursionStack.delete(nodeId);
  }

  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  });

  return cycles;
}

function componentsOverlap(comp1: any, comp2: any): boolean {
  return !(
    comp1.x + comp1.width < comp2.x ||
    comp2.x + comp2.width < comp1.x ||
    comp1.y + comp1.height < comp2.y ||
    comp2.y + comp2.height < comp1.y
  );
}

export function generateValidationReport(result: ValidationResult): string {
  let report = '# Export Validation Report\n\n';

  if (result.isValid) {
    report += '✅ **Project is valid and ready for export**\n\n';
  } else {
    report += `❌ **Project has ${result.errors.length} error(s) that must be fixed**\n\n`;
  }

  if (result.errors.length > 0) {
    report += '## Errors\n\n';
    result.errors.forEach((error, i) => {
      report += `${i + 1}. **${error.message}**\n`;
      if (error.suggestion) {
        report += `   - *Suggestion: ${error.suggestion}*\n`;
      }
      report += '\n';
    });
  }

  if (result.warnings.length > 0) {
    report += '## Warnings\n\n';
    result.warnings.forEach((warning, i) => {
      report += `${i + 1}. ${warning.message}\n`;
      if (warning.suggestion) {
        report += `   - *Suggestion: ${warning.suggestion}*\n`;
      }
      report += '\n';
    });
  }

  if (result.info.length > 0) {
    report += '## Information\n\n';
    result.info.forEach((info, i) => {
      report += `${i + 1}. ${info.message}\n`;
      if (info.suggestion) {
        report += `   - *Suggestion: ${info.suggestion}*\n`;
      }
      report += '\n';
    });
  }

  return report;
}
