// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
module.exports = withPWA({
  reactStrictMode: true,

  // ✅ Next.js 16 対応（今回のビルドエラー対策）
  turbopack: {},
})