/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',
      // External sources used by our new API bridges:
      'static.openfoodfacts.org', // product images
      'images.openfoodfacts.org',
      'wger.de' // exercise images/media
    ],
  },
  experimental: {
    // Keep default unless you use edge specific features
  }
}

module.exports = nextConfig
