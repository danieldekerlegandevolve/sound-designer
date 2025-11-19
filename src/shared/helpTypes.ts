/**
 * Help System Types
 *
 * Type definitions for the in-app documentation and help system
 */

/**
 * Help article category
 */
export enum HelpCategory {
  GETTING_STARTED = 'getting-started',
  PRESETS = 'presets',
  MIDI = 'midi',
  AUTOMATION = 'automation',
  MODULATION = 'modulation',
  SAMPLES = 'samples',
  EFFECTS = 'effects',
  SYNTHESIS = 'synthesis',
  EXPORT = 'export',
  KEYBOARD_SHORTCUTS = 'keyboard-shortcuts',
  PERFORMANCE = 'performance',
  TROUBLESHOOTING = 'troubleshooting',
  ADVANCED = 'advanced',
}

/**
 * Help article
 */
export interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  tags: string[];
  content: string;
  relatedArticles?: string[];
  lastUpdated?: Date;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Tutorial step
 */
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'type' | 'drag' | 'observe';
  actionDescription?: string;
  nextCondition?: () => boolean; // Condition to automatically advance
  skippable?: boolean;
}

/**
 * Tutorial
 */
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: HelpCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  steps: TutorialStep[];
  prerequisites?: string[]; // IDs of required tutorials
}

/**
 * FAQ item
 */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: HelpCategory;
  tags: string[];
  helpful?: number; // Number of helpful votes
}

/**
 * Contextual help
 */
export interface ContextualHelp {
  id: string;
  context: string; // Component or feature identifier
  title: string;
  description: string;
  quickTips?: string[];
  relatedArticles?: string[];
  videoUrl?: string;
}

/**
 * Search result
 */
export interface SearchResult {
  type: 'article' | 'tutorial' | 'faq' | 'shortcut';
  id: string;
  title: string;
  excerpt: string;
  relevance: number; // 0-1
  category: HelpCategory;
}

/**
 * User progress tracking
 */
export interface UserProgress {
  completedTutorials: string[];
  viewedArticles: string[];
  bookmarkedArticles: string[];
  lastVisited: Date;
}

/**
 * Help system configuration
 */
export interface HelpConfig {
  enableTutorials: boolean;
  enableContextualHelp: boolean;
  showTipsOnStartup: boolean;
  tutorialAutoAdvance: boolean;
  searchResultsLimit: number;
}

/**
 * Keyboard shortcut documentation
 */
export interface ShortcutDoc {
  id: string;
  category: string;
  action: string;
  keys: string;
  description: string;
  context?: string; // Where the shortcut applies
}

/**
 * Video tutorial metadata
 */
export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // in seconds
  category: HelpCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Help search options
 */
export interface SearchOptions {
  query: string;
  categories?: HelpCategory[];
  types?: ('article' | 'tutorial' | 'faq' | 'shortcut')[];
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  limit?: number;
}

/**
 * Tip of the day
 */
export interface Tip {
  id: string;
  title: string;
  description: string;
  category: HelpCategory;
  learnMoreArticle?: string;
}

/**
 * Help notification
 */
export interface HelpNotification {
  id: string;
  type: 'tip' | 'update' | 'tutorial' | 'feature';
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  dismissible: boolean;
  expiresAt?: Date;
}
