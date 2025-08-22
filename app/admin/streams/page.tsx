import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Plus, Play, Square, Settings, ExternalLink, Calendar } from 'lucide-react'
import { getStreamSessions, createStreamSession } from '@/lib/cosmic'
import { validateMuxConfig, createLiveStream } from '@/lib/mux' // FIXED: Proper import
import StatsCard from '@/components/StatsCard'
import StreamCard from '@/components/StreamCard'
import type { StreamSession, CreateStreamFormData } from '@/types'

async function validateAccess() {
  // Simple admin check - in production, implement proper authentication
  const isAdmin = process.env.ADMIN_ACCESS === 'enabled'
  if (!isAdmin) {
    redirect('/')
  }
}

async function AdminStreamsContent() {
  await validateAccess()

  // Validate MUX configuration
  const muxConfig = validateMuxConfig()
  if (!muxConfig.isValid) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">MUX Configuration Error</h2>
          <p className="text-red-700">{muxConfig.error}</p>
          <p className="text-red-600 text-sm mt-2">
            Please configure your MUX credentials in environment variables.
          </p>
        </div>
      </div>
    )
  }

  const streams = await getStreamSessions()

  const activeStreams = streams.filter(stream => 
    stream.metadata?.status?.key === 'live'
  )

  const scheduledStreams = streams.filter(stream => 
    stream.metadata?.status?.key === 'scheduled'
  )

  const endedStreams = streams.filter(stream => 
    stream.metadata?.status?.key === 'ended'
  )

  async function handleCreateStream(formData: FormData) {
    'use server'
    
    try {
      const streamData: CreateStreamFormData = {
        stream_title: formData.get('stream_title') as string,
        description: formData.get('description') as string,
        status: 'scheduled' as const,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        chat_enabled: formData.get('chat_enabled') === 'on',
        stream_quality: (formData.get('stream_quality') as any) || '1080p',
        tags: formData.get('tags') as string
      }

      // Create MUX live stream
      const muxStream = await createLiveStream({
        playback_policy: ['public'],
        reconnect_window: 60
        // FIXED: Removed 'reduced_latency' as it doesn't exist in MuxLiveStreamCreateParams
      })

      // Create stream session in Cosmic
      await createStreamSession({
        stream_title: streamData.stream_title,
        description: streamData.description,
        status: streamData.status,
        start_time: streamData.start_time,
        end_time: streamData.end_time,
        chat_enabled: streamData.chat_enabled,
        stream_quality: streamData.stream_quality,
        tags: streamData.tags
      })

      // Redirect to refresh the page
      redirect('/admin/streams')
    } catch (error) {
      console.error('Error creating stream:', error)
      throw error
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your live streams and access settings
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <a
            href="/admin"
            className="btn-secondary"
          >
            <Settings className="h-4 w-4 mr-2" />
            Admin Dashboard
          </a>
          <button 
            type="button"
            className="btn-primary"
            onClick={() => {
              const dialog = document.getElementById('create-stream-dialog') as HTMLDialogElement
              dialog?.showModal()
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Stream
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Streams"
          value={streams.length.toString()}
          icon={Play}
          color="blue"
        />
        <StatsCard
          title="Live Now"
          value={activeStreams.length.toString()}
          icon={Play}
          color="red"
          trend={activeStreams.length > 0 ? 'up' : 'neutral'}
        />
        <StatsCard
          title="Scheduled"
          value={scheduledStreams.length.toString()}
          icon={Calendar}
          color="yellow"
        />
        <StatsCard
          title="Completed"
          value={endedStreams.length.toString()}
          icon={Square}
          color="gray"
        />
      </div>

      {/* Active Streams */}
      {activeStreams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Live Streams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Streams */}
      {scheduledStreams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Scheduled Streams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduledStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Streams */}
      {endedStreams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Recent Streams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {endedStreams.slice(0, 6).map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {streams.length === 0 && (
        <div className="text-center py-12">
          <Play className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">No streams yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first stream to get started
          </p>
          <button 
            type="button"
            className="btn-primary"
            onClick={() => {
              const dialog = document.getElementById('create-stream-dialog') as HTMLDialogElement
              dialog?.showModal()
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Stream
          </button>
        </div>
      )}

      {/* Create Stream Dialog */}
      <dialog id="create-stream-dialog" className="bg-card rounded-lg border shadow-lg p-0 max-w-2xl w-full">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-foreground">Create New Stream</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set up a new live stream with custom settings
          </p>
        </div>

        <form action={handleCreateStream}>
          <div className="p-6 space-y-6">
            {/* Stream Title */}
            <div>
              <label htmlFor="stream_title" className="block text-sm font-medium text-foreground mb-2">
                Stream Title *
              </label>
              <input
                type="text"
                id="stream_title"
                name="stream_title"
                required
                className="form-input w-full"
                placeholder="Enter stream title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="form-input w-full"
                placeholder="Describe your stream..."
              />
            </div>

            {/* Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-foreground mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  id="start_time"
                  name="start_time"
                  className="form-input w-full"
                />
              </div>
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-foreground mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  id="end_time"
                  name="end_time"
                  className="form-input w-full"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="stream_quality" className="block text-sm font-medium text-foreground mb-2">
                  Stream Quality
                </label>
                <select id="stream_quality" name="stream_quality" className="form-input w-full">
                  <option value="720p">720p HD</option>
                  <option value="1080p" selected>1080p Full HD</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="chat_enabled"
                  name="chat_enabled"
                  className="form-checkbox"
                  defaultChecked
                />
                <label htmlFor="chat_enabled" className="ml-2 text-sm font-medium text-foreground">
                  Enable Chat
                </label>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                className="form-input w-full"
                placeholder="gaming, tutorial, live coding"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate tags with commas
              </p>
            </div>
          </div>

          <div className="border-t px-6 py-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const dialog = document.getElementById('create-stream-dialog') as HTMLDialogElement
                dialog?.close()
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Stream
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}

export default function AdminStreamsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <AdminStreamsContent />
    </Suspense>
  )
}