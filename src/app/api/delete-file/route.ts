import { NextResponse } from 'next/server'
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const fileKey = url.searchParams.get('fileKey')

    if (!fileKey) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 })
    }

    // ต้นหาวิดีโอและข้อมูลขนาดไฟล์
    const video = await prisma.video.findFirst({
      where: {
        id: fileKey,
        userId: session.user.id
      },
      select: {
        id: true,
        userId: true,
        fileSize: true
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 })
    }

    // แน่ใจว่ามีค่า fileSize ก่อนที่จะลบ
    const fileSizeToDecrement = video.fileSize || 0

    // ทำ transaction เพื่อให้แน่ใจว่าทั้งการลบและการอัพเดทพื้นที่จะสำเร็จพร้อมกัน
    await prisma.$transaction([
      prisma.video.delete({
        where: { id: video.id }
      }),
      prisma.user.update({
        where: { id: video.userId },
        data: {
          totalStorageUsed: {
            decrement: fileSizeToDecrement
          }
        }
      })
    ])

    const s3Filekey = fileKey.split('/').slice(0, -1).join('/')

    // ลบไฟล์จาก S3
    const listParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Prefix: s3Filekey
    }

    try {
      // ดึงรายการไฟล์ทั้งหมดในโฟลเดอร์
      const { Contents } = await s3Client.send(new ListObjectsV2Command(listParams))
      
      if (Contents && Contents.length > 0) {
        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME!,
          Delete: {
            Objects: Contents.map(({ Key }) => ({ Key: Key! }))
          }
        }

        // ลบไฟล์ทั้งหมด
        await s3Client.send(new DeleteObjectsCommand(deleteParams))
      }

      return NextResponse.json({ message: 'ลบไฟล์สำเร็จ' })

    } catch (error) {
      console.error('Error deleting files from S3:', error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการลบไฟล์' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ 
      error: 'An error occurred while deleting the video' 
    }, { status: 500 })
  }
}
