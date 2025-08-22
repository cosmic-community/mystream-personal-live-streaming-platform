import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams, MuxValidationResult } from '@/types'

// Initialize MUX client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
})

// FIXED: Access Video through mux instance, not as direct property
const { video } = mux

// FIXED: Corrected function name to match imports (createMuxLiveStream -> createLiveStream)
export async function createLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStream> {
  try {
    const liveStream = await video.liveStreams.create({
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      test: params.test || false
    })

    return {
      id: liveStream.id!,
      stream_key: liveStream.stream_key!,
      playback_ids: liveStream.playback_ids?.map(pid => ({
        id: pid.id!,
        policy: pid.policy as 'public' | 'signed' | 'drm'
      })) || [],
      status: liveStream.status || '',
      created_at: liveStream.created_at || '',
      reconnect_window: liveStream.reconnect_window,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// FIXED: Corrected function name to match imports (getMuxLiveStream -> getLiveStream)
export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await video.liveStreams.retrieve(streamId)
    
    if (!liveStream) {
      return null
    }

    return {
      id: liveStream.id!,
      stream_key: liveStream.stream_key!,
      playback_ids: liveStream.playback_ids?.map(pid => ({
        id: pid.id!,
        policy: pid.policy as 'public' | 'signed' | 'drm'
      })) || [],
      status: liveStream.status || '',
      created_at: liveStream.created_at || '',
      reconnect_window: liveStream.reconnect_window,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
    return null
  }
}

// FIXED: Corrected function name to match imports (deleteMuxLiveStream -> deleteLiveStream)
export async function deleteLiveStream(streamId: string): Promise<boolean> {
  try {
    await video.liveStreams.delete(streamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

// FIXED: Added missing validateMuxCredentials function that was being imported
export async function validateMuxCredentials(): Promise<MuxValidationResult> {
  try {
    // Test credentials by attempting to list live streams
    await video.liveStreams.list({ limit: 1 })
    
    return {
      isValid: true,
      data: { message: 'MUX credentials are valid' }
    }
  } catch (error) {
    console.error('MUX credentials validation failed:', error)
    
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid MUX credentials'
    }
  }
}

// Additional helper functions
export async function getAssetPlaybackId(assetId: string): Promise<string | null> {
  try {
    const asset = await video.assets.retrieve(assetId)
    
    if (asset.playback_ids && asset.playback_ids.length > 0) {
      return asset.playback_ids[0]!.id || null
    }
    
    return null
  } catch (error) {
    console.error('Error fetching MUX asset playback ID:', error)
    return null
  }
}

export async function createAssetFromUrl(url: string): Promise<string | null> {
  try {
    const asset = await video.assets.create({
      input: [{ url }],
      playback_policy: ['public']
    })
    
    return asset.id || null
  } catch (error) {
    console.error('Error creating MUX asset from URL:', error)
    return null
  }
}

export function generateStreamUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

export function generateThumbnailUrl(playbackId: string, options?: {
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
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}