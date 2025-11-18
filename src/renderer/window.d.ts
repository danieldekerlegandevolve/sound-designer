export {};

declare global {
  interface Window {
    electronAPI?: {
      // Project file operations
      saveProject: (projectData: any, filePath?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      loadProject: (filePath?: string) => Promise<{ success: boolean; data?: any; path?: string; error?: string }>;
      getRecentProjects: () => Promise<{ success: boolean; data?: any; error?: string }>;
      exportProjectJSON: (projectData: any) => Promise<{ success: boolean; path?: string; error?: string }>;
      importProjectJSON: () => Promise<{ success: boolean; data?: any; error?: string }>;

      // Template operations
      saveAsTemplate: (projectData: any, templateName: string) => Promise<{ success: boolean; error?: string }>;
      getTemplates: () => Promise<{ success: boolean; data?: any; error?: string }>;
      createFromTemplate: (templateName: string) => Promise<{ success: boolean; data?: any; error?: string }>;

      // Plugin export
      exportPlugin: (exportConfig: any) => Promise<{ success: boolean; path?: string; error?: string }>;

      // System
      getAppPath: (name: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    };
  }
}
