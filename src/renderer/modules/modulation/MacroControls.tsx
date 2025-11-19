import React from 'react';
import { useModulationStore } from '../../store/modulationStore';
import { Settings, Plus, Trash2, Link } from 'lucide-react';
import './MacroControls.css';

interface MacroControlsProps {
  compact?: boolean;
}

export function MacroControls({ compact = false }: MacroControlsProps) {
  const {
    macros,
    matrix,
    setMacroValue,
    updateMacro,
    createMacro,
    deleteMacro,
    addMacroMapping,
    removeMacroMapping,
  } = useModulationStore();

  const [editingMacro, setEditingMacro] = React.useState<number | null>(null);

  return (
    <div className={`macro-controls ${compact ? 'compact' : ''}`}>
      <div className="macros-header">
        <h3>Macro Controls</h3>
        <button
          className="add-macro-btn"
          onClick={() => createMacro(`Macro ${macros.length + 1}`)}
          title="Add Macro"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="macros-grid">
        {macros.map((macro, index) => (
          <div key={index} className="macro-card" style={{ borderColor: macro.color }}>
            <div className="macro-header">
              <input
                type="text"
                value={macro.label}
                onChange={(e) => updateMacro(index, { label: e.target.value })}
                className="macro-label"
                placeholder="Macro name..."
              />
              <div className="macro-actions">
                <button
                  className="icon-btn"
                  onClick={() => setEditingMacro(editingMacro === index ? null : index)}
                  title="Edit mappings"
                >
                  <Settings size={14} />
                </button>
                <button
                  className="icon-btn delete"
                  onClick={() => deleteMacro(index)}
                  title="Delete macro"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="macro-control">
              <input
                type="range"
                min="0"
                max="100"
                value={macro.value * 100}
                onChange={(e) => setMacroValue(index, Number(e.target.value) / 100)}
                className="macro-slider"
                style={{ accentColor: macro.color }}
              />
              <div className="macro-value">{(macro.value * 100).toFixed(0)}%</div>
            </div>

            <div className="macro-mappings-count">
              <Link size={12} />
              {macro.mappings.length} mapping{macro.mappings.length !== 1 ? 's' : ''}
            </div>

            {editingMacro === index && (
              <div className="macro-mappings">
                <div className="mappings-header">
                  <h4>Mappings</h4>
                </div>

                <div className="mappings-list">
                  {macro.mappings.length === 0 ? (
                    <p className="empty-message">No mappings</p>
                  ) : (
                    macro.mappings.map((mapping) => (
                      <div key={mapping.targetId} className="mapping-item">
                        <div className="mapping-info">
                          <span className="mapping-name">{mapping.targetName}</span>
                          <span className="mapping-amount">
                            {(mapping.amount * 100).toFixed(0)}%
                          </span>
                        </div>
                        <button
                          className="remove-mapping-btn"
                          onClick={() => removeMacroMapping(index, mapping.targetId)}
                          title="Remove mapping"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="add-mapping">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const target = matrix.targets.find((t) => t.id === e.target.value);
                        if (target) {
                          addMacroMapping(index, target.id, target.parameterName, 0.5);
                        }
                        e.target.value = '';
                      }
                    }}
                    className="target-select"
                  >
                    <option value="">Add target...</option>
                    {matrix.targets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.parameterName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
