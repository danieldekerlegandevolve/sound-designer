import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Project file operations
  saveProject: (projectData: any, filePath?: string) =>
    ipcRenderer.invoke('save-project', projectData, filePath),
  loadProject: (filePath?: string) =>
    ipcRenderer.invoke('load-project', filePath),
  getRecentProjects: () =>
    ipcRenderer.invoke('get-recent-projects'),
  exportProjectJSON: (projectData: any) =>
    ipcRenderer.invoke('export-project-json', projectData),
  importProjectJSON: () =>
    ipcRenderer.invoke('import-project-json'),

  // Template operations
  saveAsTemplate: (projectData: any, templateName: string) =>
    ipcRenderer.invoke('save-as-template', projectData, templateName),
  getTemplates: () =>
    ipcRenderer.invoke('get-templates'),
  createFromTemplate: (templateName: string) =>
    ipcRenderer.invoke('create-from-template', templateName),

  // Plugin export
  exportPlugin: (exportConfig: any) =>
    ipcRenderer.invoke('export-plugin', exportConfig),

  // System
  getAppPath: (name: string) =>
    ipcRenderer.invoke('get-app-path', name),

  // Plugin database
  savePluginToDB: (pluginProject: any) =>
    ipcRenderer.invoke('save-plugin-to-db', pluginProject),
  getPluginFromDB: (id: string) =>
    ipcRenderer.invoke('get-plugin-from-db', id),
  listPlugins: (options?: any) =>
    ipcRenderer.invoke('list-plugins', options),
  deletePluginFromDB: (id: string) =>
    ipcRenderer.invoke('delete-plugin-from-db', id),
  searchPlugins: (query: string) =>
    ipcRenderer.invoke('search-plugins', query),
  getAllTags: () =>
    ipcRenderer.invoke('get-all-tags'),
});
