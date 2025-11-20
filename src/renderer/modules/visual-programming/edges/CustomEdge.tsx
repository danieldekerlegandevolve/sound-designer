import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

/**
 * Custom Audio Edge Component
 * Represents an audio signal connection
 */

const CustomEdge: React.FC<EdgeProps> = ({
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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: selected ? '#4a9eff' : '#666',
          strokeWidth: selected ? 3 : 2,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {/* Optional: Add audio level indicator */}
      <circle
        cx={labelX}
        cy={labelY}
        r={4}
        fill={selected ? '#4a9eff' : '#666'}
        className="edge-indicator"
      />
    </>
  );
};

export default CustomEdge;
