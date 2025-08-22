'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, Settings, ExternalLink } from 'lucide-react'
import StreamCard from '@/components/StreamCard'
import StatsCard from '@/components/StatsCard'
import { getStreamSessions, getStreamSettings, createStreamSession } from '@/lib/cosmic'
import { createLiveStream } from '@/lib/mux'
import type { 
  StreamSession, 
  StreamSettings, 
  StreamStatus, 
  StreamQuality,
  CreateStreamFormData 
} from '@/types'

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (stream: StreamSession) => void;
}

function CreateStreamModal({ isOpen, onClose, onSuccess }: CreateStreamModalProps) {
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create stream')
      }

      const result = await response.json()
      onSuccess(result.stream)
      onClose()
      
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
    } catch (error) {
      console.error('Error creating stream:', error)
      setError(error instanceof Error ? error.message : 'Failed to create stream')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Create New Stream</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="stream_title" className="block text-sm font-medium text-foreground mb-2">
                Stream Title *
              </label>
              <input
                type="text"
                id="stream_title"
                value={formData.stream_title}
                onChange={(e) => setFormData({ ...formData, stream_title: e.target.value })}
                className="form-input w-full"
                required
                placeholder="Enter stream title"
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-input w-full h-24 resize-none"
                placeholder="Describe what this stream is about..."
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StreamStatus })}
                  className="form-input w-full"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="private">Private</option>
                  <option value="live">Live</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              <div>
                <label htmlFor="stream_quality" className="block text-sm font-medium text-foreground mb-2">
                  Quality
                </label>
                <select
                  id="stream_quality"
                  value={formData.stream_quality}
                  onChange={(e) => setFormData({ ...formData, stream_quality: e.target.value as StreamQuality })}
                  className="form-input w-full"
                >
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-foreground mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  id="start_time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
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
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="form-input w-full"
                />
              </div>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="form-input w-full"
                placeholder="tech, coding, tutorial (comma-separated)"
                maxLength={200}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="chat_enabled"
                checked={formData.chat_enabled}
                onChange={(e) => setFormData({ ...formData, chat_enabled: e.target.checked })}
                className="form-checkbox"
              />
              <label htmlFor="chat_enabled" className="text-sm font-medium text-foreground">
                Enable Chat
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading || !formData.stream_title.trim()}
              >
                {isLoading ? 'Creating...' : 'Create Stream'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdminStreamsPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [settings, setSettings] = useState<StreamSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [streamsData, settingsData] = await Promise.all([
        getStreamSessions(),
        getStreamSettings()
      ])
      setStreams(streamsData)
      setSettings(settingsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStreamCreated = (newStream: StreamSession) => {
    setStreams(prev => [newStream, ...prev])
  }

  const handleEditStream = (stream: StreamSession) => {
    // TODO: Implement edit functionality
    console.log('Edit stream:', stream)
  }

  const filteredStreams = streams.filter(stream => {
    const matchesSearch = stream.metadata?.stream_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stream.metadata?.tags?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === 'all') return matchesSearch
    
    const streamStatus = stream.metadata?.status?.key || 'scheduled'
    return matchesSearch && streamStatus === filterStatus
  })

  // Calculate stats
  const totalStreams = streams.length
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Stream Management</h1>
            <p className="text-muted-foreground">Manage your live streams and settings</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button className="btn-secondary">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Stream
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Streams"
            value={totalStreams}
            icon="🎥"
            trend="+12%"
            trendDirection="up"
          />
          <StatsCard
            title="Live Now"
            value={liveStreams}
            icon="🔴"
            trend={liveStreams > 0 ? "Active" : "None"}
            trendDirection={liveStreams > 0 ? "up" : "neutral"}
          />
          <StatsCard
            title="Scheduled"
            value={scheduledStreams}
            icon="📅"
            trend="Upcoming"
            trendDirection="neutral"
          />
          <StatsCard
            title="Total Viewers"
            value={totalViewers}
            icon="👥"
            trend="+8%"
            trendDirection="up"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search streams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input w-auto"
            >
              <option value="all">All Status</option>
              <option value="live">Live</option>
              <option value="scheduled">Scheduled</option>
              <option value="ended">Ended</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Streams Grid */}
        {filteredStreams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No streams match your filters' : 'No streams yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by creating your first live stream'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
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
                className="hover:shadow-lg transition-shadow"
              />
            ))}
          </div>
        )}

        {/* Quick Actions Panel */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="flex items-center p-4 bg-card rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="text-2xl mr-3">⚡</div>
              <div className="text-left">
                <div className="font-medium">Go Live Now</div>
                <div className="text-sm text-muted-foreground">Start streaming immediately</div>
              </div>
            </button>
            
            <button className="flex items-center p-4 bg-card rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="text-2xl mr-3">📊</div>
              <div className="text-left">
                <div className="font-medium">View Analytics</div>
                <div className="text-sm text-muted-foreground">Check stream performance</div>
              </div>
            </button>
            
            <button className="flex items-center p-4 bg-card rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="text-2xl mr-3">🔗</div>
              <div className="text-left">
                <div className="font-medium">Manage Access</div>
                <div className="text-sm text-muted-foreground">Create access links</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Create Stream Modal */}
      <CreateStreamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleStreamCreated}
      />
    </div>
  )
}