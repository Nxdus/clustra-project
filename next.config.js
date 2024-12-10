/** @type {import('next').NextConfig} */
const nextConfig = {
  // ลดขนาดของ build output
  output: 'standalone',
  // ปิดการสร้าง source maps ในโหมด production
  productionBrowserSourceMaps: false,
  images: {
    domains: ['clustra.tech'], // แก้ไขตามที่คุณใช้งาน
  },
  // เพิ่ม config สำหรับ authentication
  auth: {
    providers: ['google'],
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true
  }
}

module.exports = nextConfig 