import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeSubscriptionId: true }
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    // ยกเลิก subscription ใน Stripe
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    // อัพเดทข้อมูล user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        role: 'FREE',
        stripeSubscriptionId: null 
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการยกเลิก subscription' },
      { status: 500 }
    );
  }
} 