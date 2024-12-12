import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
  DeleteObjectsCommand,
  PutObjectCommandInput
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  CreateInvalidationCommand
} from "@aws-sdk/client-cloudfront";
import {
  updateProgress,
  clearProgress,
  setError
} from '@/lib/upload-status';

ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const cloudFrontClient = new CloudFrontClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.CLOUDFRONT_ENDPOINT
});

const deleteS3Folder = async (prefix: string, fileName: string, segmentFiles: string[]) => {
  try {
    console.log(`\x1b[33m⚠\x1b[0m Deleting folder ${prefix} from S3`);

    const objectsToDelete = [
      { Key: `${prefix}/${fileName}.m3u8` },
      ...segmentFiles.map(segment => ({ Key: `${prefix}/${segment}` }))
    ];

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Delete: { Objects: objectsToDelete }
    });
    
    await s3Client.send(deleteCommand);
  } catch (error) {
    console.error('Error deleting S3 folder:', error);
    throw error;
  }
};

const uploadToS3WithRetry = async (params: PutObjectCommandInput, retries = 3) => {
  while (retries > 0) {
    try {
      await s3Client.send(new PutObjectCommand(params));
      return;
    } catch (error) {
      retries -= 1;
      if (retries === 0) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

const calculateTotalSize = (m3u8Buffer: Buffer, segmentFiles: string[], outputDir: string): number => {
  let totalSize = m3u8Buffer.length;
  segmentFiles.forEach(segmentFile => {
    const segmentPath = path.join(outputDir, segmentFile);
    if (fs.existsSync(segmentPath)) {
      totalSize += fs.statSync(segmentPath).size;
    }
  });
  return totalSize;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signal = req.signal;
  let cleanup: (() => void) | null = null;
  let currentUploadId: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const uploadId = formData.get('uploadId') as string;
    currentUploadId = uploadId;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          monthlyUploads: { increment: 1 }
        }
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Error updating limits' }, { status: 400 });
    }

    const fileName = `${randomBytes(6).toString('hex')}`;
    const encodedFileName = encodeURIComponent(fileName);

    const pendingVideo = await prisma.video.create({
      data: {
        name: fileName,
        key: `converted/${encodedFileName}/${encodedFileName}.m3u8`,
        url: `https://${process.env.CLOUDFRONT_DOMAIN}/converted/${encodedFileName}/${encodedFileName}.m3u8`,
        userId: session.user.id,
        status: 'PROCESSING',
      }
    });

    cleanup = async () => {
      try {
        await prisma.video.delete({ where: { id: pendingVideo.id } });
      } catch (err) {
        console.error('Cleanup error:', err instanceof Error ? err.message : 'Unknown error');
      }
    };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = path.join(process.cwd(), 'public/uploads', encodedFileName);
    const outputDir = path.join(process.cwd(), 'public/converted', encodedFileName);
    const outputPath = path.join(outputDir, `${encodedFileName}.m3u8`);

    fs.writeFileSync(filePath, buffer);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(filePath);
    console.log(outputPath);

    await new Promise((resolve, reject) => {
      let isAborted = false;
      const process = ffmpeg(filePath)
        .output(outputPath)
        .outputOptions([
          '-preset fast',
          '-f hls',
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename',
          path.join(outputDir, `${encodedFileName}-%03d.ts`),
        ])
        .on('progress', (progress) => {
          if (isAborted) {
            return;
          }
          updateProgress(uploadId, Math.round(progress.percent || 0), 'processing');
        })
        .on('end', () => {
          if (!isAborted) {
            resolve('');
          }
        })
        .on('error', (err) => {
          if (!isAborted) {
            reject(err);
          }
        });

      process.run();

      signal?.addEventListener('abort', () => {
        isAborted = true;
        process.kill('SIGKILL');
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
        cleanup?.();
        clearProgress(uploadId);
        resolve('aborted');
      });
    });

    if (signal?.aborted) {
      return NextResponse.json({ status: 'aborted', message: 'Conversion aborted' });
    }

    if (!fs.existsSync(outputPath)) {
      throw new Error(`M3U8 file not found at ${outputPath}`);
    }

    const m3u8FileBuffer = fs.readFileSync(outputPath);
    const segmentFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.ts'));

    if (segmentFiles.length === 0) {
      throw new Error('No segment files found (.ts)');
    }

    const totalFileSize = calculateTotalSize(m3u8FileBuffer, segmentFiles, outputDir);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { totalStorageUsed: { increment: totalFileSize } }
    });

    await prisma.video.update({
      where: { id: pendingVideo.id },
      data: { fileSize: totalFileSize }
    });

    const totalFiles = segmentFiles.length + 1;
    let uploadedFiles = 0;

    await uploadToS3WithRetry({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `converted/${encodedFileName}/${encodedFileName}.m3u8`,
      Body: m3u8FileBuffer,
      ContentType: 'application/vnd.apple.mpegurl',
      ACL: ObjectCannedACL.private
    });

    uploadedFiles++;
    updateProgress(uploadId, Math.round((uploadedFiles / totalFiles) * 100), 'uploading');

    for (const segmentFile of segmentFiles) {
      const segmentFilePath = path.join(outputDir, segmentFile);
      if (signal?.aborted) {
        await deleteS3Folder(`converted/${encodedFileName}`, encodedFileName, segmentFiles);
        return NextResponse.json({ status: 'aborted', message: 'Upload aborted' });
      }

      if (fs.existsSync(segmentFilePath)) {
        await uploadToS3WithRetry({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: `converted/${encodedFileName}/${segmentFile}`,
          Body: fs.readFileSync(segmentFilePath),
          ContentType: 'video/MP2T',
          ACL: ObjectCannedACL.private
        });

        uploadedFiles++;
        updateProgress(uploadId, Math.round((uploadedFiles / totalFiles) * 100), 'uploading');
      }
    }

    updateProgress(uploadId, 100, 'completed');

    fs.unlinkSync(filePath);
    fs.rmSync(outputDir, { recursive: true, force: true });

    await prisma.video.update({
      where: { id: pendingVideo.id },
      data: { status: 'COMPLETED' }
    });

    try {
      await cloudFrontClient.send(new CreateInvalidationCommand({
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID!,
        InvalidationBatch: {
          CallerReference: String(Date.now()),
          Paths: { Quantity: 1, Items: [`/converted/${encodedFileName}/*`] },
        },
      }));
    } catch (error) {
      console.error('Error invalidating CloudFront cache:', error);
    }

    clearProgress(uploadId);
    return NextResponse.json({
      message: 'File successfully converted to M3U8',
      videoId: pendingVideo.id,
      m3u8Url: pendingVideo.url
    });

  } catch (error) {
    setError(currentUploadId!, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}
