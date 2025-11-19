/**
 * Initialize Help Content
 *
 * Loads all help content into the HelpContentManager
 */

import { getHelpContentManager } from '../utils/helpContentManager';
import {
  helpArticles,
  tutorials,
  faqItems,
  keyboardShortcuts,
  contextualHelp,
  tips,
} from './helpContent';

/**
 * Initialize all help content
 */
export function initializeHelpContent(): void {
  const helpManager = getHelpContentManager();

  // Load articles
  helpManager.addArticles(helpArticles);

  // Load tutorials
  helpManager.addTutorials(tutorials);

  // Load FAQs
  helpManager.addFAQs(faqItems);

  // Load keyboard shortcuts
  helpManager.addShortcuts(keyboardShortcuts);

  // Load contextual help
  contextualHelp.forEach((help) => {
    helpManager.addContextualHelp(help);
  });

  // Load tips
  helpManager.addTips(tips);

  console.log('Help content initialized successfully');
}

/**
 * Check if help content is initialized
 */
export function isHelpContentInitialized(): boolean {
  const helpManager = getHelpContentManager();
  return helpManager.getAllShortcuts().length > 0;
}
