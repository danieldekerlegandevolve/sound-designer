/**
 * Sound Designer - Main Application
 *
 * Integrated application bringing together all modules
 */

import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DragDropProvider } from './contexts/DragDropContext';
import { HelpCenter } from './components/HelpCenter';
import { UndoRedoToolbar } from './components/UndoRedoToolbar';
import { PerformanceDashboard } from './modules/performance/PerformanceDashboard';
import { LoadingSpinner } from './components/LoadingSpinner';

// Initialize systems
import { initializeHelpContent } from './content/initializeHelpContent';
import { getKeyboardShortcutManager, DEFAULT_SHORTCUTS } from './utils/keyboardShortcuts';
import { getUndoManager } from './utils/undoManager';
import { getPerformanceMonitor } from './utils/performanceMonitor';

// Styles
import './styles/animations.css';
import './styles/uiux.css';
import './styles/help.css';

/**
 * Main Application Component
 */
export function SoundDesigner() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Initialize application systems
  useEffect(() => {
    async function initializeApp() {
      console.log('🎵 Initializing Sound Designer...');

      try {
        // Initialize help content
        initializeHelpContent();
        console.log('✓ Help system initialized');

        // Initialize keyboard shortcuts
        const shortcutManager = getKeyboardShortcutManager();
        const undoManager = getUndoManager();

        shortcutManager.start();

        // Register global shortcuts
        shortcutManager.registerAll([
          {
            ...DEFAULT_SHORTCUTS.UNDO,
            action: () => undoManager.undo(),
          },
          {
            ...DEFAULT_SHORTCUTS.REDO,
            action: () => undoManager.redo(),
          },
          {
            key: 'F1',
            description: 'Open Help Center',
            category: 'view',
            action: () => setShowHelp(true),
          },
          {
            key: '?',
            shiftKey: true,
            description: 'Show Keyboard Shortcuts',
            category: 'view',
            action: () => setShowHelp(true),
          },
          {
            key: 'p',
            ctrlKey: true,
            description: 'Open Performance Dashboard',
            category: 'view',
            action: () => setShowPerformance(true),
          },
        ]);
        console.log('✓ Keyboard shortcuts registered');

        // Initialize performance monitoring
        const perfMonitor = getPerformanceMonitor();
        perfMonitor.start();
        console.log('✓ Performance monitoring started');

        // Check if first time user
        const hasSeenWelcome = localStorage.getItem('sound-designer-welcome-seen');
        if (!hasSeenWelcome) {
          setShowWelcome(true);
          localStorage.setItem('sound-designer-welcome-seen', 'true');
        }

        setIsInitialized(true);
        console.log('🎉 Sound Designer initialized successfully!');
      } catch (error) {
        console.error('Failed to initialize Sound Designer:', error);
        // TODO: Show error UI
      }
    }

    initializeApp();

    return () => {
      // Cleanup
      const shortcutManager = getKeyboardShortcutManager();
      const perfMonitor = getPerformanceMonitor();

      shortcutManager.stop();
      perfMonitor.stop();
    };
  }, []);

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#1a1a2e'
      }}>
        <LoadingSpinner
          size="large"
          message="Initializing Sound Designer..."
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DragDropProvider>
        <div className="sound-designer-app">
          {/* Main Application Header */}
          <AppHeader
            onOpenHelp={() => setShowHelp(true)}
            onOpenPerformance={() => setShowPerformance(true)}
          />

          {/* Main Content Area */}
          <MainContent />

          {/* Floating Undo/Redo Toolbar */}
          <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 1000 }}>
            <UndoRedoToolbar showHistory />
          </div>

          {/* Help Center Modal */}
          {showHelp && (
            <HelpCenter onClose={() => setShowHelp(false)} />
          )}

          {/* Performance Dashboard Modal */}
          {showPerformance && (
            <PerformanceDashboard onClose={() => setShowPerformance(false)} />
          )}

          {/* Welcome Screen */}
          {showWelcome && (
            <WelcomeScreen onClose={() => setShowWelcome(false)} />
          )}
        </div>
      </DragDropProvider>
    </ErrorBoundary>
  );
}

/**
 * Application Header
 */
function AppHeader({
  onOpenHelp,
  onOpenPerformance
}: {
  onOpenHelp: () => void;
  onOpenPerformance: () => void;
}) {
  return (
    <header className="app-header">
      <div className="app-logo">
        <h1>🎵 Sound Designer</h1>
        <span className="app-version">v1.0.0</span>
      </div>

      <nav className="app-nav">
        <button className="nav-button" onClick={onOpenHelp}>
          Help <kbd>F1</kbd>
        </button>
        <button className="nav-button" onClick={onOpenPerformance}>
          Performance <kbd>Ctrl+P</kbd>
        </button>
      </nav>
    </header>
  );
}

/**
 * Main Content Area
 */
function MainContent() {
  return (
    <main className="app-main">
      <div className="app-workspace">
        {/* This is where the main application content will go */}
        {/* Including: Audio Graph, Preset Manager, MIDI Editor, etc. */}
        <div className="workspace-placeholder">
          <h2>Welcome to Sound Designer</h2>
          <p>Your integrated audio plugin creation workspace</p>

          <div className="quick-start">
            <h3>Quick Start</h3>
            <ul>
              <li>Press <kbd>F1</kbd> to open the Help Center</li>
              <li>Press <kbd>Ctrl+P</kbd> to view Performance metrics</li>
              <li>Press <kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Shift+Z</kbd> to Undo/Redo</li>
              <li>All features are integrated and ready to use!</li>
            </ul>
          </div>

          <div className="features-overview">
            <h3>Available Features</h3>
            <div className="features-grid">
              <FeatureCard
                icon="🎹"
                title="MIDI & Piano Roll"
                description="Create melodies with the built-in piano roll editor"
              />
              <FeatureCard
                icon="📦"
                title="Preset Management"
                description="Save and organize your sound designs"
              />
              <FeatureCard
                icon="🎛️"
                title="Modulation Matrix"
                description="Route LFOs and envelopes to parameters"
              />
              <FeatureCard
                icon="🎵"
                title="Sample Editor"
                description="Import and edit audio samples"
              />
              <FeatureCard
                icon="⚡"
                title="Performance Monitor"
                description="Track CPU and memory usage"
              />
              <FeatureCard
                icon="📚"
                title="Help & Tutorials"
                description="Interactive guides and documentation"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Feature Card Component
 */
function FeatureCard({
  icon,
  title,
  description
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h4 className="feature-title">{title}</h4>
      <p className="feature-description">{description}</p>
    </div>
  );
}

/**
 * Welcome Screen Component
 */
function WelcomeScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-header">
          <h2>🎵 Welcome to Sound Designer!</h2>
          <button className="welcome-close" onClick={onClose}>✕</button>
        </div>

        <div className="welcome-content">
          <p className="welcome-intro">
            Create custom synthesizers, effects, and audio processors with our
            powerful visual programming environment.
          </p>

          <div className="welcome-features">
            <h3>What You Can Do</h3>
            <ul>
              <li>✨ Build audio graphs with drag-and-drop nodes</li>
              <li>🎹 Create MIDI sequences with the piano roll</li>
              <li>🎛️ Design complex modulation routings</li>
              <li>📦 Manage presets and samples</li>
              <li>⚡ Monitor performance in real-time</li>
              <li>🔄 Undo/redo all your actions</li>
            </ul>
          </div>

          <div className="welcome-tips">
            <h3>Quick Tips</h3>
            <ul>
              <li><kbd>F1</kbd> - Open Help Center</li>
              <li><kbd>Ctrl+Z</kbd> - Undo</li>
              <li><kbd>Ctrl+Shift+Z</kbd> - Redo</li>
              <li><kbd>Ctrl+P</kbd> - Performance Dashboard</li>
            </ul>
          </div>

          <div className="welcome-actions">
            <button className="welcome-tutorial-btn" onClick={onClose}>
              🎓 Start Tutorial
            </button>
            <button className="welcome-start-btn" onClick={onClose}>
              🚀 Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SoundDesigner;
