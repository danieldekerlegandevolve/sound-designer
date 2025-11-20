import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  EdgeTypes,
  NodeTypes,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useProjectStore } from '@renderer/store/projectStore';
import CustomAudioNode from './nodes/CustomAudioNode';
import ModulationNode from './nodes/ModulationNode';
import VisualizerNode from './nodes/VisualizerNode';
import CustomEdge from './edges/CustomEdge';
import ModulationEdge from './edges/ModulationEdge';
import './VisualProgrammingEditor.css';

/**
 * Visual Programming Editor
 * Enhanced node-based audio graph editor with drag-and-drop,
 * visual modulation routing, and real-time debugging
 */

const nodeTypes: NodeTypes = {
  audioNode: CustomAudioNode,
  modulationNode: ModulationNode,
  visualizerNode: VisualizerNode,
};

const edgeTypes: EdgeTypes = {
  audio: CustomEdge,
  modulation: ModulationEdge,
};

export const VisualProgrammingEditor: React.FC = () => {
  const { project, updateDSPGraph } = useProjectStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeLibrary, setShowNodeLibrary] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Load initial graph from project
  useEffect(() => {
    if (project?.dspGraph) {
      const flowNodes = project.dspGraph.nodes.map((node) => ({
        id: node.id,
        type: 'audioNode',
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.label || node.type,
          type: node.type,
          parameters: node.parameters || [],
          debugMode,
        },
      }));

      const flowEdges = (project.dspGraph.connections || []).map((conn, index) => ({
        id: `edge-${index}`,
        source: conn.from,
        target: conn.to,
        sourceHandle: conn.fromPort,
        targetHandle: conn.toPort,
        type: 'audio',
        animated: true,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [project?.dspGraph, setNodes, setEdges, debugMode]);

  // Handle connection creation
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: params.sourceHandle?.includes('mod') ? 'modulation' : 'audio',
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Handle drag and drop from node library
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - (reactFlowBounds?.left || 0),
        y: event.clientY - (reactFlowBounds?.top || 0),
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'audioNode',
        position,
        data: {
          label: type,
          type: type,
          parameters: getDefaultParameters(type),
          debugMode,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, debugMode]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle node deletion
  const onDeleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
      );
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  // Save graph to project store
  const saveGraph = useCallback(() => {
    const dspNodes = nodes.map((node) => ({
      id: node.id,
      type: node.data.type,
      label: node.data.label,
      position: node.position,
      parameters: node.data.parameters,
    }));

    const connections = edges.map((edge) => ({
      from: edge.source,
      to: edge.target,
      fromPort: edge.sourceHandle || 'output',
      toPort: edge.targetHandle || 'input',
    }));

    updateDSPGraph({ nodes: dspNodes, connections });
  }, [nodes, edges, updateDSPGraph]);

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveGraph();
    }, 500);

    return () => clearTimeout(timer);
  }, [nodes, edges, saveGraph]);

  return (
    <div className="visual-programming-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <button onClick={() => setShowNodeLibrary(!showNodeLibrary)}>
          {showNodeLibrary ? 'Hide' : 'Show'} Node Library
        </button>
        <button onClick={() => setDebugMode(!debugMode)}>
          {debugMode ? 'Disable' : 'Enable'} Debug Mode
        </button>
        <button onClick={onDeleteNode} disabled={!selectedNode}>
          Delete Selected
        </button>
        <button onClick={saveGraph}>Save Graph</button>
      </div>

      <div className="editor-content">
        {/* Node Library */}
        {showNodeLibrary && (
          <div className="node-library">
            <h3>Node Library</h3>
            <div className="node-categories">
              <NodeCategory title="Synthesis" nodes={['oscillator', 'noise', 'sampler']} />
              <NodeCategory title="Filters" nodes={['filter', 'eq', 'vocoder']} />
              <NodeCategory title="Effects" nodes={['delay', 'reverb', 'distortion', 'chorus', 'phaser']} />
              <NodeCategory
                title="Dynamics"
                nodes={['compressor', 'limiter', 'gate', 'expander']}
              />
              <NodeCategory title="Modulation" nodes={['lfo', 'envelope', 'sequencer']} />
              <NodeCategory title="Utilities" nodes={['gain', 'pan', 'mixer', 'analyser']} />
              <NodeCategory title="Custom" nodes={['custom-dsp', 'custom-ui']} />
            </div>
          </div>
        )}

        {/* React Flow Graph Editor */}
        <div className="graph-editor" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#333" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'modulationNode') return '#ff6b6b';
                if (node.type === 'visualizerNode') return '#51cf66';
                return '#4a9eff';
              }}
            />

            {/* Debug Overlay */}
            {debugMode && (
              <Panel position="top-right">
                <div className="debug-panel">
                  <h4>Debug Info</h4>
                  <p>Nodes: {nodes.length}</p>
                  <p>Edges: {edges.length}</p>
                  {selectedNode && (
                    <div>
                      <h5>Selected Node</h5>
                      <p>ID: {selectedNode.id}</p>
                      <p>Type: {selectedNode.data.type}</p>
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Node Inspector */}
        {selectedNode && (
          <div className="node-inspector">
            <h3>Node Inspector</h3>
            <div className="inspector-content">
              <div className="inspector-field">
                <label>Label:</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, label: e.target.value } }
                          : n
                      )
                    );
                  }}
                />
              </div>

              <div className="inspector-field">
                <label>Type:</label>
                <span>{selectedNode.data.type}</span>
              </div>

              {selectedNode.data.parameters && selectedNode.data.parameters.length > 0 && (
                <div className="parameters-section">
                  <h4>Parameters</h4>
                  {selectedNode.data.parameters.map((param: any, index: number) => (
                    <div key={index} className="parameter-control">
                      <label>{param.name}:</label>
                      <input
                        type="range"
                        min={param.min || 0}
                        max={param.max || 1}
                        step="0.01"
                        value={param.value}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setNodes((nds) =>
                            nds.map((n) => {
                              if (n.id === selectedNode.id) {
                                const newParams = [...n.data.parameters];
                                newParams[index] = { ...newParams[index], value: newValue };
                                return { ...n, data: { ...n.data, parameters: newParams } };
                              }
                              return n;
                            })
                          );
                        }}
                      />
                      <span>{param.value?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Node Category Component for Library
const NodeCategory: React.FC<{ title: string; nodes: string[] }> = ({ title, nodes }) => {
  const [expanded, setExpanded] = useState(true);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="node-category">
      <h4 onClick={() => setExpanded(!expanded)}>
        {expanded ? '▼' : '▶'} {title}
      </h4>
      {expanded && (
        <div className="node-list">
          {nodes.map((nodeType) => (
            <div
              key={nodeType}
              className="node-item"
              draggable
              onDragStart={(e) => onDragStart(e, nodeType)}
            >
              <span className="node-icon">◆</span>
              {nodeType}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to get default parameters for node types
function getDefaultParameters(type: string): any[] {
  const parameterDefaults: Record<string, any[]> = {
    oscillator: [
      { id: 'frequency', name: 'Frequency', min: 20, max: 20000, value: 440, unit: 'Hz' },
      { id: 'detune', name: 'Detune', min: -100, max: 100, value: 0, unit: 'cents' },
    ],
    filter: [
      { id: 'frequency', name: 'Cutoff', min: 20, max: 20000, value: 1000, unit: 'Hz' },
      { id: 'Q', name: 'Resonance', min: 0.001, max: 30, value: 1, unit: '' },
    ],
    delay: [
      { id: 'time', name: 'Time', min: 0, max: 5, value: 0.5, unit: 's' },
      { id: 'feedback', name: 'Feedback', min: 0, max: 0.95, value: 0.3, unit: '' },
    ],
    gain: [
      { id: 'gain', name: 'Gain', min: 0, max: 2, value: 1, unit: '' },
    ],
    compressor: [
      { id: 'threshold', name: 'Threshold', min: -100, max: 0, value: -24, unit: 'dB' },
      { id: 'ratio', name: 'Ratio', min: 1, max: 20, value: 4, unit: ':1' },
      { id: 'attack', name: 'Attack', min: 0, max: 1, value: 0.003, unit: 's' },
      { id: 'release', name: 'Release', min: 0, max: 1, value: 0.25, unit: 's' },
    ],
    lfo: [
      { id: 'frequency', name: 'Rate', min: 0.01, max: 20, value: 1, unit: 'Hz' },
      { id: 'depth', name: 'Depth', min: 0, max: 1, value: 0.5, unit: '' },
    ],
  };

  return parameterDefaults[type] || [];
}

export default VisualProgrammingEditor;
