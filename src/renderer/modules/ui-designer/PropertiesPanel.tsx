import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import './PropertiesPanel.css';

export function PropertiesPanel() {
  const { project, selectedUIComponent, updateUIComponent } = useProjectStore();

  const component = project.uiComponents.find((c) => c.id === selectedUIComponent);

  if (!component) {
    return (
      <div className="properties-panel">
        <div className="panel-header">Properties</div>
        <div className="panel-content">
          <div className="empty-state">No component selected</div>
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: any) => {
    updateUIComponent(component.id, { [field]: value });
  };

  const handleStyleChange = (field: string, value: any) => {
    updateUIComponent(component.id, {
      style: { ...component.style, [field]: value },
    });
  };

  return (
    <div className="properties-panel">
      <div className="panel-header">Properties</div>
      <div className="panel-content">
        <div className="property-section">
          <div className="section-title">General</div>

          <div className="property-row">
            <label>Type</label>
            <input type="text" value={component.type} disabled />
          </div>

          <div className="property-row">
            <label>Label</label>
            <input
              type="text"
              value={component.label}
              onChange={(e) => handleChange('label', e.target.value)}
            />
          </div>
        </div>

        <div className="property-section">
          <div className="section-title">Position & Size</div>

          <div className="property-grid">
            <div className="property-row">
              <label>X</label>
              <input
                type="number"
                value={Math.round(component.x)}
                onChange={(e) => handleChange('x', Number(e.target.value))}
              />
            </div>

            <div className="property-row">
              <label>Y</label>
              <input
                type="number"
                value={Math.round(component.y)}
                onChange={(e) => handleChange('y', Number(e.target.value))}
              />
            </div>

            <div className="property-row">
              <label>Width</label>
              <input
                type="number"
                value={Math.round(component.width)}
                onChange={(e) => handleChange('width', Number(e.target.value))}
              />
            </div>

            <div className="property-row">
              <label>Height</label>
              <input
                type="number"
                value={Math.round(component.height)}
                onChange={(e) => handleChange('height', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="property-section">
          <div className="section-title">Style</div>

          <div className="property-row">
            <label>Background</label>
            <input
              type="color"
              value={component.style.backgroundColor || '#2a2a2a'}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            />
          </div>

          <div className="property-row">
            <label>Border Color</label>
            <input
              type="color"
              value={component.style.borderColor || '#4a4a4a'}
              onChange={(e) => handleStyleChange('borderColor', e.target.value)}
            />
          </div>

          <div className="property-row">
            <label>Border Radius</label>
            <input
              type="number"
              value={component.style.borderRadius || 0}
              onChange={(e) => handleStyleChange('borderRadius', Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
