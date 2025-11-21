import { nanoid } from 'nanoid';
import type { PluginProject, DSPNode, UIComponent, DSPConnection } from '@shared/types';

/**
 * Auto-connect DSP nodes in sequential order
 */
export function autoConnectNodes(nodes: DSPNode[]): DSPConnection[] {
  const connections: DSPConnection[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const sourceNode = nodes[i];
    const targetNode = nodes[i + 1];

    // Get first available output from source and first available input from target
    const sourcePort = sourceNode.outputs && sourceNode.outputs.length > 0
      ? sourceNode.outputs[0]
      : 'output';

    const targetPort = targetNode.inputs && targetNode.inputs.length > 0
      ? targetNode.inputs[0]
      : 'input';

    connections.push({
      id: nanoid(),
      sourceNodeId: sourceNode.id,
      sourcePort,
      targetNodeId: targetNode.id,
      targetPort,
    });
  }

  return connections;
}

/**
 * Map UI components to DSP node parameters by name matching
 */
export function mapUIComponentsToParameters(
  uiComponents: UIComponent[],
  dspNodes: DSPNode[]
): UIComponent[] {
  return uiComponents.map((component) => {
    // Get the parameter name from properties
    const paramName = component.properties?.parameter as string;
    if (!paramName) return component;

    // Find matching parameter in any DSP node
    for (const node of dspNodes) {
      if (!node.parameters) continue;

      for (const param of node.parameters) {
        // Match by name (case-insensitive, with underscores)
        const normalizedParamName = param.name.toLowerCase().replace(/\s+/g, '_');
        const normalizedSearchName = paramName.toLowerCase();

        if (normalizedParamName === normalizedSearchName ||
            normalizedParamName.includes(normalizedSearchName) ||
            normalizedSearchName.includes(normalizedParamName)) {
          // Found a match!  Update the component to use the parameter ID
          return {
            ...component,
            parameterId: param.id,
            properties: {
              ...component.properties,
              min: param.min ?? component.properties.min,
              max: param.max ?? component.properties.max,
              value: param.value ?? component.properties.value,
            },
          };
        }
      }
    }

    // No match found, return unchanged
    return component;
  });
}

/**
 * Enhance a template project with proper connections and parameter mappings
 */
export function enhanceTemplateProject(project: Omit<PluginProject, 'id'>): Omit<PluginProject, 'id'> {
  const { dspGraph, uiComponents } = project;

  // Auto-connect nodes if connections are empty or invalid
  let connections = dspGraph.connections || [];

  // Filter out invalid connections (with empty IDs)
  connections = connections.filter(
    conn => conn.sourceNodeId && conn.targetNodeId &&
            conn.sourceNodeId.trim() !== '' && conn.targetNodeId.trim() !== ''
  );

  // If no valid connections, auto-connect sequentially
  if (connections.length === 0 && dspGraph.nodes.length > 1) {
    connections = autoConnectNodes(dspGraph.nodes);
  }

  // Map UI components to parameters
  const mappedComponents = mapUIComponentsToParameters(uiComponents, dspGraph.nodes);

  return {
    ...project,
    dspGraph: {
      ...dspGraph,
      connections,
    },
    uiComponents: mappedComponents,
  };
}

/**
 * Get processing order based on connections (topological sort)
 */
export function getProcessingOrder(nodes: DSPNode[], connections: DSPConnection[]): DSPNode[] {
  // Build adjacency list
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // Build graph
  connections.forEach(conn => {
    const neighbors = graph.get(conn.sourceNodeId) || [];
    neighbors.push(conn.targetNodeId);
    graph.set(conn.sourceNodeId, neighbors);

    inDegree.set(conn.targetNodeId, (inDegree.get(conn.targetNodeId) || 0) + 1);
  });

  // Topological sort (Kahn's algorithm)
  const queue: string[] = [];
  const result: DSPNode[] = [];

  // Start with nodes that have no incoming edges
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      result.push(node);
    }

    const neighbors = graph.get(nodeId) || [];
    neighbors.forEach(neighborId => {
      const newDegree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, newDegree);
      if (newDegree === 0) {
        queue.push(neighborId);
      }
    });
  }

  // If result doesn't contain all nodes, there's a cycle or disconnected nodes
  // Add remaining nodes at the end
  nodes.forEach(node => {
    if (!result.find(n => n.id === node.id)) {
      result.push(node);
    }
  });

  return result;
}
