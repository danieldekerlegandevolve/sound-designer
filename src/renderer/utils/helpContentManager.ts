/**
 * Help Content Manager
 *
 * Manages help articles, tutorials, FAQs, and search functionality
 */

import {
  HelpArticle,
  Tutorial,
  FAQItem,
  ContextualHelp,
  SearchResult,
  SearchOptions,
  UserProgress,
  HelpConfig,
  Tip,
  ShortcutDoc,
  HelpCategory,
} from '../../shared/helpTypes';

const DEFAULT_CONFIG: HelpConfig = {
  enableTutorials: true,
  enableContextualHelp: true,
  showTipsOnStartup: true,
  tutorialAutoAdvance: false,
  searchResultsLimit: 20,
};

/**
 * Help Content Manager class
 */
export class HelpContentManager {
  private config: HelpConfig;
  private articles: Map<string, HelpArticle> = new Map();
  private tutorials: Map<string, Tutorial> = new Map();
  private faqs: Map<string, FAQItem> = new Map();
  private contextualHelp: Map<string, ContextualHelp> = new Map();
  private shortcuts: Map<string, ShortcutDoc> = new Map();
  private tips: Tip[] = [];
  private userProgress: UserProgress;

  constructor(config: Partial<HelpConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.userProgress = this.loadUserProgress();
    this.initializeContent();
  }

  /**
   * Initialize all help content
   */
  private initializeContent(): void {
    // Content is loaded from external sources or defined here
    // This is a placeholder - content will be added by the content initialization
  }

  /**
   * Add a help article
   */
  addArticle(article: HelpArticle): void {
    this.articles.set(article.id, article);
  }

  /**
   * Add multiple articles
   */
  addArticles(articles: HelpArticle[]): void {
    articles.forEach((article) => this.addArticle(article));
  }

  /**
   * Get article by ID
   */
  getArticle(id: string): HelpArticle | undefined {
    const article = this.articles.get(id);
    if (article) {
      this.trackArticleView(id);
    }
    return article;
  }

  /**
   * Get articles by category
   */
  getArticlesByCategory(category: HelpCategory): HelpArticle[] {
    return Array.from(this.articles.values()).filter(
      (article) => article.category === category
    );
  }

  /**
   * Add a tutorial
   */
  addTutorial(tutorial: Tutorial): void {
    this.tutorials.set(tutorial.id, tutorial);
  }

  /**
   * Add multiple tutorials
   */
  addTutorials(tutorials: Tutorial[]): void {
    tutorials.forEach((tutorial) => this.addTutorial(tutorial));
  }

  /**
   * Get tutorial by ID
   */
  getTutorial(id: string): Tutorial | undefined {
    return this.tutorials.get(id);
  }

  /**
   * Get tutorials by category
   */
  getTutorialsByCategory(category: HelpCategory): Tutorial[] {
    return Array.from(this.tutorials.values()).filter(
      (tutorial) => tutorial.category === category
    );
  }

  /**
   * Mark tutorial as completed
   */
  completeTutorial(tutorialId: string): void {
    if (!this.userProgress.completedTutorials.includes(tutorialId)) {
      this.userProgress.completedTutorials.push(tutorialId);
      this.saveUserProgress();
    }
  }

  /**
   * Check if tutorial is completed
   */
  isTutorialCompleted(tutorialId: string): boolean {
    return this.userProgress.completedTutorials.includes(tutorialId);
  }

  /**
   * Add FAQ item
   */
  addFAQ(faq: FAQItem): void {
    this.faqs.set(faq.id, faq);
  }

  /**
   * Add multiple FAQs
   */
  addFAQs(faqs: FAQItem[]): void {
    faqs.forEach((faq) => this.addFAQ(faq));
  }

  /**
   * Get FAQ by ID
   */
  getFAQ(id: string): FAQItem | undefined {
    return this.faqs.get(id);
  }

  /**
   * Get FAQs by category
   */
  getFAQsByCategory(category: HelpCategory): FAQItem[] {
    return Array.from(this.faqs.values()).filter((faq) => faq.category === category);
  }

  /**
   * Vote FAQ as helpful
   */
  voteFAQHelpful(faqId: string): void {
    const faq = this.faqs.get(faqId);
    if (faq) {
      faq.helpful = (faq.helpful || 0) + 1;
    }
  }

  /**
   * Add contextual help
   */
  addContextualHelp(help: ContextualHelp): void {
    this.contextualHelp.set(help.context, help);
  }

  /**
   * Get contextual help for a context
   */
  getContextualHelp(context: string): ContextualHelp | undefined {
    return this.contextualHelp.get(context);
  }

  /**
   * Add keyboard shortcut documentation
   */
  addShortcut(shortcut: ShortcutDoc): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  /**
   * Add multiple shortcuts
   */
  addShortcuts(shortcuts: ShortcutDoc[]): void {
    shortcuts.forEach((shortcut) => this.addShortcut(shortcut));
  }

  /**
   * Get all shortcuts
   */
  getAllShortcuts(): ShortcutDoc[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: string): ShortcutDoc[] {
    return Array.from(this.shortcuts.values()).filter(
      (shortcut) => shortcut.category === category
    );
  }

  /**
   * Add tips
   */
  addTips(tips: Tip[]): void {
    this.tips = tips;
  }

  /**
   * Get random tip
   */
  getRandomTip(): Tip | undefined {
    if (this.tips.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * this.tips.length);
    return this.tips[randomIndex];
  }

  /**
   * Search help content
   */
  search(options: SearchOptions): SearchResult[] {
    const { query, categories, types, difficulty, limit } = options;
    const results: SearchResult[] = [];

    const searchLower = query.toLowerCase();

    // Search articles
    if (!types || types.includes('article')) {
      this.articles.forEach((article) => {
        if (categories && !categories.includes(article.category)) return;
        if (difficulty && article.difficulty && !difficulty.includes(article.difficulty))
          return;

        const titleMatch = article.title.toLowerCase().includes(searchLower);
        const contentMatch = article.content.toLowerCase().includes(searchLower);
        const tagMatch = article.tags.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        );

        if (titleMatch || contentMatch || tagMatch) {
          const relevance = titleMatch ? 1.0 : tagMatch ? 0.8 : 0.6;
          results.push({
            type: 'article',
            id: article.id,
            title: article.title,
            excerpt: this.extractExcerpt(article.content, searchLower),
            relevance,
            category: article.category,
          });
        }
      });
    }

    // Search tutorials
    if (!types || types.includes('tutorial')) {
      this.tutorials.forEach((tutorial) => {
        if (categories && !categories.includes(tutorial.category)) return;
        if (difficulty && !difficulty.includes(tutorial.difficulty)) return;

        const titleMatch = tutorial.title.toLowerCase().includes(searchLower);
        const descMatch = tutorial.description.toLowerCase().includes(searchLower);

        if (titleMatch || descMatch) {
          const relevance = titleMatch ? 1.0 : 0.7;
          results.push({
            type: 'tutorial',
            id: tutorial.id,
            title: tutorial.title,
            excerpt: tutorial.description,
            relevance,
            category: tutorial.category,
          });
        }
      });
    }

    // Search FAQs
    if (!types || types.includes('faq')) {
      this.faqs.forEach((faq) => {
        if (categories && !categories.includes(faq.category)) return;

        const questionMatch = faq.question.toLowerCase().includes(searchLower);
        const answerMatch = faq.answer.toLowerCase().includes(searchLower);
        const tagMatch = faq.tags.some((tag) => tag.toLowerCase().includes(searchLower));

        if (questionMatch || answerMatch || tagMatch) {
          const relevance = questionMatch ? 1.0 : tagMatch ? 0.8 : 0.6;
          results.push({
            type: 'faq',
            id: faq.id,
            title: faq.question,
            excerpt: this.extractExcerpt(faq.answer, searchLower),
            relevance,
            category: faq.category,
          });
        }
      });
    }

    // Search shortcuts
    if (!types || types.includes('shortcut')) {
      this.shortcuts.forEach((shortcut) => {
        const actionMatch = shortcut.action.toLowerCase().includes(searchLower);
        const descMatch = shortcut.description.toLowerCase().includes(searchLower);
        const keysMatch = shortcut.keys.toLowerCase().includes(searchLower);

        if (actionMatch || descMatch || keysMatch) {
          const relevance = actionMatch ? 1.0 : keysMatch ? 0.9 : 0.7;
          results.push({
            type: 'shortcut',
            id: shortcut.id,
            title: shortcut.action,
            excerpt: `${shortcut.keys} - ${shortcut.description}`,
            relevance,
            category: HelpCategory.KEYBOARD_SHORTCUTS,
          });
        }
      });
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply limit
    const maxResults = limit || this.config.searchResultsLimit;
    return results.slice(0, maxResults);
  }

  /**
   * Extract excerpt around search term
   */
  private extractExcerpt(content: string, searchTerm: string, length: number = 150): string {
    const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) {
      return content.substring(0, length) + '...';
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + searchTerm.length + 100);

    let excerpt = content.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Bookmark an article
   */
  bookmarkArticle(articleId: string): void {
    if (!this.userProgress.bookmarkedArticles.includes(articleId)) {
      this.userProgress.bookmarkedArticles.push(articleId);
      this.saveUserProgress();
    }
  }

  /**
   * Remove bookmark
   */
  removeBookmark(articleId: string): void {
    const index = this.userProgress.bookmarkedArticles.indexOf(articleId);
    if (index !== -1) {
      this.userProgress.bookmarkedArticles.splice(index, 1);
      this.saveUserProgress();
    }
  }

  /**
   * Check if article is bookmarked
   */
  isBookmarked(articleId: string): boolean {
    return this.userProgress.bookmarkedArticles.includes(articleId);
  }

  /**
   * Track article view
   */
  private trackArticleView(articleId: string): void {
    if (!this.userProgress.viewedArticles.includes(articleId)) {
      this.userProgress.viewedArticles.push(articleId);
      this.saveUserProgress();
    }
  }

  /**
   * Get user progress
   */
  getUserProgress(): UserProgress {
    return { ...this.userProgress };
  }

  /**
   * Load user progress from storage
   */
  private loadUserProgress(): UserProgress {
    try {
      const stored = localStorage.getItem('sound-designer-help-progress');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }

    return {
      completedTutorials: [],
      viewedArticles: [],
      bookmarkedArticles: [],
      lastVisited: new Date(),
    };
  }

  /**
   * Save user progress to storage
   */
  private saveUserProgress(): void {
    try {
      this.userProgress.lastVisited = new Date();
      localStorage.setItem(
        'sound-designer-help-progress',
        JSON.stringify(this.userProgress)
      );
    } catch (error) {
      console.error('Failed to save user progress:', error);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): HelpConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HelpConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
let helpContentManagerInstance: HelpContentManager | null = null;

/**
 * Get the global HelpContentManager instance
 */
export function getHelpContentManager(): HelpContentManager {
  if (!helpContentManagerInstance) {
    helpContentManagerInstance = new HelpContentManager();
  }
  return helpContentManagerInstance;
}

/**
 * Reset the global HelpContentManager instance
 */
export function resetHelpContentManager(): void {
  helpContentManagerInstance = null;
}
