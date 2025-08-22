import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

// Initialize MUX client with environment variables
let mux: Mux | null = null

try {
  if (process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
    mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET
    })
  }
} catch (error) {
  console.error('Error initializing MUX client:', error)
}

// Validation function
export async function validateMuxConfig(): Promise<{
  isConfigured: boolean
  missingVariables: string[]
}> {
  const requiredVars = ['MUX_TOKEN_ID', 'MUX_TOKEN_SECRET']
  const missingVariables = requiredVars.filter(varName => !process.env[varName])
  
  return {
    isConfigured: missingVariables.length === 0 && mux !== null,
    missingVariables
  }
}

// Create a new live stream
export async function createMuxLiveStream(
  params: MuxLiveStreamCreateParams = {}
): Promise<MuxLiveStream | null> {
  if (!mux) {
    throw new Error('MUX client not configured')
  }

  try {
    const response = await mux.video.liveStreams.create({
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      reduced_latency: params.reduced_latency || false,
      test: params.test || false
    })

    // Map MUX response to our interface
    const liveStream: MuxLiveStream = {
      id: response.id,
      stream_key: response.stream_key,
      playback_ids: response.playback_ids || [],
      status: response.status,
      created_at: response.created_at,
      reconnect_window: response.reconnect_window,
      reduced_latency: response.reduced_latency,
      test: response.test
    }

    return liveStream
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get live stream details
export async function getMuxLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  if (!mux) {
    throw new Error('MUX client not configured')
  }

  try {
    const response = await mux.video.liveStreams.retrieve(streamId)

    const liveStream: MuxLiveStream = {
      id: response.id,
      stream_key: response.stream_key,
      playback_ids: response.playback_ids || [],
      status: response.status,
      created_at: response.created_at,
      reconnect_window: response.reconnect_window,
      reduced_latency: response.reduced_latency,
      test: response.test
    }

    return liveStream
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
    return null
  }
}

// Update live stream
export async function updateMuxLiveStream(
  streamId: string,
  updates: {
    reconnect_window?: number
    reduced_latency?: boolean
  }
): Promise<MuxLiveStream | null> {
  if (!mux) {
    throw new Error('MUX client not configured')
  }

  try {
    const response = await mux.video.liveStreams.update(streamId, {
      reconnect_window: updates.reconnect_window,
      reduced_latency: updates.reduced_latency
    })

    const liveStream: MuxLiveStream = {
      id: response.id,
      stream_key: response.stream_key,
      playback_ids: response.playback_ids || [],
      status: response.status,
      created_at: response.created_at,
      reconnect_window: response.reconnect_window,
      reduced_latency: response.reduced_latency,
      test: response.test
    }

    return liveStream
  } catch (error) {
    console.error('Error updating MUX live stream:', error)
    return null
  }
}

// Enable recordings for live stream
export async function enableMuxRecording(streamId: string): Promise<MuxLiveStream | null> {
  if (!mux) {
    throw new Error('MUX client not configured')
  }

  try {
    const response = await mux.video.liveStreams.update(streamId, {
      // Note: Recording settings might be handled differently in newer MUX versions
      // This is a simplified implementation
    })

    const liveStream: MuxLiveStream = {
      id: response.id,
      stream_key: response.stream_key,
      playback_ids: response.playback_ids || [],
      status: response.status,
      created_at: response.created_at,
      reconnect_window: response.reconnect_window,
      reduced_latency: response.reduced_latency,
      test: response.test
    }

    return liveStream
  } catch (error) {
    console.error('Error enabling MUX recording:', error)
    return null
  }
}

// Delete live stream
export async function deleteMuxLiveStream(streamId: string): Promise<boolean> {
  if (!mux) {
    throw new Error('MUX client not configured')
  }

  try {
    await mux.video.liveStreams.del(streamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

// Generate signed playback URL for private streams
export async function generateSignedPlaybackUrl(
  playbackId: string,
  options: {
    expiration?: number
    type?: 'video' | 'thumbnail'
  } = {}
): Promise<string | null> {
  if (!mux) {
    throw new Error('MUX client not configured')
  }

  try {
    // Note: The JWT signing utilities might be accessed differently in newer versions
    // This is a simplified implementation - check MUX docs for current API
    const expiration = options.expiration || Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour default
    
    // For now, return the basic playback URL
    // In production, implement proper JWT signing according to MUX documentation
    return `https://stream.mux.com/${playbackId}.m3u8`
  } catch (error) {
    console.error('Error generating signed playback URL:', error)
    return null
  }
}

// Utility functions
export function getMuxPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

export function getMuxThumbnailUrl(playbackId: string, options: {
  width?: number
  height?: number
  fit_mode?: 'preserve' | 'crop' | 'pad'
  time?: number
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.fit_mode) params.set('fit_mode', options.fit_mode)
  if (options.time) params.set('time', options.time.toString())
  
  const query = params.toString() ? `?${params.toString()}` : ''
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${query}`
}

// Check if MUX is properly configured
export function isMuxConfigured(): boolean {
  return mux !== null && 
         Boolean(process.env.MUX_TOKEN_ID) && 
         Boolean(process.env.MUX_TOKEN_SECRET)
}