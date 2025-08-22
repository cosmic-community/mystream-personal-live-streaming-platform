import Mux from '@mux/mux-node'
import { updateStreamSession } from './cosmic'
import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
})

export interface CreateLiveStreamParams {
  reconnectWindow?: number;
  reducedLatency?: boolean;
  test?: boolean;
}

export async function createLiveStream(params: CreateLiveStreamParams = {}): Promise<MuxLiveStream> {
  try {
    const liveStreamParams: MuxLiveStreamCreateParams = {
      reconnect_window: params.reconnectWindow || 60,
      reduced_latency: params.reducedLatency || false,
      test: params.test || false
    }

    const liveStream = await mux.video.liveStreams.create(liveStreamParams)
    
    // FIXED: Corrected typo from playbook_ids to playback_ids and properly typed parameter
    const playbackId = liveStream.playback_ids?.find((p: any) => p.policy === 'public')?.id || ''

    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids || [],
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

export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    
    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids || [],
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

export async function deleteLiveStream(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(streamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

export async function createLiveStreamAsset(streamId: string): Promise<string | null> {
  try {
    const asset = await mux.video.assets.create({
      input: [{
        url: `mux://live-streams/${streamId}`
      }],
      playback_policy: ['public']
    })
    
    return asset.id
  } catch (error) {
    console.error('Error creating MUX asset:', error)
    return null
  }
}

export async function getAssetPlaybackUrl(assetId: string): Promise<string | null> {
  try {
    const asset = await mux.video.assets.retrieve(assetId)
    const playbackId = asset.playback_ids?.find((p: any) => p.policy === 'public')?.id
    
    if (!playbackId) {
      return null
    }
    
    return `https://stream.mux.com/${playbackId}.m3u8`
  } catch (error) {
    console.error('Error getting MUX asset playback URL:', error)
    return null
  }
}

// FIXED: Removed metrics.get() which doesn't exist, replaced with proper webhook handling
export async function handleStreamStatusWebhook(
  eventType: string,
  streamId: string,
  cosmicStreamId: string
): Promise<void> {
  try {
    let status = 'scheduled'
    
    switch (eventType) {
      case 'video.live_stream.active':
        status = 'live'
        break
      case 'video.live_stream.idle':
        status = 'ended'
        break
      case 'video.live_stream.disconnected':
        status = 'ended'
        break
      default:
        return // Ignore other event types
    }

    await updateStreamSession(cosmicStreamId, { status })
  } catch (error) {
    console.error('Error handling MUX webhook:', error)
  }
}

export function validateMuxWebhook(signature: string, timestamp: string, body: string): boolean {
  // Implementation would depend on your webhook validation needs
  // This is a placeholder for MUX webhook signature validation
  return true
}

export async function getViewerCount(streamId: string): Promise<number> {
  try {
    // MUX doesn't provide real-time viewer count directly
    // You would need to implement this through your own tracking
    // or use MUX's analytics API with appropriate queries
    return 0
  } catch (error) {
    console.error('Error getting viewer count:', error)
    return 0
  }
}