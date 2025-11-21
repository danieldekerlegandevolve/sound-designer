import { PluginProject } from '@shared/types';

/**
 * Sanitizes a project object for IPC transfer by removing non-serializable data
 * This ensures the project can be passed through Electron IPC without errors
 */
export function sanitizeProjectForIPC(project: PluginProject): PluginProject {
  try {
    // Use structured clone if available (more reliable than JSON)
    if (typeof structuredClone !== 'undefined') {
      return structuredClone(project);
    }

    // Fallback to deep serialization
    return deepSerialize(project) as PluginProject;
  } catch (error) {
    console.error('Error sanitizing project, attempting deep clean:', error);
    // If all else fails, try JSON approach
    try {
      return JSON.parse(JSON.stringify(project));
    } catch (jsonError) {
      console.error('JSON serialization also failed:', jsonError);
      throw new Error('Unable to serialize project data. Please check for circular references or complex objects.');
    }
  }
}

/**
 * Deep serializes an object, handling edge cases that JSON.stringify misses
 */
export function deepSerialize<T>(obj: T): T {
  // Handle primitives
  if (obj === null || obj === undefined) {
    return obj;
  }

  const type = typeof obj;

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return obj;
  }

  if (type === 'function' || type === 'symbol') {
    return undefined as any;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }

  // Handle RegExp
  if (obj instanceof RegExp) {
    return obj.toString() as any;
  }

  // Handle Error objects
  if (obj instanceof Error) {
    return { message: obj.message, stack: obj.stack } as any;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deepSerialize(item)) as any;
  }

  // Handle plain objects
  if (type === 'object') {
    // Check if it's a plain object
    const proto = Object.getPrototypeOf(obj);
    if (proto !== null && proto !== Object.prototype) {
      // Not a plain object, try to extract data
      console.warn('Non-plain object detected, attempting to serialize:', obj);
    }

    const result: any = {};
    const seen = new WeakSet();

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as any)[key];

        // Skip functions
        if (typeof value === 'function') {
          continue;
        }

        // Handle circular references
        if (value && typeof value === 'object' && !seen.has(value)) {
          seen.add(value);
          result[key] = deepSerialize(value);
        } else if (value && typeof value === 'object' && seen.has(value)) {
          // Circular reference detected, skip
          console.warn(`Circular reference detected at key: ${key}`);
          continue;
        } else {
          result[key] = deepSerialize(value);
        }
      }
    }

    return result;
  }

  // Unknown type, return undefined
  console.warn('Unknown type detected:', type, obj);
  return undefined as any;
}

/**
 * Creates a plain object representation of the project
 * Ensures all nested objects are plain objects without prototypes
 */
export function toPlainObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toPlainObject) as any;
  }

  const plain: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as any)[key];
      if (typeof value !== 'function') {
        plain[key] = toPlainObject(value);
      }
    }
  }

  return plain;
}
