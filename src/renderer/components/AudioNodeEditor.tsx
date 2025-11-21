/**
 * Audio Node Editor
 *
 * Visual canvas for editing the audio graph
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AudioGraphNode, AudioConnection, NodePosition } from '../../shared/audioGraphTypes';
import { getAudioGraphManager } from '../audio/audioGraphManager';

export interface AudioNodeEditorProps {
  onNodeSelect?: (nodeId: string | null) => void;
  onConnectionCreate?: (connection: AudioConnection) => void;
}

export function AudioNodeEditor({ onNodeSelect, onConnectionCreate }: AudioNodeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<AudioGraphNode[]>([]);
  const [connections, setConnections] = useState<AudioConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<NodePosition>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState<NodePosition>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [connectingPort, setConnectingPort] = useState<{
    nodeId: string;
    portId: string;
    isOutput: boolean;
  } | null>(null);
  const [mousePos, setMousePos] = useState<NodePosition>({ x: 0, y: 0 });

  const audioGraphManager = getAudioGraphManager();

  // Update graph from manager
  useEffect(() => {
    const updateGraph = () => {
      const graph = audioGraphManager.getGraph();
      setNodes(graph.nodes);
      setConnections(graph.connections);
    };

    updateGraph();

    // Poll for updates (in production, use event system)
    const interval = setInterval(updateGraph, 100);

    return () => clearInterval(interval);
  }, [audioGraphManager]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height, panOffset, zoom);

    // Draw connections
    connections.forEach((connection) => {
      drawConnection(ctx, connection, nodes);
    });

    // Draw temporary connection while dragging
    if (connectingPort) {
      drawTemporaryConnection(ctx, connectingPort, nodes, mousePos);
    }

    // Draw nodes
    nodes.forEach((node) => {
      const isSelected = node.id === selectedNodeId;
      const isDragging = node.id === draggedNodeId;
      drawNode(ctx, node, isSelected, isDragging);
    });

    ctx.restore();
  }, [nodes, connections, selectedNodeId, draggedNodeId, panOffset, zoom, connectingPort, mousePos]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    // Check if clicking on a node
    const clickedNode = findNodeAtPosition(nodes, x, y);

    if (clickedNode) {
      // Check if clicking on a port
      const port = findPortAtPosition(clickedNode, x, y);

      if (port) {
        // Start connection
        setConnectingPort({
          nodeId: clickedNode.id,
          portId: port.id,
          isOutput: clickedNode.outputs.includes(port),
        });
      } else {
        // Start dragging node
        setDraggedNodeId(clickedNode.id);
        setSelectedNodeId(clickedNode.id);
        setDragOffset({
          x: x - clickedNode.position.x,
          y: y - clickedNode.position.y,
        });

        if (onNodeSelect) {
          onNodeSelect(clickedNode.id);
        }
      }
    } else {
      // Start panning
      if (e.button === 0 && (e.shiftKey || e.metaKey)) {
        setIsPanning(true);
        setDragOffset({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      } else {
        setSelectedNodeId(null);
        if (onNodeSelect) {
          onNodeSelect(null);
        }
      }
    }
  }, [nodes, panOffset, zoom, onNodeSelect]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    setMousePos({ x, y });

    if (isPanning) {
      setPanOffset({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    } else if (draggedNodeId) {
      const node = nodes.find((n) => n.id === draggedNodeId);
      if (node) {
        node.position = {
          x: x - dragOffset.x,
          y: y - dragOffset.y,
        };
        setNodes([...nodes]);
      }
    }
  }, [draggedNodeId, dragOffset, isPanning, nodes, panOffset, zoom]);

  // Handle mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (connectingPort) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      // Check if releasing on a port
      const targetNode = findNodeAtPosition(nodes, x, y);
      if (targetNode && targetNode.id !== connectingPort.nodeId) {
        const targetPort = findPortAtPosition(targetNode, x, y);

        if (targetPort) {
          const isTargetOutput = targetNode.outputs.includes(targetPort);

          // Can only connect output to input
          if (connectingPort.isOutput !== isTargetOutput) {
            try {
              const connection = connectingPort.isOutput
                ? audioGraphManager.connect(
                    connectingPort.nodeId,
                    connectingPort.portId,
                    targetNode.id,
                    targetPort.id
                  )
                : audioGraphManager.connect(
                    targetNode.id,
                    targetPort.id,
                    connectingPort.nodeId,
                    connectingPort.portId
                  );

              if (onConnectionCreate) {
                onConnectionCreate(connection);
              }
            } catch (error) {
              console.error('Failed to create connection:', error);
            }
          }
        }
      }

      setConnectingPort(null);
    }

    setDraggedNodeId(null);
    setIsPanning(false);
  }, [connectingPort, nodes, panOffset, zoom, audioGraphManager, onConnectionCreate]);

  // Handle mouse wheel (zoom)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const zoomSpeed = 0.001;
    const delta = -e.deltaY * zoomSpeed;
    const newZoom = Math.max(0.1, Math.min(3, zoom + delta));

    setZoom(newZoom);
  }, [zoom]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // TODO: Show context menu
  }, []);

  return (
    <div ref={containerRef} className="audio-node-editor">
      <canvas
        ref={canvasRef}
        className="audio-node-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />

      <div className="editor-controls">
        <button onClick={() => setZoom(1)} title="Reset Zoom">
          1:1
        </button>
        <button onClick={() => setZoom(Math.min(3, zoom * 1.2))} title="Zoom In">
          +
        </button>
        <button onClick={() => setZoom(Math.max(0.1, zoom / 1.2))} title="Zoom Out">
          −
        </button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
      </div>

      <div className="editor-info">
        <span>Nodes: {nodes.length}</span>
        <span>Connections: {connections.length}</span>
        <span>Shift+Drag to pan</span>
      </div>
    </div>
  );
}

// Helper functions

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offset: NodePosition,
  zoom: number
) {
  const gridSize = 20;
  const adjustedGridSize = gridSize * zoom;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = offset.x % adjustedGridSize; x < width; x += adjustedGridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = offset.y % adjustedGridSize; y < height; y += adjustedGridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: AudioGraphNode,
  isSelected: boolean,
  isDragging: boolean
) {
  const width = 180;
  const height = 80 + Math.max(node.inputs.length, node.outputs.length) * 20;
  const x = node.position.x;
  const y = node.position.y;

  // Shadow
  if (!isDragging) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  }

  // Node background
  ctx.fillStyle = node.color || '#6496ff';
  ctx.fillRect(x, y, width, height);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Selection border
  if (isSelected) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
  }

  // Node border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Node header
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x, y, width, 30);

  // Node title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(node.name, x + width / 2, y + 20);

  // Draw ports
  const portRadius = 6;
  const portY = y + 50;

  // Input ports
  node.inputs.forEach((port, index) => {
    const py = portY + index * 20;

    ctx.fillStyle = port.isConnected ? '#64ff96' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, py, portRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(port.name, x + 12, py + 4);
  });

  // Output ports
  node.outputs.forEach((port, index) => {
    const py = portY + index * 20;

    ctx.fillStyle = port.isConnected ? '#64ff96' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x + width, py, portRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(port.name, x + width - 12, py + 4);
  });
}

function drawConnection(
  ctx: CanvasRenderingContext2D,
  connection: AudioConnection,
  nodes: AudioGraphNode[]
) {
  const sourceNode = nodes.find((n) => n.id === connection.sourceNodeId);
  const targetNode = nodes.find((n) => n.id === connection.targetNodeId);

  if (!sourceNode || !targetNode) return;

  const sourcePort = sourceNode.outputs.find((p) => p.id === connection.sourcePortId);
  const targetPort = targetNode.inputs.find((p) => p.id === connection.targetPortId);

  if (!sourcePort || !targetPort) return;

  const sourceIndex = sourceNode.outputs.indexOf(sourcePort);
  const targetIndex = targetNode.inputs.indexOf(targetPort);

  const startX = sourceNode.position.x + 180;
  const startY = sourceNode.position.y + 50 + sourceIndex * 20;
  const endX = targetNode.position.x;
  const endY = targetNode.position.y + 50 + targetIndex * 20;

  // Draw bezier curve
  const midX = (startX + endX) / 2;

  ctx.strokeStyle = '#64c8ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
  ctx.stroke();

  // Draw connection endpoints
  ctx.fillStyle = '#64c8ff';
  ctx.beginPath();
  ctx.arc(startX, startY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(endX, endY, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawTemporaryConnection(
  ctx: CanvasRenderingContext2D,
  connectingPort: { nodeId: string; portId: string; isOutput: boolean },
  nodes: AudioGraphNode[],
  mousePos: NodePosition
) {
  const node = nodes.find((n) => n.id === connectingPort.nodeId);
  if (!node) return;

  const port = connectingPort.isOutput
    ? node.outputs.find((p) => p.id === connectingPort.portId)
    : node.inputs.find((p) => p.id === connectingPort.portId);

  if (!port) return;

  const portIndex = connectingPort.isOutput
    ? node.outputs.indexOf(port)
    : node.inputs.indexOf(port);

  const startX = connectingPort.isOutput
    ? node.position.x + 180
    : node.position.x;
  const startY = node.position.y + 50 + portIndex * 20;

  const midX = (startX + mousePos.x) / 2;

  ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(midX, startY, midX, mousePos.y, mousePos.x, mousePos.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function findNodeAtPosition(nodes: AudioGraphNode[], x: number, y: number): AudioGraphNode | null {
  // Check in reverse order (top nodes first)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const width = 180;
    const height = 80 + Math.max(node.inputs.length, node.outputs.length) * 20;

    if (
      x >= node.position.x &&
      x <= node.position.x + width &&
      y >= node.position.y &&
      y <= node.position.y + height
    ) {
      return node;
    }
  }

  return null;
}

function findPortAtPosition(node: AudioGraphNode, x: number, y: number): any {
  const portRadius = 10; // Slightly larger hit area
  const portY = node.position.y + 50;
  const nodeWidth = 180;

  // Check input ports
  for (let i = 0; i < node.inputs.length; i++) {
    const py = portY + i * 20;
    const px = node.position.x;
    const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);

    if (distance <= portRadius) {
      return node.inputs[i];
    }
  }

  // Check output ports
  for (let i = 0; i < node.outputs.length; i++) {
    const py = portY + i * 20;
    const px = node.position.x + nodeWidth;
    const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);

    if (distance <= portRadius) {
      return node.outputs[i];
    }
  }

  return null;
}
