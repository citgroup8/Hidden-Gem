// The browser only ever talks to this app. Requests to /api/* are proxied to the backend,
// so session cookies, redirects and the realtime stream all stay on one origin.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Location is a core feature, so allow it for this origin only.
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(self)' }
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    agentUpgrade: "security",
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
