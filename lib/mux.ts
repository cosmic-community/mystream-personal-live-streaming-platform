import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Missing MUX credentials. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.')
}

// Initialize MUX client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

// Create a live stream
export async function createLiveStream(params?: MuxLiveStreamCreateParams): Promise<MuxLiveStream> {
  try {
    const createParams = {
      playback_policy: params?.playback_policy || ['public'],
      reconnect_window: params?.reconnect_window || 60,
      reduced_latency: params?.reduced_latency || false,
      test: params?.test || false,
    }

    const liveStream = await mux.video.liveStreams.create(createParams)

    return {
      id: liveStream.id || '',
      stream_key: liveStream.stream_key || '',
      playback_ids: liveStream.playbook_ids?.map(pb => ({
        id: pb.id || '',
        policy: pb.policy as 'public' | 'signed' || 'public'
      })) || [],
      status: liveStream.status || 'idle',
      created_at: liveStream.created_at || new Date().toISOString(),
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test,
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get a live stream
export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)

    if (!liveStream) {
      return null
    }

    return {
      id: liveStream.id || '',
      stream_key: liveStream.stream_key || '',
      playback_ids: liveStream.playbook_ids?.map(pb => ({
        id: pb.id || '',
        policy: pb.policy as 'public' | 'signed' || 'public'
      })) || [],
      status: liveStream.status || 'idle',
      created_at: liveStream.created_at || new Date().toISOString(),
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test,
    }
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
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
export async function createAssetFromLiveStream(liveStreamId: string): Promise<string | null> {
  try {
    const asset = await mux.video.assets.create({
      input: [{
        url: `mux://live-streams/${liveStreamId}`
      }],
      playbook_policy: ['public']
    })

    return asset.id || null
  } catch (error) {
    console.error('Error creating asset from live stream:', error)
    return null
  }
}

// Generate a signed playback URL for private content
export function generateSignedPlaybackUrl(
  playbackId: string, 
  keyId: string, 
  keySecret: string,
  expiration?: number
): string {
  try {
    // FIXED: Updated to use the correct JWT signing method
    const token = mux.jwt.signPlaybackId({
      playbackId,
      keyId,
      keySecret,
      expiration: expiration || Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    })

    return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
  } catch (error) {
    console.error('Error generating signed playback URL:', error)
    return `https://stream.mux.com/${playbackId}.m3u8`
  }
}

// Generate a thumbnail URL
export function generateThumbnailUrl(
  playbackId: string,
  options?: {
    time?: number
    width?: number
    height?: number
    fit_mode?: 'preserve' | 'stretch' | 'crop' | 'pad'
  }
): string {
  const params = new URLSearchParams()
  
  if (options?.time) params.set('time', options.time.toString())
  if (options?.width) params.set('width', options.width.toString())
  if (options?.height) params.set('height', options.height.toString())
  if (options?.fit_mode) params.set('fit_mode', options.fit_mode)

  const queryString = params.toString()
  return `https://image.mux.com/${playbackId}/thumbnail.png${queryString ? `?${queryString}` : ''}`
}

// Get live stream status
export async function getLiveStreamStatus(streamId: string): Promise<string | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    return liveStream?.status || null
  } catch (error) {
    console.error('Error getting live stream status:', error)
    return null
  }
}

// Get viewer count from metrics (simplified)
export async function getViewerCount(playbackId: string): Promise<number> {
  try {
    // FIXED: Updated metrics API call
    const metrics = await mux.data.metrics.get('video_view_end', {
      filters: [`playback_id:${playbackId}`],
      timeframe: ['now-1h', 'now'],
      group_by: 'minute'
    })

    // FIXED: Simplified metrics processing without 'breakdown' property
    if (metrics && Array.isArray(metrics.data)) {
      const latestData = metrics.data[metrics.data.length - 1]
      return latestData?.value || 0
    }

    return 0
  } catch (error) {
    console.error('Error getting viewer count:', error)
    return 0
  }
}

// Validate webhook signature
export function validateWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    // FIXED: Updated to use correct Webhooks API
    return Mux.Webhooks.verifyHeader(rawBody, signature, secret)
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

// Helper function to check if stream is live
export async function isStreamLive(streamId: string): Promise<boolean> {
  const status = await getLiveStreamStatus(streamId)
  return status === 'active'
}

// Helper function to get playback URL
export function getPlaybackUrl(playbackId: string, signed: boolean = false): string {
  if (signed) {
    const keyId = process.env.MUX_SIGNING_KEY_ID
    const keySecret = process.env.MUX_SIGNING_KEY_SECRET
    
    if (keyId && keySecret) {
      return generateSignedPlaybackUrl(playbackId, keyId, keySecret)
    }
  }
  
  return `https://stream.mux.com/${playbackId}.m3u8`
}

// Helper to format stream data for Cosmic
export function formatStreamForCosmic(muxStream: MuxLiveStream): {
  stream_key: string
  mux_playbook_id: string
  status: string
} {
  return {
    stream_key: muxStream.stream_key,
    mux_playbook_id: muxStream.playback_ids[0]?.id || '',
    status: muxStream.status
  }
}

// Error helper for MUX operations
export function handleMuxError(error: unknown, operation: string): Error {
  console.error(`MUX ${operation} error:`, error)
  
  if (error instanceof Error) {
    return new Error(`MUX ${operation} failed: ${error.message}`)
  }
  
  return new Error(`MUX ${operation} failed: Unknown error`)
}