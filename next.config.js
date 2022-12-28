/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['avatars.githubusercontent.com', 'firebasestorage.googleapis.com'],
  }
}

module.exports = nextConfig
