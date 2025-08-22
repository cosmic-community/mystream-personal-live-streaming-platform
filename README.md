# MyStream - Personal Live Streaming Platform

![App Preview](https://imgix.cosmicjs.com/7c4bc110-7f86-11f0-8dcc-651091f6a7c0-photo-1516321318423-f06f85e504b3-1755887603439.jpg?w=1200&h=300&fit=crop&auto=format,compress)

A comprehensive personal live streaming platform built with Next.js 15, MUX Video, and Cosmic CMS. Stream securely to your audience with token-based access control, real-time chat, and professional streaming features.

## ✨ Features

- **🔒 Secure Access Control**: Token-based link generation with customizable permissions
- **📺 MUX Video Integration**: Professional live streaming with automatic recording
- **💬 Real-time Chat**: WebSocket-powered live chat with moderation tools
- **📱 Mobile Responsive**: Optimized streaming experience across all devices
- **🎥 OBS Integration**: Support for camera and screen sharing setups
- **📊 Analytics Dashboard**: Stream management with viewer tracking
- **⚙️ Configurable Settings**: Global streaming preferences and defaults
- **🔗 Link Management**: Generate, track, and revoke access links

## Clone this Project

## Clone this Project

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Project](https://img.shields.io/badge/Clone%20this%20Project-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmic-staging.com/projects/new?clone_bucket=68a8b3ef77147f09fa10a394&clone_repository=68a8bab677147f09fa10a3b0)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> "I want to create a personal live streaming site that allows me to live stream to anyone I send my stream link to. I want to be able to show my camera AND computer monitor during the stream. I I want it essentially to be my own personal twitch. I'm using MUX Video as the video components for this site. Please develop the plan to be able to build this successful website. Feel free to tell me anything you need to make this work"

### Code Generation Prompt

> Frontend Development Prompt for Personal Streaming Platform Here's the comprehensive prompt you should give to your frontend developer: Project Brief: Personal Streaming Platform with MUX Video Integration Build a personal live streaming platform that allows the owner to stream to viewers via secure access links, similar to a personal Twitch. The content structure is already set up in Cosmic CMS.

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## 🛠 Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first styling framework
- **Cosmic CMS** - Headless content management
- **MUX Video** - Professional video streaming platform
- **WebSocket** - Real-time chat functionality
- **JWT** - Secure token-based authentication

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- MUX Video account with API credentials
- Cosmic CMS bucket with the required content models

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mystream-platform
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```env
# Cosmic CMS (automatically included)
COSMIC_BUCKET_SLUG=your-bucket-slug
COSMIC_READ_KEY=your-read-key
COSMIC_WRITE_KEY=your-write-key

# MUX Video (required for streaming)
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
MUX_SIGNING_SECRET=your-mux-signing-secret

# Authentication
JWT_SECRET=your-jwt-secret-key-minimum-32-characters

# WebSocket (for real-time features)
WEBSOCKET_URL=wss://your-websocket-server
```

5. Run the development server:
```bash
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Cosmic SDK Examples

### Fetching Stream Sessions
```typescript
import { cosmic } from '@/lib/cosmic'

// Get all stream sessions
const sessions = await cosmic.objects
  .find({ type: 'stream-sessions' })
  .props(['id', 'title', 'slug', 'metadata'])
  .depth(1)

// Get a specific stream session
const session = await cosmic.objects.findOne({
  type: 'stream-sessions',
  slug: 'my-stream-slug'
}).depth(1)
```

### Creating Access Links
```typescript
// Generate a new access link
const accessLink = await cosmic.objects.insertOne({
  type: 'access-links',
  title: 'Stream Access Link',
  metadata: {
    access_token: generateSecureToken(),
    stream_session: streamId,
    permissions: 'chat',
    expiration_date: '2024-12-31',
    active: true
  }
})
```

### Managing Stream Settings
```typescript
// Update global stream settings
const settings = await cosmic.objects.updateOne(settingsId, {
  metadata: {
    default_quality: '1080p',
    auto_record: true,
    default_chat_enabled: true
  }
})
```

## 🎬 Cosmic CMS Integration

The platform uses four main content types in Cosmic:

### Stream Sessions
- Manage live streaming sessions
- Configure stream settings and metadata
- Track viewer engagement and recording URLs

### Access Links
- Generate secure, token-based access URLs
- Set permission levels and expiration dates
- Monitor usage statistics and access patterns

### Stream Settings
- Global configuration for streaming defaults
- Overlay and notification preferences
- Quality and privacy settings

### Chat Messages
- Real-time chat message storage
- Moderation and filtering capabilities
- Session-specific message threading

## 🚀 Deployment Options

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on git push

### Netlify
1. Build the application: `bun run build`
2. Deploy the `dist` folder to Netlify
3. Configure environment variables in Netlify dashboard
4. Set up continuous deployment

### Environment Variables for Production
Make sure to set all required environment variables in your hosting platform:
- Cosmic CMS credentials (automatically included)
- MUX Video API credentials
- JWT secret for authentication
- WebSocket server URL for real-time features

## 📝 Usage

### For Streamers (Admin Dashboard)
1. Create new stream sessions with titles and descriptions
2. Generate secure access links with custom permissions
3. Monitor live viewer count and engagement
4. Manage chat moderation and settings
5. Access recorded streams and analytics

### For Viewers
1. Access streams via secure, token-based links
2. Watch live streams with MUX Video player
3. Participate in real-time chat (if enabled)
4. View on mobile devices with responsive design
5. Access recorded streams if permissions allow

## 🔧 Configuration

The platform can be customized through the Stream Settings in Cosmic CMS:
- Default stream quality (720p, 1080p, 4K)
- Auto-recording preferences
- Chat enable/disable defaults
- Overlay and notification settings
- Privacy and access control defaults

<!-- README_END -->