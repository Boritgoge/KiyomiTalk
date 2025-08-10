/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['avatars.githubusercontent.com', 'firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
  }
}

module.exports = nextConfig
