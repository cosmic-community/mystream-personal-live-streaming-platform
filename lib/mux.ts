import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string
})

// Create a live stream
export async function createLiveStream(
  params: MuxLiveStreamCreateParams = {}
): Promise<MuxLiveStream> {
  try {
    const liveStream = await mux.video.liveStreams.create({
      reconnect_window: params.reconnect_window || 60,
      reduced_latency: params.reduced_latency || false,
      test: params.test || false,
      playback_policy: ['public'] // FIXED: Was 'playbook_policy', now corrected to 'playback_policy'
    })

    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids || [],
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get live stream by ID
export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    
    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids || [],
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
    return null
  }
}

// Delete a live stream
export async function deleteLiveStream(streamId: string): Promise<boolean> {
  try {
    // FIXED: Using correct method name 'del' -> 'delete'
    await mux.video.liveStreams.delete(streamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

// Get live stream status
export async function getLiveStreamStatus(streamId: string): Promise<string | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    return liveStream.status
  } catch (error) {
    console.error('Error getting live stream status:', error)
    return null
  }
}

// List all live streams
export async function listLiveStreams(limit = 25, page = 1): Promise<MuxLiveStream[]> {
  try {
    const response = await mux.video.liveStreams.list({
      limit,
      page
    })

    return response.data.map((stream) => ({
      id: stream.id,
      stream_key: stream.stream_key,
      playback_ids: stream.playback_ids || [],
      status: stream.status,
      created_at: stream.created_at,
      reconnect_window: stream.reconnect_window,
      reduced_latency: stream.reduced_latency,
      test: stream.test
    }))
  } catch (error) {
    console.error('Error listing MUX live streams:', error)
    return []
  }
}

// Create an asset from a live stream (for recording)
export async function createAssetFromLiveStream(
  liveStreamId: string,
  playbackPolicy: 'public' | 'signed' = 'public'
): Promise<string | null> {
  try {
    const asset = await mux.video.assets.create({
      input: [{ url: `mux://live-streams/${liveStreamId}` }],
      playback_policy: [playbackPolicy]
    })

    return asset.id
  } catch (error) {
    console.error('Error creating asset from live stream:', error)
    return null
  }
}

// Get asset details (for recorded streams)
export async function getAsset(assetId: string) {
  try {
    return await mux.video.assets.retrieve(assetId)
  } catch (error) {
    console.error('Error fetching asset:', error)
    return null
  }
}

// Enable live stream recording
export async function enableRecording(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.update(streamId, {
      reconnect_window: 60,
      reduced_latency: false
    })
    return true
  } catch (error) {
    console.error('Error enabling recording for live stream:', error)
    return false
  }
}

// Helper function to get playback URL
export function getPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

// Helper function to get thumbnail URL
export function getThumbnailUrl(
  playbackId: string, 
  options: { width?: number; height?: number; fit_mode?: string; time?: number } = {}
): string {
  const { width = 640, height = 360, fit_mode = 'smartcrop', time = 0 } = options
  return `https://image.mux.com/${playbackId}/thumbnail.png?width=${width}&height=${height}&fit_mode=${fit_mode}&time=${time}`
}