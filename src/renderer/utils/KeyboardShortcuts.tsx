import { useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';

export function KeyboardShortcuts() {
  const {
    saveProject,
    saveProjectAs,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedMode,
    selectedUIComponent,
    selectedDSPNode,
    copyUIComponent,
    pasteUIComponent,
    copyDSPNode,
    pasteDSPNode,
    deleteUIComponent,
    deleteDSPNode,
  } = useProjectStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Save: Ctrl/Cmd + S
      if (modifier && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          saveProjectAs();
        } else {
          saveProject();
        }
        return;
      }

      // Undo: Ctrl/Cmd + Z
      if (modifier && e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((modifier && e.shiftKey && e.key === 'z') || (modifier && e.key === 'y')) {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
        return;
      }

      // Copy: Ctrl/Cmd + C
      if (modifier && e.key === 'c') {
        e.preventDefault();
        if (selectedMode === 'ui' && selectedUIComponent) {
          copyUIComponent(selectedUIComponent);
        } else if (selectedMode === 'dsp' && selectedDSPNode) {
          copyDSPNode(selectedDSPNode);
        }
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (modifier && e.key === 'v') {
        e.preventDefault();
        if (selectedMode === 'ui') {
          pasteUIComponent();
        } else if (selectedMode === 'dsp') {
          pasteDSPNode();
        }
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if typing in an input
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        e.preventDefault();
        if (selectedMode === 'ui' && selectedUIComponent) {
          deleteUIComponent(selectedUIComponent);
        } else if (selectedMode === 'dsp' && selectedDSPNode) {
          deleteDSPNode(selectedDSPNode);
        }
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if (modifier && e.key === 'd') {
        e.preventDefault();
        if (selectedMode === 'ui' && selectedUIComponent) {
          copyUIComponent(selectedUIComponent);
          pasteUIComponent();
        } else if (selectedMode === 'dsp' && selectedDSPNode) {
          copyDSPNode(selectedDSPNode);
          pasteDSPNode();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    saveProject,
    saveProjectAs,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedMode,
    selectedUIComponent,
    selectedDSPNode,
    copyUIComponent,
    pasteUIComponent,
    copyDSPNode,
    pasteDSPNode,
    deleteUIComponent,
    deleteDSPNode,
  ]);

  return null;
}
