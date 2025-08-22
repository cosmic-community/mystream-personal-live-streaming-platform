import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams, MuxValidationResult } from '@/types'

// Initialize MUX client
const { Video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string,
})

export async function createLiveStream(params: MuxLiveStreamCreateParams): Promise<MuxLiveStream> {
  try {
    const response = await Video.LiveStreams.create({
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      test: params.test || false
    })
    
    return {
      id: response.id!,
      stream_key: response.stream_key!,
      playback_ids: response.playback_ids || [],
      status: response.status || '',
      created_at: response.created_at || '',
      reconnect_window: response.reconnect_window,
      test: response.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const response = await Video.LiveStreams.get(streamId)
    
    if (!response) {
      return null
    }
    
    return {
      id: response.id!,
      stream_key: response.stream_key!,
      playback_ids: response.playback_ids || [],
      status: response.status || '',
      created_at: response.created_at || '',
      reconnect_window: response.reconnect_window,
      test: response.test
    }
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
    return null
  }
}

export async function deleteLiveStream(streamId: string): Promise<boolean> {
  try {
    // FIXED: Changed from 'del' to 'delete' to match current MUX SDK API
    await Video.LiveStreams.delete(streamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

export async function createAsset(input: { url: string }): Promise<string> {
  try {
    const response = await Video.Assets.create({
      input: input.url,
      playback_policy: ['public']
    })
    
    return response.id!
  } catch (error) {
    console.error('Error creating MUX asset:', error)
    throw new Error('Failed to create asset')
  }
}

export async function getAsset(assetId: string) {
  try {
    const response = await Video.Assets.get(assetId)
    return response
  } catch (error) {
    console.error('Error fetching MUX asset:', error)
    return null
  }
}

// Validation helpers
export function validateMuxConfig(): MuxValidationResult {
  const tokenId = process.env.MUX_TOKEN_ID
  const tokenSecret = process.env.MUX_TOKEN_SECRET
  
  if (!tokenId || !tokenSecret) {
    return {
      isValid: false,
      error: 'MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables are required'
    }
  }
  
  return { isValid: true }
}

export function generateStreamKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'live_'
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function validatePlaybackId(playbackId: string): boolean {
  // Basic validation for MUX playback ID format
  return typeof playbackId === 'string' && playbackId.length > 0 && /^[a-zA-Z0-9]+$/.test(playbackId)
}

// Helper function to get streaming status from MUX
export async function getStreamStatus(streamId: string): Promise<string> {
  try {
    const stream = await getLiveStream(streamId)
    return stream?.status || 'unknown'
  } catch (error) {
    console.error('Error getting stream status:', error)
    return 'error'
  }
}

// Helper function to check if stream is currently live
export async function isStreamLive(streamId: string): Promise<boolean> {
  try {
    const status = await getStreamStatus(streamId)
    return status === 'active' || status === 'connected'
  } catch (error) {
    console.error('Error checking if stream is live:', error)
    return false
  }
}