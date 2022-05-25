/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? "https://boritgoge.github.io/KiyomiTalk"
      : "",
}

module.exports = nextConfig
