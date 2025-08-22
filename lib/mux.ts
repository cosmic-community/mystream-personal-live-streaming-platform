import Mux from '@mux/mux-node'
import type { StreamSession } from '@/types'

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string,
})

export interface MuxAsset {
  id: string
  status: string
  playback_ids?: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  tracks?: Array<{
    type: string
    max_width?: number
    max_height?: number
  }>
}

export interface MuxLiveStream {
  id: string
  status: string
  stream_key: string
  playback_ids?: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
}

// Create a new live stream
export async function createLiveStream(options?: {
  playback_policy?: Array<'public' | 'signed'>
}): Promise<MuxLiveStream> {
  try {
    const streamOptions: any = {
      playback_policy: options?.playback_policy || ['public'],
      new_asset_settings: {
        playback_policy: options?.playback_policy || ['public']
      }
    }

    const liveStream = await mux.video.liveStreams.create(streamOptions)
    return liveStream as MuxLiveStream
  } catch (error) {
    console.error('Error creating live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get live stream details
export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    return liveStream as MuxLiveStream
  } catch (error) {
    console.error('Error fetching live stream:', error)
    return null
  }
}

// Delete a live stream
export async function deleteLiveStream(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(streamId)
    return true
  } catch (error) {
    console.error('Error deleting live stream:', error)
    return false
  }
}

// Get primary playback ID from stream session
export function getPrimaryPlaybackId(stream: StreamSession): string | null {
  return stream.metadata?.mux_playback_id || null
}

// Create a new asset for recording
export async function createAsset(options?: {
  playback_policy?: Array<'public' | 'signed'>
}): Promise<MuxAsset> {
  try {
    const assetOptions: any = {
      playback_policy: options?.playback_policy || ['public']
    }

    const asset = await mux.video.assets.create(assetOptions)
    return asset as MuxAsset
  } catch (error) {
    console.error('Error creating asset:', error)
    throw new Error('Failed to create asset')
  }
}

// Get asset details
export async function getAsset(assetId: string): Promise<MuxAsset | null> {
  try {
    const asset = await mux.video.assets.retrieve(assetId)
    return asset as MuxAsset
  } catch (error) {
    console.error('Error fetching asset:', error)
    return null
  }
}

// Delete an asset
export async function deleteAsset(assetId: string): Promise<boolean> {
  try {
    await mux.video.assets.del(assetId)
    return true
  } catch (error) {
    console.error('Error deleting asset:', error)
    return false
  }
}

// Utility functions
export function getPlaybackUrl(playbackId: string, signed: boolean = false): string {
  if (signed) {
    // For signed URLs, you would need to implement JWT token generation
    return `https://stream.mux.com/${playbackId}.m3u8`
  }
  return `https://stream.mux.com/${playbackId}.m3u8`
}

export function getThumbnailUrl(playbackId: string, options?: {
  time?: number
  width?: number
  height?: number
}): string {
  const params = new URLSearchParams()
  
  if (options?.time !== undefined) {
    params.set('time', options.time.toString())
  }
  if (options?.width) {
    params.set('width', options.width.toString())
  }
  if (options?.height) {
    params.set('height', options.height.toString())
  }

  const queryString = params.toString()
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}

// Stream status helpers
export function isStreamActive(stream: MuxLiveStream): boolean {
  return stream.status === 'active'
}

export function isStreamReady(stream: MuxLiveStream): boolean {
  return stream.status === 'ready' || stream.status === 'active'
}

// Error handling helper
export function isMuxError(error: unknown): error is { type: string; messages: string[] } {
  return typeof error === 'object' && error !== null && 'type' in error && 'messages' in error
}