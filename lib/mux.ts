import { MuxLiveStream, MuxPlaybackId } from '@/types'

// MUX Configuration
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables are required')
}

// Initialize MUX SDK with proper error handling
let Mux: any
try {
  Mux = require('@mux/mux-node')
} catch (error) {
  console.warn('MUX SDK not available - streaming functionality will be limited')
}

const mux = Mux ? new Mux({
  tokenId: MUX_TOKEN_ID,
  tokenSecret: MUX_TOKEN_SECRET,
}) : null

export async function createLiveStream(options: {
  reconnectWindow?: number
  reducedLatency?: boolean  
  test?: boolean
} = {}): Promise<MuxLiveStream | null> {
  if (!mux) {
    console.error('MUX SDK not available')
    return null
  }

  try {
    const liveStream = await mux.video.liveStreams.create({
      reconnect_window: options.reconnectWindow || 60,
      reduced_latency: options.reducedLatency || false,
      test: options.test || false,
      playback_policy: ['public']
    })

    // Transform MUX response to match our types
    const playbackIds: MuxPlaybackId[] = (liveStream.playback_ids || []).map((playbackId: any) => ({
      id: playbackId.id,
      policy: playbackId.policy === 'drm' ? 'signed' : playbackId.policy as 'public' | 'signed'
    }))

    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: playbackIds,
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

export async function getLiveStream(liveStreamId: string): Promise<MuxLiveStream | null> {
  if (!mux) {
    console.error('MUX SDK not available')
    return null
  }

  try {
    const liveStream = await mux.video.liveStreams.retrieve(liveStreamId)
    
    // Transform MUX response to match our types
    const playbackIds: MuxPlaybackId[] = (liveStream.playback_ids || []).map((playbackId: any) => ({
      id: playbackId.id,
      policy: playbackId.policy === 'drm' ? 'signed' : playbackId.policy as 'public' | 'signed'
    }))

    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: playbackIds,
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error retrieving MUX live stream:', error)
    return null
  }
}

export async function deleteLiveStream(liveStreamId: string): Promise<boolean> {
  if (!mux) {
    console.error('MUX SDK not available')
    return false
  }

  try {
    // Use the correct method name for MUX SDK
    await mux.video.liveStreams.delete(liveStreamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

export async function createAsset(input: { url: string }): Promise<any> {
  if (!mux) {
    console.error('MUX SDK not available')
    return null
  }

  try {
    const asset = await mux.video.assets.create({
      input: [input],
      playback_policy: ['public']
    })
    return asset
  } catch (error) {
    console.error('Error creating MUX asset:', error)
    throw new Error('Failed to create asset')
  }
}

export async function getAsset(assetId: string): Promise<any> {
  if (!mux) {
    console.error('MUX SDK not available')  
    return null
  }

  try {
    return await mux.video.assets.retrieve(assetId)
  } catch (error) {
    console.error('Error retrieving MUX asset:', error)
    return null
  }
}

export function generatePlaybackUrl(playbackId: string, options?: {
  token?: string
  thumbnailTime?: number
}): string {
  let url = `https://stream.mux.com/${playbackId}.m3u8`
  
  if (options?.token) {
    url += `?token=${options.token}`
  }
  
  return url
}

export function generateThumbnailUrl(playbackId: string, options?: {
  time?: number
  width?: number
  height?: number
  fitMode?: string
}): string {
  let url = `https://image.mux.com/${playbackId}/thumbnail.jpg`
  
  const params = new URLSearchParams()
  if (options?.time !== undefined) params.append('time', options.time.toString())
  if (options?.width) params.append('width', options.width.toString())
  if (options?.height) params.append('height', options.height.toString())
  if (options?.fitMode) params.append('fit_mode', options.fitMode)
  
  const queryString = params.toString()
  if (queryString) {
    url += `?${queryString}`
  }
  
  return url
}

// Helper function to validate MUX configuration
export function validateMuxConfig(): boolean {
  return Boolean(MUX_TOKEN_ID && MUX_TOKEN_SECRET && mux)
}

// Helper function to get MUX webhook signature verification
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!mux || !mux.webhooks) {
    return false
  }

  try {
    return mux.webhooks.verifyHeader(rawBody, signature, secret)
  } catch (error) {
    console.error('Error verifying MUX webhook signature:', error)
    return false
  }
}