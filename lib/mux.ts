import Mux from '@mux/mux-node'

// Initialize Mux client with credentials
const { Video } = new Mux(
  process.env.MUX_TOKEN_ID as string,
  process.env.MUX_TOKEN_SECRET as string
)

// Types for Mux API responses
export interface MuxLiveStream {
  id: string
  status: string
  stream_key: string
  playback_ids: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  created_at: string
  reconnect_window?: number
  max_continuous_duration?: number
}

export interface MuxAsset {
  id: string
  status: string
  playback_ids: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  duration?: number
  created_at: string
}

// Create a new live stream
export async function createMuxLiveStream(options: {
  playback_policy?: 'public' | 'signed'
  reconnect_window?: number
  max_continuous_duration?: number
}): Promise<MuxLiveStream> {
  try {
    const liveStream = await Video.LiveStreams.create({
      playback_policy: [options.playback_policy || 'public'],
      reconnect_window: options.reconnect_window || 60,
      max_continuous_duration: options.max_continuous_duration || 12 * 60 * 60 // 12 hours
    })

    return {
      id: liveStream.id,
      status: liveStream.status,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids || [],
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      max_continuous_duration: liveStream.max_continuous_duration
    }
  } catch (error) {
    console.error('Error creating Mux live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get live stream details
export async function getMuxLiveStream(streamId: string): Promise<MuxLiveStream> {
  try {
    const liveStream = await Video.LiveStreams.get(streamId)
    
    return {
      id: liveStream.id,
      status: liveStream.status,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids || [],
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      max_continuous_duration: liveStream.max_continuous_duration
    }
  } catch (error) {
    console.error('Error fetching Mux live stream:', error)
    throw new Error('Failed to fetch live stream')
  }
}

// Delete a live stream
export async function deleteMuxLiveStream(streamId: string): Promise<void> {
  try {
    await Video.LiveStreams.del(streamId)
  } catch (error) {
    console.error('Error deleting Mux live stream:', error)
    throw new Error('Failed to delete live stream')
  }
}

// Get Mux player URL for a playback ID
export function getMuxPlayerUrl(playbackId: string, options?: {
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
}): string {
  const baseUrl = 'https://stream.mux.com'
  const params = new URLSearchParams()
  
  if (options?.autoplay) params.append('autoplay', '1')
  if (options?.muted) params.append('muted', '1')
  if (options?.controls !== false) params.append('controls', '1')
  
  const queryString = params.toString()
  return `${baseUrl}/${playbackId}.m3u8${queryString ? `?${queryString}` : ''}`
}

// Create Mux player embed URL
export function getMuxPlayerEmbedUrl(playbackId: string, options?: {
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  color?: string
}): string {
  const baseUrl = 'https://stream.mux.com'
  const params = new URLSearchParams()
  
  if (options?.autoplay) params.append('autoplay', '1')
  if (options?.muted) params.append('muted', '1')
  if (options?.controls !== false) params.append('controls', '1')
  if (options?.color) params.append('color', options.color)
  
  const queryString = params.toString()
  return `${baseUrl}/${playbackId}${queryString ? `?${queryString}` : ''}`
}

// Get live stream metrics
export async function getMuxLiveStreamMetrics(streamId: string): Promise<{
  viewerCount: number
  status: string
}> {
  try {
    const liveStream = await Video.LiveStreams.get(streamId)
    
    // Note: Mux doesn't provide real-time viewer count in the basic API
    // You would need to use Mux Data API or implement your own tracking
    return {
      viewerCount: 0, // Placeholder - implement real tracking
      status: liveStream.status
    }
  } catch (error) {
    console.error('Error fetching Mux live stream metrics:', error)
    return {
      viewerCount: 0,
      status: 'idle'
    }
  }
}

// Create an asset from a live stream recording
export async function createAssetFromLiveStream(liveStreamId: string): Promise<MuxAsset> {
  try {
    const asset = await Video.Assets.create({
      input: [{ url: `mux://live-streams/${liveStreamId}` }],
      playback_policy: ['public']
    })

    return {
      id: asset.id,
      status: asset.status,
      playback_ids: asset.playback_ids || [],
      duration: asset.duration,
      created_at: asset.created_at
    }
  } catch (error) {
    console.error('Error creating asset from live stream:', error)
    throw new Error('Failed to create asset from live stream')
  }
}

// Utility function to check if a playback ID is valid
export function isValidPlaybackId(playbackId: string): boolean {
  return typeof playbackId === 'string' && playbackId.length > 0
}

// Utility function to get thumbnail URL from Mux
export function getMuxThumbnailUrl(playbackId: string, options?: {
  width?: number
  height?: number
  fit_mode?: 'preserve' | 'crop' | 'pad'
  time?: number
}): string {
  const baseUrl = 'https://image.mux.com'
  const params = new URLSearchParams()
  
  if (options?.width) params.append('width', options.width.toString())
  if (options?.height) params.append('height', options.height.toString())
  if (options?.fit_mode) params.append('fit_mode', options.fit_mode)
  if (options?.time) params.append('time', options.time.toString())
  
  const queryString = params.toString()
  return `${baseUrl}/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}