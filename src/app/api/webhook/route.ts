import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import Stripe from 'stripe';
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function deleteVideoAndS3Files(videoId: string) {
  // ลบไฟล์จาก S3
  const s3Filekey = videoId.split('/').slice(0, -1).join('/');
  const listParams = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Prefix: s3Filekey
  };

  try {
    const { Contents } = await s3Client.send(new ListObjectsV2Command(listParams));
    
    if (Contents && Contents.length > 0) {
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Delete: {
          Objects: Contents.map(({ Key }) => ({ Key: Key! }))
        }
      };
      await s3Client.send(new DeleteObjectsCommand(deleteParams));
    }
  } catch (error) {
    console.error('Error deleting files from S3:', error);
    throw error;
  }
}

async function cleanupCancelledSubscription(userId: string) {
  // ลบ domains ที่เกินจำกัด free plan
  const FREE_DOMAIN_LIMIT = 2;
  const domains = await prisma.allowedDomain.findMany({
    where: { userId: userId },
    orderBy: { createdAt: 'desc' }
  });

  if (domains.length > FREE_DOMAIN_LIMIT) {
    const domainsToDelete = domains.slice(FREE_DOMAIN_LIMIT);
    await prisma.allowedDomain.deleteMany({
      where: {
        id: {
          in: domainsToDelete.map(d => d.id)
        }
      }
    });
  }

  // ลบวิดีโอที่เกินจนาดพื้นที่ของ free plan
  const FREE_STORAGE_LIMIT = 1024 * 1024 * 1024 * 5; // 5GB in bytes
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalStorageUsed: true }
  });

  if (!user || user.totalStorageUsed <= FREE_STORAGE_LIMIT) return;

  // หาวิดีโอทั้งหมดเรียงตามวันที่สร้างจากเก่าสุด
  const videos = await prisma.video.findMany({
    where: { userId: userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, fileSize: true }
  });

  let currentStorage = user.totalStorageUsed;
  const videosToDelete = [];

  // เลือกวิดีโอที่จะลบจนกว่าจะเหลือพื้นที่ไม่เกิน limit
  for (const video of videos) {
    if (currentStorage <= FREE_STORAGE_LIMIT) break;
    videosToDelete.push(video.id);
    currentStorage -= (video.fileSize || 0);
  }

  // ลบวิดีโอและไฟล์ใน S3
  for (const videoId of videosToDelete) {
    await deleteVideoAndS3Files(videoId);
    await prisma.video.delete({
      where: { id: videoId }
    });
  }

  // อัพเดทพื้นที่การใช้งานของผู้ใช้
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalStorageUsed: currentStorage
    }
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  
  if (!userId) return;

  const newRole = subscription.status === 'active' ? 'PRO' : 'FREE';

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: newRole,
      stripeSubscriptionId: subscription.id,
      ...(newRole === 'FREE' && {
        monthlyUploads: 0
      })
    }
  });

  // ถ้าสถานะเปลี่ยนเป็น FREE (ยกเลิก subscription) ให้ทำการ cleanup
  if (newRole === 'FREE') {
    await cleanupCancelledSubscription(userId);
  }

  console.log('Subscription updated for user:', userId);
  console.log('Subscription status:', newRole);
}

export async function POST(req: Request) {
  const body = await req.text();

  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Webhook verified, event:', event.type);
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    await handleSubscriptionUpdated(subscription);
  }

  if (event.type === 'customer.subscription.updated' || 
      event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionUpdated(subscription);
  }

  return NextResponse.json({ received: true });
} 