/** @type {import('next').NextConfig} */
const nextConfig = {
  // ลดขนาดของ build output
  output: 'standalone',
  // ปิดการสร้าง source maps ในโหมด production
  productionBrowserSourceMaps: false,
  images: {
    domains: ['clustra.tech'], // แก้ไขตามที่คุณใช้งาน
  },
}

module.exports = nextConfig 