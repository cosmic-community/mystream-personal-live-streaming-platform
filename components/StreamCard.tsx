import Link from 'next/link'
import { format } from 'date-fns'
import type { StreamSession } from '@/types'
import { Play, Calendar, Users, Settings, ExternalLink } from 'lucide-react'

interface StreamCardProps {
  stream: StreamSession
  showActions?: boolean
  className?: string
}

export default function StreamCard({ stream, showActions = false, className = '' }: StreamCardProps) {
  const status = stream.metadata?.status?.key || 'unknown'
  const statusLabel = stream.metadata?.status?.value || 'Unknown'
  const viewerCount = stream.metadata?.viewer_count || 0
  const thumbnail = stream.metadata?.thumbnail?.imgix_url
  const startTime = stream.metadata?.start_time
  const chatEnabled = stream.metadata?.chat_enabled

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white'
      case 'scheduled':
        return 'bg-yellow-500 text-white'
      case 'ended':
        return 'bg-gray-500 text-white'
      case 'private':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-400 text-white'
    }
  }

  return (
    <div className={`stream-card ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Thumbnail */}
        <div className="relative md:w-48 md:h-28 w-full h-40 flex-shrink-0">
          {thumbnail ? (
            <img
              src={`${thumbnail}?w=384&h=216&fit=crop&auto=format,compress`}
              alt={stream.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <Play className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status === 'live' && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                {statusLabel}
              </span>
            )}
            {status !== 'live' && statusLabel}
          </div>

          {/* Viewer Count (if live) */}
          {status === 'live' && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              {viewerCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {stream.metadata?.stream_title || stream.title}
            </h3>
            {showActions && (
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/admin/streams/${stream.slug}`}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </Link>
                <Link
                  href={`/admin/access-links?stream=${stream.id}`}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Stream Details */}
          <div className="space-y-2 mb-4">
            {startTime && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  {status === 'scheduled' ? 'Scheduled for' : 'Started on'}{' '}
                  {format(new Date(startTime), 'MMM d, yyyy at h:mm a')}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{viewerCount} viewers</span>
              </div>
              
              {stream.metadata?.stream_quality?.value && (
                <span className="text-blue-600 font-medium">
                  {stream.metadata.stream_quality.value}
                </span>
              )}
              
              {chatEnabled && (
                <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded-full">
                  Chat enabled
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {stream.metadata?.description && (
            <div 
              className="text-sm text-gray-600 line-clamp-2"
              dangerouslySetInnerHTML={{ 
                __html: stream.metadata.description.substring(0, 200) + 
                (stream.metadata.description.length > 200 ? '...' : '') 
              }}
            />
          )}

          {/* Tags */}
          {stream.metadata?.tags && (
            <div className="mt-3 flex flex-wrap gap-2">
              {stream.metadata.tags.split(',').map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="mt-4 flex gap-2">
              <Link
                href={`/admin/streams/${stream.slug}`}
                className="btn-secondary text-sm"
              >
                Edit Stream
              </Link>
              <Link
                href={`/admin/access-links?stream=${stream.id}`}
                className="btn-primary text-sm"
              >
                Manage Access
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}