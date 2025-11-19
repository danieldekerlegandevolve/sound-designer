import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { ExportConfig } from '@shared/types';
import { Download, X } from 'lucide-react';
import './ExportDialog.css';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const { project } = useProjectStore();
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'vst3',
    platform: 'windows',
    outputPath: '',
    optimizationLevel: 'release',
  });
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.exportPlugin({
          project,
          config: exportConfig,
        });

        if (result.success) {
          alert(`Plugin exported successfully to: ${result.path}`);
          onClose();
        } else {
          alert('Export failed: ' + result.error);
        }
      }
    } catch (error) {
      alert('Export error: ' + error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-dialog-overlay">
      <div className="export-dialog">
        <div className="dialog-header">
          <h2>Export Plugin</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="dialog-content">
          <div className="export-section">
            <h3>Export Format</h3>
            <div className="format-grid">
              {[
                { value: 'vst', label: 'VST 2' },
                { value: 'vst3', label: 'VST 3' },
                { value: 'au', label: 'Audio Unit' },
                { value: 'lv2', label: 'LV2' },
                { value: 'web', label: 'Web App' },
                { value: 'standalone', label: 'Standalone' },
                { value: 'mobile', label: 'Mobile' },
              ].map((format) => (
                <button
                  key={format.value}
                  className={`format-btn ${exportConfig.format === format.value ? 'active' : ''}`}
                  onClick={() =>
                    setExportConfig({ ...exportConfig, format: format.value as any })
                  }
                >
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          <div className="export-section">
            <h3>Platform</h3>
            <div className="platform-grid">
              {[
                { value: 'windows', label: 'Windows' },
                { value: 'macos', label: 'macOS' },
                { value: 'linux', label: 'Linux' },
                { value: 'ios', label: 'iOS' },
                { value: 'android', label: 'Android' },
                { value: 'web', label: 'Web' },
              ].map((platform) => (
                <button
                  key={platform.value}
                  className={`platform-btn ${exportConfig.platform === platform.value ? 'active' : ''}`}
                  onClick={() =>
                    setExportConfig({ ...exportConfig, platform: platform.value as any })
                  }
                >
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          <div className="export-section">
            <h3>Optimization</h3>
            <div className="optimization-options">
              <label>
                <input
                  type="radio"
                  name="optimization"
                  value="debug"
                  checked={exportConfig.optimizationLevel === 'debug'}
                  onChange={() =>
                    setExportConfig({ ...exportConfig, optimizationLevel: 'debug' })
                  }
                />
                <span>Debug (larger file size, includes debug symbols)</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="optimization"
                  value="release"
                  checked={exportConfig.optimizationLevel === 'release'}
                  onChange={() =>
                    setExportConfig({ ...exportConfig, optimizationLevel: 'release' })
                  }
                />
                <span>Release (optimized, smaller file size)</span>
              </label>
            </div>
          </div>

          <div className="export-section">
            <h3>Output Path</h3>
            <input
              type="text"
              className="output-path-input"
              placeholder="/path/to/output"
              value={exportConfig.outputPath}
              onChange={(e) =>
                setExportConfig({ ...exportConfig, outputPath: e.target.value })
              }
            />
          </div>

          <div className="export-info">
            <p>
              <strong>Plugin Name:</strong> {project.name}
            </p>
            <p>
              <strong>Version:</strong> {project.version}
            </p>
            <p>
              <strong>DSP Nodes:</strong> {project.dspGraph.nodes.length}
            </p>
            <p>
              <strong>UI Components:</strong> {project.uiComponents.length}
            </p>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={exporting || !exportConfig.outputPath}
          >
            <Download size={18} />
            {exporting ? 'Exporting...' : 'Export Plugin'}
          </button>
        </div>
      </div>
    </div>
  );
}
