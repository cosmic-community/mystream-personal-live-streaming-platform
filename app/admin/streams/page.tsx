'use client'

import { useState, useEffect } from 'react'
import { Plus, RefreshCcw, Search, Filter } from 'lucide-react'
import StreamCard from '@/components/StreamCard'
import type { StreamSession } from '@/types'

export default function AdminStreamsPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [filteredStreams, setFilteredStreams] = useState<StreamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Fetch streams
  const fetchStreams = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/streams')
      const data = await response.json()
      
      if (data.streams) {
        setStreams(data.streams)
        setFilteredStreams(data.streams)
      }
    } catch (error) {
      console.error('Error fetching streams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchStreams()
  }, [])

  // Filter streams based on search term and status
  useEffect(() => {
    let filtered = streams

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(stream =>
        stream.metadata?.stream_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.metadata?.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(stream => 
        stream.metadata?.status?.key === statusFilter
      )
    }

    setFilteredStreams(filtered)
  }, [streams, searchTerm, statusFilter])

  const handleEditStream = (stream: StreamSession) => {
    // TODO: Implement edit functionality
    console.log('Edit stream:', stream)
  }

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'live', label: 'Live' },
    { value: 'ended', label: 'Ended' },
    { value: 'private', label: 'Private' }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage your live streams and scheduled broadcasts
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={fetchStreams}
              className="btn-secondary"
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Stream
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search streams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select w-full"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>Total: {streams.length}</span>
              <span>Filtered: {filteredStreams.length}</span>
              <span>
                Live: {streams.filter(s => s.metadata?.status?.key === 'live').length}
              </span>
            </div>
          </div>
        </div>

        {/* Streams Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredStreams.length > 0 ? (
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
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' ? (
                <div>
                  <Filter className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No streams match your filters</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <div>
                  <Plus className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No streams yet</h3>
                  <p>Get started by creating your first stream</p>
                </div>
              )}
            </div>
            
            {(!searchTerm && statusFilter === 'all') && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Stream
              </button>
            )}
          </div>
        )}

        {/* Create Stream Form Modal - TODO: Implement */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Stream</h2>
              <p className="text-muted-foreground">
                Stream creation form coming soon...
              </p>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary mt-4"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}