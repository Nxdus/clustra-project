import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/lib/auth'

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoId, displayName } = await req.json()

    if (!videoId || !displayName) {
      return NextResponse.json({ error: "Video ID and display name are required" }, { status: 400 })
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

    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: { displayName }
    })

    return NextResponse.json({
      message: 'อัพเดทชื่อวิดีโอเรียบร้อยแล้ว',
      video: updatedVideo
    })
    
  } catch (error) {
    console.error('Error renaming video:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเปลี่ยนชื่อวิดีโอ' },
      { status: 500 }
    )
  }
} 