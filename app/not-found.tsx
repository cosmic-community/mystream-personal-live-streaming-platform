import Link from 'next/link'
import { Video, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Video className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">Stream Not Found</h2>
          <p className="text-gray-400 leading-relaxed">
            The stream or page you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Homepage
          </Link>
          
          <Link
            href="/admin"
            className="btn-secondary w-full inline-flex items-center justify-center gap-2 bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Admin Dashboard
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Common reasons for this error:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-left">
            <li>Stream has been deleted or ended</li>
            <li>Invalid access token in the URL</li>
            <li>Mistyped URL or broken link</li>
          </ul>
        </div>
      </div>
    </div>
  )
}