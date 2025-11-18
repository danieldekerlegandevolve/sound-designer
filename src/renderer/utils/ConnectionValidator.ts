import { DSPNode, DSPConnection } from '@shared/types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Validate if a connection between two nodes is valid
export function validateConnection(
  sourceNode: DSPNode,
  targetNode: DSPNode,
  sourcePort: string,
  targetPort: string,
  existingConnections: DSPConnection[]
): ValidationResult {
  // Check if connecting to self
  if (sourceNode.id === targetNode.id) {
    return {
      isValid: false,
      error: 'Cannot connect a node to itself',
    };
  }

  // Check if ports exist
  if (!sourceNode.outputs.includes(sourcePort)) {
    return {
      isValid: false,
      error: `Source port "${sourcePort}" does not exist`,
    };
  }

  if (!targetNode.inputs.includes(targetPort)) {
    return {
      isValid: false,
      error: `Target port "${targetPort}" does not exist`,
    };
  }

  // Check if connection already exists
  const connectionExists = existingConnections.some(
    (conn) =>
      conn.sourceNodeId === sourceNode.id &&
      conn.sourcePort === sourcePort &&
      conn.targetNodeId === targetNode.id &&
      conn.targetPort === targetPort
  );

  if (connectionExists) {
    return {
      isValid: false,
      error: 'Connection already exists',
    };
  }

  // Check if target port is already connected (most audio inputs only accept one connection)
  const targetPortConnected = existingConnections.some(
    (conn) => conn.targetNodeId === targetNode.id && conn.targetPort === targetPort
  );

  if (targetPortConnected && targetNode.type !== 'mixer') {
    return {
      isValid: false,
      error: 'Target input is already connected (only mixers support multiple inputs)',
    };
  }

  // Check for circular dependencies
  if (wouldCreateCycle(sourceNode.id, targetNode.id, existingConnections)) {
    return {
      isValid: false,
      error: 'Connection would create a circular dependency',
    };
  }

  // Validate node type compatibility
  const compatibilityCheck = validateNodeTypeCompatibility(sourceNode, targetNode);
  if (!compatibilityCheck.isValid) {
    return compatibilityCheck;
  }

  return { isValid: true };
}

// Check if adding a connection would create a cycle in the graph
function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  connections: DSPConnection[]
): boolean {
  const visited = new Set<string>();
  const stack = [targetId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;

    if (currentId === sourceId) {
      return true; // Found a cycle
    }

    if (visited.has(currentId)) {
      continue;
    }

    visited.add(currentId);

    // Find all nodes that this node connects to
    const outgoingConnections = connections.filter((c) => c.sourceNodeId === currentId);
    outgoingConnections.forEach((conn) => stack.push(conn.targetNodeId));
  }

  return false;
}

// Validate compatibility between node types
function validateNodeTypeCompatibility(
  sourceNode: DSPNode,
  targetNode: DSPNode
): ValidationResult {
  // Oscillators should connect to filters/effects, not other oscillators
  if (sourceNode.type === 'oscillator' && targetNode.type === 'oscillator') {
    return {
      isValid: false,
      error: 'Cannot connect oscillator directly to another oscillator',
    };
  }

  // LFO should typically connect to modulation targets, not audio path
  if (sourceNode.type === 'lfo' && ['oscillator', 'filter', 'envelope'].includes(targetNode.type)) {
    // This is actually valid for modulation, so allow it
    return { isValid: true };
  }

  // Envelope output is typically a control signal
  if (sourceNode.type === 'envelope' && targetNode.type === 'oscillator') {
    return {
      isValid: false,
      error: 'Cannot connect envelope directly to oscillator (use as amplitude control)',
    };
  }

  return { isValid: true };
}

// Get suggested connections for a node
export function getSuggestedConnections(
  node: DSPNode,
  allNodes: DSPNode[],
  existingConnections: DSPConnection[]
): Array<{ targetNode: DSPNode; reason: string }> {
  const suggestions: Array<{ targetNode: DSPNode; reason: string }> = [];

  switch (node.type) {
    case 'oscillator':
      // Suggest connecting to filters or effects
      allNodes
        .filter((n) => n.id !== node.id)
        .forEach((targetNode) => {
          if (targetNode.type === 'filter') {
            suggestions.push({
              targetNode,
              reason: 'Filters shape the tone of oscillators',
            });
          } else if (targetNode.type === 'envelope') {
            suggestions.push({
              targetNode,
              reason: 'Envelopes control amplitude over time',
            });
          } else if (['distortion', 'reverb', 'delay'].includes(targetNode.type)) {
            suggestions.push({
              targetNode,
              reason: 'Effects add character to the sound',
            });
          }
        });
      break;

    case 'filter':
      // Suggest connecting to effects or output
      allNodes
        .filter((n) => n.id !== node.id && ['gain', 'reverb', 'delay', 'mixer'].includes(n.type))
        .forEach((targetNode) => {
          suggestions.push({
            targetNode,
            reason: `${targetNode.type} processes the filtered signal`,
          });
        });
      break;

    case 'lfo':
      // Suggest modulation targets
      allNodes
        .filter((n) => n.id !== node.id && ['filter', 'oscillator', 'gain'].includes(n.type))
        .forEach((targetNode) => {
          suggestions.push({
            targetNode,
            reason: `LFO can modulate ${targetNode.type} parameters`,
          });
        });
      break;

    default:
      // Generic suggestion: connect to mixer or next effect
      allNodes
        .filter((n) => n.id !== node.id && ['mixer', 'gain'].includes(n.type))
        .forEach((targetNode) => {
          suggestions.push({
            targetNode,
            reason: 'Route signal through mixer or gain control',
          });
        });
  }

  // Filter out connections that already exist or would be invalid
  return suggestions.filter(({ targetNode }) => {
    const validation = validateConnection(
      node,
      targetNode,
      node.outputs[0] || 'output',
      targetNode.inputs[0] || 'input',
      existingConnections
    );
    return validation.isValid;
  });
}

// Validate entire DSP graph
export function validateGraph(
  nodes: DSPNode[],
  connections: DSPConnection[]
): Array<{ type: 'error' | 'warning'; message: string }> {
  const issues: Array<{ type: 'error' | 'warning'; message: string }> = [];

  // Check for disconnected nodes
  const connectedNodeIds = new Set<string>();
  connections.forEach((conn) => {
    connectedNodeIds.add(conn.sourceNodeId);
    connectedNodeIds.add(conn.targetNodeId);
  });

  nodes.forEach((node) => {
    if (!connectedNodeIds.has(node.id)) {
      issues.push({
        type: 'warning',
        message: `Node "${node.type}" (${node.id.slice(0, 8)}) is not connected`,
      });
    }
  });

  // Check for nodes with no output
  const nodesWithOutput = new Set(connections.map((c) => c.sourceNodeId));
  nodes.forEach((node) => {
    if (!nodesWithOutput.has(node.id) && node.outputs.length > 0) {
      issues.push({
        type: 'warning',
        message: `Node "${node.type}" has no output connection`,
      });
    }
  });

  // Check for potential feedback loops (not always bad, but worth warning)
  const cycles = findAllCycles(connections);
  if (cycles.length > 0) {
    issues.push({
      type: 'warning',
      message: `Found ${cycles.length} feedback loop(s) in graph`,
    });
  }

  return issues;
}

// Find all cycles in the graph
function findAllCycles(connections: DSPConnection[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const outgoing = connections.filter((c) => c.sourceNodeId === nodeId);

    for (const conn of outgoing) {
      const targetId = conn.targetNodeId;

      if (!visited.has(targetId)) {
        dfs(targetId, [...path]);
      } else if (recursionStack.has(targetId)) {
        // Found a cycle
        const cycleStart = path.indexOf(targetId);
        cycles.push(path.slice(cycleStart));
      }
    }

    recursionStack.delete(nodeId);
  }

  // Get all unique node IDs
  const nodeIds = new Set<string>();
  connections.forEach((c) => {
    nodeIds.add(c.sourceNodeId);
    nodeIds.add(c.targetNodeId);
  });

  nodeIds.forEach((nodeId) => {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  });

  return cycles;
}
