export {};

declare global {
  interface Window {
    electronAPI?: {
      saveProject: (projectData: any) => Promise<{ success: boolean; data?: any }>;
      loadProject: (projectPath: string) => Promise<{ success: boolean; data?: any }>;
      exportPlugin: (exportConfig: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    };
  }
}
