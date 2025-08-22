import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams, MuxAssetInput } from '@/types'

// Initialize MUX client
let mux: Mux | null = null

function getMuxClient(): Mux {
  if (!mux) {
    const tokenId = process.env.MUX_TOKEN_ID
    const tokenSecret = process.env.MUX_TOKEN_SECRET

    if (!tokenId || !tokenSecret) {
      throw new Error('MUX credentials not configured')
    }

    mux = new Mux(tokenId, tokenSecret)
  }

  return mux
}

// Export validateMuxConfig function to fix TS2305 error
export function validateMuxConfig(): boolean {
  try {
    const tokenId = process.env.MUX_TOKEN_ID
    const tokenSecret = process.env.MUX_TOKEN_SECRET
    
    if (!tokenId || !tokenSecret) {
      return false
    }

    // Basic format validation
    if (typeof tokenId !== 'string' || typeof tokenSecret !== 'string') {
      return false
    }

    if (tokenId.length < 10 || tokenSecret.length < 10) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error validating MUX config:', error)
    return false
  }
}

// Create a new live stream
export async function createLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStream> {
  try {
    const client = getMuxClient()
    
    const createParams = {
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      test: params.test || false
    }

    const response = await client.video.liveStreams.create(createParams)
    
    return {
      id: response.id || '',
      stream_key: response.stream_key || '',
      playback_ids: response.playback_ids || [],
      status: response.status || 'idle',
      created_at: response.created_at || new Date().toISOString(),
      reconnect_window: response.reconnect_window,
      test: response.test
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Delete a live stream - FIXED: Changed from 'del' to 'delete'
export async function deleteLiveStream(streamId: string): Promise<void> {
  try {
    const client = getMuxClient()
    await client.video.liveStreams.delete(streamId)
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    throw new Error('Failed to delete live stream')
  }
}

// Get live stream details
export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const client = getMuxClient()
    const response = await client.video.liveStreams.retrieve(streamId)
    
    if (!response) {
      return null
    }

    return {
      id: response.id || '',
      stream_key: response.stream_key || '',
      playback_ids: response.playbook_ids || [],
      status: response.status || 'idle',
      created_at: response.created_at || new Date().toISOString(),
      reconnect_window: response.reconnect_window,
      test: response.test
    }
  } catch (error) {
    console.error('Error retrieving MUX live stream:', error)
    return null
  }
}

// Create an asset from a live stream recording - FIXED: Changed string to Input[] array
export async function createAssetFromRecording(playbackId: string): Promise<string | null> {
  try {
    const client = getMuxClient()
    
    // FIXED: MUX SDK expects an array of Input objects, not a string
    const inputArray: MuxAssetInput[] = [{
      url: `https://stream.mux.com/${playbackId}.m3u8`
    }]
    
    const response = await client.video.assets.create({
      input: inputArray,
      playback_policy: ['public']
    })
    
    return response.id || null
  } catch (error) {
    console.error('Error creating MUX asset from recording:', error)
    return null
  }
}

// Get live stream statistics
export async function getLiveStreamMetrics(streamId: string): Promise<any> {
  try {
    const client = getMuxClient()
    
    // Note: MUX metrics might require different API endpoints
    // This is a placeholder for actual metrics implementation
    const response = await client.video.liveStreams.retrieve(streamId)
    
    return {
      stream_id: streamId,
      status: response?.status || 'unknown',
      concurrent_viewers: 0, // This would come from real-time metrics
      total_watch_time: 0    // This would come from analytics
    }
  } catch (error) {
    console.error('Error fetching MUX live stream metrics:', error)
    return null
  }
}

// Validate webhook signature - FIXED: Changed 'webhooks' to 'Webhooks'
export function validateWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    // FIXED: Use Mux.Webhooks instead of mux.webhooks
    return Mux.Webhooks.verifyHeader(rawBody, signature, secret)
  } catch (error) {
    console.error('Error validating MUX webhook signature:', error)
    return false
  }
}

// Helper function to generate playback URL
export function generatePlaybackUrl(playbackId: string, token?: string): string {
  if (token) {
    return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
  }
  return `https://stream.mux.com/${playbackId}.m3u8`
}

// Helper function to generate thumbnail URL
export function generateThumbnailUrl(playbackId: string, options: {
  time?: number;
  width?: number;
  height?: number;
  fit_mode?: 'preserve' | 'crop' | 'fill' | 'pad';
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.time) params.set('time', options.time.toString())
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.fit_mode) params.set('fit_mode', options.fit_mode)
  
  const queryString = params.toString()
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}

// List all live streams
export async function listLiveStreams(limit: number = 25, page: number = 1): Promise<MuxLiveStream[]> {
  try {
    const client = getMuxClient()
    const response = await client.video.liveStreams.list({
      limit,
      page
    })
    
    return response.data?.map(stream => ({
      id: stream.id || '',
      stream_key: stream.stream_key || '',
      playback_ids: stream.playback_ids || [],
      status: stream.status || 'idle',
      created_at: stream.created_at || new Date().toISOString(),
      reconnect_window: stream.reconnect_window,
      test: stream.test
    })) || []
  } catch (error) {
    console.error('Error listing MUX live streams:', error)
    return []
  }
}

// Check if MUX is properly configured
export function isMuxConfigured(): boolean {
  return validateMuxConfig()
}

// Export MUX client for advanced usage
export function getMuxClientInstance(): Mux | null {
  try {
    return getMuxClient()
  } catch (error) {
    return null
  }
}