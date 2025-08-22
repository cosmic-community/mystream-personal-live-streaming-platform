'use client'

import { useEffect, useRef, useState } from 'react'
import { getMuxPlayerUrl } from '@/lib/mux'
import type { VideoPlayerProps } from '@/types'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'

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
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const playerUrl = getMuxPlayerUrl(playbackId, {
    autoplay: false,
    muted: false,
    controls: false // We'll use custom controls
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadStart = () => setIsLoading(true)
    const handleLoadedData = () => setIsLoading(false)
    const handleError = () => {
      setError('Failed to load video stream')
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleDurationChange = () => {
      setDuration(video.duration)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (showControls && isPlaying) {
      timeout = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [showControls, isPlaying])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current
    if (!video) return

    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleSeek = (newTime: number) => {
    const video = videoRef.current
    if (!video || isLive) return // Don't allow seeking on live streams

    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Playback Error</h3>
          <p className="text-sm opacity-75">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="relative w-full h-full bg-black group cursor-pointer"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => !isPlaying && setShowControls(false)}
      onClick={togglePlay}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={playerUrl}
        playsInline
        autoPlay={isLive}
        muted={isMuted}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        </div>
      )}

      {/* Title Overlay */}
      <div className="absolute top-4 right-4 left-20 z-10">
        <h2 className="text-white text-lg font-medium truncate bg-black/20 px-2 py-1 rounded">
          {title}
        </h2>
      </div>

      {/* Custom Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-10 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar (only for non-live streams) */}
          {!isLive && duration > 0 && (
            <div className="mb-4">
              <div className="w-full bg-white/20 rounded-full h-1 cursor-pointer">
                <div 
                  className="bg-red-600 h-1 rounded-full relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full -mr-1.5"></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-white">
            {/* Left Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="hover:text-red-400 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="hover:text-red-400 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Time Display */}
              {!isLive && (
                <div className="text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-white/60"> / </span>
                  <span>{formatTime(duration)}</span>
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              <button
                className="hover:text-red-400 transition-colors"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="hover:text-red-400 transition-colors"
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-4 transition-all duration-200 hover:scale-110"
            aria-label="Play"
          >
            <Play className="h-12 w-12 ml-1" />
          </button>
        </div>
      )}
    </div>
  )
}