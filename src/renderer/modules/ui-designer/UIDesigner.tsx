import React, { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { PropertiesPanel } from './PropertiesPanel';
import { UIComponent } from '@shared/types';
import './UIDesigner.css';

export function UIDesigner() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    project,
    selectedUIComponent,
    selectUIComponent,
    updateUIComponent,
    deleteUIComponent,
  } = useProjectStore();

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent, component: UIComponent) => {
    if (e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Check if clicking on resize handle
    const relX = e.clientX - rect.left - component.x;
    const relY = e.clientY - rect.top - component.y;
    const isResizeHandle = relX > component.width - 10 && relY > component.height - 10;

    if (isResizeHandle) {
      setResizing(component.id);
    } else {
      setDragging(component.id);
      setDragOffset({
        x: e.clientX - rect.left - component.x,
        y: e.clientY - rect.top - component.y,
      });
    }

    selectUIComponent(component.id);
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (dragging) {
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      updateUIComponent(dragging, { x, y });
    } else if (resizing) {
      const component = project.uiComponents.find((c) => c.id === resizing);
      if (!component) return;

      const width = Math.max(20, e.clientX - rect.left - component.x);
      const height = Math.max(20, e.clientY - rect.top - component.y);
      updateUIComponent(resizing, { width, height });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectUIComponent(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedUIComponent) {
      deleteUIComponent(selectedUIComponent);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUIComponent]);

  return (
    <div className="ui-designer">
      <div
        ref={canvasRef}
        className="canvas"
        style={{
          width: project.settings.width,
          height: project.settings.height,
          backgroundColor: project.settings.backgroundColor,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {project.uiComponents.map((component) => (
          <div
            key={component.id}
            className={`ui-component ${selectedUIComponent === component.id ? 'selected' : ''}`}
            style={{
              left: component.x,
              top: component.y,
              width: component.width,
              height: component.height,
              ...component.style,
            }}
            onMouseDown={(e) => handleMouseDown(e, component)}
          >
            <div className="component-content">
              {renderComponent(component)}
            </div>
            {selectedUIComponent === component.id && (
              <div className="resize-handle" />
            )}
          </div>
        ))}
      </div>
      <PropertiesPanel />
    </div>
  );
}

function renderComponent(component: UIComponent) {
  switch (component.type) {
    case 'knob':
      return (
        <div className="knob-component">
          <div className="knob-circle">
            <div className="knob-indicator" />
          </div>
          <div className="knob-label">{component.label}</div>
        </div>
      );
    case 'slider':
      return (
        <div className="slider-component">
          <div className="slider-label">{component.label}</div>
          <div className="slider-track">
            <div className="slider-thumb" style={{ left: '50%' }} />
          </div>
        </div>
      );
    case 'button':
      return (
        <div className="button-component">
          {component.label}
        </div>
      );
    case 'toggle':
      return (
        <div className="toggle-component">
          <div className="toggle-switch">
            <div className="toggle-handle" />
          </div>
          <div className="toggle-label">{component.label}</div>
        </div>
      );
    case 'display':
      return (
        <div className="display-component">
          <div className="display-value">0.00</div>
          <div className="display-label">{component.label}</div>
        </div>
      );
    case 'waveform':
      return (
        <div className="waveform-component">
          <svg width="100%" height="100%">
            <path
              d="M0,50 Q25,20 50,50 T100,50"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
            />
          </svg>
        </div>
      );
    case 'keyboard':
      return (
        <div className="keyboard-component">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="key white-key" />
          ))}
        </div>
      );
    case 'xy-pad':
      return (
        <div className="xypad-component">
          <div className="xypad-point" style={{ left: '50%', top: '50%' }} />
        </div>
      );
    default:
      return <div>{component.label}</div>;
  }
}
