import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/api/v1/account/usage',
        destination: '/api/v1/router/usage',
        permanent: true,
      },
      {
        source: '/api/v1/developer/usage',
        destination: '/api/v1/router/usage',
        permanent: true,
      },
      {
        source: '/api/v1/developer/:path*',
        destination: '/api/v1/router/:path*',
        permanent: true,
      },
      {
        source: '/router',
        destination: '/connect',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
