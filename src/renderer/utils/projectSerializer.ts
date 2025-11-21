import { PluginProject } from '@shared/types';

/**
 * Sanitizes a project object for IPC transfer by removing non-serializable data
 * This ensures the project can be passed through Electron IPC without errors
 */
export function sanitizeProjectForIPC(project: PluginProject): PluginProject {
  // Create a deep copy and remove any non-serializable data
  const sanitized = JSON.parse(JSON.stringify(project));
  return sanitized;
}

/**
 * Strips functions and other non-serializable objects from any object
 */
export function deepSerialize<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'function') {
    return undefined as any;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSerialize) as any;
  }

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as any)[key];
      if (typeof value !== 'function') {
        result[key] = deepSerialize(value);
      }
    }
  }

  return result;
}
