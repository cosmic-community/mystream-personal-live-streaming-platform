import Link from 'next/link'
import { getStreamSessions, getStreamSettings } from '@/lib/cosmic'
import StreamCard from '@/components/StreamCard'
import StatsCard from '@/components/StatsCard'
import { Play, Link as LinkIcon, Settings, Plus, Video, Users } from 'lucide-react'

export default async function AdminDashboard() {
  // Fetch data in parallel
  const [streams, settings] = await Promise.all([
    getStreamSessions(),
    getStreamSettings()
  ])

  const liveStreams = streams.filter(stream => stream.metadata?.status?.key === 'live')
  const scheduledStreams = streams.filter(stream => stream.metadata?.status?.key === 'scheduled')
  const totalViewers = streams.reduce((sum, stream) => sum + (stream.metadata?.viewer_count || 0), 0)

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
                href="/"
                className="btn-secondary"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your streams, access links, and platform settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Live Streams"
            value={liveStreams.length.toString()}
            icon={Play}
            color="red"
            trend={liveStreams.length > 0 ? 'up' : 'neutral'}
          />
          <StatsCard
            title="Scheduled"
            value={scheduledStreams.length.toString()}
            icon={Video}
            color="yellow"
            trend="neutral"
          />
          <StatsCard
            title="Total Viewers"
            value={totalViewers.toString()}
            icon={Users}
            color="blue"
            trend="up"
          />
          <StatsCard
            title="All Sessions"
            value={streams.length.toString()}
            icon={Video}
            color="green"
            trend="up"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/streams"
            className="p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Streams</h3>
                <p className="text-sm text-gray-600">Create and manage stream sessions</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/access-links"
            className="p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <LinkIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Access Links</h3>
                <p className="text-sm text-gray-600">Generate and manage viewer access</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">Configure platform defaults</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Streams */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Streams</h2>
            <Link
              href="/admin/streams"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all streams
            </Link>
          </div>
          <div className="p-6">
            {streams.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No streams yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first stream session</p>
                <Link
                  href="/admin/streams/new"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Stream
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {streams.slice(0, 3).map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings Preview */}
        {settings && (
          <div className="mt-8 bg-white rounded-lg border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Current Settings</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Default Quality</h4>
                  <p className="text-sm text-gray-600">
                    {settings.metadata?.default_quality?.value || 'Not set'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Auto Record</h4>
                  <p className="text-sm text-gray-600">
                    {settings.metadata?.auto_record ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Default Privacy</h4>
                  <p className="text-sm text-gray-600">
                    {settings.metadata?.default_privacy?.value || 'Not set'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Chat Enabled</h4>
                  <p className="text-sm text-gray-600">
                    {settings.metadata?.default_chat_enabled ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Viewer Threshold</h4>
                  <p className="text-sm text-gray-600">
                    {settings.metadata?.notification_settings?.viewer_threshold || 'Not set'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/admin/settings"
                  className="btn-secondary text-sm"
                >
                  Update Settings
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}