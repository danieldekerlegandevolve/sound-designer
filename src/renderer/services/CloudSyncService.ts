import { PluginProject } from '@shared/types';

/**
 * Cloud Sync Service
 * Handles synchronization of presets and projects to cloud storage
 * Supports multiple cloud providers (AWS S3, Firebase, custom backend)
 */

export interface CloudConfig {
  provider: 'firebase' | 'supabase' | 'custom';
  apiKey?: string;
  apiUrl?: string;
  bucket?: string;
  region?: string;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSync?: Date;
  pendingChanges: number;
  error?: string;
}

export interface CloudPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  version: string;
  downloads: number;
  rating: number;
  ratingCount: number;
  isPublic: boolean;
  isFavorite?: boolean;
  createdAt: Date;
  updatedAt: Date;
  data: any; // Preset data
}

export interface SyncConflict {
  presetId: string;
  localVersion: CloudPreset;
  remoteVersion: CloudPreset;
  conflictType: 'modified' | 'deleted' | 'renamed';
}

export class CloudSyncService {
  private config: CloudConfig;
  private syncStatus: SyncStatus = {
    isSyncing: false,
    pendingChanges: 0,
  };
  private syncInterval?: NodeJS.Timeout;
  private listeners: Map<string, Set<Function>> = new Map();
  private userId?: string;

  constructor(config: CloudConfig) {
    this.config = config;
  }

  /**
   * Initialize cloud sync
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;

    try {
      // Validate connection
      await this.validateConnection();

      // Load sync status
      await this.loadSyncStatus();

      // Start auto-sync
      this.startAutoSync();

      console.log('Cloud sync initialized');
    } catch (error) {
      console.error('Failed to initialize cloud sync:', error);
      throw error;
    }
  }

  /**
   * Sync presets to cloud
   */
  async syncPresets(presets: CloudPreset[]): Promise<void> {
    if (this.syncStatus.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.updateSyncStatus({ isSyncing: true, error: undefined });

    try {
      // Get remote presets
      const remotePresets = await this.fetchRemotePresets();

      // Detect conflicts
      const conflicts = this.detectConflicts(presets, remotePresets);

      if (conflicts.length > 0) {
        // Emit conflict event
        this.emit('conflicts', conflicts);
        throw new Error(`${conflicts.length} conflicts detected`);
      }

      // Upload changed presets
      const changedPresets = this.getChangedPresets(presets, remotePresets);

      for (const preset of changedPresets) {
        await this.uploadPreset(preset);
      }

      // Download new remote presets
      const newRemotePresets = remotePresets.filter(
        (rp) => !presets.find((p) => p.id === rp.id)
      );

      for (const preset of newRemotePresets) {
        await this.downloadPreset(preset.id);
      }

      this.updateSyncStatus({
        isSyncing: false,
        lastSync: new Date(),
        pendingChanges: 0,
      });

      this.emit('syncComplete', { synced: changedPresets.length + newRemotePresets.length });
    } catch (error) {
      this.updateSyncStatus({
        isSyncing: false,
        error: (error as Error).message,
      });
      this.emit('syncError', error);
      throw error;
    }
  }

  /**
   * Upload a preset to cloud
   */
  async uploadPreset(preset: CloudPreset): Promise<void> {
    const endpoint = this.getEndpoint('/presets');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(preset),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload preset: ${response.statusText}`);
    }

    this.emit('presetUploaded', preset);
  }

  /**
   * Download a preset from cloud
   */
  async downloadPreset(presetId: string): Promise<CloudPreset> {
    const endpoint = this.getEndpoint(`/presets/${presetId}`);

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download preset: ${response.statusText}`);
    }

    const preset = await response.json();
    this.emit('presetDownloaded', preset);

    return preset;
  }

  /**
   * Fetch all remote presets
   */
  async fetchRemotePresets(): Promise<CloudPreset[]> {
    const endpoint = this.getEndpoint(`/users/${this.userId}/presets`);

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch presets: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a preset from cloud
   */
  async deletePreset(presetId: string): Promise<void> {
    const endpoint = this.getEndpoint(`/presets/${presetId}`);

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete preset: ${response.statusText}`);
    }

    this.emit('presetDeleted', { presetId });
  }

  /**
   * Share a preset with others
   */
  async sharePreset(presetId: string, userIds: string[]): Promise<void> {
    const endpoint = this.getEndpoint(`/presets/${presetId}/share`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({ userIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to share preset: ${response.statusText}`);
    }

    this.emit('presetShared', { presetId, userIds });
  }

  /**
   * Make a preset public
   */
  async makePresetPublic(presetId: string, isPublic: boolean): Promise<void> {
    const endpoint = this.getEndpoint(`/presets/${presetId}/visibility`);

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({ isPublic }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update preset visibility: ${response.statusText}`);
    }

    this.emit('presetVisibilityChanged', { presetId, isPublic });
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Resolve sync conflict
   */
  async resolveConflict(
    conflict: SyncConflict,
    resolution: 'useLocal' | 'useRemote' | 'merge'
  ): Promise<void> {
    switch (resolution) {
      case 'useLocal':
        await this.uploadPreset(conflict.localVersion);
        break;
      case 'useRemote':
        await this.downloadPreset(conflict.remoteVersion.id);
        break;
      case 'merge':
        // Implement custom merge logic
        const merged = this.mergePresets(conflict.localVersion, conflict.remoteVersion);
        await this.uploadPreset(merged);
        break;
    }

    this.emit('conflictResolved', { conflict, resolution });
  }

  /**
   * Start auto-sync
   */
  private startAutoSync(intervalMs: number = 60000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      // Auto-sync will be triggered by the UI when presets change
      this.emit('autoSyncTick');
    }, intervalMs);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  /**
   * Validate cloud connection
   */
  private async validateConnection(): Promise<void> {
    const endpoint = this.getEndpoint('/health');

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to connect to cloud service');
    }
  }

  /**
   * Load sync status from storage
   */
  private async loadSyncStatus(): Promise<void> {
    try {
      const stored = localStorage.getItem('cloudSyncStatus');
      if (stored) {
        const status = JSON.parse(stored);
        this.syncStatus = {
          ...status,
          lastSync: status.lastSync ? new Date(status.lastSync) : undefined,
          isSyncing: false, // Always reset syncing state
        };
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }

  /**
   * Update sync status
   */
  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };

    // Save to storage
    localStorage.setItem('cloudSyncStatus', JSON.stringify(this.syncStatus));

    // Emit event
    this.emit('statusChanged', this.syncStatus);
  }

  /**
   * Detect conflicts between local and remote presets
   */
  private detectConflicts(
    localPresets: CloudPreset[],
    remotePresets: CloudPreset[]
  ): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    for (const local of localPresets) {
      const remote = remotePresets.find((r) => r.id === local.id);

      if (remote) {
        // Check if both were modified since last sync
        if (
          local.updatedAt > (this.syncStatus.lastSync || new Date(0)) &&
          remote.updatedAt > (this.syncStatus.lastSync || new Date(0))
        ) {
          conflicts.push({
            presetId: local.id,
            localVersion: local,
            remoteVersion: remote,
            conflictType: 'modified',
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Get presets that have changed since last sync
   */
  private getChangedPresets(
    localPresets: CloudPreset[],
    remotePresets: CloudPreset[]
  ): CloudPreset[] {
    return localPresets.filter((local) => {
      const remote = remotePresets.find((r) => r.id === local.id);

      if (!remote) {
        return true; // New preset
      }

      return local.updatedAt > remote.updatedAt;
    });
  }

  /**
   * Merge two preset versions
   */
  private mergePresets(local: CloudPreset, remote: CloudPreset): CloudPreset {
    // Simple merge strategy: prefer local changes but keep remote metadata
    return {
      ...local,
      downloads: remote.downloads,
      rating: remote.rating,
      ratingCount: remote.ratingCount,
      updatedAt: new Date(),
    };
  }

  /**
   * Get API endpoint
   */
  private getEndpoint(path: string): string {
    const baseUrl = this.config.apiUrl || 'https://api.sounddesigner.com';
    return `${baseUrl}${path}`;
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string {
    // In production, this would retrieve the actual auth token
    return this.config.apiKey || localStorage.getItem('authToken') || '';
  }

  /**
   * Event system
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopAutoSync();
    this.listeners.clear();
  }
}

export default CloudSyncService;
