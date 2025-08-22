import { Suspense } from 'react'
import { getStreamSessions } from '@/lib/cosmic'
import { createLiveStream, deleteLiveStream } from '@/lib/mux'
import StreamCard from '@/components/StreamCard'
import StatsCard from '@/components/StatsCard'
import { Plus, Video, Users, Clock, Settings } from 'lucide-react'
import type { StreamSession } from '@/types'

async function StreamsContent() {
  const streams = await getStreamSessions()

  const stats = {
    total: streams.length,
    live: streams.filter(s => s.metadata?.status?.key === 'live').length,
    scheduled: streams.filter(s => s.metadata?.status?.key === 'scheduled').length,
    ended: streams.filter(s => s.metadata?.status?.key === 'ended').length
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your live streams, view analytics, and configure settings
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Stream
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Streams"
          value={stats.total.toString()}
          icon={Video}
          color="blue"
        />
        <StatsCard
          title="Live Now"
          value={stats.live.toString()}
          icon={Users}
          color="red"
        />
        <StatsCard
          title="Scheduled"
          value={stats.scheduled.toString()}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Ended"
          value={stats.ended.toString()}
          icon={Settings}
          color="gray"
        />
      </div>

      {/* Streams Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Your Streams</h2>
        
        {streams.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No streams yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first stream to get started with live streaming
            </p>
            <button className="btn-primary">
              Create Your First Stream
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                showActions={true}
                onEdit={(stream: StreamSession) => {
                  console.log('Edit stream:', stream.id)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminStreamsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      }>
        <StreamsContent />
      </Suspense>
    </div>
  )
}