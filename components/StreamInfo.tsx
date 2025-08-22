import { format } from 'date-fns'
import type { StreamSession, AccessPermission } from '@/types'
import { Calendar, Users, Shield, Clock } from 'lucide-react'

interface StreamInfoProps {
  stream: StreamSession
  viewerName: string
  permissions: AccessPermission
}

export default function StreamInfo({ stream, viewerName, permissions }: StreamInfoProps) {
  const status = stream.metadata?.status?.key || 'unknown'
  const statusLabel = stream.metadata?.status?.value || 'Unknown'
  const viewerCount = stream.metadata?.viewer_count || 0
  const startTime = stream.metadata?.start_time
  const quality = stream.metadata?.stream_quality?.value

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'text-red-500'
      case 'scheduled':
        return 'text-yellow-500'
      case 'ended':
        return 'text-gray-500'
      case 'private':
        return 'text-purple-500'
      default:
        return 'text-gray-400'
    }
  }

  const getPermissionLabel = (permission: AccessPermission) => {
    switch (permission) {
      case 'view-only':
        return 'Viewer'
      case 'chat':
        return 'Participant'
      case 'moderator':
        return 'Moderator'
      default:
        return 'Guest'
    }
  }

  const getPermissionColor = (permission: AccessPermission) => {
    switch (permission) {
      case 'view-only':
        return 'bg-gray-100 text-gray-800'
      case 'chat':
        return 'bg-blue-100 text-blue-800'
      case 'moderator':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Stream Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white truncate">
              {stream.metadata?.stream_title || stream.title}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              status === 'live' ? 'bg-red-500 text-white' :
              status === 'scheduled' ? 'bg-yellow-500 text-white' :
              status === 'ended' ? 'bg-gray-500 text-white' :
              status === 'private' ? 'bg-purple-500 text-white' :
              'bg-gray-400 text-white'
            }`}>
              {status === 'live' && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  {statusLabel}
                </span>
              )}
              {status !== 'live' && statusLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
            {/* Viewer Count */}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{viewerCount} viewer{viewerCount !== 1 ? 's' : ''}</span>
            </div>

            {/* Stream Quality */}
            {quality && (
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                  HD
                </div>
                <span>{quality}</span>
              </div>
            )}

            {/* Start Time */}
            {startTime && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {status === 'scheduled' ? 'Starts' : status === 'live' ? 'Started' : 'Ended'}{' '}
                  {format(new Date(startTime), 'MMM d, h:mm a')}
                </span>
              </div>
            )}

            {/* Duration (if ended) */}
            {status === 'ended' && stream.metadata?.end_time && startTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Duration: {Math.round(
                    (new Date(stream.metadata.end_time).getTime() - new Date(startTime).getTime()) / (1000 * 60)
                  )} min
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Viewer Info */}
        <div className="flex flex-col md:items-end gap-2">
          <div className="text-white">
            Welcome, <span className="font-semibold">{viewerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-400" />
            <span className={`permission-badge ${getPermissionColor(permissions)}`}>
              {getPermissionLabel(permissions)}
            </span>
          </div>
        </div>
      </div>

      {/* Stream Tags */}
      {stream.metadata?.tags && (
        <div className="mt-4 flex flex-wrap gap-2">
          {stream.metadata.tags.split(',').map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full"
            >
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}