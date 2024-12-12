import 'dotenv/config' // ถ้าคุณต้องการโหลด env ตอนรัน worker
import { prisma } from '../lib/prisma';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { promisify } from 'util';
import { pipeline } from 'stream';

ffmpeg.setFfmpegPath('/usr/bin/ffmpeg'); // ปรับตามตำแหน่ง ffmpeg บนเซิร์ฟเวอร์คุณ

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
  }
});

async function downloadFromS3(key: string, localPath: string) {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key
  });
  const response = await s3Client.send(command);

  await promisify(pipeline)(
    response.Body as NodeJS.ReadableStream,
    fs.createWriteStream(localPath)
  );
}

async function uploadToS3(key: string, body: Buffer, contentType: string) {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'private'
  }));
}

async function processPendingJobs() {
  const jobs = await prisma.video.findMany({ where: { status: 'PENDING' }, take: 5 });

  for (const job of jobs) {
    const encodedFileName = encodeURIComponent(job.name);
    const originalKey = `original/${encodedFileName}.mp4`;
    const tempDir = path.join(process.cwd(), 'temp', encodedFileName);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const originalFilePath = path.join(tempDir, `${encodedFileName}.mp4`);
    const outputDir = path.join(tempDir, 'converted');
    const outputPath = path.join(outputDir, `${encodedFileName}.m3u8`);

    try {
      await downloadFromS3(originalKey, originalFilePath);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // อัปเดตสถานะเป็น PROCESSING ก่อนแปลง
      await prisma.video.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', progress: 0.0 }
      });

      await new Promise<void>((resolve, reject) => {
        let lastUpdateTime = Date.now();

        ffmpeg(originalFilePath)
          .output(outputPath)
          .outputOptions([
            '-preset fast',
            '-f hls',
            '-hls_time 10',
            '-hls_list_size 0',
            '-hls_segment_filename',
            path.join(outputDir, `${encodedFileName}-%03d.ts`),
          ])
          .on('progress', async (progress) => {
            const now = Date.now();
            if (now - lastUpdateTime > 1000) {
              lastUpdateTime = now;
              await prisma.video.update({
                where: { id: job.id },
                data: { progress: progress.percent ?? 0.0 }
              });
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          })
          .run();
      });

      const m3u8FileBuffer = fs.readFileSync(outputPath);
      const segmentFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.ts'));

      // อัปโหลดไฟล์แปลงเสร็จ
      await uploadToS3(`converted/${encodedFileName}/${encodedFileName}.m3u8`, m3u8FileBuffer, 'application/vnd.apple.mpegurl');

      for (const segmentFile of segmentFiles) {
        const segmentPath = path.join(outputDir, segmentFile);
        await uploadToS3(`converted/${encodedFileName}/${segmentFile}`, fs.readFileSync(segmentPath), 'video/MP2T');
      }

      // คำนวน fileSize
      let totalSize = m3u8FileBuffer.length;
      for (const seg of segmentFiles) {
        const segPath = path.join(outputDir, seg);
        totalSize += fs.statSync(segPath).size;
      }

      // อัปเดตสถานะเป็น COMPLETED และ fileSize, progress = 100
      await prisma.video.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', fileSize: totalSize, progress: 100.0 }
      });

      // อัปเดตการใช้งาน storage ของ user
      await prisma.user.update({
        where: { id: job.userId },
        data: { totalStorageUsed: { increment: totalSize } }
      });

      // Invalidate CloudFront Cache (ถ้าจำเป็น)
      await cloudFrontClient.send(new CreateInvalidationCommand({
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID!,
        InvalidationBatch: {
          CallerReference: String(Date.now()),
          Paths: { Quantity: 1, Items: [`/converted/${encodedFileName}/*`] },
        },
      }));
    } catch (error) {
      console.error('Error processing job:', job.id, error);
      await prisma.video.update({
        where: { id: job.id },
        data: { status: 'ERROR' }
      });
    } finally {
      // Cleanup temp files
      if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// ตัวอย่าง: รันหนึ่งครั้งแล้วจบ (ใช้ cron job เรียกซ้ำ):
processPendingJobs().then(() => {
  console.log('Processed pending jobs.');
  process.exit(0);
});
