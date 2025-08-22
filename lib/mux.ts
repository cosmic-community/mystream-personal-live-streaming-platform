import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
})

// Helper function to convert Mux SDK types to our custom types
function convertMuxPlaybackIds(muxPlaybackIds: Mux.PlaybackID[]): Array<{ id: string; policy: 'public' | 'signed' }> {
  return muxPlaybackIds.map(playbackId => ({
    id: playbackId.id,
    policy: (playbackId.policy === 'public' || playbackId.policy === 'signed') 
      ? playbackId.policy 
      : 'public' as const
  }))
}

// Create a new live stream
export async function createMuxLiveStream(
  params: MuxLiveStreamCreateParams = {}
): Promise<MuxLiveStream> {
  try {
    const createParams: any = {}
    
    if (params.playback_policy) {
      createParams.playback_policy = params.playback_policy
    }
    
    if (params.reconnect_window !== undefined) {
      createParams.reconnect_window = params.reconnect_window
    }
    
    if (params.reduced_latency !== undefined) {
      createParams.reduced_latency = params.reduced_latency
    }
    
    if (params.test !== undefined) {
      createParams.test = params.test
    }

    const liveStream = await mux.video.liveStreams.create(createParams)

    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: convertMuxPlaybackIds(liveStream.playback_ids || []),
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error creating Mux live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Get live stream details
export async function getMuxLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)

    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: convertMuxPlaybackIds(liveStream.playback_ids || []),
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error fetching Mux live stream:', error)
    return null
  }
}

// List all live streams
export async function getMuxLiveStreams(): Promise<MuxLiveStream[]> {
  try {
    const liveStreams = await mux.video.liveStreams.list()

    return liveStreams.data.map(liveStream => ({
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: convertMuxPlaybackIds(liveStream.playback_ids || []),
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    }))
  } catch (error) {
    console.error('Error listing Mux live streams:', error)
    return []
  }
}

// Delete a live stream
export async function deleteMuxLiveStream(streamId: string): Promise<void> {
  try {
    await mux.video.liveStreams.delete(streamId)
  } catch (error) {
    console.error('Error deleting Mux live stream:', error)
    throw new Error('Failed to delete live stream')
  }
}

// Create signed URL for private playback
export async function createSignedPlaybackUrl(
  playbackId: string,
  params: {
    expiresAt?: number
    width?: number
    height?: number
  } = {}
): Promise<string> {
  try {
    const { expiresAt, ...playbackParams } = params
    
    const signedUrl = mux.video.playbackIds.createUrl(playbackId, {
      token: mux.jwt.signPlaybackId(playbackId, {
        exp: expiresAt || Math.floor(Date.now() / 1000) + 3600, // 1 hour default
        ...playbackParams
      })
    })

    return signedUrl
  } catch (error) {
    console.error('Error creating signed playback URL:', error)
    throw new Error('Failed to create signed playback URL')
  }
}

// Update live stream (limited parameters supported by Mux)
export async function updateMuxLiveStream(
  streamId: string,
  params: { reconnect_window?: number }
): Promise<MuxLiveStream> {
  try {
    const updateParams: any = {}
    
    if (params.reconnect_window !== undefined) {
      updateParams.reconnect_window = params.reconnect_window
    }

    const liveStream = await mux.video.liveStreams.update(streamId, updateParams)

    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: convertMuxPlaybackIds(liveStream.playback_ids || []),
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error updating Mux live stream:', error)
    throw new Error('Failed to update live stream')
  }
}

// Create an asset from a live stream recording
export async function createMuxAsset(inputUrl: string): Promise<{ id: string; playback_ids: Array<{ id: string; policy: 'public' | 'signed' }> }> {
  try {
    const asset = await mux.video.assets.create({
      input: [{
        url: inputUrl
      }],
      playback_policy: ['public']
    })

    return {
      id: asset.id,
      playback_ids: convertMuxPlaybackIds(asset.playback_ids || [])
    }
  } catch (error) {
    console.error('Error creating Mux asset:', error)
    throw new Error('Failed to create video asset')
  }
}

// Get live stream metrics
export async function getMuxLiveStreamMetrics(streamId: string): Promise<{
  current_viewers: number
  max_viewers: number
}> {
  try {
    // Note: Mux metrics API might require different endpoints
    // This is a simplified version - you may need to adjust based on Mux's actual metrics API
    const metrics = await mux.data.metrics.breakdown('current-concurrent-viewers', {
      filters: [`live_stream_id:${streamId}`],
      timeframe: ['1:hour:ago', 'now']
    })

    return {
      current_viewers: 0, // Would need actual implementation
      max_viewers: 0      // Would need actual implementation
    }
  } catch (error) {
    console.error('Error fetching Mux metrics:', error)
    return {
      current_viewers: 0,
      max_viewers: 0
    }
  }
}

// Get webhook signature for verifying Mux webhooks
export function verifyMuxWebhook(payload: string, signature: string, secret: string): boolean {
  try {
    return Mux.webhooks.verifyHeader(payload, signature, secret)
  } catch (error) {
    console.error('Error verifying Mux webhook:', error)
    return false
  }
}