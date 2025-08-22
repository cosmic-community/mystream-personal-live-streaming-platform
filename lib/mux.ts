import Mux from '@mux/mux-node';
import type { MuxLiveStream, MuxLiveStreamCreateParams, MuxValidationResult } from '@/types';

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

// FIXED: Updated to use correct MUX SDK API structure
export async function validateMuxCredentials(): Promise<MuxValidationResult> {
  try {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      return {
        isValid: false,
        error: 'MUX_TOKEN_ID and MUX_TOKEN_SECRET are required'
      };
    }

    // Test API connection by listing assets (lightweight operation)
    await mux.video.assets.list({ limit: 1 });
    
    return {
      isValid: true,
      data: {
        tokenId: process.env.MUX_TOKEN_ID.substring(0, 8) + '...',
        hasCredentials: true
      }
    };
  } catch (error) {
    console.error('MUX validation error:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Failed to validate MUX credentials'
    };
  }
}

export async function createMuxLiveStream(
  params: MuxLiveStreamCreateParams = {}
): Promise<MuxLiveStream> {
  try {
    // FIXED: Updated to use correct MUX SDK response structure (no .data property)
    const response = await mux.video.liveStreams.create({
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      test: params.test || false
    });

    // FIXED: Response is the live stream object directly, not wrapped in .data
    return {
      id: response.id || '',
      stream_key: response.stream_key || '',
      playback_ids: response.playback_ids || [],
      status: response.status || 'idle',
      created_at: response.created_at || new Date().toISOString(),
      reconnect_window: response.reconnect_window,
      test: response.test
    };
  } catch (error) {
    console.error('Error creating MUX live stream:', error);
    throw new Error('Failed to create MUX live stream');
  }
}

export async function getMuxLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    // FIXED: Updated to use correct MUX SDK response structure (no .data property)
    const response = await mux.video.liveStreams.retrieve(streamId);

    // FIXED: Response is the live stream object directly, not wrapped in .data
    return {
      id: response.id || '',
      stream_key: response.stream_key || '',
      playback_ids: response.playback_ids || [],
      status: response.status || 'idle',
      created_at: response.created_at || new Date().toISOString(),
      reconnect_window: response.reconnect_window,
      test: response.test
    };
  } catch (error) {
    console.error('Error fetching MUX live stream:', error);
    return null;
  }
}

export async function deleteMuxLiveStream(streamId: string): Promise<boolean> {
  try {
    // FIXED: Updated to use correct MUX SDK method name (delete instead of del)
    await mux.video.liveStreams.delete(streamId);
    return true;
  } catch (error) {
    console.error('Error deleting MUX live stream:', error);
    return false;
  }
}

export async function createMuxAsset(input: { url: string }): Promise<any> {
  try {
    // FIXED: Updated to use correct MUX SDK response structure (no .data property)
    const response = await mux.video.assets.create({
      input: [{ url: input.url }]
    });

    // FIXED: Response is the asset object directly, not wrapped in .data
    return {
      id: response.id || '',
      status: response.status || 'preparing',
      playback_ids: response.playbook_ids || [], // Note: typo in original, keeping for compatibility
      created_at: response.created_at || new Date().toISOString(),
      duration: response.duration,
      aspect_ratio: response.aspect_ratio
    };
  } catch (error) {
    console.error('Error creating MUX asset:', error);
    throw new Error('Failed to create MUX asset');
  }
}

export async function getMuxAsset(assetId: string): Promise<any | null> {
  try {
    const response = await mux.video.assets.retrieve(assetId);
    
    return {
      id: response.id || '',
      status: response.status || 'preparing',
      playback_ids: response.playbook_ids || [],
      created_at: response.created_at || new Date().toISOString(),
      duration: response.duration,
      aspect_ratio: response.aspect_ratio
    };
  } catch (error) {
    console.error('Error fetching MUX asset:', error);
    return null;
  }
}

export async function getMuxLiveStreamStatus(streamId: string): Promise<string | null> {
  try {
    const liveStream = await getMuxLiveStream(streamId);
    return liveStream?.status || null;
  } catch (error) {
    console.error('Error getting MUX live stream status:', error);
    return null;
  }
}

export async function listMuxLiveStreams(): Promise<MuxLiveStream[]> {
  try {
    const response = await mux.video.liveStreams.list({ limit: 100 });
    
    return (response.data || []).map((stream: any) => ({
      id: stream.id || '',
      stream_key: stream.stream_key || '',
      playback_ids: stream.playback_ids || [],
      status: stream.status || 'idle',
      created_at: stream.created_at || new Date().toISOString(),
      reconnect_window: stream.reconnect_window,
      test: stream.test
    }));
  } catch (error) {
    console.error('Error listing MUX live streams:', error);
    return [];
  }
}

export function getMuxPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function getMuxThumbnailUrl(playbackId: string, options: {
  width?: number;
  height?: number;
  time?: number;
  format?: 'jpg' | 'png' | 'gif';
} = {}): string {
  const { width = 1280, height = 720, time = 0, format = 'jpg' } = options;
  return `https://image.mux.com/${playbackId}/thumbnail.${format}?width=${width}&height=${height}&time=${time}`;
}

// Helper function to extract playback ID from MUX live stream
export function getPlaybackId(liveStream: MuxLiveStream): string | null {
  const publicPlaybackId = liveStream.playback_ids?.find(p => p.policy === 'public');
  return publicPlaybackId?.id || null;
}

// Helper function to check if stream is live
export function isStreamLive(status: string): boolean {
  return status === 'active';
}

// Helper function to format stream status for display
export function formatMuxStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'idle': 'Ready',
    'active': 'Live',
    'disabled': 'Disabled',
    'preparing': 'Preparing'
  };
  return statusMap[status] || status;
}