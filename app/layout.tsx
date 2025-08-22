import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import CosmicBadge from '@/components/CosmicBadge'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MyStream - Personal Live Streaming Platform',
  description: 'Secure personal live streaming platform with MUX Video integration, token-based access control, and real-time chat.',
  keywords: 'live streaming, personal streaming, MUX Video, private streaming, secure streaming',
  authors: [{ name: 'MyStream Platform' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Private streaming platform
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Access environment variable on server side for the badge
  const bucketSlug = process.env.COSMIC_BUCKET_SLUG as string

  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-background">
          {children}
        </main>
        {/* Pass bucket slug as prop to client component */}
        <CosmicBadge bucketSlug={bucketSlug} />
      </body>
    </html>
  )
}