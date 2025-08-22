'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import StreamCard from '@/components/StreamCard'
import type { StreamSession } from '@/types'

export default function AdminStreamsPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Fetch streams
  useEffect(() => {
    fetchStreams()
  }, [])

  const fetchStreams = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/streams')
      if (!response.ok) {
        throw new Error('Failed to fetch streams')
      }
      
      const data = await response.json()
      setStreams(data.streams || [])
    } catch (err) {
      console.error('Error fetching streams:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch streams')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStream = () => {
    setShowCreateModal(true)
  }

  const handleEditStream = (stream: StreamSession) => {
    console.log('Edit stream:', stream)
    // TODO: Implement edit functionality
  }

  // Filter streams
  const filteredStreams = streams.filter(stream => {
    const matchesSearch = !searchQuery || 
      stream.metadata?.stream_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stream.metadata?.tags && stream.metadata.tags.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || 
      stream.metadata?.status?.key === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStreamCount = (status: string) => {
    if (status === 'all') return streams.length
    return streams.filter(s => s.metadata?.status?.key === status).length
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">⚠️ Error</div>
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchStreams}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your live streams, recordings, and access controls
          </p>
        </div>
        <button
          onClick={handleCreateStream}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Stream
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search streams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All ({getStreamCount('all')})</option>
            <option value="live">Live ({getStreamCount('live')})</option>
            <option value="scheduled">Scheduled ({getStreamCount('scheduled')})</option>
            <option value="ended">Ended ({getStreamCount('ended')})</option>
            <option value="private">Private ({getStreamCount('private')})</option>
          </select>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Live Streams</p>
              <p className="text-2xl font-bold text-red-600">{getStreamCount('live')}</p>
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-yellow-600">{getStreamCount('scheduled')}</p>
            </div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ended</p>
              <p className="text-2xl font-bold text-gray-600">{getStreamCount('ended')}</p>
            </div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Private</p>
              <p className="text-2xl font-bold text-purple-600">{getStreamCount('private')}</p>
            </div>
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Streams Grid */}
      {filteredStreams.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📺</div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No matching streams found' : 'No streams yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first live stream.'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={handleCreateStream}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
              className="h-full"
            />
          ))}
        </div>
      )}

      {/* Create Stream Modal - Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Stream</h2>
            <p className="text-muted-foreground mb-4">
              Stream creation form would go here.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-border rounded hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}