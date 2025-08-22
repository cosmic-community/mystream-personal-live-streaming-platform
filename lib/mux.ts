import Mux from '@mux/mux-node'

// Initialize Mux client with environment variables
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string
})

// Define proper interfaces for MUX operations
export interface MuxLiveStreamCreateParams {
  reconnect_window?: number;
  reduced_latency?: boolean;
  test?: boolean;
  playback_policy?: ('public' | 'signed')[];
  new_asset_settings?: {
    playback_policy?: ('public' | 'signed')[];
  };
}

export interface MuxPlaybackId {
  id: string;
  policy: 'public' | 'signed';
}

export interface MuxLiveStream {
  id: string;
  stream_key: string;
  playbook_ids?: MuxPlaybackId[];
  playback_ids: MuxPlaybackId[];
  status: 'idle' | 'active' | 'disconnected';
  created_at: string;
  reconnect_window?: number;
  reduced_latency?: boolean;
  test?: boolean;
}

export interface MuxAsset {
  id: string;
  status: 'preparing' | 'ready' | 'errored';
  duration?: number;
  max_stored_resolution?: string;
  max_stored_frame_rate?: number;
  aspect_ratio?: string;
  playback_ids?: MuxPlaybackId[];
  created_at: string;
}

// Create a new live stream
export async function createLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStream> {
  try {
    const defaultParams: MuxLiveStreamCreateParams = {
      playback_policy: ['public'],
      new_asset_settings: {
        playbook_policy: ['public']
      },
      reduced_latency: false,
      reconnect_window: 60,
      test: process.env.NODE_ENV !== 'production',
      ...params
    };

    const liveStream = await mux.video.liveStreams.create(defaultParams);
    
    return {
      id: liveStream.id!,
      stream_key: liveStream.stream_key!,
      playback_ids: (liveStream.playback_ids || []).map(pb => ({
        id: pb.id!,
        policy: pb.policy as 'public' | 'signed'
      })),
      status: liveStream.status as 'idle' | 'active' | 'disconnected',
      created_at: liveStream.created_at!,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    };
  } catch (error) {
    console.error('Error creating MUX live stream:', error);
    throw new Error('Failed to create live stream');
  }
}

// Get live stream by ID
export async function getLiveStream(streamId: string): Promise<MuxLiveStream> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId);
    
    return {
      id: liveStream.id!,
      stream_key: liveStream.stream_key!,
      playback_ids: (liveStream.playback_ids || []).map(pb => ({
        id: pb.id!,
        policy: pb.policy as 'public' | 'signed'
      })),
      status: liveStream.status as 'idle' | 'active' | 'disconnected',
      created_at: liveStream.created_at!,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    };
  } catch (error) {
    console.error('Error getting MUX live stream:', error);
    throw new Error('Failed to get live stream');
  }
}

// Delete a live stream
export async function deleteLiveStream(streamId: string): Promise<void> {
  try {
    await mux.video.liveStreams.del(streamId);
  } catch (error) {
    console.error('Error deleting MUX live stream:', error);
    throw new Error('Failed to delete live stream');
  }
}

// Create an asset from a live stream
export async function createAssetFromLiveStream(liveStreamId: string): Promise<MuxAsset> {
  try {
    const asset = await mux.video.assets.create({
      input: [{
        url: `mux://live-streams/${liveStreamId}`
      }],
      playback_policy: ['public']
    });

    return {
      id: asset.id!,
      status: asset.status as 'preparing' | 'ready' | 'errored',
      duration: asset.duration,
      max_stored_resolution: asset.max_stored_resolution,
      max_stored_frame_rate: asset.max_stored_frame_rate,
      aspect_ratio: asset.aspect_ratio,
      playback_ids: (asset.playback_ids || []).map(pb => ({
        id: pb.id!,
        policy: pb.policy as 'public' | 'signed'
      })),
      created_at: asset.created_at!
    };
  } catch (error) {
    console.error('Error creating asset from live stream:', error);
    throw new Error('Failed to create asset from live stream');
  }
}

// Get asset by ID
export async function getAsset(assetId: string): Promise<MuxAsset> {
  try {
    const asset = await mux.video.assets.retrieve(assetId);

    return {
      id: asset.id!,
      status: asset.status as 'preparing' | 'ready' | 'errored',
      duration: asset.duration,
      max_stored_resolution: asset.max_stored_resolution,
      max_stored_frame_rate: asset.max_stored_frame_rate,
      aspect_ratio: asset.aspect_ratio,
      playback_ids: (asset.playback_ids || []).map(pb => ({
        id: pb.id!,
        policy: pb.policy as 'public' | 'signed'
      })),
      created_at: asset.created_at!
    };
  } catch (error) {
    console.error('Error getting MUX asset:', error);
    throw new Error('Failed to get asset');
  }
}

// Get live stream statistics
export async function getLiveStreamStats(streamId: string) {
  try {
    // Note: This would require MUX Data API integration
    // For now, return mock data structure
    return {
      concurrent_viewers: 0,
      total_views: 0,
      max_concurrent_viewers: 0
    };
  } catch (error) {
    console.error('Error getting live stream stats:', error);
    return {
      concurrent_viewers: 0,
      total_views: 0,
      max_concurrent_viewers: 0
    };
  }
}

// Utility function to generate MUX video URL
export function getMuxVideoUrl(playbackId: string, options: {
  width?: number;
  height?: number;
  fit_mode?: 'preserve' | 'crop' | 'pad';
  time?: number;
} = {}): string {
  const baseUrl = `https://stream.mux.com/${playbackId}`;
  
  if (Object.keys(options).length === 0) {
    return `${baseUrl}.m3u8`;
  }

  const params = new URLSearchParams();
  
  if (options.width) params.set('width', options.width.toString());
  if (options.height) params.set('height', options.height.toString());
  if (options.fit_mode) params.set('fit_mode', options.fit_mode);
  if (options.time) params.set('time', options.time.toString());

  return `${baseUrl}.m3u8?${params.toString()}`;
}

// Generate thumbnail URL from MUX playback ID
export function getMuxThumbnailUrl(playbackId: string, options: {
  width?: number;
  height?: number;
  fit_mode?: 'crop' | 'preserve' | 'pad';
  time?: number;
} = {}): string {
  const params = new URLSearchParams({
    width: (options.width || 640).toString(),
    height: (options.height || 360).toString(),
    fit_mode: options.fit_mode || 'crop',
    time: (options.time || 0).toString()
  });

  return `https://image.mux.com/${playbackId}/thumbnail.jpg?${params.toString()}`;
}

// Check if MUX credentials are configured
export function isMuxConfigured(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}