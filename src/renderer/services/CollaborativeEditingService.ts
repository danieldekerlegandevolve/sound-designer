import { PluginProject } from '@shared/types';

/**
 * Collaborative Editing Service
 * Real-time collaborative editing with WebSocket synchronization
 * Based on Operational Transformation (OT) for conflict-free editing
 */

export interface CollaborationSession {
  id: string;
  projectId: string;
  host: User;
  participants: User[];
  createdAt: Date;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: string[]; // Selected node IDs
}

export interface EditOperation {
  id: string;
  type: 'add' | 'delete' | 'update' | 'move';
  userId: string;
  timestamp: Date;
  path: string[]; // Path to the modified property
  value?: any;
  previousValue?: any;
}

export interface Cursor {
  userId: string;
  position: { x: number; y: number };
  color: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

export class CollaborativeEditingService {
  private ws?: WebSocket;
  private session?: CollaborationSession;
  private currentUser?: User;
  private pendingOperations: EditOperation[] = [];
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  constructor(private wsUrl: string = 'wss://api.sounddesigner.com/collab') {}

  /**
   * Create a new collaboration session
   */
  async createSession(projectId: string, user: User): Promise<CollaborationSession> {
    this.currentUser = user;

    const response = await fetch(`${this.getApiUrl()}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({ projectId, user }),
    });

    if (!response.ok) {
      throw new Error('Failed to create collaboration session');
    }

    this.session = await response.json();

    // Connect to WebSocket
    await this.connect(this.session.id);

    return this.session;
  }

  /**
   * Join an existing collaboration session
   */
  async joinSession(sessionId: string, user: User): Promise<CollaborationSession> {
    this.currentUser = user;

    const response = await fetch(`${this.getApiUrl()}/sessions/${sessionId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({ user }),
    });

    if (!response.ok) {
      throw new Error('Failed to join collaboration session');
    }

    this.session = await response.json();

    // Connect to WebSocket
    await this.connect(sessionId);

    return this.session;
  }

  /**
   * Leave the current session
   */
  async leaveSession(): Promise<void> {
    if (!this.session) {
      return;
    }

    const response = await fetch(
      `${this.getApiUrl()}/sessions/${this.session.id}/leave`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ userId: this.currentUser?.id }),
      }
    );

    if (!response.ok) {
      console.error('Failed to leave session');
    }

    this.disconnect();
    this.session = undefined;
  }

  /**
   * Send an edit operation
   */
  sendOperation(operation: Omit<EditOperation, 'id' | 'userId' | 'timestamp'>): void {
    if (!this.isConnected || !this.currentUser) {
      console.warn('Not connected to collaboration session');
      return;
    }

    const fullOperation: EditOperation = {
      ...operation,
      id: this.generateId(),
      userId: this.currentUser.id,
      timestamp: new Date(),
    };

    this.send({
      type: 'operation',
      payload: fullOperation,
    });

    // Add to pending operations
    this.pendingOperations.push(fullOperation);

    this.emit('operationSent', fullOperation);
  }

  /**
   * Update cursor position
   */
  updateCursor(position: { x: number; y: number }): void {
    if (!this.isConnected || !this.currentUser) {
      return;
    }

    this.send({
      type: 'cursor',
      payload: {
        userId: this.currentUser.id,
        position,
        color: this.currentUser.color,
      },
    });
  }

  /**
   * Update selection
   */
  updateSelection(nodeIds: string[]): void {
    if (!this.isConnected || !this.currentUser) {
      return;
    }

    this.send({
      type: 'selection',
      payload: {
        userId: this.currentUser.id,
        selection: nodeIds,
      },
    });
  }

  /**
   * Send a chat message
   */
  sendMessage(message: string): void {
    if (!this.isConnected || !this.currentUser) {
      return;
    }

    const chatMessage: ChatMessage = {
      id: this.generateId(),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      message,
      timestamp: new Date(),
    };

    this.send({
      type: 'chat',
      payload: chatMessage,
    });
  }

  /**
   * Get active participants
   */
  getParticipants(): User[] {
    return this.session?.participants || [];
  }

  /**
   * Check if connected
   */
  isSessionActive(): boolean {
    return this.isConnected && !!this.session;
  }

  /**
   * Connect to WebSocket
   */
  private async connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.wsUrl}/${sessionId}?token=${this.getAuthToken()}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to collaboration session');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Send join message
        this.send({
          type: 'join',
          payload: {
            user: this.currentUser,
          },
        });

        this.emit('connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.emit('disconnected');

        // Attempt to reconnect
        this.attemptReconnect(sessionId);
      };
    });
  }

  /**
   * Disconnect from WebSocket
   */
  private disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.isConnected = false;
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(sessionId: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;

    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(sessionId).catch((error) => {
        console.error('Reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * Send message through WebSocket
   */
  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not open, message not sent');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'operation':
          this.handleOperation(message.payload);
          break;

        case 'cursor':
          this.handleCursor(message.payload);
          break;

        case 'selection':
          this.handleSelection(message.payload);
          break;

        case 'chat':
          this.handleChat(message.payload);
          break;

        case 'userJoined':
          this.handleUserJoined(message.payload);
          break;

        case 'userLeft':
          this.handleUserLeft(message.payload);
          break;

        case 'ack':
          this.handleAcknowledgement(message.payload);
          break;

        case 'error':
          this.handleError(message.payload);
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }

  /**
   * Handle operation from other users
   */
  private handleOperation(operation: EditOperation): void {
    // Don't process our own operations
    if (operation.userId === this.currentUser?.id) {
      return;
    }

    // Apply operational transformation if needed
    const transformedOp = this.transformOperation(operation);

    this.emit('operationReceived', transformedOp);
  }

  /**
   * Handle cursor update
   */
  private handleCursor(cursor: Cursor): void {
    if (cursor.userId === this.currentUser?.id) {
      return;
    }

    this.emit('cursorMoved', cursor);
  }

  /**
   * Handle selection update
   */
  private handleSelection(data: { userId: string; selection: string[] }): void {
    if (data.userId === this.currentUser?.id) {
      return;
    }

    this.emit('selectionChanged', data);
  }

  /**
   * Handle chat message
   */
  private handleChat(message: ChatMessage): void {
    this.emit('messageReceived', message);
  }

  /**
   * Handle user joined
   */
  private handleUserJoined(user: User): void {
    if (this.session) {
      this.session.participants.push(user);
    }

    this.emit('userJoined', user);
  }

  /**
   * Handle user left
   */
  private handleUserLeft(userId: string): void {
    if (this.session) {
      this.session.participants = this.session.participants.filter((u) => u.id !== userId);
    }

    this.emit('userLeft', { userId });
  }

  /**
   * Handle acknowledgement
   */
  private handleAcknowledgement(data: { operationId: string }): void {
    // Remove acknowledged operation from pending
    this.pendingOperations = this.pendingOperations.filter((op) => op.id !== data.operationId);
  }

  /**
   * Handle error
   */
  private handleError(error: any): void {
    console.error('Collaboration error:', error);
    this.emit('error', error);
  }

  /**
   * Transform operation using OT
   */
  private transformOperation(operation: EditOperation): EditOperation {
    // Simple OT: Transform against pending operations
    let transformed = operation;

    for (const pending of this.pendingOperations) {
      if (pending.timestamp < operation.timestamp) {
        transformed = this.applyTransform(transformed, pending);
      }
    }

    return transformed;
  }

  /**
   * Apply transformation between two operations
   */
  private applyTransform(op1: EditOperation, op2: EditOperation): EditOperation {
    // Simplified OT - in production, use a proper OT library
    // This handles basic path transformations

    if (op1.path.join('.') === op2.path.join('.')) {
      // Same path - use timestamp to decide precedence
      if (op2.timestamp > op1.timestamp) {
        return op2;
      }
    }

    return op1;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get API URL
   */
  private getApiUrl(): string {
    return this.wsUrl.replace('wss://', 'https://').replace('/collab', '');
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
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
    this.disconnect();
    this.listeners.clear();
    this.pendingOperations = [];
  }
}

export default CollaborativeEditingService;
