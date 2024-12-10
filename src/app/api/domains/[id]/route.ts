import { NextRequest, NextResponse } from 'next/server'
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

export async function DELETE(
  request: NextRequest
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ลรวจสอบว่า domain มีอยู่จริงและเป็นของ user นี้
    const domain = await prisma.allowedDomain.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!domain) {
      return NextResponse.json(
        { error: "ไม่พบ domain หรือคุณไม่มีสิทธิ์ลบ domain นี้" },
        { status: 404 }
      )
    }

    // ลบ domain
    await prisma.allowedDomain.delete({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    // อัพเดท CloudFront Response Headers Policy
    try {
      const policyId = process.env.CLOUDFRONT_RESPONSE_HEADERS_POLICY_ID
      if (!policyId) {
        throw new Error('Missing CloudFront Response Headers Policy ID')
      }

      // ดึง domains ที่เหลือ
      const remainingDomains = await prisma.allowedDomain.findMany({
        where: { userId: session.user.id },
        select: { domain: true }
      })

      const corsOrigins = remainingDomains.length > 0 
        ? remainingDomains.map(d => {
            const asciiDomain = toASCII(d.domain)
            return [
              `https://${asciiDomain}`
            ]
          }).flat()
        : ['http://clustra.tech'] // ใส่ default origin เมื่อไม่มี domain เหลือ

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
          Comment: "Updated CORS configuration with default origin"
        },
        Id: policyId,
        IfMatch: currentPolicy.ETag
      })

      await cloudFrontClient.send(updateCommand)
    } catch (corsError) {
      console.error('Error updating CloudFront CORS:', corsError)
      // ไม่ return error เพราะ domain ถูกลบไปแล้ว
    }

    return NextResponse.json({ message: 'Domain ถูกลบเรียบร้อยแล้ว' })
  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบ domain' },
      { status: 500 }
    )
  }
} 