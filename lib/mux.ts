import Mux from '@mux/mux-node'
import jwt from 'jsonwebtoken'

// Initialize MUX client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

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
  aspect_ratio?: string
}

export interface MuxWebhookEvent {
  type: string
  object: {
    type: string
    id: string
  }
  id: string
  created_at: string
  data: Record<string, any>
}

// Create a new live stream
export async function createLiveStream(options: {
  playback_policy?: ('public' | 'signed')[]
  reconnect_window?: number
  reduced_latency?: boolean
  test?: boolean
} = {}): Promise<MuxLiveStreamResponse> {
  try {
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: options.playback_policy || ['public'],
      reconnect_window: options.reconnect_window || 60,
      reduced_latency: options.reduced_latency || false,
      test: options.test || false,
    })

    return {
      id: liveStream.id!,
      stream_key: liveStream.stream_key!,
      status: liveStream.status!,
      playback_ids: liveStream.playback_ids?.map(pid => ({
        id: pid.id!,
        policy: pid.policy! as 'public' | 'signed'
      })) || [],
      created_at: liveStream.created_at!,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test,
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get live stream details
export async function getLiveStream(streamId: string): Promise<MuxLiveStreamResponse | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    
    if (!liveStream) return null

    return {
      id: liveStream.id!,
      stream_key: liveStream.stream_key!,
      status: liveStream.status!,
      playback_ids: liveStream.playback_ids?.map(pid => ({
        id: pid.id!,
        policy: pid.policy! as 'public' | 'signed'
      })) || [],
      created_at: liveStream.created_at!,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test,
    }
  } catch (error) {
    console.error('Error retrieving MUX live stream:', error)
    return null
  }
}

// Delete a live stream
export async function deleteLiveStream(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(streamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

// Create an asset from a live stream recording
export async function createAssetFromLiveStream(liveStreamId: string): Promise<MuxAssetResponse | null> {
  try {
    const asset = await mux.video.assets.create({
      input: [{ url: `mux://live-streams/${liveStreamId}` }],
      playback_policy: ['public'],
    })

    return {
      id: asset.id!,
      status: asset.status!,
      playback_ids: asset.playback_ids?.map(pid => ({
        id: pid.id!,
        policy: pid.policy! as 'public' | 'signed'
      })) || [],
      created_at: asset.created_at!,
      duration: asset.duration,
      aspect_ratio: asset.aspect_ratio,
    }
  } catch (error) {
    console.error('Error creating MUX asset from live stream:', error)
    return null
  }
}

// Generate a signed playback URL for private content
export function generateSignedPlaybackUrl(
  playbackId: string,
  options: {
    expirationTime?: number // seconds from now
    type?: 'video' | 'thumbnail' | 'gif' | 'storyboard'
  } = {}
): string {
  const { expirationTime = 3600, type = 'video' } = options

  if (!process.env.MUX_SIGNING_KEY || !process.env.MUX_PRIVATE_KEY) {
    throw new Error('MUX signing credentials not configured')
  }

  try {
    // FIXED: Use standard JWT payload structure instead of MUX-specific options
    const payload = {
      sub: playbackId,
      aud: type,
      exp: Math.floor(Date.now() / 1000) + expirationTime,
      kid: process.env.MUX_SIGNING_KEY,
    }

    const token = jwt.sign(payload, process.env.MUX_PRIVATE_KEY.replace(/\\n/g, '\n'), {
      algorithm: 'RS256',
    })

    // FIXED: Manually construct the URL instead of using non-existent createUrl method
    return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
  } catch (error) {
    console.error('Error generating signed playback URL:', error)
    throw new Error('Failed to generate signed playback URL')
  }
}

// Generate a thumbnail URL
export function generateThumbnailUrl(
  playbackId: string,
  options: {
    time?: number // seconds
    width?: number
    height?: number
    fit_mode?: 'preserve' | 'stretch' | 'crop' | 'pad'
    flip_v?: boolean
    flip_h?: boolean
  } = {}
): string {
  const params = new URLSearchParams()
  
  if (options.time !== undefined) params.append('time', options.time.toString())
  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  if (options.fit_mode) params.append('fit_mode', options.fit_mode)
  if (options.flip_v) params.append('flip_v', 'true')
  if (options.flip_h) params.append('flip_h', 'true')

  const queryString = params.toString()
  return `https://image.mux.com/${playbackId}/thumbnail.png${queryString ? `?${queryString}` : ''}`
}

// Get live stream metrics
export async function getLiveStreamMetrics(streamId: string): Promise<{
  viewers: number
  concurrent_viewers: number
  total_watch_time: number
} | null> {
  try {
    const metrics = await mux.data.metrics.get(streamId, {
      timeframe: ['1:hour'],
      measurement: ['concurrent_viewers', 'total_watch_time'],
    })

    // FIXED: Access metrics data safely without assuming 'breakdown' property exists
    if (!metrics || !metrics.data || metrics.data.length === 0) {
      return {
        viewers: 0,
        concurrent_viewers: 0,
        total_watch_time: 0,
      }
    }

    const data = metrics.data[0]
    
    return {
      viewers: data?.total_watch_time || 0,
      concurrent_viewers: data?.concurrent_viewers || 0,
      total_watch_time: data?.total_watch_time || 0,
    }
  } catch (error) {
    console.error('Error retrieving MUX metrics:', error)
    return null
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    // FIXED: Use Mux.Webhooks instead of non-existent mux.webhooks
    return Mux.Webhooks.verifyHeader(rawBody, signature, secret)
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

// Parse webhook payload
export function parseWebhookPayload(payload: any): MuxWebhookEvent | null {
  try {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    return {
      type: payload.type || '',
      object: {
        type: payload.object?.type || '',
        id: payload.object?.id || '',
      },
      id: payload.id || '',
      created_at: payload.created_at || '',
      data: payload.data || {},
    }
  } catch (error) {
    console.error('Error parsing webhook payload:', error)
    return null
  }
}

// Helper function to get playback ID from live stream
export function getPlaybackIdFromLiveStream(liveStream: MuxLiveStreamResponse): string | null {
  const publicPlaybackId = liveStream.playbook_ids?.find(pid => pid.policy === 'public')
  return publicPlaybackId?.id || null
}

// Helper function to check if stream is live
export function isStreamLive(status: string): boolean {
  return status === 'active' || status === 'connected'
}

// Helper function to format stream duration
export function formatStreamDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Helper function to get stream quality settings
export function getStreamQualitySettings(quality: '720p' | '1080p' | '4k'): {
  width: number
  height: number
  bitrate: number
} {
  const settings = {
    '720p': { width: 1280, height: 720, bitrate: 2500 },
    '1080p': { width: 1920, height: 1080, bitrate: 4500 },
    '4k': { width: 3840, height: 2160, bitrate: 15000 },
  }
  
  return settings[quality] || settings['1080p']
}

export default mux