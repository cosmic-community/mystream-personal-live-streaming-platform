import jwt from 'jsonwebtoken'

export interface MuxUploadURL {
  upload_id: string;
  upload_url: string;
}

export interface MuxAsset {
  id: string;
  status: string;
  playback_ids: Array<{
    id: string;
    policy: 'public' | 'signed';
  }>;
  duration?: number;
  aspect_ratio?: string;
  video_quality?: string;
}

export interface MuxLiveStream {
  id: string;
  status: string;
  stream_key: string;
  playback_ids: Array<{
    id: string;
    policy: 'public' | 'signed';
  }>;
  recent_asset_ids?: string[];
  created_at: string;
  new_asset_settings?: {
    playback_policies: string[];
  };
}

// Create signed JWT for MUX Video playback
export function createMuxJWT(playbackId: string, audience = 'v'): string {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecret = process.env.MUX_SIGNING_KEY_PRIVATE_KEY;

  if (!keyId || !keySecret) {
    throw new Error('MUX signing keys not configured');
  }

  const payload = {
    sub: playbackId,
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
  };

  try {
    // Convert the key secret from base64 to Buffer for JWT signing
    const keyBuffer = Buffer.from(keySecret, 'base64');
    
    return jwt.sign(payload, keyBuffer, {
      algorithm: 'RS256',
      keyid: keyId,
    });
  } catch (error) {
    console.error('Error creating MUX JWT:', error);
    throw new Error('Failed to create signed URL');
  }
}

// Get MUX Video player URL (signed if needed)
export function getMuxVideoUrl(
  playbackId: string, 
  signed: boolean = false,
  audience: string = 'v'
): string {
  const baseUrl = `https://stream.mux.com/${playbackId}.m3u8`;
  
  if (!signed) {
    return baseUrl;
  }

  try {
    const token = createMuxJWT(playbackId, audience);
    return `${baseUrl}?token=${token}`;
  } catch (error) {
    console.error('Error creating signed MUX URL:', error);
    return baseUrl; // Fallback to unsigned URL
  }
}

// Get MUX thumbnail URL
export function getMuxThumbnailUrl(
  playbackId: string,
  options: {
    time?: number;
    width?: number;
    height?: number;
    fit_mode?: 'preserve' | 'crop' | 'pad';
    signed?: boolean;
  } = {}
): string {
  const {
    time = 0,
    width = 640,
    height = 360,
    fit_mode = 'crop',
    signed = false
  } = options;

  let url = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
  const params = new URLSearchParams({
    time: time.toString(),
    width: width.toString(),
    height: height.toString(),
    fit_mode,
  });

  if (signed) {
    try {
      const token = createMuxJWT(playbackId, 't'); // 't' for thumbnail audience
      params.set('token', token);
    } catch (error) {
      console.error('Error creating signed thumbnail URL:', error);
    }
  }

  return `${url}?${params.toString()}`;
}

// Get MUX GIF URL
export function getMuxGifUrl(
  playbackId: string,
  options: {
    start?: number;
    end?: number;
    width?: number;
    height?: number;
    fps?: number;
    signed?: boolean;
  } = {}
): string {
  const {
    start = 0,
    end = 10,
    width = 640,
    height = 360,
    fps = 15,
    signed = false
  } = options;

  let url = `https://image.mux.com/${playbackId}/animated.gif`;
  const params = new URLSearchParams({
    start: start.toString(),
    end: end.toString(),
    width: width.toString(),
    height: height.toString(),
    fps: fps.toString(),
  });

  if (signed) {
    try {
      const token = createMuxJWT(playbackId, 'g'); // 'g' for GIF audience
      params.set('token', token);
    } catch (error) {
      console.error('Error creating signed GIF URL:', error);
    }
  }

  return `${url}?${params.toString()}`;
}

// Check if MUX credentials are configured
export function isMuxConfigured(): boolean {
  return Boolean(
    process.env.MUX_TOKEN_ID &&
    process.env.MUX_TOKEN_SECRET &&
    process.env.MUX_SIGNING_KEY_ID &&
    process.env.MUX_SIGNING_KEY_PRIVATE_KEY
  );
}

// Format MUX video duration
export function formatMuxDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get video quality label
export function getVideoQualityLabel(quality?: string): string {
  const qualityMap: Record<string, string> = {
    '720p': '720p HD',
    '1080p': '1080p Full HD',
    '4k': '4K Ultra HD',
  };
  
  return qualityMap[quality || '1080p'] || '1080p Full HD';
}