/**
 * Help and Documentation System Module Exports
 *
 * Central export point for all help and documentation functionality
 */

// Content Manager
export { getHelpContentManager, resetHelpContentManager, HelpContentManager } from '../../utils/helpContentManager';

// Initialize Content
export { initializeHelpContent, isHelpContentInitialized } from '../../content/initializeHelpContent';

// Components
export { HelpCenter } from '../../components/HelpCenter';
export type { HelpCenterProps } from '../../components/HelpCenter';

export { TutorialOverlay, TutorialLauncher } from '../../components/TutorialOverlay';
export type { TutorialOverlayProps, TutorialLauncherProps } from '../../components/TutorialOverlay';

export { ShortcutsPanel, ShortcutBadge } from '../../components/ShortcutsPanel';
export type { ShortcutsPanelProps, ShortcutBadgeProps } from '../../components/ShortcutsPanel';

export { ContextualHelpPanel, HelpButton } from '../../components/ContextualHelpPanel';
export type { ContextualHelpPanelProps, HelpButtonProps } from '../../components/ContextualHelpPanel';

// Types
export type {
  HelpArticle,
  Tutorial,
  TutorialStep,
  FAQItem,
  ContextualHelp,
  SearchResult,
  SearchOptions,
  UserProgress,
  HelpConfig,
  ShortcutDoc,
  VideoTutorial,
  Tip,
  HelpNotification,
} from '../../../shared/helpTypes';

export { HelpCategory } from '../../../shared/helpTypes';
