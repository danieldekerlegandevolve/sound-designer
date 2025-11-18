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
});
