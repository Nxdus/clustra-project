import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        monthlyUploads: true,
        totalStorageUsed: true,
        lastUploadReset: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // รีเซ็ตจำนวนการอัพโหลดรายเดือนถ้าเข้าเดือนใหม่
    const now = new Date();
    const lastReset = new Date(user.lastUploadReset);
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          monthlyUploads: 0,
          lastUploadReset: now
        }
      });
      user.monthlyUploads = 0;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' },
      { status: 500 }
    );
  }
} 