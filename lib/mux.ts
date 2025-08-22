import Mux from '@mux/mux-node'

// Initialize Mux SDK
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string
})

// Type definitions for MUX SDK
export interface MuxPlaybackId {
  id: string
  policy: 'public' | 'signed'
}

export interface MuxLiveStreamCreateParams {
  reconnect_window?: number
  reduced_latency?: boolean
  test?: boolean
}

export interface MuxLiveStream {
  id: string
  stream_key: string
  playback_ids: MuxPlaybackId[]
  status: string
  created_at: string
  reconnect_window?: number
  reduced_latency?: boolean
  test?: boolean
}

// Create a live stream
export async function createLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStream | null> {
  try {
    const response = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: {
        playback_policy: ['public']
      },
      ...params
    })

    if (!response || !response.data) {
      return null
    }

    const stream = response.data
    
    return {
      id: stream.id || '',
      stream_key: stream.stream_key || '',
      playback_ids: stream.playback_ids?.map(pid => ({
        id: pid.id || '',
        policy: (pid.policy as 'public' | 'signed') || 'public'
      })) || [],
      status: stream.status || 'idle',
      created_at: stream.created_at || new Date().toISOString(),
      reconnect_window: stream.reconnect_window,
      reduced_latency: stream.reduced_latency,
      test: stream.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    return null
  }
}

// Delete a live stream
export async function deleteLiveStream(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(streamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

// Get live stream details
export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const response = await mux.video.liveStreams.get(streamId)
    
    if (!response || !response.data) {
      return null
    }

    const stream = response.data
    
    return {
      id: stream.id || '',
      stream_key: stream.stream_key || '',
      playback_ids: stream.playback_ids?.map(pid => ({
        id: pid.id || '',
        policy: (pid.policy as 'public' | 'signed') || 'public'
      })) || [],
      status: stream.status || 'idle',
      created_at: stream.created_at || new Date().toISOString(),
      reconnect_window: stream.reconnect_window,
      reduced_latency: stream.reduced_latency,
      test: stream.test
    }
  } catch (error) {
    console.error('Error getting MUX live stream:', error)
    return null
  }
}

// Create an asset from a live stream recording
export async function createAsset(input: { url: string }): Promise<any> {
  try {
    const response = await mux.video.assets.create({
      input: [{ url: input.url }],
      playback_policy: ['public']
    })

    return response.data
  } catch (error) {
    console.error('Error creating MUX asset:', error)
    throw error
  }
}

// Helper function to get playback URL
export function getPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

// Helper function to generate thumbnail URL
export function getThumbnailUrl(playbackId: string, options: {
  width?: number
  height?: number
  time?: number
} = {}): string {
  const { width = 640, height = 360, time = 0 } = options
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&time=${time}`
}

// Validate MUX configuration
export function validateMuxConfig(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET)
}

// Get stream status
export async function getStreamStatus(streamId: string): Promise<string | null> {
  try {
    const stream = await getLiveStream(streamId)
    return stream?.status || null
  } catch (error) {
    console.error('Error getting stream status:', error)
    return null
  }
}