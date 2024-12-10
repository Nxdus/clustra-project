import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront"

// สร้าง CloudFront client
const cloudFrontClient = new CloudFrontClient({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
})

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoId, isPublic } = await req.json()

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId: session.user.id
      }
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // อร้าง invalidation ใน CloudFront
    const createInvalidationCommand = new CreateInvalidationCommand({
      DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `${videoId}-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: [`/videos/${video.key}*`]
        }
      }
    })
    await cloudFrontClient.send(createInvalidationCommand)

    // อัพเดทสถานะวิดีโอใน Database
    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: { isPublic }
    })

    return NextResponse.json({
      message: 'อัพเดทการเข้าถึงเรียบร้อยแล้ว',
      video: updatedVideo
    })
    
  } catch (error) {
    console.error('Error updating access:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทการเข้าถึง' },
      { status: 500 }
    )
  }
}