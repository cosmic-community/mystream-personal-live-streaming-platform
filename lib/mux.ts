import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

// MUX SDK client setup
let Mux: any;
if (typeof window === 'undefined') {
  try {
    Mux = require('@mux/mux-node').default;
  } catch (e) {
    console.warn('MUX SDK not available');
  }
}

// Initialize MUX client
const mux = Mux ? new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
}) : null;

// FIXED: Properly export validateMuxConfig function
export function validateMuxConfig(): { isValid: boolean; error?: string } {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    return {
      isValid: false,
      error: 'MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables are required'
    };
  }

  if (!mux) {
    return {
      isValid: false,
      error: 'MUX SDK could not be initialized. Please check your credentials.'
    };
  }

  return { isValid: true };
}

// Create a live stream
export async function createLiveStream(params: {
  playback_policy?: ('public' | 'signed')[];
  reconnect_window?: number;
}): Promise<MuxLiveStream> {
  if (!mux) {
    throw new Error('MUX client not initialized');
  }

  try {
    // FIXED: Use correct property name 'playback_policy' instead of 'playbook_policy'
    const createParams: MuxLiveStreamCreateParams = {
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60
      // REMOVED: reduced_latency as it's not supported in current MUX SDK
    };

    const liveStream = await mux.video.liveStreams.create(createParams);
    return liveStream;
  } catch (error) {
    console.error('Error creating MUX live stream:', error);
    throw new Error('Failed to create live stream');
  }
}

// Get live stream
export async function getLiveStream(streamId: string): Promise<MuxLiveStream> {
  if (!mux) {
    throw new Error('MUX client not initialized');
  }

  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId);
    return liveStream;
  } catch (error) {
    console.error('Error fetching MUX live stream:', error);
    throw new Error('Failed to fetch live stream');
  }
}

// Update live stream
export async function updateLiveStream(streamId: string, params: {
  reconnect_window?: number;
}): Promise<MuxLiveStream> {
  if (!mux) {
    throw new Error('MUX client not initialized');
  }

  try {
    // FIXED: Remove 'test' property as it doesn't exist in LiveStreamUpdateParams
    const updateParams = {
      reconnect_window: params.reconnect_window
    };

    const liveStream = await mux.video.liveStreams.update(streamId, updateParams);
    return liveStream;
  } catch (error) {
    console.error('Error updating MUX live stream:', error);
    throw new Error('Failed to update live stream');
  }
}

// Delete live stream
export async function deleteLiveStream(streamId: string): Promise<void> {
  if (!mux) {
    throw new Error('MUX client not initialized');
  }

  try {
    await mux.video.liveStreams.del(streamId);
  } catch (error) {
    console.error('Error deleting MUX live stream:', error);
    throw new Error('Failed to delete live stream');
  }
}

// Get playback URL
export function getPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

// Get live stream metrics (simplified version)
export async function getLiveStreamMetrics(streamId: string): Promise<{
  concurrent_viewers?: number;
  total_watch_time?: number;
}> {
  if (!mux) {
    throw new Error('MUX client not initialized');
  }

  try {
    // FIXED: Use a simplified approach instead of accessing 'breakdown' property
    // which doesn't exist on the Metrics type
    const metrics = await mux.data.metrics.overall({
      metric_filters: [`live_stream_id:${streamId}`]
    });

    // Return simplified metrics structure
    return {
      concurrent_viewers: metrics.concurrent_viewers || 0,
      total_watch_time: metrics.total_watch_time || 0
    };
  } catch (error) {
    console.error('Error fetching MUX metrics:', error);
    // Return empty metrics instead of throwing
    return {
      concurrent_viewers: 0,
      total_watch_time: 0
    };
  }
}

// Create an asset from a live stream recording
export async function createAssetFromLiveStream(liveStreamId: string): Promise<any> {
  if (!mux) {
    throw new Error('MUX client not initialized');
  }

  try {
    const asset = await mux.video.assets.create({
      input: [{
        url: `mux://live-streams/${liveStreamId}`
      }],
      playback_policy: ['public']
    });

    return asset;
  } catch (error) {
    console.error('Error creating asset from live stream:', error);
    throw new Error('Failed to create asset from live stream');
  }
}

// Helper function to check if a stream is live
export async function isStreamLive(streamId: string): Promise<boolean> {
  try {
    const stream = await getLiveStream(streamId);
    return stream.status === 'active';
  } catch (error) {
    console.error('Error checking stream status:', error);
    return false;
  }
}

// Get stream status
export async function getStreamStatus(streamId: string): Promise<string> {
  try {
    const stream = await getLiveStream(streamId);
    return stream.status || 'unknown';
  } catch (error) {
    console.error('Error getting stream status:', error);
    return 'error';
  }
}

// Export default for compatibility
export default {
  validateMuxConfig,
  createLiveStream,
  getLiveStream,
  updateLiveStream,
  deleteLiveStream,
  getPlaybackUrl,
  getLiveStreamMetrics,
  createAssetFromLiveStream,
  isStreamLive,
  getStreamStatus
};