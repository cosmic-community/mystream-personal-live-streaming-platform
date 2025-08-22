import Link from 'next/link'
import { Play, Shield, MessageCircle, Settings, Video, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold text-white">MyStream</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin"
                className="btn-primary"
              >
                Admin Dashboard
              </Link>
              <Link
                href="/watch"
                className="btn-secondary text-white border-gray-600 hover:bg-gray-700"
              >
                Watch Stream
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-8">
            Your Personal
            <span className="text-red-500 block">Streaming Platform</span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Stream securely to your audience with token-based access control, professional video quality powered by MUX, 
            and real-time chat interaction. Complete control over who watches your streams.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
            >
              <Settings className="h-6 w-6" />
              Start Streaming
            </Link>
            <Link
              href="/admin/streams"
              className="inline-flex items-center gap-3 bg-gray-800 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-colors border border-gray-600"
            >
              <Play className="h-6 w-6" />
              Manage Sessions
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur">
            <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-6">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Secure Access Control</h3>
            <p className="text-gray-400 leading-relaxed">
              Generate secure, token-based access links with customizable permissions. Control who can view, chat, or moderate your streams.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur">
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6">
              <Video className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Professional Video Quality</h3>
            <p className="text-gray-400 leading-relaxed">
              Powered by MUX Video for crystal-clear streaming with support for multiple qualities from 720p to 4K Ultra HD.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur">
            <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-6">
              <MessageCircle className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Real-time Chat</h3>
            <p className="text-gray-400 leading-relaxed">
              WebSocket-powered live chat with moderation tools and message filtering for seamless viewer interaction.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur">
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6">
              <Settings className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Complete Control</h3>
            <p className="text-gray-400 leading-relaxed">
              Comprehensive admin dashboard to manage streams, monitor viewers, generate access links, and configure settings.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur">
            <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">OBS Integration</h3>
            <p className="text-gray-400 leading-relaxed">
              Full support for OBS Studio with camera and screen sharing capabilities for professional streaming setups.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur">
            <div className="h-12 w-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-6">
              <Play className="h-6 w-6 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Auto Recording</h3>
            <p className="text-gray-400 leading-relaxed">
              Automatically record your streams for later viewing with secure access control and playback management.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Built for Professional Streaming</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500 mb-2">4K</div>
              <div className="text-gray-400">Ultra HD Quality</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">100%</div>
              <div className="text-gray-400">Secure Access</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">Real-time</div>
              <div className="text-gray-400">Chat & Analytics</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 MyStream Platform. Built with Next.js, MUX Video, and Cosmic CMS.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}