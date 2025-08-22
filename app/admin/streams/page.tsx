'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, Download, Eye, Calendar, Clock } from 'lucide-react'
import StreamCard from '@/components/StreamCard'
import StatsCard from '@/components/StatsCard'
import { getStreamSessions, createStreamSession } from '@/lib/cosmic'
import { validateMuxCredentials, createLiveStream } from '@/lib/mux'
import type { StreamSession, CreateStreamFormData, MuxValidationResult } from '@/types'

export default function AdminStreamsPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [muxValidation, setMuxValidation] = useState<MuxValidationResult>({ isValid: false })

  // Check MUX credentials on mount
  useEffect(() => {
    // FIXED: Use the returned validation result object instead of treating it as boolean
    const validation = validateMuxCredentials()
    setMuxValidation(validation)
  }, [])

  // Load streams
  useEffect(() => {
    async function loadStreams() {
      try {
        const sessions = await getStreamSessions()
        setStreams(sessions)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading streams:', error)
        setIsLoading(false)
      }
    }

    loadStreams()
  }, [])

  // FIXED: Use proper validation result properties
  if (!muxValidation.isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground mb-4">MUX Configuration Required</h1>
          <p className="text-muted-foreground mb-6">
            {muxValidation.error}
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-left">
            <p className="font-medium mb-2">To get started:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Sign up at <a href="https://mux.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mux.com</a></li>
              <li>Create a new API token in your MUX dashboard</li>
              <li>Add MUX_TOKEN_ID and MUX_TOKEN_SECRET to your environment variables</li>
              <li>Restart your application</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  const handleCreateStream = async (formData: CreateStreamFormData) => {
    if (isCreating) return

    setIsCreating(true)
    try {
      // Create MUX live stream
      const muxStream = await createLiveStream({
        playback_policy: ['public'],
        reconnect_window: 60
      })

      // Create stream session in Cosmic CMS
      const streamData = {
        stream_title: formData.stream_title,
        description: formData.description || '',
        status: formData.status,
        start_time: formData.start_time || '',
        end_time: formData.end_time || '',
        chat_enabled: formData.chat_enabled || false,
        stream_quality: formData.stream_quality || '1080p',
        tags: formData.tags || ''
      }

      const newStream = await createStreamSession(streamData)

      // Update the new stream with MUX details
      const updatedStream = {
        ...newStream,
        metadata: {
          ...newStream.metadata,
          stream_key: muxStream.stream_key,
          mux_playback_id: muxStream.playback_ids[0]?.id || ''
        }
      }

      setStreams(prev => [updatedStream, ...prev])
      setShowCreateForm(false)
      
      console.log('Stream created successfully:', updatedStream)
    } catch (error) {
      console.error('Error creating stream:', error)
      alert('Failed to create stream. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Filter streams
  const filteredStreams = streams.filter(stream => {
    const matchesSearch = stream.metadata?.stream_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.title.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         stream.metadata?.status?.key === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const liveStreams = streams.filter(s => s.metadata?.status?.key === 'live').length
  const scheduledStreams = streams.filter(s => s.metadata?.status?.key === 'scheduled').length
  const totalViewers = streams.reduce((sum, s) => sum + (s.metadata?.viewer_count || 0), 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage your live streams and access controls
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Stream</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Streams"
            value={streams.length.toString()}
            icon={Eye}
            color="blue"
          />
          <StatsCard
            title="Live Now"
            value={liveStreams.toString()}
            icon={Calendar}
            color="red"
          />
          <StatsCard
            title="Scheduled"
            value={scheduledStreams.toString()}
            icon={Clock}
            color="yellow"
          />
          <StatsCard
            title="Total Viewers"
            value={totalViewers.toString()}
            icon={Eye}
            color="green"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">All Status</option>
              <option value="live">Live</option>
              <option value="scheduled">Scheduled</option>
              <option value="ended">Ended</option>
              <option value="private">Private</option>
            </select>
          </div>

          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Streams Grid */}
        {filteredStreams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📺</div>
            <h3 className="text-lg font-medium text-foreground mb-2">No streams found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first stream to get started'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Create Your First Stream
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                onEdit={(stream) => console.log('Edit stream:', stream)}
                showActions={true}
              />
            ))}
          </div>
        )}

        {/* Create Stream Modal */}
        {showCreateForm && (
          <CreateStreamModal
            onClose={() => setShowCreateForm(false)}
            onCreate={handleCreateStream}
            isCreating={isCreating}
          />
        )}
      </div>
    </div>
  )
}

// Create Stream Modal Component
function CreateStreamModal({ 
  onClose, 
  onCreate, 
  isCreating 
}: { 
  onClose: () => void
  onCreate: (data: CreateStreamFormData) => void
  isCreating: boolean
}) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.stream_title.trim()) return
    onCreate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Create New Stream</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Stream Title *</label>
              <input
                type="text"
                value={formData.stream_title}
                onChange={(e) => setFormData(prev => ({ ...prev, stream_title: e.target.value }))}
                className="form-input"
                placeholder="Enter stream title"
                required
              />
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="form-textarea"
                rows={3}
                placeholder="Describe your stream"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="form-select"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="form-label">Quality</label>
                <select
                  value={formData.stream_quality}
                  onChange={(e) => setFormData(prev => ({ ...prev, stream_quality: e.target.value as any }))}
                  className="form-select"
                >
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">End Time</label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="form-input"
                placeholder="gaming, tutorial, live coding (comma separated)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="chat_enabled"
                checked={formData.chat_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, chat_enabled: e.target.checked }))}
                className="form-checkbox"
              />
              <label htmlFor="chat_enabled" className="ml-2 text-sm text-foreground">
                Enable chat
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
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
                {isCreating ? 'Creating...' : 'Create Stream'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}