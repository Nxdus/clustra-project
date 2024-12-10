import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function GET() {
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
      return NextResponse.json({ hasActiveSubscription: false });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    return NextResponse.json({
      hasActiveSubscription: subscription.status === 'active'
    });

  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการรวจสอบ subscription' },
      { status: 500 }
    );
  }
} 