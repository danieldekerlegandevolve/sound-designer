import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import './ExportDialog.css';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormat?: 'vst3' | 'au' | 'web' | 'standalone';
}

export function ExportDialog({ isOpen, onClose, initialFormat = 'vst3' }: ExportDialogProps) {
  const { project } = useProjectStore();
  const [format, setFormat] = useState<'vst' | 'vst3' | 'au' | 'web' | 'standalone'>(initialFormat);
  const [platform, setPlatform] = useState<'windows' | 'macos' | 'linux' | 'web'>('macos');
  const [optimizationLevel, setOptimizationLevel] = useState<'debug' | 'release'>('release');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Detect platform
  React.useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('win')) setPlatform('windows');
      else if (userAgent.includes('mac')) setPlatform('macos');
      else if (userAgent.includes('linux')) setPlatform('linux');
    }
  }, []);

  const exportPlugin = async () => {
    setExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const exportConfig = {
        project,
        config: {
          format,
          platform: format === 'web' ? 'web' : platform,
          outputPath: '', // Will be chosen by file dialog in main process
          optimizationLevel,
        },
      };

      const result = await window.electronAPI.exportPlugin(exportConfig);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Export failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during export');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  const formatLabels = {
    vst3: 'VST3',
    au: 'Audio Unit (AU)',
    web: 'Web Audio Plugin',
    standalone: 'Standalone Application',
  };

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="export-dialog-header">
          <h2>Export Plugin</h2>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="export-dialog-content">
          <div className="export-field">
            <label>Plugin Name</label>
            <input
              type="text"
              value={project.name}
              disabled
              className="export-input"
            />
          </div>

          <div className="export-field">
            <label>Version</label>
            <input
              type="text"
              value={project.version}
              disabled
              className="export-input"
            />
          </div>

          <div className="export-field">
            <label>Author/Manufacturer</label>
            <input
              type="text"
              value={project.author}
              disabled
              className="export-input"
            />
          </div>

          <div className="export-field">
            <label>Export Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="export-select"
              disabled={exporting}
            >
              <option value="vst3">VST3 Plugin</option>
              <option value="au">Audio Unit (AU)</option>
              <option value="web">Web Audio Plugin</option>
              <option value="standalone">Standalone Application</option>
            </select>
          </div>

          {format !== 'web' && (
            <div className="export-field">
              <label>Target Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="export-select"
                disabled={exporting}
              >
                <option value="windows">Windows</option>
                <option value="macos">macOS</option>
                <option value="linux">Linux</option>
              </select>
            </div>
          )}

          <div className="export-field">
            <label>Optimization Level</label>
            <select
              value={optimizationLevel}
              onChange={(e) => setOptimizationLevel(e.target.value as any)}
              className="export-select"
              disabled={exporting}
            >
              <option value="debug">Debug (with symbols)</option>
              <option value="release">Release (optimized)</option>
            </select>
          </div>

          <div className="export-info">
            <p><strong>Exporting as:</strong> {formatLabels[format]} {format !== 'web' && `(${platform})`}</p>
            <p className="export-note">
              The plugin will be exported with all DSP nodes, UI components, and settings.
              You will be prompted to choose an output directory.
            </p>
          </div>

          {error && (
            <div className="export-error">
              <strong>Export Failed:</strong> {error}
            </div>
          )}

          {success && (
            <div className="export-success">
              Export completed successfully!
            </div>
          )}
        </div>

        <div className="export-dialog-footer">
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={exporting}
          >
            Cancel
          </button>
          <button
            className="export-button"
            onClick={exportPlugin}
            disabled={exporting || !project.name || !project.version}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
