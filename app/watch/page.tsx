import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import VideoPlayer from '@/components/VideoPlayer'
import Chat from '@/components/Chat'
import StreamInfo from '@/components/StreamInfo'
import { getAccessLinkByToken, updateAccessLinkUsage, getStreamSession } from '@/lib/cosmic'
import type { AccessPermission } from '@/types'

interface SearchParams {
  token?: string
}

interface WatchPageProps {
  searchParams: Promise<SearchParams>
}

async function WatchContent({ searchParams }: WatchPageProps) {
  const params = await searchParams
  const { token } = params

  if (!token) {
    notFound()
  }

  // Validate access token and get stream details
  const accessLink = await getAccessLinkByToken(token)
  
  if (!accessLink || !accessLink.metadata?.stream_session) {
    notFound()
  }

  const streamSession = accessLink.metadata.stream_session

  if (!streamSession || !streamSession.metadata) {
    notFound()
  }

  // Update access link usage tracking
  if (accessLink.id) {
    await updateAccessLinkUsage(accessLink.id)
  }

  // Get stream status
  const streamStatus = streamSession.metadata.status?.key || 'scheduled'
  const isLive = streamStatus === 'live'
  const playbackId = streamSession.metadata.mux_playback_id || ''

  // Check if stream is accessible
  if (streamStatus === 'private' && !accessLink.metadata?.active) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">This access link is no longer active.</p>
        </div>
      </div>
    )
  }

  // Get permissions with proper type casting
  const permissionsKey = accessLink.metadata?.permissions?.key || 'view-only'
  let permissions: AccessPermission = 'view-only' // Default fallback
  
  // Type-safe permission assignment
  if (permissionsKey === 'view-only' || permissionsKey === 'chat' || permissionsKey === 'moderator') {
    permissions = permissionsKey as AccessPermission
  }

  const chatEnabled = streamSession.metadata.chat_enabled ?? false

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {playbackId ? (
                <VideoPlayer
                  playbackId={playbackId}
                  title={streamSession.metadata.stream_title || streamSession.title}
                  isLive={isLive}
                  onViewerCountChange={(count) => {
                    console.log('Viewer count updated:', count)
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📺</div>
                    <h3 className="text-lg font-medium">Stream not available</h3>
                    <p className="text-sm opacity-75">Please check back later</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stream Information */}
            <StreamInfo
              title={streamSession.metadata.stream_title || streamSession.title}
              description={streamSession.metadata.description || ''}
              status={streamStatus}
              startTime={streamSession.metadata.start_time}
              endTime={streamSession.metadata.end_time}
              tags={streamSession.metadata.tags}
              viewerCount={streamSession.metadata.viewer_count || 0}
            />
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-card rounded-lg border shadow-sm h-[600px] flex flex-col">
                <Chat
                  streamId={streamSession.id}
                  viewerName="Anonymous Viewer"
                  isEnabled={chatEnabled}
                  permissions={permissions}
                />
              </div>

              {/* Access Information */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm mb-2">Access Details</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Permission Level:</span>
                    <span className="font-medium">
                      {accessLink.metadata?.permissions?.value || 'View Only'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage Count:</span>
                    <span className="font-medium">
                      {accessLink.metadata?.usage_count || 0}
                    </span>
                  </div>
                  {accessLink.metadata?.expiration_date && (
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className="font-medium">
                        {new Date(accessLink.metadata.expiration_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Status Banner */}
        {streamStatus === 'scheduled' && (
          <div className="fixed bottom-4 left-4 right-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
            <p className="text-yellow-600 dark:text-yellow-400">
              This stream is scheduled to start at{' '}
              {streamSession.metadata.start_time ? 
                new Date(streamSession.metadata.start_time).toLocaleString() : 
                'a later time'
              }
            </p>
          </div>
        )}

        {streamStatus === 'ended' && (
          <div className="fixed bottom-4 left-4 right-4 bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              This stream has ended.
              {streamSession.metadata.recording_url && (
                <span>
                  {' '}
                  <a 
                    href={streamSession.metadata.recording_url} 
                    className="underline hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Recording
                  </a>
                </span>
              )}
            </p>
          </div>
        )}

        {streamStatus === 'live' && (
          <div className="fixed bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-red-600 dark:text-red-400 font-medium">
                LIVE NOW
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WatchPage(props: WatchPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <WatchContent {...props} />
    </Suspense>
  )
}