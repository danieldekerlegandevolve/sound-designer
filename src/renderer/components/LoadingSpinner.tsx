/**
 * Loading Spinner Component
 *
 * Reusable loading state indicators
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'medium',
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: 16,
    medium: 32,
    large: 64,
  };

  const spinnerSize = sizeMap[size];

  const spinner = (
    <div className={`loading-spinner loading-spinner-${size}`}>
      <div
        className="spinner"
        style={{
          width: spinnerSize,
          height: spinnerSize,
        }}
      />
      {message && <div className="loading-message">{message}</div>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Inline loading indicator for buttons and small components
 */
export function InlineLoader({ size = 12 }: { size?: number }) {
  return (
    <div
      className="inline-loader"
      style={{
        width: size,
        height: size,
      }}
    />
  );
}

/**
 * Skeleton loader for content placeholders
 */
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  count?: number;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  count = 1,
}: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="skeleton"
          style={{
            width,
            height,
            borderRadius,
            marginBottom: index < count - 1 ? '8px' : 0,
          }}
        />
      ))}
    </>
  );
}

/**
 * Progress bar component
 */
export interface ProgressBarProps {
  progress: number; // 0-100
  message?: string;
  showPercentage?: boolean;
}

export function ProgressBar({
  progress,
  message,
  showPercentage = true,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="progress-bar-container">
      {message && <div className="progress-message">{message}</div>}
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="progress-percentage">{clampedProgress.toFixed(0)}%</div>
      )}
    </div>
  );
}
