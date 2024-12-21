import type { NextConfig } from "next";

const allowedOrigins = ['https://clustra.tech', 'https://upload.clustra.tech']; // อนุญาตเฉพาะ Origin ที่ต้องการ

const headers = [
  "Accept", "Accept-Version", "Content-Length",
  "Content-MD5", "Content-Type", "Date", "X-Api-Version",
  "X-CSRF-Token", "X-Requested-With",
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigins.join(', ') // อนุญาตเฉพาะ Origin ที่ระบุ
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: headers.join(', ')
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