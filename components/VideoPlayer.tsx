'use client'

import { useEffect, useRef, useState } from 'react'
import { getMuxPlayerUrl, getMuxThumbnailUrl } from '@/lib/mux'
import type { VideoPlayerProps } from '@/types'
import { Play, Volume2, VolumeX, Maximize, AlertCircle } from 'lucide-react'

export default function VideoPlayer({ 
  playbackId, 
  title, 
  isLive, 
  onViewerCountChange 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!playbackId) {
      setError('No playback ID provided')
      setIsLoading(false)
      return
    }

    const video = videoRef.current
    if (!video) return

    try {
      const streamUrl = getMuxPlayerUrl(playbackId, true)
      video.src = streamUrl
      video.load()

      const handleLoadStart = () => setIsLoading(true)
      const handleCanPlay = () => setIsLoading(false)
      const handleError = (e: Event) => {
        console.error('Video playback error:', e)
        setError('Failed to load video stream')
        setIsLoading(false)
      }
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)
      const handleVolumeChange = () => {
        setVolume(video.volume)
        setIsMuted(video.muted)
      }

      video.addEventListener('loadstart', handleLoadStart)
      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('error', handleError)
      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)
      video.addEventListener('volumechange', handleVolumeChange)

      return () => {
        video.removeEventListener('loadstart', handleLoadStart)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('error', handleError)
        video.removeEventListener('play', handlePlay)
        video.removeEventListener('pause', handlePause)
        video.removeEventListener('volumechange', handleVolumeChange)
      }
    } catch (err) {
      console.error('Error setting up video player:', err)
      setError('Failed to initialize video player')
      setIsLoading(false)
    }
  }, [playbackId])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().catch(err => {
        console.error('Error playing video:', err)
        setError('Failed to play video')
      })
    } else {
      video.pause()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    video.muted = newVolume === 0
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }

  if (error) {
    return (
      <div className="stream-player bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Playback Error</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative stream-player group">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-white">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={getMuxThumbnailUrl(playbackId, { width: 1280, height: 720 })}
        controls={false}
        playsInline
        autoPlay={isLive}
        preload="metadata"
      />

      {/* Custom Controls */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Live Indicator */}
        {isLive && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            LIVE
          </div>
        )}

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center text-white hover:bg-black/20 transition-colors"
        >
          {!isPlaying && (
            <div className="bg-black/50 rounded-full p-4">
              <Play className="h-8 w-8 ml-1" />
            </div>
          )}
        </button>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="text-white hover:text-red-400 transition-colors"
              >
                <Play className={`h-5 w-5 ${isPlaying ? 'hidden' : 'block'}`} />
                <div className={`h-5 w-5 ${isPlaying ? 'block' : 'hidden'}`}>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-5 bg-white"></div>
                    <div className="w-1.5 h-5 bg-white"></div>
                  </div>
                </div>
              </button>

              <button
                onClick={toggleMute}
                className="text-white hover:text-red-400 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-red-500"
              />
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-red-400 transition-colors"
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stream Title Overlay */}
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm max-w-xs truncate">
        {title}
      </div>
    </div>
  )
}