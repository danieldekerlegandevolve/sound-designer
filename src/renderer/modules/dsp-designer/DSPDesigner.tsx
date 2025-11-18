import React, { useCallback } from 'react';
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
import { DSPNodeComponent } from './DSPNodeComponent';
import { DSPPropertiesPanel } from './DSPPropertiesPanel';
import './DSPDesigner.css';

const nodeTypes = {
  dspNode: DSPNodeComponent,
};

export function DSPDesigner() {
  const { project, addConnection, deleteConnection, updateDSPNode } = useProjectStore();

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
    [addConnection, setEdges]
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

  return (
    <div className="dsp-designer">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgesDelete={onEdgesDelete}
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
