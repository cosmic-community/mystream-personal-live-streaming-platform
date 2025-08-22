'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600">
            We encountered an error while loading your streaming platform.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">
            Error: {error.message || 'An unexpected error occurred'}
          </p>
          {error.digest && (
            <p className="text-xs text-red-600 mt-1">
              ID: {error.digest}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          
          <a
            href="/"
            className="btn-secondary w-full inline-flex items-center justify-center"
          >
            Go to homepage
          </a>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          <p>If this problem persists, please check:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-left">
            <li>Your internet connection</li>
            <li>Cosmic CMS configuration</li>
            <li>MUX Video service status</li>
          </ul>
        </div>
      </div>
    </div>
  )
}