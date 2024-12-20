import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      monthlyUploads: { increment: 1 }
    }
  });

  const fileName = `${randomBytes(6).toString('hex')}`;
  const encodedFileName = encodeURIComponent(fileName);

  // Upload original file to S3
  const arrayBuffer = await file.arrayBuffer();
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `original/${encodedFileName}.mp4`,
    Body: Buffer.from(arrayBuffer),
    ContentType: 'video/mp4',
    ACL: 'private',
  }));

  // Create a job in DB with PENDING status
  const pendingVideo = await prisma.video.create({
    data: {
      name: fileName,
      key: `converted/${encodedFileName}/${encodedFileName}.m3u8`,
      url: `https://${process.env.CLOUDFRONT_DOMAIN}/converted/${encodedFileName}/${encodedFileName}.m3u8`,
      userId: session.user.id,
      status: 'PENDING',
      progress: 0.0
    }
  });

  return NextResponse.json({
    message: 'Upload received. Processing will start shortly.',
    jobId: pendingVideo.id
  });
}