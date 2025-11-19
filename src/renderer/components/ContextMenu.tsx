/**
 * Context Menu Component
 *
 * Reusable context menu system
 */

import React, { useState, useEffect, useCallback, ReactNode } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
  onClick?: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  onClose: () => void;
  position: { x: number; y: number };
}

export function ContextMenu({ items, onClose, position }: ContextMenuProps) {
  const [submenuIndex, setSubmenuIndex] = useState<number | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        onClose();
      }
    };

    // Delay to avoid closing immediately
    setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 0);

    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled || item.separator) return;

    if (item.submenu) {
      return; // Submenu handled by hover
    }

    if (item.onClick) {
      item.onClick();
    }

    onClose();
  };

  return (
    <div
      className="context-menu"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
      }}
    >
      <div className="context-menu-items">
        {items.map((item, index) => {
          if (item.separator) {
            return <div key={item.id} className="context-menu-separator" />;
          }

          return (
            <div
              key={item.id}
              className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${
                item.danger ? 'danger' : ''
              }`}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => {
                if (item.submenu) {
                  setSubmenuIndex(index);
                }
              }}
              onMouseLeave={() => {
                if (item.submenu) {
                  setSubmenuIndex(null);
                }
              }}
            >
              {item.icon && <span className="context-menu-icon">{item.icon}</span>}
              <span className="context-menu-label">{item.label}</span>
              {item.shortcut && (
                <span className="context-menu-shortcut">{item.shortcut}</span>
              )}
              {item.submenu && <span className="context-menu-arrow">▸</span>}

              {/* Submenu */}
              {item.submenu && submenuIndex === index && (
                <div className="context-menu-submenu">
                  <ContextMenu
                    items={item.submenu}
                    onClose={onClose}
                    position={{ x: 200, y: 0 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook to manage context menu state
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    items: ContextMenuItem[];
    position: { x: number; y: number };
  } | null>(null);

  const showContextMenu = useCallback(
    (items: ContextMenuItem[], event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setContextMenu({
        items,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    []
  );

  const hideContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const contextMenuProps = {
    onContextMenu: (event: React.MouseEvent, items: ContextMenuItem[]) => {
      showContextMenu(items, event);
    },
  };

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    contextMenuProps,
  };
}
