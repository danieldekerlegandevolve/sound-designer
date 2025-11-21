import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { PluginProject } from '../shared/types';

let db: Database.Database | null = null;

/**
 * Initialize the plugin database
 * Creates the database file and tables if they don't exist
 */
export function initPluginDatabase(): void {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'plugins.db');

  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create plugins table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      version TEXT NOT NULL DEFAULT '1.0.0',
      author TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      dsp_graph TEXT NOT NULL,
      ui_components TEXT NOT NULL,
      code TEXT NOT NULL,
      settings TEXT NOT NULL,
      tags TEXT
    )
  `);

  // Create index on name for faster searches
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_plugins_name ON plugins(name);
  `);

  // Create index on tags for filtering
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_plugins_tags ON plugins(tags);
  `);

  console.log('Plugin database initialized at:', dbPath);
}

/**
 * Close the database connection
 */
export function closePluginDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Save a plugin to the database
 * If a plugin with the same ID exists, it will be updated
 */
export function savePluginToDB(pluginProject: PluginProject): void {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO plugins (
      id, name, description, version, author,
      created_at, updated_at, dsp_graph, ui_components, code, settings, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      version = excluded.version,
      author = excluded.author,
      updated_at = excluded.updated_at,
      dsp_graph = excluded.dsp_graph,
      ui_components = excluded.ui_components,
      code = excluded.code,
      settings = excluded.settings,
      tags = excluded.tags
  `);

  stmt.run(
    pluginProject.id,
    pluginProject.name,
    pluginProject.description || '',
    pluginProject.version,
    pluginProject.author || '',
    now,
    now,
    JSON.stringify(pluginProject.dspGraph),
    JSON.stringify(pluginProject.uiComponents),
    JSON.stringify(pluginProject.code),
    JSON.stringify(pluginProject.settings),
    pluginProject.tags?.join(',') || ''
  );
}

/**
 * Get a plugin from the database by ID
 */
export function getPluginFromDB(id: string): PluginProject | null {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const stmt = db.prepare(`
    SELECT * FROM plugins WHERE id = ?
  `);

  const row = stmt.get(id) as any;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    author: row.author,
    dspGraph: JSON.parse(row.dsp_graph),
    uiComponents: JSON.parse(row.ui_components),
    code: JSON.parse(row.code),
    settings: JSON.parse(row.settings),
    tags: row.tags ? row.tags.split(',') : [],
  };
}

/**
 * List all plugins in the database
 */
export interface PluginListItem {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export function listPlugins(options?: {
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
}): PluginListItem[] {
  if (!db) {
    throw new Error('Database not initialized');
  }

  let query = 'SELECT id, name, description, version, author, created_at, updated_at, tags FROM plugins';
  const params: any[] = [];
  const conditions: string[] = [];

  // Add search filter
  if (options?.search) {
    conditions.push('(name LIKE ? OR description LIKE ? OR author LIKE ?)');
    const searchPattern = `%${options.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  // Add tag filter
  if (options?.tags && options.tags.length > 0) {
    const tagConditions = options.tags.map(() => 'tags LIKE ?').join(' OR ');
    conditions.push(`(${tagConditions})`);
    options.tags.forEach(tag => {
      params.push(`%${tag}%`);
    });
  }

  // Add WHERE clause if there are conditions
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Add sorting
  const sortBy = options?.sortBy || 'updated';
  const sortOrder = options?.sortOrder || 'desc';
  const sortColumn = sortBy === 'name' ? 'name' : sortBy === 'created' ? 'created_at' : 'updated_at';
  query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    author: row.author,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ? row.tags.split(',') : [],
  }));
}

/**
 * Delete a plugin from the database
 */
export function deletePluginFromDB(id: string): boolean {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const stmt = db.prepare('DELETE FROM plugins WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}

/**
 * Search plugins by name, description, or author
 */
export function searchPlugins(query: string): PluginListItem[] {
  return listPlugins({ search: query });
}

/**
 * Get all unique tags from the database
 */
export function getAllTags(): string[] {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const stmt = db.prepare('SELECT DISTINCT tags FROM plugins WHERE tags IS NOT NULL AND tags != ""');
  const rows = stmt.all() as any[];

  const tagsSet = new Set<string>();
  rows.forEach(row => {
    if (row.tags) {
      const tags = row.tags.split(',');
      tags.forEach((tag: string) => tagsSet.add(tag.trim()));
    }
  });

  return Array.from(tagsSet).sort();
}
