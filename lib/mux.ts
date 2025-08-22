import Mux from '@mux/mux-node'

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string,
})

// Types for Mux integration
export interface MuxLiveStreamData {
  playback_id: string
  stream_key: string
  status: 'idle' | 'active' | 'disconnected'
}

export interface CreateLiveStreamOptions {
  playback_policy: 'public' | 'signed'
  new_asset_settings?: {
    playback_policy: 'public' | 'signed'
  }
}

// Create a new live stream
export async function createMuxLiveStream(options: CreateLiveStreamOptions = { playbook_policy: 'public' }): Promise<MuxLiveStreamData> {
  try {
    const liveStream = await mux.video.liveStreams.create(options)
    
    return {
      playback_id: liveStream.playback_ids?.[0]?.id || '',
      stream_key: liveStream.stream_key || '',
      status: liveStream.status || 'idle'
    }
  } catch (error) {
    console.error('Error creating Mux live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get live stream details
export async function getMuxLiveStream(streamId: string): Promise<MuxLiveStreamData | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    
    return {
      playback_id: liveStream.playback_ids?.[0]?.id || '',
      stream_key: liveStream.stream_key || '',
      status: liveStream.status || 'idle'
    }
  } catch (error) {
    console.error('Error fetching Mux live stream:', error)
    return null
  }
}

// Delete a live stream
export async function deleteMuxLiveStream(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(streamId)
    return true
  } catch (error) {
    console.error('Error deleting Mux live stream:', error)
    return false
  }
}

// Generate Mux player URL for video playback
export function getMuxPlayerUrl(playbackId: string, options: {
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
} = {}): string {
  const baseUrl = `https://stream.mux.com/${playbackId}.m3u8`
  
  // Add query parameters for player options
  const params = new URLSearchParams()
  
  if (options.autoplay) params.append('autoplay', '1')
  if (options.muted) params.append('muted', '1')
  if (options.loop) params.append('loop', '1')
  if (options.controls !== false) params.append('controls', '1')
  
  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// Generate thumbnail URL for a playback ID
export function getMuxThumbnailUrl(playbackId: string, options: {
  width?: number
  height?: number
  fit_mode?: 'preserve' | 'crop' | 'fill'
  time?: number
} = {}): string {
  const baseUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`
  
  const params = new URLSearchParams()
  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  if (options.fit_mode) params.append('fit_mode', options.fit_mode)
  if (options.time) params.append('time', options.time.toString())
  
  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// Get live stream status
export async function getMuxStreamStatus(streamId: string): Promise<'idle' | 'active' | 'disconnected' | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    return liveStream.status || null
  } catch (error) {
    console.error('Error fetching stream status:', error)
    return null
  }
}

// Create a new asset from a live stream recording
export async function createAssetFromLiveStream(liveStreamId: string, options: {
  playback_policy?: 'public' | 'signed'
} = {}): Promise<string | null> {
  try {
    const asset = await mux.video.assets.create({
      input: [{
        url: `mux://live-streams/${liveStreamId}`
      }],
      playback_policy: [options.playback_policy || 'public']
    })
    
    return asset.id || null
  } catch (error) {
    console.error('Error creating asset from live stream:', error)
    return null
  }
}

// Utility function to validate Mux credentials
export function validateMuxCredentials(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET)
}

// Export the Mux client for direct usage if needed
export { mux }

// Export class name for TypeScript error resolution  
export class MuxLiveStream {
  constructor(public data: MuxLiveStreamData) {}
  
  get playbackId(): string {
    return this.data.playback_id
  }
  
  get streamKey(): string {
    return this.data.stream_key
  }
  
  get status(): string {
    return this.data.status
  }
  
  getPlayerUrl(options?: Parameters<typeof getMuxPlayerUrl>[1]): string {
    return getMuxPlayerUrl(this.data.playback_id, options)
  }
  
  getThumbnailUrl(options?: Parameters<typeof getMuxThumbnailUrl>[1]): string {
    return getMuxThumbnailUrl(this.data.playback_id, options)
  }
}