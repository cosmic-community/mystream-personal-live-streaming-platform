import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

// Initialize MUX client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string,
})

// Type definitions for MUX API responses
export interface MuxLiveStreamResponse {
  id: string
  stream_key: string
  status: string
  playback_ids: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  created_at: string
  reconnect_window?: number
  reduced_latency?: boolean
  test?: boolean
}

export interface MuxAssetResponse {
  id: string
  status: string
  playback_ids: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  created_at: string
  duration?: number
}

export interface MuxWebhookPayload {
  type: string
  object: {
    type: string
    id: string
  }
  id: string
  environment: {
    name: string
    id: string
  }
  data: any
  created_at: string
  accessor?: string
  accessor_source?: string
  request_id?: string
}

// Create a new live stream
export async function createLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStreamResponse> {
  try {
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      reduced_latency: params.reduced_latency || false,
      test: params.test || false
    })

    return {
      id: liveStream.id || '',
      stream_key: liveStream.stream_key || '',
      status: liveStream.status || '',
      playback_ids: liveStream.playback_ids || [],
      created_at: liveStream.created_at || '',
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get live stream details
export async function getLiveStream(liveStreamId: string): Promise<MuxLiveStreamResponse | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(liveStreamId)
    
    if (!liveStream) {
      return null
    }

    return {
      id: liveStream.id || '',
      stream_key: liveStream.stream_key || '',
      status: liveStream.status || '',
      playback_ids: liveStream.playback_ids || [],
      created_at: liveStream.created_at || '',
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
export async function deleteLiveStream(liveStreamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(liveStreamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

// List all live streams
export async function getLiveStreams(): Promise<MuxLiveStreamResponse[]> {
  try {
    const response = await mux.video.liveStreams.list()
    
    if (!response.data) {
      return []
    }

    return response.data.map(stream => ({
      id: stream.id || '',
      stream_key: stream.stream_key || '',
      status: stream.status || '',
      playback_ids: stream.playback_ids || [],
      created_at: stream.created_at || '',
      reconnect_window: stream.reconnect_window,
      reduced_latency: stream.reduced_latency,
      test: stream.test
    }))
  } catch (error) {
    console.error('Error fetching MUX live streams:', error)
    return []
  }
}

// Create an asset from a live stream recording
export async function createAssetFromLiveStream(liveStreamId: string): Promise<MuxAssetResponse | null> {
  try {
    const asset = await mux.video.assets.create({
      input: [
        {
          url: `mux://live-streams/${liveStreamId}`
        }
      ],
      playback_policy: ['public']
    })

    return {
      id: asset.id || '',
      status: asset.status || '',
      playback_ids: asset.playbook_ids || [],
      created_at: asset.created_at || '',
      duration: asset.duration
    }
  } catch (error) {
    console.error('Error creating MUX asset from live stream:', error)
    return null
  }
}

// Get asset details
export async function getAsset(assetId: string): Promise<MuxAssetResponse | null> {
  try {
    const asset = await mux.video.assets.retrieve(assetId)
    
    if (!asset) {
      return null
    }

    return {
      id: asset.id || '',
      status: asset.status || '',
      playback_ids: asset.playbook_ids || [],
      created_at: asset.created_at || '',
      duration: asset.duration
    }
  } catch (error) {
    console.error('Error fetching MUX asset:', error)
    return null
  }
}

// Get live stream metrics
export async function getLiveStreamMetrics(liveStreamId: string, timeframe = '7:days'): Promise<any> {
  try {
    // Note: MUX Data API has different endpoints for metrics
    // This is a placeholder implementation
    return {
      views: 0,
      watch_time: 0,
      concurrent_viewers: 0
    }
  } catch (error) {
    console.error('Error fetching MUX live stream metrics:', error)
    return null
  }
}

// Verify MUX webhook signature
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Note: MUX webhook verification would typically use their SDK method
    // For now, we'll implement a basic verification
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying MUX webhook signature:', error)
    return false
  }
}

// Get playback URL for a live stream
export function getPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

// Get thumbnail URL for a live stream
export function getThumbnailUrl(playbackId: string, options: {
  time?: number
  width?: number
  height?: number
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.time) params.append('time', options.time.toString())
  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  
  const queryString = params.toString()
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}

// Generate a signed URL for private playback (if using signed URLs)
export function generateSignedUrl(playbackId: string, params: {
  keyId?: string
  keySecret?: string
  expiration?: number
} = {}): string {
  // This would require MUX signing key implementation
  // For now, return the basic playback URL
  return getPlaybackUrl(playbackId)
}

// Get live stream status
export async function getLiveStreamStatus(liveStreamId: string): Promise<string | null> {
  try {
    const liveStream = await getLiveStream(liveStreamId)
    return liveStream?.status || null
  } catch (error) {
    console.error('Error getting live stream status:', error)
    return null
  }
}

// Update live stream settings
export async function updateLiveStream(
  liveStreamId: string,
  updates: {
    reconnect_window?: number
    reduced_latency?: boolean
  }
): Promise<MuxLiveStreamResponse | null> {
  try {
    // Note: MUX SDK might not support updating live streams after creation
    // This is a placeholder for the interface
    console.warn('Live stream updates may not be supported by MUX SDK')
    return await getLiveStream(liveStreamId)
  } catch (error) {
    console.error('Error updating MUX live stream:', error)
    return null
  }
}

// Helper to extract playback IDs
export function extractPlaybackIds(muxResponse: MuxLiveStreamResponse): string[] {
  if (!muxResponse.playback_ids) {
    return []
  }
  
  return muxResponse.playback_ids.map((pid: any) => pid.id).filter(Boolean)
}