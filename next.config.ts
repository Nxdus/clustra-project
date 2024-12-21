import type { NextConfig } from "next";

const allowedOrigins = ['https://clustra.tech', 'https://upload.clustra.tech']; // อนุญาตเฉพาะ Origin ที่ต้องการ

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*' // อนุญาตเฉพาะ Origin ที่ระบุ
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, Range'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true' // หากต้องการรองรับ Cookies
          }
        ]
      }
    ]
  },
};

export default nextConfig;