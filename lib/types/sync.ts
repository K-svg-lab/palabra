/**
 * Type definitions for cloud synchronization
 * Handles sync operations, conflict resolution, and device management
 */

/**
 * Sync status
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'conflict' | 'skipped';

/**
 * Sync direction
 */
export type SyncDirection = 'upload' | 'download' | 'bidirectional';

/**
 * Sync type
 */
export type SyncType = 'full' | 'incremental' | 'force';

/**
 * Conflict resolution strategy
 */
export type ConflictResolution = 'local' | 'remote' | 'newest' | 'manual';

/**
 * Entity type for sync
 */
export type SyncEntityType = 'vocabulary' | 'review' | 'session' | 'stats' | 'tag' | 'settings';

/**
 * Base syncable item interface
 */
export interface SyncableItem {
  id: string;
  version: number;
  lastSyncedAt: Date | string;
  updatedAt: Date | string;
  isDeleted: boolean;
}

/**
 * Sync operation
 */
export interface SyncOperation {
  id: string;
  entityType: SyncEntityType;
  operation: 'create' | 'update' | 'delete';
  localVersion?: number;
  remoteVersion?: number;
  data: any;
  timestamp: Date | string;
}

/**
 * Sync conflict
 */
export interface SyncConflict {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  localData: any;
  remoteData: any;
  localVersion: number;
  remoteVersion: number;
  localTimestamp: Date | string;
  remoteTimestamp: Date | string;
  suggestedResolution: ConflictResolution;
}

/**
 * Sync result
 */
export interface SyncResult {
  status: SyncStatus;
  syncType: SyncType;
  direction: SyncDirection;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  
  // Statistics
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: number;
  
  // Details
  conflictDetails?: SyncConflict[];
  errorDetails?: SyncError[];
  
  // Device info
  deviceId: string;
  deviceName: string;
}

/**
 * Sync error
 */
export interface SyncError {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  error: string;
  timestamp: Date | string;
}

/**
 * Sync state
 */
export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncStatus: SyncStatus;
  pendingOperations: number;
  errors: SyncError[];
  conflicts: SyncConflict[];
}

/**
 * Device information
 */
export interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  browser?: string;
  lastActiveAt: Date | string;
  lastSyncAt?: Date | string;
  appVersion?: string;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  conflictResolution: ConflictResolution;
  syncOnStartup: boolean;
  syncOnNetworkChange: boolean;
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

/**
 * Sync request payload
 */
export interface SyncRequest {
  deviceId: string;
  deviceName: string;
  syncType: SyncType;
  lastSyncTime?: Date | string;
  operations: SyncOperation[];
}

/**
 * Sync response payload
 */
export interface SyncResponse {
  success: boolean;
  syncId: string;
  timestamp: Date | string;
  operations: SyncOperation[];
  conflicts: SyncConflict[];
  errors: SyncError[];
  nextSyncTime?: Date | string;
}

/**
 * Delta change for incremental sync
 */
export interface DeltaChange<T = any> {
  entityType: SyncEntityType;
  entityId: string;
  changeType: 'create' | 'update' | 'delete';
  oldValue?: T;
  newValue?: T;
  timestamp: Date | string;
  version: number;
}

/**
 * Sync queue item
 */
export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  attempts: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  error?: string;
}

/**
 * Background sync registration
 */
export interface BackgroundSyncConfig {
  tag: string;
  options?: {
    minInterval?: number;
    maxAttempts?: number;
  };
}

/**
 * Offline queue manager interface
 */
export interface OfflineQueueManager {
  enqueue(item: SyncQueueItem): Promise<void>;
  dequeue(): Promise<SyncQueueItem | null>;
  clear(): Promise<void>;
  size(): Promise<number>;
  getAll(): Promise<SyncQueueItem[]>;
}

/**
 * Sync service interface
 */
export interface SyncService {
  // Core sync operations
  sync(type?: SyncType): Promise<SyncResult>;
  syncEntity(entityType: SyncEntityType, entityId: string): Promise<void>;
  
  // Conflict resolution
  resolveConflict(conflict: SyncConflict, resolution: ConflictResolution): Promise<void>;
  resolveAllConflicts(resolution: ConflictResolution): Promise<void>;
  
  // Queue management
  getPendingOperations(): Promise<SyncQueueItem[]>;
  clearPendingOperations(): Promise<void>;
  
  // State management
  getState(): Promise<SyncState>;
  getLastSyncTime(): Promise<Date | null>;
  
  // Device management
  getDevices(): Promise<DeviceInfo[]>;
  removeDevice(deviceId: string): Promise<void>;
  
  // Configuration
  getConfig(): Promise<SyncConfig>;
  updateConfig(config: Partial<SyncConfig>): Promise<void>;
}

/**
 * Delta calculator for change detection
 */
export interface DeltaCalculator {
  calculateDeltas<T extends SyncableItem>(
    local: T[],
    remote: T[],
    entityType: SyncEntityType
  ): {
    toUpload: DeltaChange[];
    toDownload: DeltaChange[];
    conflicts: SyncConflict[];
  };
  
  detectConflicts<T extends SyncableItem>(
    localItem: T,
    remoteItem: T,
    entityType: SyncEntityType
  ): SyncConflict | null;
}

/**
 * Sync event types
 */
export type SyncEventType = 
  | 'sync:start'
  | 'sync:progress'
  | 'sync:complete'
  | 'sync:error'
  | 'sync:conflict'
  | 'sync:online'
  | 'sync:offline';

/**
 * Sync event payload
 */
export interface SyncEvent {
  type: SyncEventType;
  timestamp: Date;
  data?: any;
}

/**
 * Sync event listener
 */
export type SyncEventListener = (event: SyncEvent) => void;

/**
 * Network status
 */
export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string; // 'slow-2g' | '2g' | '3g' | '4g'
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

