import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  console.warn('MUX credentials not found. MUX functionality will be disabled.')
}

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string,
})

// Create a new live stream
export async function createMuxLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStream> {
  try {
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: params.playbook_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      // Note: removed reduced_latency as it's not supported in current MUX SDK
      test: params.test || false,
    })

    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids?.map(pb => ({
        id: pb.id,
        policy: pb.policy as 'public' | 'signed' | 'drm'
      })) || [],
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get a single live stream by ID
export async function getMuxLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    
    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids?.map(pb => ({
        id: pb.id,
        policy: pb.policy as 'public' | 'signed' | 'drm'
      })) || [],
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
    return null
  }
}

// Get all live streams (renamed from getMuxLiveStreams to match export)
export async function getAllMuxLiveStreams(): Promise<MuxLiveStream[]> {
  try {
    const response = await mux.video.liveStreams.list({ limit: 100 })
    
    return response.data?.map(liveStream => ({
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids?.map(pb => ({
        id: pb.id,
        policy: pb.policy as 'public' | 'signed' | 'drm'
      })) || [],
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      test: liveStream.test
    })) || []
  } catch (error) {
    console.error('Error fetching MUX live streams:', error)
    return []
  }
}

// Update a live stream
export async function updateMuxLiveStream(
  streamId: string, 
  updates: { reconnect_window?: number; test?: boolean }
): Promise<MuxLiveStream | null> {
  try {
    // Note: removed reduced_latency from updates as it's not supported in current MUX SDK
    const liveStream = await mux.video.liveStreams.update(streamId, {
      reconnect_window: updates.reconnect_window,
      test: updates.test
    })

    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids?.map(pb => ({
        id: pb.id,
        policy: pb.policy as 'public' | 'signed' | 'drm'
      })) || [],
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error updating MUX live stream:', error)
    return null
  }
}

// Delete a live stream
export async function deleteMuxLiveStream(streamId: string): Promise<boolean> {
  try {
    // Use delete method instead of del
    await mux.video.liveStreams.delete(streamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

// Check if stream is live
export async function isStreamLive(streamId: string): Promise<boolean> {
  try {
    const stream = await getMuxLiveStream(streamId)
    return stream?.status === 'active' || false
  } catch (error) {
    console.error('Error checking stream status:', error)
    return false
  }
}

// Get stream statistics
export async function getMuxStreamStats(streamId: string): Promise<any> {
  try {
    // Note: This might need adjustment based on actual MUX SDK metrics API
    return await mux.data.metrics.breakdown(streamId, {
      timeframe: ['7:days'],
      measurement: 'video_startup_time'
    })
  } catch (error) {
    console.error('Error fetching stream stats:', error)
    return null
  }
}

// Create an asset from a live stream recording
export async function createAssetFromLiveStream(streamId: string): Promise<any> {
  try {
    return await mux.video.assets.create({
      input: [{
        url: `mux://live-streams/${streamId}`
      }]
    })
  } catch (error) {
    console.error('Error creating asset from live stream:', error)
    throw new Error('Failed to create asset')
  }
}

// Validate MUX credentials
export function validateMuxCredentials(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET)
}

// Get playback URL for a given playback ID
export function getPlaybackUrl(playbackId: string, token?: string): string {
  const baseUrl = `https://stream.mux.com/${playbackId}.m3u8`
  return token ? `${baseUrl}?token=${token}` : baseUrl
}

// Generate a signed playback URL (for private streams)
export async function generateSignedPlaybackUrl(
  playbackId: string, 
  expiresIn: number = 3600
): Promise<string> {
  try {
    // This would require MUX JWT signing - implementation depends on specific needs
    const token = 'implement-jwt-signing-here'
    return getPlaybackUrl(playbackId, token)
  } catch (error) {
    console.error('Error generating signed playback URL:', error)
    return getPlaybackUrl(playbackId)
  }
}

export default mux