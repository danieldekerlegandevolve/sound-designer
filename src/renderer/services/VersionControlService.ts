import { PluginProject } from '@shared/types';

/**
 * Version Control Service
 * Git-based version control for Sound Designer projects
 * Provides commit, branch, merge, and history tracking
 */

export interface Commit {
  hash: string;
  author: {
    name: string;
    email: string;
  };
  message: string;
  timestamp: Date;
  changes: ChangeSet[];
  parent?: string;
}

export interface ChangeSet {
  type: 'add' | 'modify' | 'delete';
  path: string;
  description: string;
}

export interface Branch {
  name: string;
  commit: string;
  isActive: boolean;
  upstream?: string;
}

export interface VersionHistory {
  commits: Commit[];
  branches: Branch[];
  currentBranch: string;
}

export interface DiffResult {
  changes: ChangeSet[];
  summary: {
    additions: number;
    modifications: number;
    deletions: number;
  };
}

export class VersionControlService {
  private projectPath: string;
  private isInitialized = false;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Initialize Git repository for project
   */
  async initialize(): Promise<void> {
    try {
      // Check if already initialized
      const exists = await this.isGitRepo();

      if (!exists) {
        // Initialize new repository
        await this.execGit('init');

        // Create .gitignore
        await this.createGitIgnore();

        // Initial commit
        await this.commit('Initial commit', 'Sound Designer');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize version control:', error);
      throw error;
    }
  }

  /**
   * Commit changes
   */
  async commit(message: string, author: string): Promise<Commit> {
    if (!this.isInitialized) {
      throw new Error('Version control not initialized');
    }

    try {
      // Stage all changes
      await this.execGit('add .');

      // Create commit
      const result = await this.execGit(`commit -m "${message}" --author="${author} <noreply@sounddesigner.com>"`);

      // Get commit hash
      const hash = await this.execGit('rev-parse HEAD');

      // Get commit details
      const commit = await this.getCommit(hash.trim());

      return commit;
    } catch (error) {
      console.error('Failed to create commit:', error);
      throw error;
    }
  }

  /**
   * Get commit history
   */
  async getHistory(limit: number = 50): Promise<Commit[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const log = await this.execGit(
        `log --pretty=format:"%H|%an|%ae|%ai|%s" -n ${limit}`
      );

      const lines = log.trim().split('\n').filter((l) => l);

      const commits: Commit[] = [];

      for (const line of lines) {
        const [hash, name, email, timestamp, message] = line.split('|');

        // Get changes for this commit
        const changes = await this.getCommitChanges(hash);

        commits.push({
          hash,
          author: { name, email },
          message,
          timestamp: new Date(timestamp),
          changes,
        });
      }

      return commits;
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }

  /**
   * Get specific commit
   */
  async getCommit(hash: string): Promise<Commit> {
    const log = await this.execGit(
      `log --pretty=format:"%H|%an|%ae|%ai|%s" -n 1 ${hash}`
    );

    const [commitHash, name, email, timestamp, message] = log.trim().split('|');

    const changes = await this.getCommitChanges(commitHash);

    return {
      hash: commitHash,
      author: { name, email },
      message,
      timestamp: new Date(timestamp),
      changes,
    };
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName: string): Promise<Branch> {
    if (!this.isInitialized) {
      throw new Error('Version control not initialized');
    }

    await this.execGit(`branch ${branchName}`);

    const currentCommit = await this.getCurrentCommit();

    return {
      name: branchName,
      commit: currentCommit,
      isActive: false,
    };
  }

  /**
   * Switch to a branch
   */
  async switchBranch(branchName: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Version control not initialized');
    }

    await this.execGit(`checkout ${branchName}`);
  }

  /**
   * Merge a branch
   */
  async mergeBranch(branchName: string, message?: string): Promise<Commit> {
    if (!this.isInitialized) {
      throw new Error('Version control not initialized');
    }

    const mergeMessage = message || `Merge branch '${branchName}'`;

    try {
      await this.execGit(`merge ${branchName} -m "${mergeMessage}"`);

      const hash = await this.getCurrentCommit();
      return await this.getCommit(hash);
    } catch (error) {
      // Handle merge conflicts
      throw new Error(`Merge conflict: ${error}`);
    }
  }

  /**
   * Get all branches
   */
  async getBranches(): Promise<Branch[]> {
    if (!this.isInitialized) {
      return [];
    }

    const output = await this.execGit('branch -v');

    const lines = output.trim().split('\n');
    const branches: Branch[] = [];

    for (const line of lines) {
      const isActive = line.startsWith('*');
      const parts = line.replace('*', '').trim().split(/\s+/);

      if (parts.length >= 2) {
        branches.push({
          name: parts[0],
          commit: parts[1],
          isActive,
        });
      }
    }

    return branches;
  }

  /**
   * Get current branch
   */
  async getCurrentBranch(): Promise<string> {
    if (!this.isInitialized) {
      return 'main';
    }

    const branch = await this.execGit('branch --show-current');
    return branch.trim();
  }

  /**
   * Get diff between commits
   */
  async getDiff(fromCommit: string, toCommit?: string): Promise<DiffResult> {
    if (!this.isInitialized) {
      return {
        changes: [],
        summary: { additions: 0, modifications: 0, deletions: 0 },
      };
    }

    const target = toCommit || 'HEAD';
    const diff = await this.execGit(`diff --name-status ${fromCommit} ${target}`);

    const changes: ChangeSet[] = [];
    let additions = 0;
    let modifications = 0;
    let deletions = 0;

    const lines = diff.trim().split('\n').filter((l) => l);

    for (const line of lines) {
      const [status, path] = line.split('\t');

      let type: 'add' | 'modify' | 'delete';
      let description: string;

      switch (status) {
        case 'A':
          type = 'add';
          description = `Added ${path}`;
          additions++;
          break;
        case 'M':
          type = 'modify';
          description = `Modified ${path}`;
          modifications++;
          break;
        case 'D':
          type = 'delete';
          description = `Deleted ${path}`;
          deletions++;
          break;
        default:
          continue;
      }

      changes.push({ type, path, description });
    }

    return {
      changes,
      summary: { additions, modifications, deletions },
    };
  }

  /**
   * Revert to a specific commit
   */
  async revertToCommit(commitHash: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Version control not initialized');
    }

    await this.execGit(`reset --hard ${commitHash}`);
  }

  /**
   * Tag a commit
   */
  async createTag(tagName: string, message?: string, commitHash?: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Version control not initialized');
    }

    const target = commitHash || 'HEAD';
    const msgFlag = message ? `-m "${message}"` : '';

    await this.execGit(`tag ${tagName} ${target} ${msgFlag}`);
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<Array<{ name: string; commit: string }>> {
    if (!this.isInitialized) {
      return [];
    }

    const output = await this.execGit('tag -l --format="%(refname:short)|%(objectname:short)"');

    const lines = output.trim().split('\n').filter((l) => l);

    return lines.map((line) => {
      const [name, commit] = line.split('|');
      return { name, commit };
    });
  }

  /**
   * Get status
   */
  async getStatus(): Promise<{
    modified: string[];
    added: string[];
    deleted: string[];
    untracked: string[];
  }> {
    if (!this.isInitialized) {
      return { modified: [], added: [], deleted: [], untracked: [] };
    }

    const status = await this.execGit('status --porcelain');

    const modified: string[] = [];
    const added: string[] = [];
    const deleted: string[] = [];
    const untracked: string[] = [];

    const lines = status.trim().split('\n').filter((l) => l);

    for (const line of lines) {
      const statusCode = line.substring(0, 2);
      const file = line.substring(3);

      if (statusCode.includes('M')) {
        modified.push(file);
      } else if (statusCode.includes('A')) {
        added.push(file);
      } else if (statusCode.includes('D')) {
        deleted.push(file);
      } else if (statusCode.includes('?')) {
        untracked.push(file);
      }
    }

    return { modified, added, deleted, untracked };
  }

  /**
   * Check if directory is a Git repository
   */
  private async isGitRepo(): Promise<boolean> {
    try {
      await this.execGit('rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current commit hash
   */
  private async getCurrentCommit(): Promise<string> {
    const hash = await this.execGit('rev-parse HEAD');
    return hash.trim();
  }

  /**
   * Get changes for a commit
   */
  private async getCommitChanges(hash: string): Promise<ChangeSet[]> {
    try {
      const diff = await this.execGit(`diff-tree --no-commit-id --name-status -r ${hash}`);

      const changes: ChangeSet[] = [];
      const lines = diff.trim().split('\n').filter((l) => l);

      for (const line of lines) {
        const [status, path] = line.split('\t');

        let type: 'add' | 'modify' | 'delete';
        let description: string;

        switch (status) {
          case 'A':
            type = 'add';
            description = `Added ${path}`;
            break;
          case 'M':
            type = 'modify';
            description = `Modified ${path}`;
            break;
          case 'D':
            type = 'delete';
            description = `Deleted ${path}`;
            break;
          default:
            continue;
        }

        changes.push({ type, path, description });
      }

      return changes;
    } catch {
      return [];
    }
  }

  /**
   * Create .gitignore file
   */
  private async createGitIgnore(): Promise<void> {
    const gitignore = `# Sound Designer
node_modules/
dist/
build/
*.log
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.bak
*.swp

# User settings
.vscode/
.idea/
*.user
`;

    // In Electron, we would write this to the file system
    // For now, just execute git add
    await this.execGit('add .gitignore');
  }

  /**
   * Execute Git command
   */
  private async execGit(command: string): Promise<string> {
    // In production, this would use Node's child_process to execute Git
    // For this implementation, we'll simulate with IPC to main process

    return new Promise((resolve, reject) => {
      // Simulate git command execution
      // In real implementation, use Electron IPC:
      // window.electronAPI.execGit(this.projectPath, command)

      // For now, return mock data
      setTimeout(() => {
        resolve('');
      }, 100);
    });
  }
}

export default VersionControlService;
