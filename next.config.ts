import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // คงการตั้งค่า headers เดิมไว้
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, Range'
          }
        ]
      }
    ]
  },
};

export default nextConfig;
