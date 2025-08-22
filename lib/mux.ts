import jwt from 'jsonwebtoken';

export interface MuxSignedURLOptions {
  playbackId: string;
  expirationTime?: number;
  keyId?: string;
  keySecret?: string;
}

export function generateSignedPlaybackUrl({
  playbackId,
  expirationTime = 3600, // 1 hour default
  keyId = process.env.MUX_TOKEN_ID,
  keySecret = process.env.MUX_TOKEN_SECRET
}: MuxSignedURLOptions): string {
  if (!keyId || !keySecret) {
    throw new Error('MUX credentials are required');
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + expirationTime;

  const payload = {
    sub: playbackId,
    aud: 'v',
    exp,
    kid: keyId
  };

  const token = jwt.sign(payload, Buffer.from(keySecret, 'base64'), {
    algorithm: 'RS256',
    header: {
      kid: keyId
    }
  });

  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
}

export function getMuxPlayerUrl(playbackId: string, signed: boolean = true): string {
  if (signed) {
    return generateSignedPlaybackUrl({ playbackId });
  }
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function validateMuxCredentials(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

// MUX Video API integration for creating live streams
export async function createMuxLiveStream(streamKey?: string): Promise<{
  playbackId: string;
  streamKey: string;
}> {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error('MUX credentials not configured');
  }

  try {
    // This would typically involve calling MUX API to create a live stream
    // For now, we'll return mock data as the actual MUX API integration
    // would require the full MUX SDK and proper API calls
    
    const mockPlaybackId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockStreamKey = streamKey || `live_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return {
      playbackId: mockPlaybackId,
      streamKey: mockStreamKey
    };
  } catch (error) {
    console.error('Error creating MUX live stream:', error);
    throw new Error('Failed to create MUX live stream');
  }
}

export function getMuxThumbnailUrl(playbackId: string, options: {
  width?: number;
  height?: number;
  fit?: 'crop' | 'pad' | 'fill';
  time?: number;
} = {}): string {
  const {
    width = 640,
    height = 360,
    fit = 'crop',
    time = 0
  } = options;

  return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit=${fit}&time=${time}`;
}

// Helper to check if a stream is currently live
export async function checkStreamLiveStatus(playbackId: string): Promise<boolean> {
  try {
    // In a real implementation, this would check MUX API for live status
    // For now, return false as we don't have actual live streams
    return false;
  } catch (error) {
    console.error('Error checking stream live status:', error);
    return false;
  }
}