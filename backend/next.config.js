// API-only app: no pages, just route handlers under app/api. Put it behind the frontend
// (which proxies /api/*) or behind a reverse proxy that routes /api to this service.
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    agentUpgrade: "security",
  },
  async headers() {
    return [{ source: '/api/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }] }];
  },
};

module.exports = nextConfig;
