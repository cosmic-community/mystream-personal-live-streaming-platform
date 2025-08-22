import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

// Initialize MUX client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

// Create a new live stream
export async function createMuxLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStream | null> {
  try {
    const response = await mux.video.liveStreams.create({
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      reduced_latency: params.reduced_latency || false,
      test: params.test || false
    })

    if (!response || !response.data) {
      throw new Error('Invalid response from MUX API')
    }

    const liveStream = response.data

    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      playback_ids: liveStream.playback_ids || [], // Safe access with fallback
      status: liveStream.status,
      created_at: liveStream.created_at,
      reconnect_window: liveStream.reconnect_window,
      reduced_latency: liveStream.reduced_latency,
      test: liveStream.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    return null
  }
}

// Get all live streams
export async function getMuxLiveStreams(): Promise<MuxLiveStream[]> {
  try {
    const response = await mux.video.liveStreams.list({
      limit: 25,
      page: 1
    })

    if (!response || !response.data) {
      return []
    }

    return response.data.map(stream => ({
      id: stream.id,
      stream_key: stream.stream_key,
      playback_ids: stream.playback_ids || [], // Safe access with fallback
      status: stream.status,
      created_at: stream.created_at,
      reconnect_window: stream.reconnect_window,
      reduced_latency: stream.reduced_latency,
      test: stream.test
    }))
  } catch (error) {
    console.error('Error fetching MUX live streams:', error)
    return []
  }
}

// Get a single live stream by ID
export async function getMuxLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const response = await mux.video.liveStreams.get(streamId)

    if (!response || !response.data) {
      return null
    }

    const stream = response.data

    return {
      id: stream.id,
      stream_key: stream.stream_key,
      playback_ids: stream.playback_ids || [], // Safe access with fallback
      status: stream.status,
      created_at: stream.created_at,
      reconnect_window: stream.reconnect_window,
      reduced_latency: stream.reduced_latency,
      test: stream.test
    }
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
    return null
  }
}

// Delete a live stream - FIXED: Use correct method name
export async function deleteMuxLiveStream(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.delete(streamId) // FIXED: Use 'delete' instead of 'del'
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

// Start recording a live stream - FIXED: Use correct method approach
export async function startMuxRecording(streamId: string): Promise<boolean> {
  try {
    // FIXED: Use update method instead of non-existent enableRecording
    await mux.video.liveStreams.update(streamId, {
      recording_settings: {
        mode: 'automatic'
      }
    })
    return true
  } catch (error) {
    console.error('Error starting MUX recording:', error)
    return false
  }
}

// Stop recording a live stream - FIXED: Use correct method approach
export async function stopMuxRecording(streamId: string): Promise<boolean> {
  try {
    // FIXED: Use update method instead of non-existent disableRecording
    await mux.video.liveStreams.update(streamId, {
      recording_settings: {
        mode: 'disabled'
      }
    })
    return true
  } catch (error) {
    console.error('Error stopping MUX recording:', error)
    return false
  }
}

// Reset stream key
export async function resetMuxStreamKey(streamId: string): Promise<string | null> {
  try {
    const response = await mux.video.liveStreams.resetStreamKey(streamId)
    
    if (!response || !response.data) {
      return null
    }

    return response.data.stream_key
  } catch (error) {
    console.error('Error resetting MUX stream key:', error)
    return null
  }
}

// Create a signed URL for private playback
export async function createSignedPlaybackUrl(playbackId: string, expireTime: number = 3600): Promise<string | null> {
  try {
    const signingKey = process.env.MUX_SIGNING_KEY
    const signingKeyId = process.env.MUX_SIGNING_KEY_ID

    if (!signingKey || !signingKeyId) {
      console.error('MUX signing credentials not configured')
      return null
    }

    // Create signed URL using MUX's utility
    const signedUrl = mux.utils.buildBaseUrl(playbackId, {
      token: mux.jwt.sign(playbackId, {
        keyId: signingKeyId,
        keySecret: signingKey,
        expiration: Math.floor(Date.now() / 1000) + expireTime
      })
    })

    return signedUrl
  } catch (error) {
    console.error('Error creating signed playback URL:', error)
    return null
  }
}

// Get playback URL for a stream
export function getPlaybackUrl(playbackId: string, token?: string): string {
  const baseUrl = `https://stream.mux.com/${playbackId}.m3u8`
  return token ? `${baseUrl}?token=${token}` : baseUrl
}

// Validate MUX configuration
export async function validateMuxConfiguration(): Promise<boolean> {
  try {
    const tokenId = process.env.MUX_TOKEN_ID
    const tokenSecret = process.env.MUX_TOKEN_SECRET

    if (!tokenId || !tokenSecret) {
      console.error('MUX credentials not configured')
      return false
    }

    // Test connection by listing live streams
    await mux.video.liveStreams.list({ limit: 1 })
    return true
  } catch (error) {
    console.error('MUX configuration validation failed:', error)
    return false
  }
}

export { mux }