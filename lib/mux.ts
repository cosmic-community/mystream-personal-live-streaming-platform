import Mux from '@mux/mux-node'
import jwt from 'jsonwebtoken'

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string,
});

// Types for MUX SDK responses - Updated to match current SDK
export interface MuxPlaybackId {
  id: string;
  policy: 'public' | 'signed';
}

export interface MuxLiveStream {
  id: string;
  stream_key: string;
  playback_ids: MuxPlaybackId[];
  status: string;
  created_at: string;
  reconnect_window?: number;
  reduced_latency?: boolean;
  test?: boolean;
}

export interface MuxLiveStreamCreateParams {
  playback_policy?: ('public' | 'signed')[];
  reconnect_window?: number;
  reduced_latency?: boolean;
  test?: boolean;
}

export interface MuxLiveStreamResponse {
  data: MuxLiveStream;
}

export interface MuxLiveStreamsResponse {
  data: MuxLiveStream[];
}

export interface MuxAsset {
  id: string;
  status: string;
  playback_ids: MuxPlaybackId[];
  duration?: number;
  max_stored_resolution?: string;
  created_at: string;
}

export interface MuxAssetResponse {
  data: MuxAsset;
}

export interface MuxMetrics {
  data: Array<{
    timestamp: string;
    value: number;
    [key: string]: any;
  }>;
}

// Live Stream Functions
export async function createLiveStream(params: MuxLiveStreamCreateParams = {}): Promise<MuxLiveStream> {
  try {
    const response = await mux.video.liveStreams.create({
      playback_policy: params.playback_policy || ['public'],
      reconnect_window: params.reconnect_window || 60,
      reduced_latency: params.reduced_latency || false,
      test: params.test || false
    });
    
    return response as MuxLiveStream;
  } catch (error) {
    console.error('Error creating live stream:', error);
    throw new Error('Failed to create live stream');
  }
}

export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const response = await mux.video.liveStreams.retrieve(streamId);
    return response as MuxLiveStream;
  } catch (error) {
    console.error('Error getting live stream:', error);
    return null;
  }
}

export async function getLiveStreams(): Promise<MuxLiveStream[]> {
  try {
    const response = await mux.video.liveStreams.list({
      limit: 25,
    });
    
    return (response as MuxLiveStreamsResponse).data || [];
  } catch (error) {
    console.error('Error getting live streams:', error);
    return [];
  }
}

export async function deleteLiveStream(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.delete(streamId);
    return true;
  } catch (error) {
    console.error('Error deleting live stream:', error);
    return false;
  }
}

// JWT Token Generation for Secure Playback
export function generateSignedPlaybackUrl(
  playbackId: string,
  options: {
    keyId?: string;
    keySecret?: string;
    expiration?: string | number;
    audience?: string;
  } = {}
): string {
  const keyId = options.keyId || process.env.MUX_SIGNING_KEY_ID;
  const keySecret = options.keySecret || process.env.MUX_SIGNING_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    throw new Error('MUX_SIGNING_KEY_ID and MUX_SIGNING_KEY_SECRET are required for signed URLs');
  }

  // JWT payload
  const payload = {
    sub: playbackId,
    aud: options.audience || 'v',
    exp: options.expiration || Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  // Sign the JWT
  const token = jwt.sign(payload, Buffer.from(keySecret, 'base64'), {
    algorithm: 'RS256',
    keyid: keyId,
  });

  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
}

// Asset Functions
export async function createAssetFromUrl(url: string): Promise<MuxAsset> {
  try {
    const response = await mux.video.assets.create({
      input: [{ url }],
      playback_policy: ['public'],
    });
    
    return response as MuxAsset;
  } catch (error) {
    console.error('Error creating asset:', error);
    throw new Error('Failed to create asset');
  }
}

export async function getAsset(assetId: string): Promise<MuxAsset | null> {
  try {
    const response = await mux.video.assets.retrieve(assetId);
    return response as MuxAsset;
  } catch (error) {
    console.error('Error getting asset:', error);
    return null;
  }
}

// Metrics and Analytics
export async function getViewershipMetrics(
  liveStreamId: string,
  timeframe: [string, string] = ['24:hours:ago', 'now']
): Promise<MuxMetrics> {
  try {
    const response = await mux.data.metrics.breakdown({
      metric_id: 'concurrent-viewers',
      group_by: 'hour',
      timeframe,
      filters: [`live_stream_id:${liveStreamId}`]
    });
    
    return response as MuxMetrics;
  } catch (error) {
    console.error('Error getting viewership metrics:', error);
    return { data: [] };
  }
}

export async function getViewData(playbackId: string) {
  try {
    const response = await mux.data.metrics.overall({
      metric_id: 'video-startup-time',
      timeframe: ['7:days:ago', 'now'],
      filters: [`playback_id:${playbackId}`]
    });
    
    return response;
  } catch (error) {
    console.error('Error getting view data:', error);
    return null;
  }
}

// Webhook Verification
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Use the Mux Webhooks utility if available, otherwise manual verification
    if (Mux.webhooks && typeof Mux.webhooks.verifyHeader === 'function') {
      return Mux.webhooks.verifyHeader(rawBody, signature, secret);
    }
    
    // Manual verification as fallback
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Utility Functions
export function getPlaybackUrl(playbackId: string, signed: boolean = false): string {
  if (signed) {
    return generateSignedPlaybackUrl(playbackId);
  }
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function getThumbnailUrl(
  playbackId: string, 
  options: { 
    width?: number; 
    height?: number; 
    time?: number; 
    fit_mode?: 'preserve' | 'crop' | 'pad';
  } = {}
): string {
  const params = new URLSearchParams();
  
  if (options.width) params.set('width', options.width.toString());
  if (options.height) params.set('height', options.height.toString());
  if (options.time) params.set('time', options.time.toString());
  if (options.fit_mode) params.set('fit_mode', options.fit_mode);
  
  const queryString = params.toString();
  return `https://image.mux.com/${playbackId}/thumbnail.png${queryString ? '?' + queryString : ''}`;
}

// Stream Status Helpers
export function isLiveStreamActive(stream: MuxLiveStream): boolean {
  return stream.status === 'active';
}

export function isLiveStreamIdle(stream: MuxLiveStream): boolean {
  return stream.status === 'idle';
}

// Helper function to extract playback IDs
export function getPublicPlaybackId(playbackIds: MuxPlaybackId[]): string | null {
  const publicPlayback = playbackIds.find(p => p.policy === 'public');
  return publicPlayback?.id || null;
}

export function getSignedPlaybackId(playbackIds: MuxPlaybackId[]): string | null {
  const signedPlayback = playbackIds.find(p => p.policy === 'signed');
  return signedPlayback?.id || null;
}

// Export aliases for backward compatibility
export const createMuxLiveStream = createLiveStream;
export const getMuxLiveStreams = getLiveStreams;
export const deleteMuxLiveStream = deleteLiveStream;
export const getMuxLiveStream = getLiveStream;

export default mux;