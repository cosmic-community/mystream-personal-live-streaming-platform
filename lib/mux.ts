import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams, MuxAssetInput } from '@/types'

// Initialize MUX client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
})

// Live Streams
export async function createLiveStream(params: MuxLiveStreamCreateParams): Promise<MuxLiveStream> {
  try {
    const liveStream = await mux.video.liveStreams.create(params)
    return liveStream as MuxLiveStream
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

export async function getLiveStream(liveStreamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(liveStreamId)
    return liveStream as MuxLiveStream
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
    return null
  }
}

export async function getAllLiveStreams(): Promise<MuxLiveStream[]> {
  try {
    const response = await mux.video.liveStreams.list()
    return response.data as MuxLiveStream[]
  } catch (error) {
    console.error('Error fetching all MUX live streams:', error)
    return []
  }
}

export async function deleteLiveStream(liveStreamId: string): Promise<void> {
  try {
    await mux.video.liveStreams.del(liveStreamId)
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    throw new Error('Failed to delete live stream')
  }
}

export async function updateLiveStream(
  liveStreamId: string, 
  params: Partial<MuxLiveStreamCreateParams>
): Promise<MuxLiveStream> {
  try {
    // Note: MUX doesn't support direct updates, need to recreate if significant changes
    const liveStream = await mux.video.liveStreams.retrieve(liveStreamId)
    return liveStream as MuxLiveStream
  } catch (error) {
    console.error('Error updating MUX live stream:', error)
    throw new Error('Failed to update live stream')
  }
}

// Assets (for recordings)
export async function createAsset(input: MuxAssetInput): Promise<any> {
  try {
    const asset = await mux.video.assets.create({
      input: input.url,
      playback_policy: ['public']
    })
    return asset
  } catch (error) {
    console.error('Error creating MUX asset:', error)
    throw new Error('Failed to create asset')
  }
}

export async function getAsset(assetId: string): Promise<any> {
  try {
    const asset = await mux.video.assets.retrieve(assetId)
    return asset
  } catch (error) {
    console.error('Error fetching MUX asset:', error)
    return null
  }
}

// Playback IDs
export async function createPlaybackId(liveStreamId: string, policy: 'public' | 'signed' = 'public'): Promise<string> {
  try {
    const playbackId = await mux.video.liveStreams.createPlaybackId(liveStreamId, {
      policy: policy
    })
    return playbackId.id!
  } catch (error) {
    console.error('Error creating MUX playback ID:', error)
    throw new Error('Failed to create playback ID')
  }
}

export async function deletePlaybackId(liveStreamId: string, playbackId: string): Promise<void> {
  try {
    await mux.video.liveStreams.deletePlaybackId(liveStreamId, playbackId)
  } catch (error) {
    console.error('Error deleting MUX playback ID:', error)
    throw new Error('Failed to delete playback ID')
  }
}

// Stream status helpers
export function isStreamLive(stream: MuxLiveStream): boolean {
  return stream.status === 'active'
}

export function isStreamReady(stream: MuxLiveStream): boolean {
  return stream.status === 'idle' || stream.status === 'active'
}

// Webhook verification
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    return Mux.webhooks.verifyHeader(rawBody, signature, secret)
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

// URL helpers
export function getStreamUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

export function getThumbnailUrl(playbackId: string, options: {
  time?: number
  width?: number
  height?: number
  fit_mode?: 'preserve' | 'crop' | 'pad'
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.time !== undefined) params.append('time', options.time.toString())
  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  if (options.fit_mode) params.append('fit_mode', options.fit_mode)

  const queryString = params.toString()
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}

// Error handling
export class MuxError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message)
    this.name = 'MuxError'
  }
}

export function handleMuxError(error: any): never {
  if (error.response) {
    const { status, data } = error.response
    throw new MuxError(
      `MUX API Error: ${data?.error?.message || 'Unknown error'}`,
      data?.error?.type,
      { status, data }
    )
  }
  
  throw new MuxError(error.message || 'Unknown MUX error', undefined, error)
}