import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const videos = await prisma.video.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ 
      videos: videos.map(video => ({
        id: video.id,
        name: video.name,
        displayName: video.displayName,
        key: video.key,
        url: video.url,
        isPublic: video.isPublic,
        uploadedAt: video.updatedAt,
        fileSize: video.fileSize
      }))
    })
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}
