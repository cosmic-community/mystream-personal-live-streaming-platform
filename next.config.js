/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.cosmicjs.com',
      'imgix.cosmicjs.com'
    ],
    dangerouslyAllowSVG: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  env: {
    COSMIC_BUCKET_SLUG: process.env.COSMIC_BUCKET_SLUG,
    COSMIC_READ_KEY: process.env.COSMIC_READ_KEY
  }
}

module.exports = nextConfig