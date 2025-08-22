import Mux from '@mux/mux-node'
import jwt from 'jsonwebtoken'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
})

export const { video: Video } = mux

// Create a live stream
export async function createLiveStream(options: {
  playback_policy: string[]
  new_asset_settings?: {
    playback_policy: string[]
  }
}) {
  try {
    const liveStream = await Video.liveStreams.create(options)
    return liveStream
  } catch (error) {
    console.error('Error creating live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

// Generate JWT token for Mux player
export function generateMuxJWT(playbackId: string, options: {
  expiration?: string
  audience?: string
} = {}) {
  const privateKey = Buffer.from(process.env.MUX_SIGNING_KEY_PRIVATE_KEY || '', 'base64')
  const keyId = process.env.MUX_SIGNING_KEY_ID
  
  if (!privateKey || !keyId) {
    throw new Error('Mux signing key or key ID not configured')
  }

  const payload = {
    sub: playbackId,
    aud: options.audience || 'v',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
  }

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    keyid: keyId,
  })
}

// Get playback URL for a video
export function getPlaybackUrl(playbackId: string, token?: string) {
  const baseUrl = `https://stream.mux.com/${playbackId}.m3u8`
  if (token) {
    return `${baseUrl}?token=${token}`
  }
  return baseUrl
}

// Delete a live stream
export async function deleteLiveStream(liveStreamId: string) {
  try {
    await Video.liveStreams.delete(liveStreamId)
  } catch (error) {
    console.error('Error deleting live stream:', error)
    throw new Error('Failed to delete live stream')
  }
}

// Get live stream details
export async function getLiveStream(liveStreamId: string) {
  try {
    const liveStream = await Video.liveStreams.retrieve(liveStreamId)
    return liveStream
  } catch (error) {
    console.error('Error fetching live stream:', error)
    throw new Error('Failed to fetch live stream')
  }
}

// Create simulcast target
export async function createSimulcastTarget(liveStreamId: string, options: {
  url: string
  stream_key: string
  passthrough?: string
}) {
  try {
    const simulcastTarget = await Video.liveStreams.createSimulcastTarget(liveStreamId, options)
    return simulcastTarget
  } catch (error) {
    console.error('Error creating simulcast target:', error)
    throw new Error('Failed to create simulcast target')
  }
}

// Update live stream
export async function updateLiveStream(liveStreamId: string, options: {
  playback_policy?: string[]
  new_asset_settings?: {
    playback_policy: string[]
  }
}) {
  try {
    const liveStream = await Video.liveStreams.update(liveStreamId, options)
    return liveStream
  } catch (error) {
    console.error('Error updating live stream:', error)
    throw new Error('Failed to update live stream')
  }
}