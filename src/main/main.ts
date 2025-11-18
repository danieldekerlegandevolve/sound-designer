import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import {
  initFileSystem,
  saveProject,
  loadProject,
  getRecentProjects,
  exportProjectJSON,
  importProjectJSON,
  saveAsTemplate,
  getTemplates,
  createFromTemplate,
} from './fileSystem';
import { exportPlugin } from './exportSystem';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a1a',
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initFileSystem();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers

// Project file operations
ipcMain.handle('save-project', async (_, projectData, filePath?: string) => {
  try {
    const savedPath = await saveProject(projectData, filePath);
    return { success: true, path: savedPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-project', async (_, filePath?: string) => {
  try {
    const { project, path: loadedPath } = await loadProject(filePath);
    return { success: true, data: project, path: loadedPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-recent-projects', async () => {
  try {
    const recent = await getRecentProjects();
    return { success: true, data: recent };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-project-json', async (_, projectData) => {
  try {
    const path = await exportProjectJSON(projectData);
    return { success: true, path };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-project-json', async () => {
  try {
    const project = await importProjectJSON();
    return { success: true, data: project };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Template operations
ipcMain.handle('save-as-template', async (_, projectData, templateName) => {
  try {
    await saveAsTemplate(projectData, templateName);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-templates', async () => {
  try {
    const templates = await getTemplates();
    return { success: true, data: templates };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-from-template', async (_, templateName) => {
  try {
    const project = await createFromTemplate(templateName);
    return { success: true, data: project };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Plugin export
ipcMain.handle('export-plugin', async (_, exportConfig) => {
  try {
    const result = await exportPlugin(exportConfig);
    return { success: true, path: result.outputPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get app paths
ipcMain.handle('get-app-path', async (_, name: string) => {
  try {
    return { success: true, path: app.getPath(name as any) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
