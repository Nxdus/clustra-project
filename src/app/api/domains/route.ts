import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { CloudFrontClient, UpdateResponseHeadersPolicyCommand, GetResponseHeadersPolicyCommand } from '@aws-sdk/client-cloudfront'
import { toASCII } from 'punycode'

const cloudFrontClient = new CloudFrontClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { domain } = await req.json()
    
    // ตรวจสอบจำนวน Domain ตาม Plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        allowedDomains: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 })
    }

    const domainLimits = {
      FREE: 2,
      PRO: 5,
      ENTERPRISE: Infinity
    }

    const limit = domainLimits[user.role as keyof typeof domainLimits]
    
    if (limit !== Infinity && user.allowedDomains.length >= limit) {
      return NextResponse.json({ 
        error: `คุณไม่สามารถเพิ่ม Domain ได้อีก เนื่องจากเกินจำนวนที่กำหนดสำหรับแพ็คเกจ ${user.role}` 
      }, { status: 400 })
    }
    
    // แปลง domain เป็น punycode
    const punycodeUrl = toASCII(domain)
    
    // ตรวจสอบรูปแบบ domain (รองรับ punycode)
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(punycodeUrl)) {
      return NextResponse.json({ error: "รูปแบบ domain ไม่ถูกต้อง" }, { status: 400 })
    }

    // บันทึก domain ลงฐานข้อมูล
    const allowedDomain = await prisma.allowedDomain.create({
      data: {
        domain: punycodeUrl,
        userId: session.user.id
      }
    })

    // ดึง domains ทั้งหมดและแปลงเป็น CORS origins
    const userDomains = await prisma.allowedDomain.findMany({
      where: { userId: session.user.id },
      select: { domain: true }
    })

    const corsOrigins = userDomains.map((d: { domain: string }) => {
      const asciiDomain = toASCII(d.domain)
      return [
        `https://${asciiDomain}`,
      ]
    }).flat()

    // อัพเดท CloudFront Response Headers Policy
    const policyId = process.env.CLOUDFRONT_RESPONSE_HEADERS_POLICY_ID
    if (!policyId) {
      throw new Error('Missing CloudFront Response Headers Policy ID')
    }

    // ดึง policy ปัจจุบัน
    const getCommand = new GetResponseHeadersPolicyCommand({
      Id: policyId
    })
    const currentPolicy = await cloudFrontClient.send(getCommand)

    if (!currentPolicy.ResponseHeadersPolicy?.ResponseHeadersPolicyConfig) {
      throw new Error('Invalid Response Headers Policy configuration')
    }

    // อัพเดท CORS origins ใน policy
    const updateCommand = new UpdateResponseHeadersPolicyCommand({
      ResponseHeadersPolicyConfig: {
        ...currentPolicy.ResponseHeadersPolicy.ResponseHeadersPolicyConfig,
        CorsConfig: {
          AccessControlAllowOrigins: {
            Items: corsOrigins,
            Quantity: corsOrigins.length
          },
          AccessControlAllowHeaders: {
            Items: ["*"],
            Quantity: 1
          },
          AccessControlAllowMethods: {
            Items: ["GET", "HEAD"],
            Quantity: 2
          },
          AccessControlMaxAgeSec: 86400,
          AccessControlExposeHeaders: {
            Items: ["ETag"],
            Quantity: 1
          },
          AccessControlAllowCredentials: false,
          OriginOverride: false
        },
        SecurityHeadersConfig: {
          StrictTransportSecurity: {
            AccessControlMaxAgeSec: 31536000,
            IncludeSubdomains: true,
            Preload: true,
            Override: true
          },
          ContentTypeOptions: {
            Override: true
          },
          XSSProtection: {
            Protection: true,
            ModeBlock: true,
            Override: true
          },
          FrameOptions: {
            FrameOption: "DENY",
            Override: true
          },
          ReferrerPolicy: {
            ReferrerPolicy: "strict-origin-when-cross-origin",
            Override: true
          },
          ContentSecurityPolicy: {
            ContentSecurityPolicy: "default-src 'self'",
            Override: true
          }
        },
        Name: currentPolicy.ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name,
        Comment: "Updated CORS and security configuration"
      },
      Id: policyId,
      IfMatch: currentPolicy.ETag
    })

    await cloudFrontClient.send(updateCommand)

    return NextResponse.json({
      message: 'เพิ่ม domain สำเร็จ',
      domain: allowedDomain
    })

  } catch (error) {
    console.error('Error adding domain:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่ม domain' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const domains = await prisma.allowedDomain.findMany({
      where: { userId: session.user.id },
      select: { id: true, domain: true }
    })

    return NextResponse.json({ domains })
  } catch {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล domain' },
      { status: 500 }
    )
  }
}
