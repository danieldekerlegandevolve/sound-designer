import fs from 'fs/promises';
import path from 'path';
import { app, dialog } from 'electron';
import { PluginProject } from '@shared/types';

const PROJECTS_DIR = path.join(app.getPath('userData'), 'projects');
const TEMPLATES_DIR = path.join(app.getPath('userData'), 'templates');
const RECENT_PROJECTS_FILE = path.join(app.getPath('userData'), 'recent-projects.json');
const MAX_RECENT_PROJECTS = 10;

// Ensure directories exist
export async function initFileSystem() {
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
  await fs.mkdir(TEMPLATES_DIR, { recursive: true });
}

// Save project to file
export async function saveProject(project: PluginProject, filePath?: string): Promise<string> {
  let targetPath = filePath;

  if (!targetPath) {
    // Show save dialog
    const result = await dialog.showSaveDialog({
      title: 'Save Plugin Project',
      defaultPath: path.join(PROJECTS_DIR, `${project.name}.sdproj`),
      filters: [
        { name: 'Sound Designer Project', extensions: ['sdproj'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      throw new Error('Save canceled');
    }

    targetPath = result.filePath;
  }

  // Add metadata
  const projectData = {
    ...project,
    metadata: {
      version: '1.0.0',
      createdAt: project.metadata?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      application: 'Sound Designer',
    },
  };

  // Save to file
  await fs.writeFile(targetPath, JSON.stringify(projectData, null, 2), 'utf-8');

  // Update recent projects
  await addToRecentProjects(targetPath, project.name);

  return targetPath;
}

// Load project from file
export async function loadProject(filePath?: string): Promise<{ project: PluginProject; path: string }> {
  let targetPath = filePath;

  if (!targetPath) {
    // Show open dialog
    const result = await dialog.showOpenDialog({
      title: 'Open Plugin Project',
      defaultPath: PROJECTS_DIR,
      filters: [
        { name: 'Sound Designer Project', extensions: ['sdproj'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      throw new Error('Open canceled');
    }

    targetPath = result.filePaths[0];
  }

  // Read file
  const fileContent = await fs.readFile(targetPath, 'utf-8');
  const project = JSON.parse(fileContent) as PluginProject;

  // Update recent projects
  await addToRecentProjects(targetPath, project.name);

  return { project, path: targetPath };
}

// Get recent projects with full project data
export async function getRecentProjects(): Promise<Array<{ path: string; name: string; updatedAt: string; lastOpened: number; project: PluginProject }>> {
  try {
    const content = await fs.readFile(RECENT_PROJECTS_FILE, 'utf-8');
    const recentPaths = JSON.parse(content) as Array<{ path: string; name: string; updatedAt: string }>;

    const projectsWithData = await Promise.all(
      recentPaths.map(async (item) => {
        try {
          const fileContent = await fs.readFile(item.path, 'utf-8');
          const project = JSON.parse(fileContent) as PluginProject;
          return {
            ...item,
            project,
            lastOpened: new Date(item.updatedAt).getTime(),
          };
        } catch (error) {
          console.warn(`Failed to load project: ${item.path}`, error);
          return null;
        }
      })
    );

    return projectsWithData.filter(Boolean) as Array<{ path: string; name: string; updatedAt: string; lastOpened: number; project: PluginProject }>;
  } catch (error) {
    return [];
  }
}

// Add to recent projects
async function addToRecentProjects(filePath: string, name: string) {
  // Read the recent projects metadata (not full data)
  let recent: Array<{ path: string; name: string; updatedAt: string }> = [];
  try {
    const content = await fs.readFile(RECENT_PROJECTS_FILE, 'utf-8');
    recent = JSON.parse(content);
  } catch (error) {
    // File doesn't exist yet, start with empty array
  }

  // Remove if already exists
  const filtered = recent.filter((item) => item.path !== filePath);

  // Add to beginning
  filtered.unshift({
    path: filePath,
    name,
    updatedAt: new Date().toISOString(),
  });

  // Keep only max recent
  const trimmed = filtered.slice(0, MAX_RECENT_PROJECTS);

  // Save
  await fs.writeFile(RECENT_PROJECTS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}

// Export project as JSON
export async function exportProjectJSON(project: PluginProject): Promise<string> {
  const result = await dialog.showSaveDialog({
    title: 'Export Project as JSON',
    defaultPath: `${project.name}.json`,
    filters: [
      { name: 'JSON File', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    throw new Error('Export canceled');
  }

  await fs.writeFile(result.filePath, JSON.stringify(project, null, 2), 'utf-8');
  return result.filePath;
}

// Import project from JSON
export async function importProjectJSON(): Promise<PluginProject> {
  const result = await dialog.showOpenDialog({
    title: 'Import Project from JSON',
    filters: [
      { name: 'JSON File', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    throw new Error('Import canceled');
  }

  const content = await fs.readFile(result.filePaths[0], 'utf-8');
  return JSON.parse(content) as PluginProject;
}

// Save as template
export async function saveAsTemplate(project: PluginProject, templateName: string): Promise<void> {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.sdtemplate`);

  const template = {
    ...project,
    id: '', // Clear ID for template
    name: templateName,
    metadata: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      isTemplate: true,
    },
  };

  await fs.writeFile(templatePath, JSON.stringify(template, null, 2), 'utf-8');
}

// Get all templates
export async function getTemplates(): Promise<PluginProject[]> {
  try {
    const files = await fs.readdir(TEMPLATES_DIR);
    const templates: PluginProject[] = [];

    for (const file of files) {
      if (file.endsWith('.sdtemplate')) {
        const content = await fs.readFile(path.join(TEMPLATES_DIR, file), 'utf-8');
        templates.push(JSON.parse(content));
      }
    }

    return templates;
  } catch (error) {
    return [];
  }
}

// Create project from template
export async function createFromTemplate(templateName: string): Promise<PluginProject> {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.sdtemplate`);
  const content = await fs.readFile(templatePath, 'utf-8');
  const template = JSON.parse(content) as PluginProject;

  // Generate new ID
  const { nanoid } = await import('nanoid');
  return {
    ...template,
    id: nanoid(),
    name: 'New Plugin',
  };
}

// Auto-save functionality
export class AutoSaver {
  private timer: NodeJS.Timeout | null = null;
  private interval: number;
  private saveCallback: () => Promise<void>;

  constructor(intervalMinutes: number, saveCallback: () => Promise<void>) {
    this.interval = intervalMinutes * 60 * 1000;
    this.saveCallback = saveCallback;
  }

  start() {
    this.stop();
    this.timer = setInterval(() => {
      this.saveCallback().catch(console.error);
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async saveNow() {
    await this.saveCallback();
  }
}
