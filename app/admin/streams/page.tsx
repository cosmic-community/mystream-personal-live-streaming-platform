import Link from 'next/link'
import { getStreamSessions } from '@/lib/cosmic'
import StreamCard from '@/components/StreamCard'
import { Plus, Video } from 'lucide-react'

export default async function StreamsPage() {
  const streams = await getStreamSessions()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold text-gray-900">MyStream Admin</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin/streams/new"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Stream
              </Link>
              <Link
                href="/admin"
                className="btn-secondary"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stream Sessions</h1>
            <p className="text-gray-600 mt-2">Manage your live streaming sessions and recordings</p>
          </div>
          <Link
            href="/admin/streams/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Stream
          </Link>
        </div>

        {/* Stream Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse-live"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Live Now</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {streams.filter(s => s.metadata?.status?.key === 'live').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {streams.filter(s => s.metadata?.status?.key === 'scheduled').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-500/10 rounded-lg flex items-center justify-center">
                <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ended</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {streams.filter(s => s.metadata?.status?.key === 'ended').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Video className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{streams.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Streams List */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">All Stream Sessions</h2>
          </div>
          <div className="p-6">
            {streams.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No streams created yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first stream session to start broadcasting to your audience
                </p>
                <Link
                  href="/admin/streams/new"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Stream
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {streams.map((stream) => (
                  <StreamCard 
                    key={stream.id} 
                    stream={stream}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}