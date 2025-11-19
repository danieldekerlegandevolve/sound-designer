/**
 * Contextual Help Panel
 *
 * Displays context-specific help and tips
 */

import React, { useState, useEffect } from 'react';
import { ContextualHelp } from '../../shared/helpTypes';
import { getHelpContentManager } from '../utils/helpContentManager';

export interface ContextualHelpPanelProps {
  context: string;
  onClose?: () => void;
  position?: 'side' | 'inline';
}

export function ContextualHelpPanel({
  context,
  onClose,
  position = 'side',
}: ContextualHelpPanelProps) {
  const [help, setHelp] = useState<ContextualHelp | null>(null);

  useEffect(() => {
    const helpManager = getHelpContentManager();
    const contextHelp = helpManager.getContextualHelp(context);
    setHelp(contextHelp || null);
  }, [context]);

  if (!help) {
    return null;
  }

  return (
    <div className={`contextual-help-panel contextual-help-${position}`}>
      <div className="contextual-help-header">
        <div className="contextual-help-icon">❓</div>
        <h3 className="contextual-help-title">{help.title}</h3>
        {onClose && (
          <button
            className="contextual-help-close"
            onClick={onClose}
            aria-label="Close help"
          >
            ✕
          </button>
        )}
      </div>

      <div className="contextual-help-content">
        <p className="contextual-help-description">{help.description}</p>

        {help.quickTips && help.quickTips.length > 0 && (
          <div className="contextual-help-tips">
            <h4 className="tips-title">Quick Tips</h4>
            <ul className="tips-list">
              {help.quickTips.map((tip, index) => (
                <li key={index} className="tip-item">
                  <span className="tip-bullet">💡</span>
                  <span className="tip-text">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {help.videoUrl && (
          <div className="contextual-help-video">
            <h4 className="video-title">Video Tutorial</h4>
            <div className="video-container">
              <a
                href={help.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="video-link"
              >
                <span className="video-icon">▶️</span>
                <span>Watch Video</span>
              </a>
            </div>
          </div>
        )}

        {help.relatedArticles && help.relatedArticles.length > 0 && (
          <div className="contextual-help-related">
            <h4 className="related-title">Learn More</h4>
            <ul className="related-list">
              {help.relatedArticles.map((articleId) => (
                <li key={articleId} className="related-item">
                  <ArticleLink articleId={articleId} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Article link component
 */
function ArticleLink({ articleId }: { articleId: string }) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    const helpManager = getHelpContentManager();
    const article = helpManager.getArticle(articleId);
    setTitle(article?.title || articleId);
  }, [articleId]);

  const handleClick = () => {
    // Open help center to this article
    // This would be handled by a help center context/state
    console.log('Open article:', articleId);
  };

  return (
    <button className="article-link" onClick={handleClick}>
      <span className="article-icon">📄</span>
      <span className="article-title">{title}</span>
    </button>
  );
}

/**
 * Help button - triggers contextual help
 */
export interface HelpButtonProps {
  context: string;
  variant?: 'icon' | 'text';
  label?: string;
}

export function HelpButton({
  context,
  variant = 'icon',
  label = 'Help',
}: HelpButtonProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="help-button-container">
      <button
        className={`help-button help-button-${variant}`}
        onClick={() => setShowHelp(!showHelp)}
        aria-label={label}
      >
        {variant === 'icon' ? '?' : label}
      </button>

      {showHelp && (
        <div className="help-button-popover">
          <ContextualHelpPanel
            context={context}
            onClose={() => setShowHelp(false)}
            position="inline"
          />
        </div>
      )}
    </div>
  );
}
