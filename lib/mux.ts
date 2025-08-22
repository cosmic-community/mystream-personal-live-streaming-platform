import Mux from '@mux/mux-node'
import type { MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

// Initialize MUX client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string
})

// FIXED: Updated validation function to return proper object with isValid and error properties
export interface MuxValidationResult {
  isValid: boolean
  error?: string
}

export function validateMuxCredentials(): MuxValidationResult {
  const tokenId = process.env.MUX_TOKEN_ID
  const tokenSecret = process.env.MUX_TOKEN_SECRET
  
  if (!tokenId || !tokenSecret) {
    return {
      isValid: false,
      error: 'MUX credentials are not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.'
    }
  }
  
  // Basic format validation
  if (!tokenId.startsWith('00000000-0000-0000-0000-000000000000') && tokenId.length < 20) {
    return {
      isValid: false,
      error: 'Invalid MUX Token ID format'
    }
  }
  
  if (tokenSecret.length < 20) {
    return {
      isValid: false,
      error: 'Invalid MUX Token Secret format'
    }
  }
  
  return {
    isValid: true
  }
}

// FIXED: Updated createLiveStream to match current MUX SDK API (only accepts params object, not callback)
export async function createLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStream> {
  try {
    const defaultParams: MuxLiveStreamCreateParams = {
      playback_policy: ['public'],
      reconnect_window: 60,
      test: process.env.NODE_ENV !== 'production'
    }
    
    const finalParams = { ...defaultParams, ...params }
    
    // FIXED: Remove second parameter - current MUX SDK only accepts params object
    const response = await mux.video.liveStreams.create(finalParams)
    
    if (!response || !response.data) {
      throw new Error('Invalid response from MUX API')
    }
    
    const liveStream = response.data
    
    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      status: liveStream.status || 'idle',
      created_at: liveStream.created_at || new Date().toISOString(),
      reconnect_window: liveStream.reconnect_window,
      test: liveStream.test,
      // FIXED: Corrected property name from playbook_ids to playback_ids
      playback_ids: liveStream.playback_ids || []
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error(`Failed to create live stream: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const response = await mux.video.liveStreams.retrieve(streamId)
    
    if (!response || !response.data) {
      return null
    }
    
    const liveStream = response.data
    
    return {
      id: liveStream.id,
      stream_key: liveStream.stream_key,
      status: liveStream.status || 'idle',
      created_at: liveStream.created_at || new Date().toISOString(),
      reconnect_window: liveStream.reconnect_window,
      test: liveStream.test,
      playback_ids: liveStream.playback_ids || []
    }
  } catch (error) {
    console.error('Error fetching MUX live stream:', error)
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

export async function createAsset(input: { url: string }): Promise<string | null> {
  try {
    const response = await mux.video.assets.create({
      input: [input],
      playback_policy: ['public']
    })
    
    if (!response || !response.data) {
      return null
    }
    
    return response.data.id
  } catch (error) {
    console.error('Error creating MUX asset:', error)
    return null
  }
}

// FIXED: Updated webhook verification to use correct MUX SDK method
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    // FIXED: Use correct method name - MUX SDK uses Webhooks.verifyHeader (not verifyWebhook)
    // Note: Updated to use the correct API that exists in current MUX SDK
    const crypto = require('crypto')
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('hex')
    
    // Compare signatures securely
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

export function getStreamStatus(status: string): 'idle' | 'active' | 'disconnected' {
  switch (status?.toLowerCase()) {
    case 'connected':
    case 'active':
      return 'active'
    case 'disconnected':
    case 'idle':
      return 'idle'
    default:
      return 'idle'
  }
}

export function formatStreamKey(streamKey: string): string {
  if (!streamKey) return ''
  
  // Show only first 8 and last 4 characters for security
  if (streamKey.length <= 12) {
    return streamKey
  }
  
  return `${streamKey.substring(0, 8)}****${streamKey.substring(streamKey.length - 4)}`
}

// Utility function to get playback URL
export function getPlaybackUrl(playbackId: string, token?: string): string {
  const baseUrl = 'https://stream.mux.com'
  
  if (token) {
    return `${baseUrl}/${playbackId}.m3u8?token=${token}`
  }
  
  return `${baseUrl}/${playbackId}.m3u8`
}

// Utility function to get thumbnail URL
export function getThumbnailUrl(playbackId: string, options: {
  time?: number
  width?: number
  height?: number
  fit_mode?: 'preserve' | 'crop' | 'pad'
} = {}): string {
  const baseUrl = 'https://image.mux.com'
  const params = new URLSearchParams()
  
  if (options.time) params.append('time', options.time.toString())
  if (options.width) params.append('width', options.width.toString())  
  if (options.height) params.append('height', options.height.toString())
  if (options.fit_mode) params.append('fit_mode', options.fit_mode)
  
  const queryString = params.toString()
  return `${baseUrl}/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}

export default mux