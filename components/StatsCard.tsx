import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: 'red' | 'yellow' | 'blue' | 'green' | 'purple' | 'gray'
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend = 'neutral',
  className = '' 
}: StatsCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500/10 text-red-500'
      case 'yellow':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'blue':
        return 'bg-blue-500/10 text-blue-500'
      case 'green':
        return 'bg-green-500/10 text-green-500'
      case 'purple':
        return 'bg-purple-500/10 text-purple-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗️'
      case 'down':
        return '↘️'
      default:
        return ''
    }
  }

  return (
    <div className={`bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend !== 'neutral' && (
              <span className="text-sm">
                {getTrendIcon()}
              </span>
            )}
          </div>
        </div>
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getColorClasses(color)}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}