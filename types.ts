// Base Cosmic object interface
export interface CosmicObject {
  id: string;
  slug: string;
  title: string;
  content?: string;
  metadata: Record<string, any>;
  type: string;
  created_at: string;
  modified_at: string;
}

// Stream Sessions
export interface StreamSession extends CosmicObject {
  type: 'stream-sessions';
  metadata: {
    stream_title: string;
    description?: string;
    status: StreamStatus;
    stream_key?: string;
    mux_playback_id?: string;
    start_time?: string;
    end_time?: string;
    thumbnail?: {
      url: string;
      imgix_url: string;
    };
    recording_url?: string;
    viewer_count?: number;
    chat_enabled?: boolean;
    stream_quality?: StreamQuality;
    tags?: string;
  };
}

// Access Links
export interface AccessLink extends CosmicObject {
  type: 'access-links';
  metadata: {
    access_token: string;
    stream_session?: StreamSession;
    expiration_date?: string;
    permissions?: AccessPermission;
    generated_link?: string;
    usage_count?: number;
    last_accessed?: string;
    active?: boolean;
  };
}

// Stream Settings
export interface StreamSettings extends CosmicObject {
  type: 'stream-settings';
  metadata: {
    default_title_template?: string;
    default_description?: string;
    auto_record?: boolean;
    default_privacy?: PrivacyLevel;
    default_quality?: StreamQuality;
    default_chat_enabled?: boolean;
    overlay_settings?: {
      show_viewer_count?: boolean;
      show_chat?: boolean;
      overlay_position?: string;
      brand_logo?: boolean;
    };
    notification_settings?: {
      email_on_stream_start?: boolean;
      email_on_high_viewer_count?: boolean;
      viewer_threshold?: number;
      chat_moderation_alerts?: boolean;
    };
  };
}

// Chat Messages
export interface ChatMessage extends CosmicObject {
  type: 'chat-messages';
  metadata: {
    message_content: string;
    viewer_name: string;
    stream_session?: StreamSession;
    timestamp: string;
    message_type?: MessageType;
    viewer_ip?: string;
  };
}

// Type literals for select-dropdown values
export type StreamStatus = 'scheduled' | 'live' | 'ended' | 'private';
export type AccessPermission = 'view-only' | 'chat' | 'moderator';
export type PrivacyLevel = 'private' | 'unlisted' | 'public';
export type StreamQuality = '720p' | '1080p' | '4k';
export type MessageType = 'regular' | 'system' | 'moderator';

// API response types
export interface CosmicResponse<T> {
  objects: T[];
  total: number;
  limit?: number;
  skip?: number;
}

// Component prop types
export interface StreamCardProps {
  stream: StreamSession;
  onEdit?: (stream: StreamSession) => void;
  className?: string;
}

export interface ChatProps {
  streamId: string;
  viewerName?: string;
  isEnabled: boolean;
  permissions: AccessPermission;
}

export interface VideoPlayerProps {
  playbackId: string;
  title: string;
  isLive: boolean;
  onViewerCountChange?: (count: number) => void;
}

export interface AccessLinkFormData {
  permissions: AccessPermission;
  expiration_date?: string;
  stream_session_id: string;
}

export interface CreateStreamFormData {
  stream_title: string;
  description?: string;
  status: StreamStatus;
  start_time?: string;
  end_time?: string;
  chat_enabled?: boolean;
  stream_quality?: StreamQuality;
  tags?: string;
}

// Utility types
export type OptionalMetadata<T> = Partial<T['metadata']>;
export type CreateStreamData = Omit<StreamSession, 'id' | 'created_at' | 'modified_at'>;
export type CreateAccessLinkData = Omit<AccessLink, 'id' | 'created_at' | 'modified_at'>;

// Type guards for runtime validation
export function isStreamSession(obj: CosmicObject): obj is StreamSession {
  return obj.type === 'stream-sessions';
}

export function isAccessLink(obj: CosmicObject): obj is AccessLink {
  return obj.type === 'access-links';
}

export function isStreamSettings(obj: CosmicObject): obj is StreamSettings {
  return obj.type === 'stream-settings';
}

export function isChatMessage(obj: CosmicObject): obj is ChatMessage {
  return obj.type === 'chat-messages';
}

// Helper function for error handling
export function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'chat' | 'viewer_count' | 'stream_status' | 'system';
  data: any;
  timestamp: string;
}

export interface ChatWebSocketMessage extends WebSocketMessage {
  type: 'chat';
  data: {
    message: string;
    viewer_name: string;
    message_type: MessageType;
  };
}

export interface ViewerCountMessage extends WebSocketMessage {
  type: 'viewer_count';
  data: {
    count: number;
  };
}

export interface StreamStatusMessage extends WebSocketMessage {
  type: 'stream_status';
  data: {
    status: StreamStatus;
    stream_id: string;
  };
}