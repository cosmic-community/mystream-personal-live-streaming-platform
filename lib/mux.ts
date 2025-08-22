import Mux from '@mux/mux-node'

// Initialize Mux client
const { Video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string,
})

// Types for MUX API responses
export interface MuxLiveStream {
  id: string
  stream_key: string
  status: string
  playback_ids?: Array<{
    id: string
    policy: string
  }>
  created_at: string
  reconnect_window?: number
  max_continuous_duration?: number
}

export interface CreateLiveStreamOptions {
  playback_policy: Array<'public' | 'signed'>
  new_asset_settings?: {
    playback_policy: Array<'public' | 'signed'>
  }
  reconnect_window?: number
  max_continuous_duration?: number
}

export interface MuxAsset {
  id: string
  status: string
  playback_ids?: Array<{
    id: string
    policy: string
  }>
  duration?: number
  created_at: string
}

// Create a new live stream
export async function createLiveStream(options: CreateLiveStreamOptions): Promise<MuxLiveStream> {
  try {
    const liveStream = await Video.LiveStreams.create({
      playback_policy: options.playback_policy,
      new_asset_settings: options.new_asset_settings,
      reconnect_window: options.reconnect_window || 60,
      max_continuous_duration: options.max_continuous_duration || 43200 // 12 hours
    })

    return liveStream as MuxLiveStream
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get live stream details
export async function getLiveStream(streamId: string): Promise<MuxLiveStream> {
  try {
    const liveStream = await Video.LiveStreams.get(streamId)
    return liveStream as MuxLiveStream
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
    throw new Error('Failed to fetch live stream')
  }
}

// Delete a live stream
export async function deleteLiveStream(streamId: string): Promise<void> {
  try {
    await Video.LiveStreams.del(streamId)
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    throw new Error('Failed to delete live stream')
  }
}

// Create a signed URL for private playback
export async function createSignedUrl(playbackId: string, expirationTime?: number): Promise<string> {
  try {
    const signedUrl = await Video.PlaybackIds.createSignedUrl(playbackId, {
      expiration_time: expirationTime || Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    })
    
    return signedUrl.signed_url
  } catch (error) {
    console.error('Error creating signed URL:', error)
    throw new Error('Failed to create signed URL')
  }
}

// Get asset details (for recorded streams)
export async function getAsset(assetId: string): Promise<MuxAsset> {
  try {
    const asset = await Video.Assets.get(assetId)
    return asset as MuxAsset
  } catch (error) {
    console.error('Error fetching MUX asset:', error)
    throw new Error('Failed to fetch asset')
  }
}

// List live streams with filtering
export async function listLiveStreams(limit: number = 25, page: number = 1): Promise<{
  data: MuxLiveStream[]
  total_row_count: number
}> {
  try {
    const response = await Video.LiveStreams.list({
      limit,
      page
    })

    return {
      data: response.data as MuxLiveStream[],
      total_row_count: response.total_row_count || 0
    }
  } catch (error) {
    console.error('Error listing MUX live streams:', error)
    throw new Error('Failed to list live streams')
  }
}

// Get live stream statistics
export async function getStreamMetrics(streamId: string): Promise<any> {
  try {
    const metrics = await Video.LiveStreams.get(streamId)
    
    // Return basic metrics (MUX provides more detailed metrics through their Data API)
    return {
      status: metrics.status,
      created_at: metrics.created_at,
      stream_key: metrics.stream_key,
      // Add more metrics as needed
    }
  } catch (error) {
    console.error('Error fetching stream metrics:', error)
    throw new Error('Failed to fetch stream metrics')
  }
}

// Utility function to check if MUX credentials are configured
export function isMuxConfigured(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET)
}

// Utility function to get playback URL
export function getPlaybackUrl(playbackId: string, isLive: boolean = false): string {
  if (isLive) {
    return `https://stream.mux.com/${playbackId}.m3u8`
  }
  return `https://stream.mux.com/${playbackId}.m3u8`
}

// Utility function to get thumbnail URL
export function getThumbnailUrl(playbackId: string, options?: {
  width?: number
  height?: number
  fit_mode?: 'preserve' | 'crop' | 'pad'
  time?: number
}): string {
  const params = new URLSearchParams()
  
  if (options?.width) params.append('width', options.width.toString())
  if (options?.height) params.append('height', options.height.toString())
  if (options?.fit_mode) params.append('fit_mode', options.fit_mode)
  if (options?.time) params.append('time', options.time.toString())
  
  const queryString = params.toString()
  const baseUrl = `https://image.mux.com/${playbackId}/thumbnail.png`
  
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// Error handling helper
export function handleMuxError(error: any): string {
  if (error?.response?.data?.error) {
    return error.response.data.error.messages?.join(', ') || 'MUX API error'
  }
  
  if (error?.message) {
    return error.message
  }
  
  return 'Unknown MUX error occurred'
}

// Export the Video client for direct use if needed
export { Video }