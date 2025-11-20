/**
 * Keyboard Shortcuts System
 *
 * Manages global keyboard shortcuts for the application
 */

import React, { useEffect } from 'react';
import { KeyboardShortcut } from '../../shared/undoRedoTypes';
import { useProjectStore } from '../store/projectStore';

/**
 * Keyboard shortcut manager
 */
export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isListening: boolean = false;

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): () => void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);

    // Return unregister function
    return () => {
      this.shortcuts.delete(key);
    };
  }

  /**
   * Register multiple shortcuts
   */
  registerAll(shortcuts: KeyboardShortcut[]): () => void {
    const unregisterFuncs = shortcuts.map((shortcut) => this.register(shortcut));

    // Return function to unregister all
    return () => {
      unregisterFuncs.forEach((unregister) => unregister());
    };
  }

  /**
   * Start listening for keyboard events
   */
  start(): void {
    if (this.isListening) return;

    this.isListening = true;
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Stop listening for keyboard events
   */
  stop(): void {
    if (!this.isListening) return;

    this.isListening = false;
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Find matching shortcut
    for (const [, shortcut] of this.shortcuts) {
      if (this.matchesShortcut(event, shortcut)) {
        event.preventDefault();
        event.stopPropagation();

        try {
          shortcut.action();
        } catch (error) {
          console.error('Error executing keyboard shortcut:', error);
        }

        break;
      }
    }
  };

  /**
   * Check if an event matches a shortcut
   */
  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    // Normalize key
    const key = event.key.toLowerCase();
    const shortcutKey = shortcut.key.toLowerCase();

    if (key !== shortcutKey) {
      return false;
    }

    // Check modifiers
    if (shortcut.ctrlKey && !event.ctrlKey) return false;
    if (shortcut.shiftKey && !event.shiftKey) return false;
    if (shortcut.altKey && !event.altKey) return false;
    if (shortcut.metaKey && !event.metaKey) return false;

    // Check that no extra modifiers are pressed
    if (!shortcut.ctrlKey && event.ctrlKey) return false;
    if (!shortcut.shiftKey && event.shiftKey) return false;
    if (!shortcut.altKey && event.altKey) return false;
    if (!shortcut.metaKey && event.metaKey) return false;

    return true;
  }

  /**
   * Get a unique key for a shortcut
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrlKey) parts.push('ctrl');
    if (shortcut.shiftKey) parts.push('shift');
    if (shortcut.altKey) parts.push('alt');
    if (shortcut.metaKey) parts.push('meta');

    parts.push(shortcut.key.toLowerCase());

    return parts.join('+');
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return this.getAllShortcuts().filter((s) => s.category === category);
  }

  /**
   * Format shortcut for display
   */
  static formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    // Use platform-specific modifier names
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    if (shortcut.ctrlKey) parts.push(isMac ? '⌃' : 'Ctrl');
    if (shortcut.shiftKey) parts.push(isMac ? '⇧' : 'Shift');
    if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt');
    if (shortcut.metaKey) parts.push(isMac ? '⌘' : 'Win');

    parts.push(shortcut.key.toUpperCase());

    return parts.join(isMac ? '' : '+');
  }
}

// Singleton instance
let keyboardShortcutManagerInstance: KeyboardShortcutManager | null = null;

/**
 * Get the global KeyboardShortcutManager instance
 */
export function getKeyboardShortcutManager(): KeyboardShortcutManager {
  if (!keyboardShortcutManagerInstance) {
    keyboardShortcutManagerInstance = new KeyboardShortcutManager();
  }
  return keyboardShortcutManagerInstance;
}

/**
 * Reset the global KeyboardShortcutManager instance
 */
export function resetKeyboardShortcutManager(): void {
  if (keyboardShortcutManagerInstance) {
    keyboardShortcutManagerInstance.stop();
  }
  keyboardShortcutManagerInstance = null;
}

/**
 * Default shortcuts for common actions
 */
export const DEFAULT_SHORTCUTS = {
  UNDO: {
    key: 'z',
    ctrlKey: true,
    description: 'Undo',
    category: 'edit',
  },
  REDO: {
    key: 'z',
    ctrlKey: true,
    shiftKey: true,
    description: 'Redo',
    category: 'edit',
  },
  SAVE: {
    key: 's',
    ctrlKey: true,
    description: 'Save',
    category: 'file',
  },
  COPY: {
    key: 'c',
    ctrlKey: true,
    description: 'Copy',
    category: 'edit',
  },
  PASTE: {
    key: 'v',
    ctrlKey: true,
    description: 'Paste',
    category: 'edit',
  },
  CUT: {
    key: 'x',
    ctrlKey: true,
    description: 'Cut',
    category: 'edit',
  },
  DELETE: {
    key: 'Delete',
    description: 'Delete',
    category: 'edit',
  },
  SELECT_ALL: {
    key: 'a',
    ctrlKey: true,
    description: 'Select All',
    category: 'edit',
  },
  PLAY_PAUSE: {
    key: ' ',
    description: 'Play/Pause',
    category: 'transport',
  },
};

/**
 * KeyboardShortcuts Component
 * Sets up global keyboard shortcuts for the application
 */
export const KeyboardShortcuts: React.FC = () => {
  const { undo, redo } = useProjectStore((state) => ({
    undo: state.undo,
    redo: state.redo,
  }));

  useEffect(() => {
    const manager = getKeyboardShortcutManager();

    // Register default shortcuts
    const shortcuts: KeyboardShortcut[] = [
      {
        ...DEFAULT_SHORTCUTS.UNDO,
        action: () => {
          undo();
        },
      },
      {
        ...DEFAULT_SHORTCUTS.REDO,
        action: () => {
          redo();
        },
      },
      // Add more shortcuts as needed
    ];

    const unregister = manager.registerAll(shortcuts);
    manager.start();

    // Cleanup on unmount
    return () => {
      unregister();
      manager.stop();
    };
  }, [undo, redo]);

  return null;
};
