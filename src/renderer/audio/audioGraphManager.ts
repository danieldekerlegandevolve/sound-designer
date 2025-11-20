/**
 * Audio Graph Manager
 *
 * Manages the audio processing graph and Web Audio API integration
 */

import {
  AudioGraph,
  AudioGraphNode,
  AudioConnection,
  AudioNodeInstance,
  AudioNodeType,
  AudioEngineConfig,
  AudioProcessingContext,
  generateNodeId,
  generateConnectionId,
  generatePortId,
} from '../../shared/audioGraphTypes';

import { getNodeTemplate } from './nodeTemplates';

const DEFAULT_CONFIG: Required<AudioEngineConfig> = {
  sampleRate: 44100,
  bufferSize: 512,
  latencyHint: 'interactive',
  enableVisualization: true,
  maxNodes: 100,
  maxConnections: 200,
};

/**
 * Audio Graph Manager class
 */
export class AudioGraphManager {
  private config: Required<AudioEngineConfig>;
  private audioContext: AudioContext | null = null;
  private graph: AudioGraph;
  private nodeInstances: Map<string, AudioNodeInstance> = new Map();
  private isInitialized: boolean = false;
  private masterGainNode: GainNode | null = null;

  constructor(config: Partial<AudioEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.graph = {
      nodes: [],
      connections: [],
      sampleRate: this.config.sampleRate,
      bufferSize: this.config.bufferSize,
      isPlaying: false,
    };
  }

  /**
   * Initialize the audio engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Audio engine already initialized');
      return;
    }

    try {
      // Create Audio Context
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: this.config.latencyHint,
      });

      // Create master gain node
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = 0.7;
      this.masterGainNode.connect(this.audioContext.destination);

      // Create default output node
      await this.createOutputNode();

      this.isInitialized = true;
      console.log('🎵 Audio engine initialized successfully');
      console.log('Sample rate:', this.audioContext.sampleRate);
      console.log('State:', this.audioContext.state);
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw error;
    }
  }

  /**
   * Resume audio context (required after user interaction)
   */
  async resume(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('Audio context resumed');
    }
  }

  /**
   * Create a new audio node
   */
  async createNode(
    type: AudioNodeType,
    position: { x: number; y: number }
  ): Promise<AudioGraphNode> {
    if (!this.isInitialized || !this.audioContext) {
      throw new Error('Audio engine not initialized');
    }

    if (this.graph.nodes.length >= this.config.maxNodes) {
      throw new Error(`Maximum number of nodes (${this.config.maxNodes}) reached`);
    }

    const template = getNodeTemplate(type);
    if (!template) {
      throw new Error(`Unknown node type: ${type}`);
    }

    // Create graph node
    const nodeId = generateNodeId();
    const graphNode: AudioGraphNode = {
      id: nodeId,
      type,
      name: template.name,
      position,
      color: template.color,
      parameters: template.defaultParameters.map((param, index) => ({
        ...param,
        id: `${nodeId}-param-${index}`,
      })),
      inputs: template.defaultInputs.map((input, index) => ({
        ...input,
        id: generatePortId(nodeId, `input-${index}`),
        isConnected: false,
      })),
      outputs: template.defaultOutputs.map((output, index) => ({
        ...output,
        id: generatePortId(nodeId, `output-${index}`),
        isConnected: false,
      })),
      bypass: false,
    };

    // Create Web Audio node
    const webAudioNode = await this.createWebAudioNode(type, graphNode);

    // Create node instance
    const instance: AudioNodeInstance = {
      graphNode,
      webAudioNode,
      isActive: true,
    };

    // Store instance
    this.nodeInstances.set(nodeId, instance);
    this.graph.nodes.push(graphNode);

    console.log(`Created node: ${template.name} (${nodeId})`);

    return graphNode;
  }

  /**
   * Delete a node
   */
  deleteNode(nodeId: string): void {
    const instance = this.nodeInstances.get(nodeId);
    if (!instance) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Don't allow deleting output node
    if (instance.graphNode.type === AudioNodeType.OUTPUT) {
      throw new Error('Cannot delete output node');
    }

    // Remove all connections to/from this node
    const connectionsToRemove = this.graph.connections.filter(
      (conn) => conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId
    );

    connectionsToRemove.forEach((conn) => {
      this.disconnect(conn.id);
    });

    // Disconnect Web Audio node
    if (instance.webAudioNode) {
      instance.webAudioNode.disconnect();
    }

    // Remove from graph and instances
    this.graph.nodes = this.graph.nodes.filter((node) => node.id !== nodeId);
    this.nodeInstances.delete(nodeId);

    console.log(`Deleted node: ${nodeId}`);
  }

  /**
   * Connect two nodes
   */
  connect(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ): AudioConnection {
    if (this.graph.connections.length >= this.config.maxConnections) {
      throw new Error(`Maximum number of connections (${this.config.maxConnections}) reached`);
    }

    const sourceInstance = this.nodeInstances.get(sourceNodeId);
    const targetInstance = this.nodeInstances.get(targetNodeId);

    if (!sourceInstance || !targetInstance) {
      throw new Error('Source or target node not found');
    }

    // Create connection
    const connection: AudioConnection = {
      id: generateConnectionId(),
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId,
    };

    // Connect Web Audio nodes
    if (sourceInstance.webAudioNode && targetInstance.webAudioNode) {
      try {
        sourceInstance.webAudioNode.connect(targetInstance.webAudioNode);
      } catch (error) {
        console.error('Failed to connect Web Audio nodes:', error);
        throw error;
      }
    }

    // Update port states
    const sourcePort = sourceInstance.graphNode.outputs.find((p) => p.id === sourcePortId);
    const targetPort = targetInstance.graphNode.inputs.find((p) => p.id === targetPortId);

    if (sourcePort) sourcePort.isConnected = true;
    if (targetPort) targetPort.isConnected = true;

    this.graph.connections.push(connection);

    console.log(`Connected: ${sourceNodeId} → ${targetNodeId}`);

    return connection;
  }

  /**
   * Disconnect nodes
   */
  disconnect(connectionId: string): void {
    const connection = this.graph.connections.find((c) => c.id === connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    const sourceInstance = this.nodeInstances.get(connection.sourceNodeId);
    const targetInstance = this.nodeInstances.get(connection.targetNodeId);

    // Disconnect Web Audio nodes
    if (sourceInstance?.webAudioNode && targetInstance?.webAudioNode) {
      try {
        sourceInstance.webAudioNode.disconnect(targetInstance.webAudioNode);
      } catch (error) {
        console.warn('Error disconnecting Web Audio nodes:', error);
      }
    }

    // Update port states
    if (sourceInstance) {
      const sourcePort = sourceInstance.graphNode.outputs.find(
        (p) => p.id === connection.sourcePortId
      );
      if (sourcePort) sourcePort.isConnected = false;
    }

    if (targetInstance) {
      const targetPort = targetInstance.graphNode.inputs.find(
        (p) => p.id === connection.targetPortId
      );
      if (targetPort) targetPort.isConnected = false;
    }

    // Remove connection
    this.graph.connections = this.graph.connections.filter((c) => c.id !== connectionId);

    console.log(`Disconnected: ${connectionId}`);
  }

  /**
   * Update node parameter
   */
  setParameter(nodeId: string, parameterId: string, value: number): void {
    const instance = this.nodeInstances.get(nodeId);
    if (!instance) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    const param = instance.graphNode.parameters.find((p) => p.id === parameterId);
    if (!param) {
      throw new Error(`Parameter not found: ${parameterId}`);
    }

    // Clamp value
    param.value = Math.max(param.min, Math.min(param.max, value));

    // Update Web Audio parameter if applicable
    this.updateWebAudioParameter(instance, param);
  }

  /**
   * Get current graph state
   */
  getGraph(): AudioGraph {
    return { ...this.graph };
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: string): AudioGraphNode | undefined {
    return this.graph.nodes.find((node) => node.id === nodeId);
  }

  /**
   * Get audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get processing context
   */
  getProcessingContext(): AudioProcessingContext | null {
    if (!this.audioContext) return null;

    return {
      audioContext: this.audioContext,
      sampleRate: this.audioContext.sampleRate,
      bufferSize: this.config.bufferSize,
      currentTime: this.audioContext.currentTime,
    };
  }

  /**
   * Get master analyzer node for visualizations
   */
  getMasterAnalyzer(): AnalyserNode | null {
    if (!this.audioContext || !this.masterGainNode) return null;

    // Create a persistent analyzer connected to master output
    const analyzer = this.audioContext.createAnalyser();
    analyzer.fftSize = 2048;
    analyzer.smoothingTimeConstant = 0.8;

    // Connect master to analyzer (analyzer doesn't affect audio output)
    this.masterGainNode.connect(analyzer);

    return analyzer;
  }

  /**
   * Export graph to JSON
   */
  exportGraph(): AudioGraph {
    return {
      nodes: this.graph.nodes.map((node) => ({ ...node })),
      connections: this.graph.connections.map((conn) => ({ ...conn })),
      sampleRate: this.graph.sampleRate,
      bufferSize: this.graph.bufferSize,
      isPlaying: this.graph.isPlaying,
    };
  }

  /**
   * Import graph from JSON
   */
  async importGraph(graph: AudioGraph): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Audio engine not initialized');
    }

    // Clear existing graph
    this.clear();

    // Create nodes
    for (const node of graph.nodes) {
      if (node.type === AudioNodeType.OUTPUT) {
        continue; // Skip output node as it's created by default
      }

      const newNode = await this.createNode(node.type, node.position);

      // Restore parameters
      for (let i = 0; i < node.parameters.length; i++) {
        if (newNode.parameters[i]) {
          this.setParameter(newNode.id, newNode.parameters[i].id, node.parameters[i].value);
        }
      }
    }

    // Create connections
    for (const conn of graph.connections) {
      try {
        // Find corresponding nodes in new graph
        const sourceIndex = graph.nodes.findIndex((n) => n.id === conn.sourceNodeId);
        const targetIndex = graph.nodes.findIndex((n) => n.id === conn.targetNodeId);

        if (sourceIndex >= 0 && targetIndex >= 0) {
          const newSourceNode = this.graph.nodes[sourceIndex];
          const newTargetNode = this.graph.nodes[targetIndex];

          if (newSourceNode && newTargetNode) {
            const sourcePort = newSourceNode.outputs.find(
              (p, i) => i === sourceIndex
            );
            const targetPort = newTargetNode.inputs.find(
              (p, i) => i === targetIndex
            );

            if (sourcePort && targetPort) {
              this.connect(
                newSourceNode.id,
                sourcePort.id,
                newTargetNode.id,
                targetPort.id
              );
            }
          }
        }
      } catch (error) {
        console.warn('Failed to restore connection:', error);
      }
    }

    console.log('Graph imported successfully');
  }

  /**
   * Clear all nodes except output
   */
  clear(): void {
    const nodesToDelete = this.graph.nodes.filter(
      (node) => node.type !== AudioNodeType.OUTPUT
    );

    nodesToDelete.forEach((node) => {
      try {
        this.deleteNode(node.id);
      } catch (error) {
        console.warn(`Failed to delete node ${node.id}:`, error);
      }
    });

    console.log('Graph cleared');
  }

  /**
   * Start audio playback
   */
  async start(): Promise<void> {
    await this.resume();
    this.graph.isPlaying = true;
    console.log('Audio playback started');
  }

  /**
   * Stop audio playback
   */
  stop(): void {
    this.graph.isPlaying = false;
    console.log('Audio playback stopped');
  }

  /**
   * Cleanup and dispose
   */
  async dispose(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.nodeInstances.clear();
    this.graph.nodes = [];
    this.graph.connections = [];
    this.isInitialized = false;

    console.log('Audio engine disposed');
  }

  /**
   * Create Web Audio node based on type
   */
  private async createWebAudioNode(
    type: AudioNodeType,
    graphNode: AudioGraphNode
  ): Promise<AudioNode | undefined> {
    if (!this.audioContext) return undefined;

    switch (type) {
      case AudioNodeType.OSCILLATOR:
        return this.createOscillatorNode(graphNode);

      case AudioNodeType.GAIN:
        return this.createGainNode(graphNode);

      case AudioNodeType.FILTER:
        return this.createFilterNode(graphNode);

      case AudioNodeType.DELAY:
        return this.createDelayNode(graphNode);

      case AudioNodeType.COMPRESSOR:
        return this.audioContext.createDynamicsCompressor();

      case AudioNodeType.ANALYZER:
        return this.createAnalyzerNode();

      case AudioNodeType.OUTPUT:
        return this.masterGainNode || undefined;

      default:
        console.warn(`Web Audio node not implemented for type: ${type}`);
        return this.audioContext.createGain(); // Fallback to gain node
    }
  }

  /**
   * Create oscillator node
   */
  private createOscillatorNode(graphNode: AudioGraphNode): OscillatorNode {
    if (!this.audioContext) throw new Error('Audio context not available');

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    osc.start();

    return osc;
  }

  /**
   * Create gain node
   */
  private createGainNode(graphNode: AudioGraphNode): GainNode {
    if (!this.audioContext) throw new Error('Audio context not available');

    const gain = this.audioContext.createGain();
    gain.gain.value = 1;

    return gain;
  }

  /**
   * Create filter node
   */
  private createFilterNode(graphNode: AudioGraphNode): BiquadFilterNode {
    if (!this.audioContext) throw new Error('Audio context not available');

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;

    return filter;
  }

  /**
   * Create delay node
   */
  private createDelayNode(graphNode: AudioGraphNode): DelayNode {
    if (!this.audioContext) throw new Error('Audio context not available');

    const delay = this.audioContext.createDelay(2);
    delay.delayTime.value = 0.25;

    return delay;
  }

  /**
   * Create analyzer node
   */
  private createAnalyzerNode(): AnalyserNode {
    if (!this.audioContext) throw new Error('Audio context not available');

    const analyzer = this.audioContext.createAnalyser();
    analyzer.fftSize = 2048;
    analyzer.smoothingTimeConstant = 0.8;

    return analyzer;
  }

  /**
   * Create default output node
   */
  private async createOutputNode(): Promise<void> {
    const outputNode = await this.createNode(AudioNodeType.OUTPUT, { x: 800, y: 300 });
    console.log('Created default output node');
  }

  /**
   * Update Web Audio parameter
   */
  private updateWebAudioParameter(instance: AudioNodeInstance, param: any): void {
    const node = instance.webAudioNode;
    if (!node || !this.audioContext) return;

    const currentTime = this.audioContext.currentTime;

    // Handle different node types
    if (node instanceof OscillatorNode) {
      if (param.type === 'frequency') {
        node.frequency.setValueAtTime(param.value, currentTime);
      } else if (param.type === 'detune') {
        node.detune.setValueAtTime(param.value, currentTime);
      }
    } else if (node instanceof GainNode) {
      if (param.type === 'gain') {
        node.gain.setValueAtTime(param.value, currentTime);
      }
    } else if (node instanceof BiquadFilterNode) {
      if (param.type === 'frequency') {
        node.frequency.setValueAtTime(param.value, currentTime);
      } else if (param.type === 'q') {
        node.Q.setValueAtTime(param.value, currentTime);
      } else if (param.type === 'gain') {
        node.gain.setValueAtTime(param.value, currentTime);
      }
    } else if (node instanceof DelayNode) {
      if (param.type === 'time') {
        node.delayTime.setValueAtTime(param.value, currentTime);
      }
    }
  }
}

// Singleton instance
let audioGraphManagerInstance: AudioGraphManager | null = null;

/**
 * Get the global AudioGraphManager instance
 */
export function getAudioGraphManager(): AudioGraphManager {
  if (!audioGraphManagerInstance) {
    audioGraphManagerInstance = new AudioGraphManager();
  }
  return audioGraphManagerInstance;
}

/**
 * Reset the global AudioGraphManager instance
 */
export async function resetAudioGraphManager(): Promise<void> {
  if (audioGraphManagerInstance) {
    await audioGraphManagerInstance.dispose();
  }
  audioGraphManagerInstance = null;
}
