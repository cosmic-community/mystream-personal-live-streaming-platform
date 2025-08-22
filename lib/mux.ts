import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams, MuxValidationResult } from '@/types'

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

// FIXED: Corrected export names to match what's imported in other files
export async function createMuxLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStream> {
  try {
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      test: params.test || false
    })

    return {
      id: liveStream.id!,
      stream_key: liveStream.stream_key!,
      playback_ids: liveStream.playback_ids || [],
      status: liveStream.status!,
      created_at: liveStream.created_at!,
      reconnect_window: liveStream.reconnect_window,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

export async function getMuxLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    
    if (!liveStream) {
      return null
    }

    return {
      id: liveStream.id!,
      stream_key: liveStream.stream_key!,
      playback_ids: liveStream.playback_ids || [],
      status: liveStream.status!,
      created_at: liveStream.created_at!,
      reconnect_window: liveStream.reconnect_window,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
    return null
  }
}

export async function deleteMuxLiveStream(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(streamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

export async function getMuxAsset(assetId: string) {
  try {
    const asset = await mux.video.assets.retrieve(assetId)
    return asset
  } catch (error) {
    console.error('Error fetching MUX asset:', error)
    return null
  }
}

export async function createMuxAsset(input: { url: string }) {
  try {
    const asset = await mux.video.assets.create({
      input: [{ url: input.url }],
      playback_policy: ['public']
    })
    return asset
  } catch (error) {
    console.error('Error creating MUX asset:', error)
    throw new Error('Failed to create asset')
  }
}

// FIXED: Corrected property name from 'playbook_ids' to 'playback_ids' 
export function getMuxPlaybackUrl(assetId: string, playbackId?: string): string | null {
  try {
    if (playbackId) {
      return `https://stream.mux.com/${playbackId}.m3u8`
    }
    
    // If no playback ID provided, we can't construct the URL
    return null
  } catch (error) {
    console.error('Error getting MUX playback URL:', error)
    return null
  }
}

export function getMuxThumbnailUrl(playbackId: string, options: {
  width?: number
  height?: number
  time?: number
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  if (options.time) params.append('time', options.time.toString())
  
  const queryString = params.toString()
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}

// FIXED: Return the correct MuxValidationResult type instead of Promise
export async function validateMuxCredentials(): Promise<MuxValidationResult> {
  try {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      return {
        isValid: false,
        error: 'MUX credentials not configured'
      }
    }

    // Test the credentials by listing live streams (with limit to minimize API usage)
    await mux.video.liveStreams.list({ limit: 1 })
    
    return {
      isValid: true
    }
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message || 'Invalid MUX credentials'
    }
  }
}

// FIXED: Corrected property name from 'playbook_ids' to 'playback_ids'
export function getAssetPlaybackIds(asset: any): string[] {
  if (!asset || !asset.playback_ids) {
    return []
  }
  
  return asset.playback_ids.map((playback: any) => playback.id).filter(Boolean)
}

export function getLiveStreamPlaybackIds(liveStream: MuxLiveStream): string[] {
  if (!liveStream.playback_ids) {
    return []
  }
  
  return liveStream.playback_ids.map(playback => playback.id).filter(Boolean)
}

// Helper functions
export function isMuxConfigured(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET)
}

export function getMuxStreamStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'idle': 'Idle',
    'active': 'Live',
    'disabled': 'Disabled'
  }
  return statusMap[status] || status
}

export function getMuxStreamStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'idle': 'text-yellow-500',
    'active': 'text-red-500',
    'disabled': 'text-gray-500'
  }
  return colorMap[status] || 'text-gray-500'
}

// Utility function to format stream key for display (showing only last 8 characters)
export function formatStreamKeyForDisplay(streamKey: string): string {
  if (streamKey.length <= 8) {
    return streamKey
  }
  return `${'*'.repeat(streamKey.length - 8)}${streamKey.slice(-8)}`
}