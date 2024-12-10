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

// กำหนดค่า ffmpeg path
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

// สร้าง S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// สร้าง CloudFront client
const cloudFrontClient = new CloudFrontClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.CLOUDFRONT_ENDPOINT
});

// Utility functions
const deleteS3Folder = async (prefix: string, fileName: string, segmentFiles: string[]) => {
  try {
    console.log(`\x1b[33m⚠\x1b[0m ลำลังลบโฟลเดอร์ ${prefix} จาก S3`);

    const objectsToDelete = [
      { Key: `${prefix}/${fileName}.m3u8` },
      ...segmentFiles.map(segment => ({
        Key: `${prefix}/${segment}`
      }))
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
  try {
    await s3Client.send(new PutObjectCommand(params));
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return uploadToS3WithRetry(params, retries - 1);
    }
    throw error;
  }
};

// เพิ่มฟังก์ชั่นสำหรับคำนวณขนาดไฟล์
const calculateTotalSize = (m3u8Buffer: Buffer, segmentFiles: string[], outputDir: string): number => {
  let totalSize = m3u8Buffer.length; // ขนาดของไฟล์ m3u8
  
  // รวมขนาดของไฟล์ segment ทั้งหมด
  for (const segmentFile of segmentFiles) {
    const segmentPath = path.join(outputDir, segmentFile);
    if (fs.existsSync(segmentPath)) {
      const stats = fs.statSync(segmentPath);
      totalSize += stats.size;
    }
  }
  
  return totalSize;
};

// เพิ่มฟังก์ชั่นตรวจสอบข้อจำกัด
const checkUserLimits = async (userId: string, fileSize: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      totalStorageUsed: true,
      monthlyUploads: true,
      lastUploadReset: true
    }
  });

  if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้');

  // รีเซ็ตจำนวนการอัพโหลดรายเดือน
  const now = new Date();
  const lastReset = new Date(user.lastUploadReset);
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyUploads: 0,
        lastUploadReset: now
      }
    });
    user.monthlyUploads = 0;
  }

  // ตรวจสอบข้อจำกัดตาม Role
  const limits = {
    FREE: {
      storage: 2 * 1024 * 1024 * 1024, // 2GB
      monthlyUploads: 5
    },
    PRO: {
      storage: 20 * 1024 * 1024 * 1024, // 20GB
      monthlyUploads: Infinity
    },
    ENTERPRISE: {
      storage: Infinity,
      monthlyUploads: Infinity
    }
  };

  const userLimits = limits[user.role as keyof typeof limits];

  // ตรวจสอบพื้นที่เก็บข้อมูล
  if (userLimits.storage !== Infinity && user.totalStorageUsed + fileSize > userLimits.storage) {
    throw new Error('พื้นที่จัดเก็บไม่เพียงพอ');
  }

  // ตรวจสอบจำนวนการอัพโหลดต่อเดือน
  if (userLimits.monthlyUploads !== Infinity && user.monthlyUploads >= userLimits.monthlyUploads) {
    throw new Error('คุณได้ใช้จำนวนครั้งในการอัพโหลดของเดือนนี้หมดแล้ว');
  }

  return user;
};

// Main API Handler
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signal = req.signal;
  let cleanup: (() => void) | null = null;
  let currentUploadId: string | null = null;

  try {
    // 1. รับและตรวจสอบข้อมูล
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const uploadId = formData.get('uploadId') as string;
    currentUploadId = uploadId;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'ไฟล์ไม่ถูกต้อง' }, { status: 400 });
    }

    try {      
      // อัพเดทจำนวนการอัพโหลดรายเดือน
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          monthlyUploads: {
            increment: 1
          }
        }
      });
    } catch (error) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตรวจสอบข้อจำกัด' 
      }, { status: 400 });
    }

    // 2. สร้างชื่อไฟล์และบันทึกวิดีโอใน Database
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

    // 3. ตั้งค่า cleanup function
    cleanup = async () => {
      try {
        await prisma.video.delete({ where: { id: pendingVideo.id } });
      } catch (err) {
        console.error('Cleanup error:', err instanceof Error ? err.message : 'Unknown error');
      }
    };

    // 5. เตรียมไฟล์และโฟลเดอร์
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = path.join(process.cwd(), 'public/uploads', encodedFileName);
    const outputDir = path.join(process.cwd(), 'public/converted', encodedFileName);
    const outputPath = path.join(outputDir, `${encodedFileName}.m3u8`);

    fs.writeFileSync(filePath, buffer);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 6. แปลงไฟล์ด้วย ffmpeg
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
          if (isAborted) return;
          updateProgress(uploadId, Math.round(progress.percent || 0), 'processing');
        })
        .on('end', () => {
          if (isAborted) return;
          updateProgress(uploadId, 100, 'processing');
          resolve('');
        })
        .on('error', (err) => {
          if (isAborted) return;
          setError(uploadId, err.message);
          reject(err);
        });

      process.run();

      signal?.addEventListener('abort', () => {
        isAborted = true;
        if (process) {
          try {
            process.kill('SIGKILL');
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
            if (cleanup) cleanup();

            console.log(`\x1b[33m⚠\x1b[0m ${fileName} | ยกเลิกการแปลงไฟล์`);

            clearProgress(uploadId);
            resolve('aborted'); // ส่งสถานะ aborted กลับ

          } catch (err) {
            console.error('Error during abort:', err);
          }
        }
      });
    });

    if (signal?.aborted) {
      return NextResponse.json({
        status: 'aborted',
        message: 'การแปลงฟล์ถูกยกเลิก'
      });
    }

    // 7. อัพโหดไฟล์ไปยัง S3
    if (!fs.existsSync(outputPath)) {
      throw new Error(`ไม่พบไฟล์ m3u8 ที่ ${outputPath}`);
    }

    if (!fs.existsSync(outputDir)) {
      throw new Error(`ไม่พบโฟลเดอร์ ${outputDir}`);
    }

    try {
      const m3u8FileBuffer = fs.readFileSync(outputPath);
      const segmentFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.ts'));
      
      if (segmentFiles.length === 0) {
        throw new Error('ไม่พบไฟล์ segment (.ts)');
      }

      // คำนวณจนาดไฟล์ทั้งหมดที่จะอัพโหลดไปยัง S3
      const totalFileSize = calculateTotalSize(m3u8FileBuffer, segmentFiles, outputDir);

      // อัพเดทขนาดไฟล์ในฐานข้อมูล
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          totalStorageUsed: {
            increment: totalFileSize
          }
        }
      });

      await prisma.video.update({
        where: { id: pendingVideo.id },
        data: {
          fileSize: totalFileSize
        }
      });

      // คำนวณจำนวนไฟล์ทั้งหมดที่ต้องอัพโหลด (m3u8 + segments)
      const totalFiles = segmentFiles.length + 1;
      let uploadedFiles = 0;

      // ตรวจสอบ signal aborted ก่อนเริมอัพโหลด
      if (signal?.aborted) {
        console.log(`\x1b[33m⚠\x1b[0m ${fileName} | ยกเลิกการอัพโหลด่อนเริ่มต้น`);
        return NextResponse.json({
          status: 'aborted',
          message: 'การอัพโหลดถูกยกเลิก'
        });
      }

      // อัพโหลด m3u8 file
      await uploadToS3WithRetry({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: `converted/${encodedFileName}/${encodedFileName}.m3u8`,
        Body: m3u8FileBuffer,
        ContentType: 'application/vnd.apple.mpegurl',
        ACL: ObjectCannedACL.private
      });
      
      uploadedFiles++;
      updateProgress(uploadId, Math.round((uploadedFiles / totalFiles) * 100), 'uploading');

      // อัพโหลด segments
      for (const segmentFile of segmentFiles) {
        // ตรวจสอบ signal aborted ก่อนอัพโหลดแต่ละ segment
        if (signal?.aborted) {
          console.log(`\x1b[33m⚠\x1b[0m ${fileName} | ยกเลิกการอัพโหลดระหว่างทาง`);
          // ลบไฟล์ที่อัพโหลดไปแล้วบน S3
          await deleteS3Folder(`converted/${encodedFileName}`, encodedFileName, segmentFiles);

          return NextResponse.json({
            status: 'aborted',
            message: 'การอัพโหลดถูกยกเลิก'
          });
        }

        const segmentFilePath = path.join(outputDir, segmentFile);
        if (!fs.existsSync(segmentFilePath)) {
          console.warn(`ไฟล์ segment ไม่พบ: ${segmentFilePath}`);
          continue;
        }

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

      updateProgress(uploadId, 100, 'completed');

      // 8. ท��ความสะอาดไฟล์ชั่วคราว
      fs.unlinkSync(filePath);
      fs.rmSync(outputDir, { recursive: true, force: true });

      // 9. อัพเดทสถานะวิดีโอ
      await prisma.video.update({
        where: { id: pendingVideo.id },
        data: { status: 'COMPLETED' }
      });

      // 10. Invalidate CloudFront cache
      try {
        await cloudFrontClient.send(new CreateInvalidationCommand({
          DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID!,
          InvalidationBatch: {
            CallerReference: String(Date.now()),
            Paths: {
              Quantity: 1,
              Items: [`/converted/${encodedFileName}/*`],
            },
          },
        }));
      } catch (error) {
        console.error('Error invalidating CloudFront cache:', error);
      }

      // 11. เคลียร์สถานะและส่งผลลัพธ์
      clearProgress(uploadId);
      return NextResponse.json({
        message: 'ไฟล์ถูกแปลงเป็น m3u8 เรียบร้อยแล้ว',
        videoId: pendingVideo.id,
        m3u8Url: pendingVideo.url
      });

    } catch (error) {
      console.error('Error during file upload:', error);
      throw error;
    }

  } catch (error) {
    if (currentUploadId) {
      setError(currentUploadId, error instanceof Error ? error.message : 'Unknown error');
    }
    throw error;
  }
}
