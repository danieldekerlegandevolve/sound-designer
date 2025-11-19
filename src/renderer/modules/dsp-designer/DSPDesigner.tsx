import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useProjectStore } from '../../store/projectStore';
import { validateConnection } from '../../utils/ConnectionValidator';
import { DSPNodeComponent } from './DSPNodeComponent';
import { DSPPropertiesPanel } from './DSPPropertiesPanel';
import './DSPDesigner.css';

const nodeTypes = {
  dspNode: DSPNodeComponent,
};

export function DSPDesigner() {
  const { project, addConnection, deleteConnection, updateDSPNode, addDSPNode } = useProjectStore();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Convert DSP graph to React Flow format
  const initialNodes: Node[] = project.dspGraph.nodes.map((node) => ({
    id: node.id,
    type: 'dspNode',
    position: { x: node.x, y: node.y },
    data: node,
  }));

  const initialEdges: Edge[] = project.dspGraph.connections.map((conn) => ({
    id: conn.id,
    source: conn.sourceNodeId,
    sourceHandle: conn.sourcePort,
    target: conn.targetNodeId,
    targetHandle: conn.targetPort,
    animated: true,
    style: { stroke: '#4a9eff', strokeWidth: 2 },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Find source and target nodes
      const sourceNode = project.dspGraph.nodes.find((n) => n.id === connection.source);
      const targetNode = project.dspGraph.nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return;

      // Validate connection
      const validation = validateConnection(
        sourceNode,
        targetNode,
        connection.sourceHandle || 'output',
        connection.targetHandle || 'input',
        project.dspGraph.connections
      );

      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid connection');
        setTimeout(() => setValidationError(null), 3000);
        return;
      }

      setValidationError(null);

      addConnection({
        sourceNodeId: connection.source,
        sourcePort: connection.sourceHandle || 'output',
        targetNodeId: connection.target,
        targetPort: connection.targetHandle || 'input',
      });

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: '#4a9eff', strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [addConnection, setEdges, project.dspGraph]
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      updateDSPNode(node.id, {
        x: node.position.x,
        y: node.position.y,
      });
    },
    [updateDSPNode]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      deletedEdges.forEach((edge) => {
        deleteConnection(edge.id);
      });
    },
    [deleteConnection]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      try {
        const data = JSON.parse(event.dataTransfer.getData('application/json'));
        if (data.mode !== 'dsp') return;

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        addDSPNode({
          type: data.type as any,
          x: position.x,
          y: position.y,
          parameters: [],
          inputs: ['input'],
          outputs: ['output'],
        });
      } catch (err) {
        console.error('Failed to handle drop:', err);
      }
    },
    [reactFlowInstance, addDSPNode]
  );

  return (
    <div className="dsp-designer">
      {validationError && (
        <div className="validation-error">
          {validationError}
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgesDelete={onEdgesDelete}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#3a3a3a" gap={16} />
        <Controls />
        <MiniMap
          style={{
            backgroundColor: '#1a1a1a',
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>
      <DSPPropertiesPanel />
    </div>
  );
}
