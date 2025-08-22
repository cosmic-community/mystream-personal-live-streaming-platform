'use client'

import { useEffect, useState } from 'react'
import { Plus, Video, Users, Clock, Settings } from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import StreamCard from '@/components/StreamCard'
import { getStreamSessions, createStreamSession } from '@/lib/cosmic'
import { createMuxLiveStream, validateMuxConfig } from '@/lib/mux'
import type { StreamSession, CreateStreamFormData } from '@/types'

export default function StreamsAdminPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [muxConfigured, setMuxConfigured] = useState(false)
  const [formData, setFormData] = useState<CreateStreamFormData>({
    stream_title: '',
    description: '',
    status: 'scheduled',
    start_time: '',
    end_time: '',
    chat_enabled: true,
    stream_quality: '1080p',
    tags: ''
  })

  useEffect(() => {
    loadStreams()
    checkMuxConfiguration()
  }, [])

  async function loadStreams() {
    try {
      const streamData = await getStreamSessions()
      setStreams(streamData)
    } catch (error) {
      console.error('Error loading streams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function checkMuxConfiguration() {
    try {
      const config = await validateMuxConfig()
      setMuxConfigured(config.isConfigured)
    } catch (error) {
      console.error('Error checking Mux configuration:', error)
      setMuxConfigured(false)
    }
  }

  async function handleCreateStream(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Create MUX live stream first
      let streamKey = ''
      let playbackId = ''

      if (muxConfigured) {
        const muxStream = await createMuxLiveStream({
          playback_policy: ['public'],
          reconnect_window: 60,
          reduced_latency: false
        })

        // Add null checks for muxStream properties
        if (muxStream && muxStream.stream_key) {
          streamKey = muxStream.stream_key
        }
        
        if (muxStream && muxStream.playback_ids && muxStream.playback_ids.length > 0) {
          playbackId = muxStream.playback_ids[0]?.id || ''
        }
      }

      // Create stream session in Cosmic
      const streamSession = await createStreamSession({
        stream_title: formData.stream_title,
        description: formData.description,
        status: formData.status,
        start_time: formData.start_time,
        end_time: formData.end_time,
        chat_enabled: formData.chat_enabled,
        stream_quality: formData.stream_quality,
        tags: formData.tags
      })

      // Update with MUX data if available
      if (streamKey || playbackId) {
        // Update the stream session with MUX data
        const { updateStreamSession } = await import('@/lib/cosmic')
        await updateStreamSession(streamSession.id, {
          stream_key: streamKey,
          mux_playback_id: playbackId
        })
      }

      // Reload streams
      await loadStreams()

      // Reset form
      setFormData({
        stream_title: '',
        description: '',
        status: 'scheduled',
        start_time: '',
        end_time: '',
        chat_enabled: true,
        stream_quality: '1080p',
        tags: ''
      })
      setShowCreateForm(false)

    } catch (error) {
      console.error('Error creating stream:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const liveStreams = streams.filter(s => s.metadata?.status?.key === 'live')
  const scheduledStreams = streams.filter(s => s.metadata?.status?.key === 'scheduled')
  const totalViewers = streams.reduce((sum, s) => sum + (s.metadata?.viewer_count || 0), 0)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your live streams and view analytics
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Stream
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Streams"
          value={streams.length.toString()}
          icon={Video}
          color="blue"
        />
        <StatsCard
          title="Live Now"
          value={liveStreams.length.toString()}
          icon={Video}
          color="red"
        />
        <StatsCard
          title="Scheduled"
          value={scheduledStreams.length.toString()}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Total Viewers"
          value={totalViewers.toString()}
          icon={Users}
          color="green"
        />
      </div>

      {/* MUX Configuration Warning */}
      {!muxConfigured && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                MUX Configuration Required
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Please configure your MUX environment variables to enable live streaming functionality.
                Add MUX_TOKEN_ID and MUX_TOKEN_SECRET to your environment variables.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Stream Form */}
      {showCreateForm && (
        <div className="bg-card rounded-lg border shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Stream</h2>
          <form onSubmit={handleCreateStream} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stream Title *
                </label>
                <input
                  type="text"
                  value={formData.stream_title}
                  onChange={(e) => setFormData({...formData, stream_title: e.target.value})}
                  className="form-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="form-select w-full"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="form-textarea w-full"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quality
                </label>
                <select
                  value={formData.stream_quality}
                  onChange={(e) => setFormData({...formData, stream_quality: e.target.value as any})}
                  className="form-select w-full"
                >
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="form-input w-full"
                  placeholder="e.g., gaming, tutorial, live coding"
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="chat_enabled"
                  checked={formData.chat_enabled}
                  onChange={(e) => setFormData({...formData, chat_enabled: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="chat_enabled" className="text-sm font-medium text-foreground">
                  Enable Chat
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isCreating || !formData.stream_title.trim()}
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Stream'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Streams Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Streams</h2>
        {streams.length === 0 ? (
          <div className="text-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No streams yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first stream to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Stream
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                showActions={true}
                onEdit={(stream) => {
                  console.log('Edit stream:', stream)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}