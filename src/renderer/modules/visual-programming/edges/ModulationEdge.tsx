import React from 'react';
import { EdgeProps, getSmoothStepPath } from 'reactflow';

/**
 * Modulation Edge Component
 * Represents a modulation connection (LFO, Envelope, etc.)
 */

const ModulationEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="100%" stopColor="#ff8787" />
        </linearGradient>
      </defs>
      <path
        id={id}
        style={{
          ...style,
          stroke: selected ? `url(#gradient-${id})` : '#ff6b6b',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '5,5',
          animation: 'dash 1s linear infinite',
        }}
        className="react-flow__edge-path modulation-edge"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <circle
        cx={labelX}
        cy={labelY}
        r={5}
        fill={selected ? '#ff6b6b' : '#ff8787'}
        className="modulation-indicator"
      />
    </>
  );
};

export default ModulationEdge;
