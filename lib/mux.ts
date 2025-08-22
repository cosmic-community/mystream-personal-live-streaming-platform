import Mux from '@mux/mux-node'

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
})

export interface MuxLiveStreamOptions {
  playback_policy: 'public' | 'signed'
  new_asset_settings?: {
    playback_policy: 'public' | 'signed'
  }
}

export interface MuxLiveStream {
  id: string
  stream_key: string
  playback_ids: Array<{
    id: string
    policy: string
  }>
  status: 'idle' | 'active'
  created_at: string
}

export interface MuxAsset {
  id: string
  status: 'preparing' | 'ready' | 'errored'
  playback_ids: Array<{
    id: string
    policy: string
  }>
  duration?: number
  created_at: string
}

export async function createLiveStream(options: MuxLiveStreamOptions = { playback_policy: 'public' }): Promise<MuxLiveStream> {
  try {
    const response = await mux.video.liveStreams.create({
      playback_policy: [options.playback_policy],
      new_asset_settings: options.new_asset_settings
    })

    return {
      id: response.id || '',
      stream_key: response.stream_key || '',
      playback_ids: response.playback_ids || [],
      status: response.status as 'idle' | 'active' || 'idle',
      created_at: response.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error creating Mux live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const response = await mux.video.liveStreams.retrieve(streamId)

    return {
      id: response.id || '',
      stream_key: response.stream_key || '',
      playback_ids: response.playback_ids || [],
      status: response.status as 'idle' | 'active' || 'idle',
      created_at: response.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error retrieving Mux live stream:', error)
    return null
  }
}

export async function deleteLiveStream(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(streamId)
    return true
  } catch (error) {
    console.error('Error deleting Mux live stream:', error)
    return false
  }
}

export async function getAsset(assetId: string): Promise<MuxAsset | null> {
  try {
    const response = await mux.video.assets.retrieve(assetId)

    return {
      id: response.id || '',
      status: response.status as 'preparing' | 'ready' | 'errored' || 'preparing',
      playback_ids: response.playback_ids || [],
      duration: response.duration,
      created_at: response.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error retrieving Mux asset:', error)
    return null
  }
}

export async function createAssetFromLiveStream(liveStreamId: string): Promise<MuxAsset | null> {
  try {
    const response = await mux.video.assets.create({
      input: [{ url: `mux://live-streams/${liveStreamId}` }],
      playback_policy: ['public']
    })

    return {
      id: response.id || '',
      status: response.status as 'preparing' | 'ready' | 'errored' || 'preparing',
      playback_ids: response.playback_ids || [],
      duration: response.duration,
      created_at: response.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error creating asset from live stream:', error)
    return null
  }
}

export function getPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

export function getThumbnailUrl(playbackId: string, options: {
  width?: number
  height?: number
  fit_mode?: 'preserve' | 'crop' | 'pad'
  time?: number
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.fit_mode) params.set('fit_mode', options.fit_mode)
  if (options.time !== undefined) params.set('time', options.time.toString())

  const queryString = params.toString()
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}

export function isValidPlaybackId(playbackId: string): boolean {
  if (!playbackId || typeof playbackId !== 'string') {
    return false
  }

  // Mux playback IDs are typically alphanumeric strings
  return /^[a-zA-Z0-9]+$/.test(playbackId) && playbackId.length > 10
}

export function parseWebhookSignature(signature: string, secret: string, body: string): boolean {
  try {
    // Mux webhook signature verification logic would go here
    // This is a simplified version - in production you'd use the actual Mux webhook verification
    return signature.includes('mux-signature')
  } catch (error) {
    console.error('Error parsing webhook signature:', error)
    return false
  }
}