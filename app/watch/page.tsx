'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import VideoPlayer from '@/components/VideoPlayer'
import Chat from '@/components/Chat'
import StreamInfo from '@/components/StreamInfo'
import { getAccessLinkByToken, updateAccessLinkUsage } from '@/lib/cosmic'
import type { AccessLink, StreamSession } from '@/types'
import { Shield, AlertCircle } from 'lucide-react'

export default function WatchPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [accessLink, setAccessLink] = useState<AccessLink | null>(null)
  const [streamSession, setStreamSession] = useState<StreamSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewerName, setViewerName] = useState<string>('')
  const [hasJoined, setHasJoined] = useState(false)

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No access token provided')
        setIsLoading(false)
        return
      }

      try {
        const link = await getAccessLinkByToken(token)
        
        if (!link) {
          setError('Invalid or expired access token')
          setIsLoading(false)
          return
        }

        if (!link.metadata?.active) {
          setError('This access link has been deactivated')
          setIsLoading(false)
          return
        }

        const stream = link.metadata?.stream_session
        if (!stream) {
          setError('Stream session not found')
          setIsLoading(false)
          return
        }

        // Update access link usage
        await updateAccessLinkUsage(link.id)

        setAccessLink(link)
        setStreamSession(stream as StreamSession)
        setIsLoading(false)
      } catch (err) {
        console.error('Error validating token:', err)
        setError('Failed to validate access token')
        setIsLoading(false)
      }
    }

    validateToken()
  }, [token])

  const handleJoinStream = (name: string) => {
    if (name.trim().length >= 2) {
      setViewerName(name.trim())
      setHasJoined(true)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Validating access token...</p>
        </div>
      </div>
    )
  }

  if (error || !accessLink || !streamSession) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            {error || 'Unable to access this stream'}
          </p>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-300">
            <p className="font-medium mb-2">Common issues:</p>
            <ul className="text-left space-y-1">
              <li>• Access link has expired</li>
              <li>• Stream has been cancelled</li>
              <li>• Invalid token format</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <div className="text-center mb-6">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Access Verified</h1>
              <p className="text-gray-400">
                You have {accessLink.metadata?.permissions?.value || 'view-only'} permissions
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">{streamSession.title}</h3>
              <p className="text-gray-400 text-sm">
                Status: <span className={`font-medium ${
                  streamSession.metadata?.status?.key === 'live' ? 'text-red-400' :
                  streamSession.metadata?.status?.key === 'scheduled' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {streamSession.metadata?.status?.value || 'Unknown'}
                </span>
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const name = formData.get('viewerName') as string
              handleJoinStream(name)
            }}>
              <div className="mb-4">
                <label htmlFor="viewerName" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter your name to join
                </label>
                <input
                  type="text"
                  id="viewerName"
                  name="viewerName"
                  placeholder="Your name"
                  className="form-input w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  minLength={2}
                  maxLength={50}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full"
              >
                Join Stream
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const playbackId = streamSession.metadata?.mux_playback_id
  const isLive = streamSession.metadata?.status?.key === 'live'
  const chatEnabled = streamSession.metadata?.chat_enabled && 
    (accessLink.metadata?.permissions?.key === 'chat' || accessLink.metadata?.permissions?.key === 'moderator')

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stream Header */}
        <StreamInfo 
          stream={streamSession}
          viewerName={viewerName}
          permissions={accessLink.metadata?.permissions?.key || 'view-only'}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            {playbackId ? (
              <VideoPlayer
                playbackId={playbackId}
                title={streamSession.title}
                isLive={isLive}
              />
            ) : (
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Stream not available</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {isLive ? 'Stream may be starting soon' : 'Stream has ended or not yet started'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          {chatEnabled && (
            <div className="lg:col-span-1">
              <Chat
                streamId={streamSession.id}
                viewerName={viewerName}
                isEnabled={chatEnabled}
                permissions={accessLink.metadata?.permissions?.key || 'view-only'}
              />
            </div>
          )}
        </div>

        {/* Stream Description */}
        {streamSession.metadata?.description && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">About this stream</h3>
            <div 
              className="text-gray-300 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: streamSession.metadata.description }}
            />
          </div>
        )}
      </div>
    </div>
  )
}