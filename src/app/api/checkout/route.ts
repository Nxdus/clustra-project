import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ดึงข้อมูล user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, stripeCustomerId: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // ส้ามี customerId แต่หาไม่เข็นใน Stripe ให้สร้างใหม่
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = null; // reset เพื่อสร้างใหม่
      }
    }

    // สร้าง customer ใหม่ถ้าไม่มี
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: session.user.id
        }
      });
      customerId = customer.id;

      // บันทึก stripeCustomerId
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId }
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // สร้าง checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_ANNUAL_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/en/dashboard?success=true`,
      cancel_url: `${baseUrl}/en?canceled=true`,
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });

  } catch (err) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้าง checkout session' },
      { status: 500 }
    );
  }
} 