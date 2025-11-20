/**
 * Sound Designer - Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import SoundDesigner from './SoundDesigner';

// Global styles
import './styles/app.css';

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

// Create React root
const root = ReactDOM.createRoot(rootElement);

// Render application
root.render(
  <React.StrictMode>
    <SoundDesigner />
  </React.StrictMode>
);

// Log application info
console.log('🎵 Sound Designer v1.0.0');
console.log('All systems integrated and ready!');
