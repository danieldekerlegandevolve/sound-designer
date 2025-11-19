/**
 * Tutorial Overlay Component
 *
 * Interactive tutorial system with step-by-step guidance
 */

import React, { useState, useEffect, useRef } from 'react';
import { Tutorial, TutorialStep } from '../../shared/helpTypes';
import { getHelpContentManager } from '../utils/helpContentManager';

export interface TutorialOverlayProps {
  tutorial: Tutorial;
  onComplete: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({ tutorial, onComplete, onSkip }: TutorialOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = tutorial.steps[currentStepIndex];
  const isLastStep = currentStepIndex === tutorial.steps.length - 1;
  const progress = ((currentStepIndex + 1) / tutorial.steps.length) * 100;

  useEffect(() => {
    // Highlight target element if specified
    if (currentStep.targetElement) {
      const element = document.querySelector(currentStep.targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightRect(null);
    }

    // Check for auto-advance condition
    if (currentStep.nextCondition && currentStep.nextCondition()) {
      setTimeout(() => handleNext(), 1000);
    }
  }, [currentStepIndex, currentStep]);

  const handleNext = () => {
    if (isLastStep) {
      const helpManager = getHelpContentManager();
      helpManager.completeTutorial(tutorial.id);
      onComplete();
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    if (confirm('Are you sure you want to skip this tutorial?')) {
      onSkip();
    }
  };

  return (
    <div className="tutorial-overlay" ref={overlayRef}>
      {/* Dark overlay */}
      <div className="tutorial-backdrop" onClick={handleSkip} />

      {/* Highlight cutout */}
      {highlightRect && (
        <>
          <div
            className="tutorial-highlight"
            style={{
              top: highlightRect.top - 4,
              left: highlightRect.left - 4,
              width: highlightRect.width + 8,
              height: highlightRect.height + 8,
            }}
          />
          <div
            className="tutorial-spotlight"
            style={{
              top: highlightRect.top,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
            }}
          />
        </>
      )}

      {/* Tutorial card */}
      <div
        className={`tutorial-card tutorial-position-${currentStep.position || 'center'}`}
        style={getCardPosition(currentStep, highlightRect)}
      >
        {/* Header */}
        <div className="tutorial-header">
          <div className="tutorial-info">
            <h3 className="tutorial-title">{tutorial.title}</h3>
            <div className="tutorial-step-counter">
              Step {currentStepIndex + 1} of {tutorial.steps.length}
            </div>
          </div>
          <button className="tutorial-close" onClick={handleSkip} aria-label="Close tutorial">
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="tutorial-progress-bar">
          <div
            className="tutorial-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="tutorial-content">
          <h4 className="tutorial-step-title">{currentStep.title}</h4>
          <p className="tutorial-step-description">{currentStep.description}</p>

          {currentStep.actionDescription && (
            <div className="tutorial-action">
              <span className="tutorial-action-icon">
                {getActionIcon(currentStep.action)}
              </span>
              <span className="tutorial-action-text">{currentStep.actionDescription}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="tutorial-nav">
          <button
            className="tutorial-button secondary"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            Previous
          </button>

          <div className="tutorial-nav-spacer" />

          {currentStep.skippable !== false && (
            <button className="tutorial-button text" onClick={handleSkip}>
              Skip Tutorial
            </button>
          )}

          <button className="tutorial-button primary" onClick={handleNext}>
            {isLastStep ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Get position for tutorial card based on target element
 */
function getCardPosition(
  step: TutorialStep,
  highlightRect: DOMRect | null
): React.CSSProperties {
  if (!highlightRect || !step.position || step.position === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const offset = 20;
  const style: React.CSSProperties = { position: 'fixed' };

  switch (step.position) {
    case 'top':
      style.left = highlightRect.left + highlightRect.width / 2;
      style.bottom = window.innerHeight - highlightRect.top + offset;
      style.transform = 'translateX(-50%)';
      break;

    case 'bottom':
      style.left = highlightRect.left + highlightRect.width / 2;
      style.top = highlightRect.bottom + offset;
      style.transform = 'translateX(-50%)';
      break;

    case 'left':
      style.right = window.innerWidth - highlightRect.left + offset;
      style.top = highlightRect.top + highlightRect.height / 2;
      style.transform = 'translateY(-50%)';
      break;

    case 'right':
      style.left = highlightRect.right + offset;
      style.top = highlightRect.top + highlightRect.height / 2;
      style.transform = 'translateY(-50%)';
      break;
  }

  return style;
}

/**
 * Get icon for action type
 */
function getActionIcon(action?: string): string {
  switch (action) {
    case 'click':
      return '👆';
    case 'type':
      return '⌨️';
    case 'drag':
      return '👋';
    case 'observe':
      return '👀';
    default:
      return '💡';
  }
}

/**
 * Tutorial launcher component
 */
export interface TutorialLauncherProps {
  tutorialId: string;
  children: React.ReactNode;
}

export function TutorialLauncher({ tutorialId, children }: TutorialLauncherProps) {
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);

  const handleLaunch = () => {
    const helpManager = getHelpContentManager();
    const tutorial = helpManager.getTutorial(tutorialId);
    if (tutorial) {
      setActiveTutorial(tutorial);
    }
  };

  const handleComplete = () => {
    setActiveTutorial(null);
  };

  const handleSkip = () => {
    setActiveTutorial(null);
  };

  return (
    <>
      <div onClick={handleLaunch}>{children}</div>

      {activeTutorial && (
        <TutorialOverlay
          tutorial={activeTutorial}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}
    </>
  );
}
