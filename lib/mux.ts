import Mux from '@mux/mux-node'

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

// MUX Video API Types
interface MuxLiveStream {
  id: string
  stream_key: string
  playback_ids: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  status: 'idle' | 'active'
  created_at: string
}

interface MuxAsset {
  id: string
  status: 'preparing' | 'ready' | 'errored'
  playback_ids: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  duration?: number
  created_at: string
}

// Create a new live stream
export async function createLiveStream(options: {
  reconnect_window?: number
  reduced_latency?: boolean
  test?: boolean
}): Promise<MuxLiveStream> {
  try {
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: {
        playback_policy: ['public'],
        mp4_support: 'standard'
      },
      reconnect_window: options.reconnect_window || 30,
      reduced_latency: options.reduced_latency || false,
      test: options.test || false
    })

    return {
      id: liveStream.id || '',
      stream_key: liveStream.stream_key || '',
      playback_ids: liveStream.playback_ids || [],
      status: (liveStream.status as 'idle' | 'active') || 'idle',
      created_at: liveStream.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error creating live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get live stream details
export async function getLiveStream(liveStreamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(liveStreamId)
    
    if (!liveStream) return null

    return {
      id: liveStream.id || '',
      stream_key: liveStream.stream_key || '',
      playback_ids: liveStream.playback_ids || [],
      status: (liveStream.status as 'idle' | 'active') || 'idle',
      created_at: liveStream.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching live stream:', error)
    return null
  }
}

// Delete a live stream
export async function deleteLiveStream(liveStreamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(liveStreamId)
    return true
  } catch (error) {
    console.error('Error deleting live stream:', error)
    return false
  }
}

// Get live stream playback ID with proper typing
export function getPlaybackId(playbackIds: Array<{ id: string; policy: string }>): string {
  const publicPlayback = playbackIds.find((pb: { id: string; policy: string }) => pb.policy === 'public')
  return publicPlayback?.id || ''
}

// Create an asset from uploaded video
export async function createAsset(url: string): Promise<MuxAsset> {
  try {
    const asset = await mux.video.assets.create({
      input: url,
      playback_policy: ['public'],
      mp4_support: 'standard'
    })

    return {
      id: asset.id || '',
      status: (asset.status as 'preparing' | 'ready' | 'errored') || 'preparing',
      playback_ids: asset.playback_ids || [],
      duration: asset.duration,
      created_at: asset.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error creating asset:', error)
    throw new Error('Failed to create asset')
  }
}

// Get asset details
export async function getAsset(assetId: string): Promise<MuxAsset | null> {
  try {
    const asset = await mux.video.assets.retrieve(assetId)
    
    if (!asset) return null

    return {
      id: asset.id || '',
      status: (asset.status as 'preparing' | 'ready' | 'errored') || 'preparing',
      playback_ids: asset.playback_ids || [],
      duration: asset.duration,
      created_at: asset.created_at || new Date().toISOString()
    }
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

// Get live stream metrics
export async function getLiveStreamMetrics(liveStreamId: string) {
  try {
    const metrics = await mux.data.metrics.breakdown('video_startup_time', {
      filters: [`live_stream_id:${liveStreamId}`],
      group_by: 'browser'
    })
    
    return metrics
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return null
  }
}

// Helper function to format duration
export function formatDuration(seconds: number): string {
  if (!seconds) return '0:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Helper function to check if stream is live
export function isStreamLive(status: string): boolean {
  return status === 'active'
}

// Generate webhook signature for Mux webhooks
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

// Process webhook events
export async function processWebhookEvent(eventType: string, data: any) {
  switch (eventType) {
    case 'video.live_stream.active':
      // Handle stream going live
      console.log('Stream went live:', data.id)
      break
      
    case 'video.live_stream.idle':
      // Handle stream going offline
      console.log('Stream went offline:', data.id)
      break
      
    case 'video.asset.ready':
      // Handle recording ready
      console.log('Recording ready:', data.id)
      break
      
    default:
      console.log('Unhandled webhook event:', eventType)
  }
}

// Export the mux client for direct access if needed
export { mux }