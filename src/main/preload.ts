import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (projectData: any) => ipcRenderer.invoke('save-project', projectData),
  loadProject: (projectPath: string) => ipcRenderer.invoke('load-project', projectPath),
  exportPlugin: (exportConfig: any) => ipcRenderer.invoke('export-plugin', exportConfig),
});
