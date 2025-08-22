import { Video } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <Video className="h-12 w-12 text-red-500 mx-auto animate-pulse" />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Loading MyStream</h2>
        <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-red-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">Preparing your streaming platform...</p>
      </div>
    </div>
  )
}