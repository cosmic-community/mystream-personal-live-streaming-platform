import type { 
  WebSocketMessage, 
  ChatWebSocketMessage, 
  ViewerCountMessage, 
  StreamStatusMessage,
  MessageType 
} from '@/types';

// Server-side WebSocket manager for Node.js environment
let WebSocketServer: any;
if (typeof window === 'undefined') {
  try {
    WebSocketServer = require('ws').WebSocketServer;
  } catch (e) {
    // WebSocket server not available
  }
}

// WebSocket connection manager
class WebSocketManager {
  private connections = new Map<string, Set<any>>();
  private viewerCounts = new Map<string, number>();

  public addConnection(streamId: string, ws: any): void {
    if (!this.connections.has(streamId)) {
      this.connections.set(streamId, new Set());
    }

    this.connections.get(streamId)!.add(ws);
    this.updateViewerCount(streamId);

    ws.on('close', () => {
      this.removeConnection(streamId, ws);
    });

    ws.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.removeConnection(streamId, ws);
    });
  }

  public removeConnection(streamId: string, ws: any): void {
    const connections = this.connections.get(streamId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.connections.delete(streamId);
        this.viewerCounts.delete(streamId);
      } else {
        this.updateViewerCount(streamId);
      }
    }
  }

  private updateViewerCount(streamId: string): void {
    const connections = this.connections.get(streamId);
    const count = connections ? connections.size : 0;
    this.viewerCounts.set(streamId, count);

    // Broadcast viewer count to all connections
    this.broadcastToStream(streamId, {
      type: 'viewer_count',
      data: { count },
      timestamp: new Date().toISOString()
    });
  }

  public broadcastToStream(streamId: string, message: WebSocketMessage): void {
    const connections = this.connections.get(streamId);
    if (!connections) return;

    const messageString = JSON.stringify(message);
    
    connections.forEach((ws) => {
      if (ws.readyState === 1) { // OPEN state
        try {
          ws.send(messageString);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          this.removeConnection(streamId, ws);
        }
      }
    });
  }

  public getViewerCount(streamId: string): number {
    return this.viewerCounts.get(streamId) || 0;
  }

  public getStreamIds(): string[] {
    return Array.from(this.connections.keys());
  }
}

export const wsManager = new WebSocketManager();

// Message creators
export function createChatMessage(
  viewerName: string,
  message: string,
  messageType: MessageType = 'regular'
): ChatWebSocketMessage {
  return {
    type: 'chat',
    data: {
      message,
      viewer_name: viewerName,
      message_type: messageType
    },
    timestamp: new Date().toISOString()
  };
}

export function createViewerCountMessage(count: number): ViewerCountMessage {
  return {
    type: 'viewer_count',
    data: { count },
    timestamp: new Date().toISOString()
  };
}

export function createStreamStatusMessage(
  streamId: string,
  status: string
): StreamStatusMessage {
  return {
    type: 'stream_status',
    data: {
      status: status as any,
      stream_id: streamId
    },
    timestamp: new Date().toISOString()
  };
}

// Client-side WebSocket utilities
export function createWebSocketConnection(
  streamId: string,
  onMessage: (message: WebSocketMessage) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket | null {
  if (typeof window === 'undefined') {
    return null; // Server-side, no WebSocket
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || `${protocol}//${host}/api/ws`;
    
    const ws = new WebSocket(`${wsUrl}?streamId=${streamId}`);

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      onClose?.(event);
    };

    return ws;
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    return null;
  }
}

export function sendChatMessage(
  ws: WebSocket,
  viewerName: string,
  message: string,
  messageType: MessageType = 'regular'
): void {
  if (ws.readyState === WebSocket.OPEN) {
    const chatMessage = createChatMessage(viewerName, message, messageType);
    ws.send(JSON.stringify(chatMessage));
  }
}

// Validation and sanitization
export function sanitizeMessage(message: string): string {
  return message
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .substring(0, 500); // Limit length
}

export function validateViewerName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 50 && /^[a-zA-Z0-9_-\s]+$/.test(name);
}

export function isValidMessageType(type: string): type is MessageType {
  return ['regular', 'system', 'moderator'].includes(type);
}