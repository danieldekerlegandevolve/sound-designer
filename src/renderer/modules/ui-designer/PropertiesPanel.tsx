import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { DSPParameter } from '@shared/types';
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

  // Get all available DSP parameters
  const allParameters: { nodeId: string; nodeName: string; param: DSPParameter }[] = [];
  project.dspGraph.nodes.forEach((node) => {
    if (node.parameters && node.parameters.length > 0) {
      node.parameters.forEach((param) => {
        allParameters.push({
          nodeId: node.id,
          nodeName: node.label || node.type,
          param,
        });
      });
    }
  });

  const handleChange = (field: string, value: any) => {
    updateUIComponent(component.id, { [field]: value });
  };

  const handlePropertiesChange = (field: string, value: any) => {
    updateUIComponent(component.id, {
      properties: { ...component.properties, [field]: value },
    });
  };

  const handleStyleChange = (field: string, value: any) => {
    updateUIComponent(component.id, {
      style: { ...component.style, [field]: value },
    });
  };

  const handleParameterMapping = (parameterKey: string) => {
    if (parameterKey === '') {
      // Clear mapping
      updateUIComponent(component.id, { parameterId: undefined });
    } else {
      updateUIComponent(component.id, { parameterId: parameterKey });
    }
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

        {/* Parameter Mapping Section */}
        {(component.type === 'knob' || component.type === 'slider' || component.type === 'toggle') && (
          <div className="property-section">
            <div className="section-title">Parameter Mapping</div>

            <div className="property-row">
              <label>Control Parameter</label>
              <select
                value={component.parameterId || ''}
                onChange={(e) => handleParameterMapping(e.target.value)}
                className="parameter-select"
              >
                <option value="">None</option>
                {allParameters.map((item) => (
                  <option key={item.param.id} value={item.param.id}>
                    {item.nodeName} - {item.param.name}
                    {item.param.unit && ` (${item.param.unit})`}
                  </option>
                ))}
              </select>
            </div>

            {component.parameterId && (
              <div className="mapping-info">
                <span className="info-icon">🔗</span>
                <span className="info-text">
                  This {component.type} controls a DSP parameter
                </span>
              </div>
            )}

            {allParameters.length === 0 && (
              <div className="mapping-warning">
                <span className="warning-icon">⚠️</span>
                <span className="warning-text">
                  No DSP parameters available. Add nodes to the DSP Graph first.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Component-specific properties */}
        {(component.type === 'knob' || component.type === 'slider') && (
          <div className="property-section">
            <div className="section-title">Value Range</div>

            <div className="property-row">
              <label>Min Value</label>
              <input
                type="number"
                value={component.properties.min || 0}
                onChange={(e) => handlePropertiesChange('min', Number(e.target.value))}
                step="0.01"
              />
            </div>

            <div className="property-row">
              <label>Max Value</label>
              <input
                type="number"
                value={component.properties.max || 1}
                onChange={(e) => handlePropertiesChange('max', Number(e.target.value))}
                step="0.01"
              />
            </div>

            <div className="property-row">
              <label>Default Value</label>
              <input
                type="number"
                value={component.properties.value || 0.5}
                onChange={(e) => handlePropertiesChange('value', Number(e.target.value))}
                step="0.01"
              />
            </div>
          </div>
        )}

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
