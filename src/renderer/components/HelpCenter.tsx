/**
 * Help Center Component
 *
 * Main help and documentation interface
 */

import React, { useState, useEffect } from 'react';
import {
  HelpArticle,
  Tutorial,
  FAQItem,
  SearchResult,
  HelpCategory,
} from '../../shared/helpTypes';
import { getHelpContentManager } from '../utils/helpContentManager';
import { TutorialOverlay } from './TutorialOverlay';
import { ShortcutsPanel } from './ShortcutsPanel';

export interface HelpCenterProps {
  onClose: () => void;
  initialTab?: 'search' | 'articles' | 'tutorials' | 'faq' | 'shortcuts';
  initialQuery?: string;
}

export function HelpCenter({
  onClose,
  initialTab = 'search',
  initialQuery = '',
}: HelpCenterProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const helpManager = getHelpContentManager();

  // Perform search
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const results = helpManager.search({
        query: searchQuery,
        limit: 20,
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'article':
        const article = helpManager.getArticle(result.id);
        if (article) {
          setSelectedArticle(article);
          setActiveTab('articles');
        }
        break;

      case 'tutorial':
        const tutorial = helpManager.getTutorial(result.id);
        if (tutorial) {
          setSelectedTutorial(tutorial);
          setActiveTab('tutorials');
        }
        break;

      case 'faq':
        setActiveTab('faq');
        // Auto-scroll to FAQ item
        setTimeout(() => {
          const element = document.getElementById(`faq-${result.id}`);
          element?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;

      case 'shortcut':
        setShowShortcuts(true);
        break;
    }
  };

  const handleBookmark = (articleId: string) => {
    if (helpManager.isBookmarked(articleId)) {
      helpManager.removeBookmark(articleId);
    } else {
      helpManager.bookmarkArticle(articleId);
    }
    // Force re-render
    setSelectedArticle({ ...selectedArticle! });
  };

  return (
    <div className="help-center">
      <div className="help-center-header">
        <h1 className="help-center-title">Help Center</h1>
        <button className="help-center-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="help-center-search">
        <input
          type="text"
          className="help-search-input"
          placeholder="Search documentation, tutorials, and FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      {searchQuery.trim().length >= 2 && searchResults.length > 0 ? (
        <div className="help-search-results">
          <h3 className="search-results-title">
            {searchResults.length} results for "{searchQuery}"
          </h3>
          <div className="search-results-list">
            {searchResults.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className="search-result-item"
                onClick={() => handleResultClick(result)}
              >
                <div className="search-result-header">
                  <span className={`search-result-type ${result.type}`}>
                    {result.type}
                  </span>
                  <span className="search-result-title">{result.title}</span>
                </div>
                <p className="search-result-excerpt">{result.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="help-center-tabs">
            <button
              className={`help-tab ${activeTab === 'articles' ? 'active' : ''}`}
              onClick={() => setActiveTab('articles')}
            >
              📄 Articles
            </button>
            <button
              className={`help-tab ${activeTab === 'tutorials' ? 'active' : ''}`}
              onClick={() => setActiveTab('tutorials')}
            >
              🎓 Tutorials
            </button>
            <button
              className={`help-tab ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              ❓ FAQ
            </button>
            <button
              className={`help-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setShowShortcuts(true)}
            >
              ⌨️ Shortcuts
            </button>
          </div>

          <div className="help-center-content">
            {activeTab === 'articles' && (
              <ArticlesView
                selectedArticle={selectedArticle}
                onSelectArticle={setSelectedArticle}
                onBookmark={handleBookmark}
              />
            )}

            {activeTab === 'tutorials' && (
              <TutorialsView
                selectedTutorial={selectedTutorial}
                onSelectTutorial={setSelectedTutorial}
                onLaunchTutorial={setActiveTutorial}
              />
            )}

            {activeTab === 'faq' && <FAQView />}
          </div>
        </>
      )}

      {showShortcuts && <ShortcutsPanel onClose={() => setShowShortcuts(false)} />}

      {activeTutorial && (
        <TutorialOverlay
          tutorial={activeTutorial}
          onComplete={() => setActiveTutorial(null)}
          onSkip={() => setActiveTutorial(null)}
        />
      )}
    </div>
  );
}

/**
 * Articles view
 */
function ArticlesView({
  selectedArticle,
  onSelectArticle,
  onBookmark,
}: {
  selectedArticle: HelpArticle | null;
  onSelectArticle: (article: HelpArticle) => void;
  onBookmark: (articleId: string) => void;
}) {
  const helpManager = getHelpContentManager();
  const categories = Object.values(HelpCategory);

  if (selectedArticle) {
    const isBookmarked = helpManager.isBookmarked(selectedArticle.id);

    return (
      <div className="article-detail">
        <button
          className="article-back-button"
          onClick={() => onSelectArticle(null as any)}
        >
          ← Back to Articles
        </button>

        <div className="article-header">
          <h2 className="article-title">{selectedArticle.title}</h2>
          <button
            className={`article-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={() => onBookmark(selectedArticle.id)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
        </div>

        <div className="article-meta">
          <span className="article-category">{selectedArticle.category}</span>
          {selectedArticle.difficulty && (
            <span className={`article-difficulty ${selectedArticle.difficulty}`}>
              {selectedArticle.difficulty}
            </span>
          )}
        </div>

        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
        />

        {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
          <div className="article-related">
            <h3>Related Articles</h3>
            <ul>
              {selectedArticle.relatedArticles.map((relatedId) => {
                const related = helpManager.getArticle(relatedId);
                if (!related) return null;
                return (
                  <li key={relatedId}>
                    <button
                      className="related-article-link"
                      onClick={() => onSelectArticle(related)}
                    >
                      {related.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="articles-list">
      {categories.map((category) => {
        const articles = helpManager.getArticlesByCategory(category);
        if (articles.length === 0) return null;

        return (
          <div key={category} className="article-category-section">
            <h3 className="category-section-title">{formatCategory(category)}</h3>
            <div className="articles-grid">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="article-card"
                  onClick={() => onSelectArticle(article)}
                >
                  <h4 className="article-card-title">{article.title}</h4>
                  <div className="article-card-tags">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="article-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Tutorials view
 */
function TutorialsView({
  selectedTutorial,
  onSelectTutorial,
  onLaunchTutorial,
}: {
  selectedTutorial: Tutorial | null;
  onSelectTutorial: (tutorial: Tutorial | null) => void;
  onLaunchTutorial: (tutorial: Tutorial) => void;
}) {
  const helpManager = getHelpContentManager();
  const categories = Object.values(HelpCategory);

  if (selectedTutorial) {
    const isCompleted = helpManager.isTutorialCompleted(selectedTutorial.id);

    return (
      <div className="tutorial-detail">
        <button
          className="tutorial-back-button"
          onClick={() => onSelectTutorial(null)}
        >
          ← Back to Tutorials
        </button>

        <div className="tutorial-header">
          <h2 className="tutorial-title">{selectedTutorial.title}</h2>
          {isCompleted && <span className="tutorial-completed">✓ Completed</span>}
        </div>

        <div className="tutorial-meta">
          <span className={`tutorial-difficulty ${selectedTutorial.difficulty}`}>
            {selectedTutorial.difficulty}
          </span>
          <span className="tutorial-time">
            ~{selectedTutorial.estimatedTime} min
          </span>
          <span className="tutorial-steps">
            {selectedTutorial.steps.length} steps
          </span>
        </div>

        <p className="tutorial-description">{selectedTutorial.description}</p>

        <div className="tutorial-steps-preview">
          <h3>Steps</h3>
          <ol className="steps-list">
            {selectedTutorial.steps.map((step, index) => (
              <li key={step.id} className="step-preview">
                <strong>{step.title}</strong>: {step.description}
              </li>
            ))}
          </ol>
        </div>

        <button
          className="tutorial-launch-button"
          onClick={() => onLaunchTutorial(selectedTutorial)}
        >
          {isCompleted ? 'Restart Tutorial' : 'Start Tutorial'}
        </button>
      </div>
    );
  }

  return (
    <div className="tutorials-list">
      {categories.map((category) => {
        const tutorials = helpManager.getTutorialsByCategory(category);
        if (tutorials.length === 0) return null;

        return (
          <div key={category} className="tutorial-category-section">
            <h3 className="category-section-title">{formatCategory(category)}</h3>
            <div className="tutorials-grid">
              {tutorials.map((tutorial) => {
                const isCompleted = helpManager.isTutorialCompleted(tutorial.id);

                return (
                  <div
                    key={tutorial.id}
                    className="tutorial-card"
                    onClick={() => onSelectTutorial(tutorial)}
                  >
                    <div className="tutorial-card-header">
                      <h4 className="tutorial-card-title">{tutorial.title}</h4>
                      {isCompleted && (
                        <span className="tutorial-card-completed">✓</span>
                      )}
                    </div>
                    <p className="tutorial-card-description">
                      {tutorial.description}
                    </p>
                    <div className="tutorial-card-meta">
                      <span className={`difficulty ${tutorial.difficulty}`}>
                        {tutorial.difficulty}
                      </span>
                      <span className="time">~{tutorial.estimatedTime} min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * FAQ view
 */
function FAQView() {
  const helpManager = getHelpContentManager();
  const categories = Object.values(HelpCategory);

  return (
    <div className="faq-list">
      {categories.map((category) => {
        const faqs = helpManager.getFAQsByCategory(category);
        if (faqs.length === 0) return null;

        return (
          <div key={category} className="faq-category-section">
            <h3 className="category-section-title">{formatCategory(category)}</h3>
            <div className="faq-items">
              {faqs.map((faq) => (
                <FAQItemComponent key={faq.id} faq={faq} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * FAQ item component
 */
function FAQItemComponent({ faq }: { faq: FAQItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const helpManager = getHelpContentManager();

  const handleHelpful = () => {
    helpManager.voteFAQHelpful(faq.id);
  };

  return (
    <div id={`faq-${faq.id}`} className="faq-item">
      <button
        className="faq-question"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="faq-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="faq-question-text">{faq.question}</span>
      </button>

      {isExpanded && (
        <div className="faq-answer">
          <p dangerouslySetInnerHTML={{ __html: faq.answer }} />
          <div className="faq-helpful">
            <button className="faq-helpful-button" onClick={handleHelpful}>
              👍 Helpful ({faq.helpful || 0})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format category name
 */
function formatCategory(category: string): string {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
