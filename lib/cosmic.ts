import { createBucketClient } from '@cosmicjs/sdk'
import type { 
  StreamSession, 
  AccessLink, 
  StreamSettings, 
  ChatMessage, 
  CosmicResponse
} from '@/types'

export const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
  apiEnvironment: 'staging'
})

// Simple error helper for Cosmic SDK
function cosmicHasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// Stream Sessions API
export async function getStreamSessions(): Promise<StreamSession[]> {
  try {
    const response = await cosmic.objects
      .find({ type: 'stream-sessions' })
      .props(['id', 'title', 'slug', 'metadata', 'created_at'])
      .depth(1);
    
    return (response.objects as StreamSession[]).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Newest first
    });
  } catch (error) {
    if (cosmicHasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch stream sessions');
  }
}

export async function getStreamSession(slug: string): Promise<StreamSession | null> {
  try {
    const response = await cosmic.objects.findOne({
      type: 'stream-sessions',
      slug
    }).depth(1);
    
    const session = response.object as StreamSession;
    
    if (!session || !session.metadata) {
      return null;
    }
    
    return session;
  } catch (error) {
    if (cosmicHasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch stream session');
  }
}

export async function createStreamSession(data: {
  stream_title: string;
  description?: string;
  status: string;
  start_time?: string;
  end_time?: string;
  chat_enabled?: boolean;
  stream_quality?: string;
  tags?: string;
}): Promise<StreamSession> {
  try {
    const response = await cosmic.objects.insertOne({
      type: 'stream-sessions',
      title: data.stream_title,
      metadata: {
        stream_title: data.stream_title,
        description: data.description || '',
        status: data.status,
        start_time: data.start_time || '',
        end_time: data.end_time || '',
        chat_enabled: data.chat_enabled || false,
        stream_quality: data.stream_quality || '',
        tags: data.tags || '',
        viewer_count: 0,
        recording_url: null
      }
    });
    
    return response.object as StreamSession;
  } catch (error) {
    console.error('Error creating stream session:', error);
    throw new Error('Failed to create stream session');
  }
}

export async function updateStreamSession(id: string, updates: {
  status?: string;
  viewer_count?: number;
  stream_key?: string;
  mux_playback_id?: string;
  recording_url?: string;
}): Promise<StreamSession> {
  try {
    const response = await cosmic.objects.updateOne(id, {
      metadata: updates
    });
    
    return response.object as StreamSession;
  } catch (error) {
    console.error('Error updating stream session:', error);
    throw new Error('Failed to update stream session');
  }
}

// Access Links API
export async function getAccessLinks(streamId?: string): Promise<AccessLink[]> {
  try {
    const query: any = { type: 'access-links' };
    if (streamId) {
      query['metadata.stream_session'] = streamId;
    }

    const response = await cosmic.objects
      .find(query)
      .props(['id', 'title', 'slug', 'metadata', 'created_at'])
      .depth(1);
    
    return (response.objects as AccessLink[]).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Newest first
    });
  } catch (error) {
    if (cosmicHasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch access links');
  }
}

export async function getAccessLinkByToken(token: string): Promise<AccessLink | null> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'access-links',
        'metadata.access_token': token,
        'metadata.active': true
      })
      .depth(1);
    
    const links = response.objects as AccessLink[];
    
    if (links.length === 0) {
      return null;
    }
    
    const link = links[0];
    
    if (!link) {
      return null;
    }
    
    // Check if link has expired
    if (link.metadata?.expiration_date) {
      const expirationDate = new Date(link.metadata.expiration_date);
      if (expirationDate < new Date()) {
        return null; // Link has expired
      }
    }
    
    return link;
  } catch (error) {
    if (cosmicHasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch access link');
  }
}

export async function createAccessLink(data: {
  access_token: string;
  stream_session_id: string;
  permissions: string;
  expiration_date?: string;
}): Promise<AccessLink> {
  try {
    const generatedLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourstream.com'}/watch?token=${data.access_token}`;
    
    const response = await cosmic.objects.insertOne({
      type: 'access-links',
      title: `Access Link - ${data.access_token.substring(0, 8)}...`,
      metadata: {
        access_token: data.access_token,
        stream_session: data.stream_session_id,
        permissions: data.permissions,
        expiration_date: data.expiration_date || '',
        generated_link: generatedLink,
        usage_count: 0,
        last_accessed: null,
        active: true
      }
    });
    
    return response.object as AccessLink;
  } catch (error) {
    console.error('Error creating access link:', error);
    throw new Error('Failed to create access link');
  }
}

export async function updateAccessLinkUsage(linkId: string): Promise<void> {
  try {
    // First, get the current link to increment usage count
    const response = await cosmic.objects.findOne({
      type: 'access-links',
      id: linkId
    });
    
    const link = response.object as AccessLink;
    const currentUsageCount = link.metadata?.usage_count || 0;
    
    await cosmic.objects.updateOne(linkId, {
      metadata: {
        usage_count: currentUsageCount + 1,
        last_accessed: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating access link usage:', error);
    // Don't throw error here as this is tracking, not critical functionality
  }
}

// Stream Settings API
export async function getStreamSettings(): Promise<StreamSettings | null> {
  try {
    const response = await cosmic.objects
      .find({ type: 'stream-settings' })
      .props(['id', 'title', 'slug', 'metadata']);
    
    const settings = response.objects as StreamSettings[];
    
    if (settings.length === 0) {
      return null;
    }
    
    return settings[0] || null; // Should be singleton
  } catch (error) {
    if (cosmicHasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch stream settings');
  }
}

export async function updateStreamSettings(settingsId: string, updates: {
  default_quality?: string;
  auto_record?: boolean;
  default_chat_enabled?: boolean;
  overlay_settings?: any;
  notification_settings?: any;
}): Promise<StreamSettings> {
  try {
    const response = await cosmic.objects.updateOne(settingsId, {
      metadata: updates
    });
    
    return response.object as StreamSettings;
  } catch (error) {
    console.error('Error updating stream settings:', error);
    throw new Error('Failed to update stream settings');
  }
}

// Chat Messages API
export async function getChatMessages(streamId: string, limit: number = 50): Promise<ChatMessage[]> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'chat-messages',
        'metadata.stream_session': streamId
      })
      .props(['id', 'title', 'metadata', 'created_at'])
      .depth(1);
    
    return (response.objects as ChatMessage[]).sort((a, b) => {
      const dateA = new Date(a.metadata.timestamp || a.created_at).getTime();
      const dateB = new Date(b.metadata.timestamp || b.created_at).getTime();
      return dateA - dateB; // Oldest first for chat
    });
  } catch (error) {
    if (cosmicHasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch chat messages');
  }
}

export async function createChatMessage(data: {
  message_content: string;
  viewer_name: string;
  stream_session_id: string;
  message_type?: string;
  viewer_ip?: string;
}): Promise<ChatMessage> {
  try {
    const response = await cosmic.objects.insertOne({
      type: 'chat-messages',
      title: `Chat: ${data.viewer_name} - ${data.message_content.substring(0, 30)}...`,
      metadata: {
        message_content: data.message_content,
        viewer_name: data.viewer_name,
        stream_session: data.stream_session_id,
        timestamp: new Date().toISOString(),
        message_type: data.message_type || 'regular',
        viewer_ip: data.viewer_ip || ''
      }
    });
    
    return response.object as ChatMessage;
  } catch (error) {
    console.error('Error creating chat message:', error);
    throw new Error('Failed to create chat message');
  }
}

// Utility functions
export function generateAccessToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'tkn_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatStreamStatus(status: string): string {
  const statusMap: Record<string, string> = {
    scheduled: 'Scheduled',
    live: 'Live',
    ended: 'Ended',
    private: 'Private'
  };
  return statusMap[status] || status;
}

export function getStreamStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    scheduled: 'text-yellow-500',
    live: 'text-red-500',
    ended: 'text-gray-500',
    private: 'text-purple-500'
  };
  return colorMap[status] || 'text-gray-500';
}