/**
 * Tooltip Component
 *
 * Reusable tooltip system with customizable positioning
 */

import React, { useState, useRef, useEffect, ReactNode } from 'react';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 500,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const pos = calculatePosition(rect, position);
        setTooltipPosition(pos);
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>

      {isVisible && tooltipPosition && (
        <div
          className={`tooltip tooltip-${position}`}
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            zIndex: 10001,
          }}
        >
          <div className="tooltip-content">{content}</div>
        </div>
      )}
    </>
  );
}

/**
 * Calculate tooltip position based on trigger element
 */
function calculatePosition(
  rect: DOMRect,
  position: 'top' | 'bottom' | 'left' | 'right'
): { x: number; y: number } {
  const offset = 8; // Distance from trigger element
  const tooltipWidth = 200; // Approximate width
  const tooltipHeight = 40; // Approximate height

  switch (position) {
    case 'top':
      return {
        x: rect.left + rect.width / 2 - tooltipWidth / 2,
        y: rect.top - tooltipHeight - offset,
      };

    case 'bottom':
      return {
        x: rect.left + rect.width / 2 - tooltipWidth / 2,
        y: rect.bottom + offset,
      };

    case 'left':
      return {
        x: rect.left - tooltipWidth - offset,
        y: rect.top + rect.height / 2 - tooltipHeight / 2,
      };

    case 'right':
      return {
        x: rect.right + offset,
        y: rect.top + rect.height / 2 - tooltipHeight / 2,
      };

    default:
      return { x: rect.left, y: rect.top };
  }
}

/**
 * Hook to manage tooltip state programmatically
 */
export function useTooltip() {
  const [tooltip, setTooltip] = useState<{
    content: ReactNode;
    position: { x: number; y: number };
  } | null>(null);

  const showTooltip = (content: ReactNode, x: number, y: number) => {
    setTooltip({ content, position: { x, y } });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  return {
    tooltip,
    showTooltip,
    hideTooltip,
  };
}
