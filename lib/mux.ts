import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

// Validate environment variables
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error('Missing MUX environment variables. Please check MUX_TOKEN_ID and MUX_TOKEN_SECRET are set.')
}

// Initialize MUX client only if environment variables are present
const mux = MUX_TOKEN_ID && MUX_TOKEN_SECRET ? new Mux({
  tokenId: MUX_TOKEN_ID,
  tokenSecret: MUX_TOKEN_SECRET,
}) : null

// Error helper for MUX operations
function createMuxError(message: string): Error {
  return new Error(`MUX API Error: ${message}`)
}

// Live Streams API
export async function createMuxLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStream> {
  if (!mux) {
    throw createMuxError('MUX client not initialized. Check environment variables.')
  }

  try {
    const response = await mux.video.liveStreams.create({
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      reduced_latency: params.reduced_latency || false,
      test: params.test || false
    })

    return {
      id: response.id,
      stream_key: response.stream_key,
      playback_ids: response.playback_ids.map(p => ({
        id: p.id,
        policy: p.policy as 'public' | 'signed' | 'drm'
      })),
      status: response.status,
      created_at: response.created_at,
      reconnect_window: response.reconnect_window,
      reduced_latency: response.reduced_latency,
      test: response.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw createMuxError('Failed to create live stream')
  }
}

export async function getMuxLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  if (!mux) {
    throw createMuxError('MUX client not initialized. Check environment variables.')
  }

  try {
    const response = await mux.video.liveStreams.retrieve(streamId)

    return {
      id: response.id,
      stream_key: response.stream_key,
      playback_ids: response.playback_ids.map(p => ({
        id: p.id,
        policy: p.policy as 'public' | 'signed' | 'drm'
      })),
      status: response.status,
      created_at: response.created_at,
      reconnect_window: response.reconnect_window,
      reduced_latency: response.reduced_latency,
      test: response.test
    }
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
    return null
  }
}

export async function deleteMuxLiveStream(streamId: string): Promise<boolean> {
  if (!mux) {
    throw createMuxError('MUX client not initialized. Check environment variables.')
  }

  try {
    await mux.video.liveStreams.del(streamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

export async function enableMuxLiveStreamRecording(streamId: string): Promise<boolean> {
  if (!mux) {
    throw createMuxError('MUX client not initialized. Check environment variables.')
  }

  try {
    await mux.video.liveStreams.enableRecording(streamId)
    return true
  } catch (error) {
    console.error('Error enabling MUX recording:', error)
    return false
  }
}

export async function disableMuxLiveStreamRecording(streamId: string): Promise<boolean> {
  if (!mux) {
    throw createMuxError('MUX client not initialized. Check environment variables.')
  }

  try {
    await mux.video.liveStreams.disableRecording(streamId)
    return true
  } catch (error) {
    console.error('Error disabling MUX recording:', error)
    return false
  }
}

export async function getMuxAssetsByLiveStream(streamId: string): Promise<any[]> {
  if (!mux) {
    throw createMuxError('MUX client not initialized. Check environment variables.')
  }

  try {
    const response = await mux.video.assets.list({
      live_stream_id: streamId
    })
    
    return response.data || []
  } catch (error) {
    console.error('Error fetching MUX assets:', error)
    return []
  }
}

// Utility functions
export function getMuxPlaybackUrl(playbackId: string, token?: string): string {
  const baseUrl = 'https://stream.mux.com'
  return token ? `${baseUrl}/${playbackId}.m3u8?token=${token}` : `${baseUrl}/${playbackId}.m3u8`
}

export function getMuxThumbnailUrl(playbackId: string, options: {
  time?: number
  width?: number
  height?: number
  fit_mode?: 'preserve' | 'crop' | 'pad'
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.time) params.set('time', options.time.toString())
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.fit_mode) params.set('fit_mode', options.fit_mode)

  const queryString = params.toString()
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}

export function validateMuxConfiguration(): {
  isConfigured: boolean
  missingVariables: string[]
} {
  const missing: string[] = []
  
  if (!MUX_TOKEN_ID) missing.push('MUX_TOKEN_ID')
  if (!MUX_TOKEN_SECRET) missing.push('MUX_TOKEN_SECRET')
  
  return {
    isConfigured: missing.length === 0,
    missingVariables: missing
  }
}

export { mux }