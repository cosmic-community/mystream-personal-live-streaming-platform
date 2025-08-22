'use client'

import { useEffect, useState } from 'react'
import { getStreamSessions, createStreamSession } from '@/lib/cosmic'
import { createLiveStream, deleteLiveStream } from '@/lib/mux'
import StreamCard from '@/components/StreamCard'
import type { StreamSession, CreateStreamFormData } from '@/types'
import { Plus, Video, Search, Filter, Calendar, Clock, Eye, Settings } from 'lucide-react'

export default function StreamsPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

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
  }, [])

  const loadStreams = async () => {
    try {
      setIsLoading(true)
      const streamData = await getStreamSessions()
      setStreams(streamData)
    } catch (error) {
      console.error('Error loading streams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Create MUX live stream first
      const muxStream = await createLiveStream({
        reduced_latency: true,
        reconnect_window: 60
      })

      // Create stream session in Cosmic CMS
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

      // Update with MUX data
      // Note: In a real app, you'd update the stream session with MUX IDs
      console.log('Created MUX stream:', muxStream)

      // Reset form and reload streams
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
      await loadStreams()

    } catch (error) {
      console.error('Error creating stream:', error)
      alert('Failed to create stream. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditStream = (stream: StreamSession) => {
    console.log('Edit stream:', stream)
    // Implement edit functionality
  }

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch = stream.metadata?.stream_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.title.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || stream.metadata?.status?.key === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusCount = (status: string) => {
    if (status === 'all') return streams.length
    return streams.filter(stream => stream.metadata?.status?.key === status).length
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
          <p className="text-muted-foreground">Create and manage your live streams</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Stream</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Streams</p>
              <p className="text-2xl font-bold text-foreground">{streams.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Video className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Live Now</p>
              <p className="text-2xl font-bold text-foreground">{getStatusCount('live')}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-foreground">{getStatusCount('scheduled')}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{getStatusCount('ended')}</p>
            </div>
            <div className="p-3 rounded-full bg-gray-100 text-gray-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Status ({streams.length})</option>
            <option value="live">Live ({getStatusCount('live')})</option>
            <option value="scheduled">Scheduled ({getStatusCount('scheduled')})</option>
            <option value="ended">Ended ({getStatusCount('ended')})</option>
            <option value="private">Private ({getStatusCount('private')})</option>
          </select>
        </div>
      </div>

      {/* Streams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border shadow-sm p-6 animate-pulse">
              <div className="aspect-video bg-muted rounded-md mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredStreams.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No matching streams' : 'No streams yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first live stream'
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
              onEdit={handleEditStream}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Create Stream Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-foreground">Create New Stream</h2>
              <p className="text-muted-foreground">Set up your live streaming session</p>
            </div>

            <form onSubmit={handleCreateStream} className="p-6 space-y-6">
              <div>
                <label className="form-label">Stream Title *</label>
                <input
                  type="text"
                  value={formData.stream_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, stream_title: e.target.value }))}
                  className="form-input"
                  required
                  placeholder="Enter stream title"
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input h-32"
                  placeholder="Describe your stream..."
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
                    <option value="live">Live</option>
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="chat_enabled"
                  checked={formData.chat_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, chat_enabled: e.target.checked }))}
                  className="form-checkbox"
                />
                <label htmlFor="chat_enabled" className="text-sm font-medium text-foreground">
                  Enable live chat
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
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
                  disabled={isCreating || !formData.stream_title}
                  className="btn-primary"
                >
                  {isCreating ? 'Creating...' : 'Create Stream'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}