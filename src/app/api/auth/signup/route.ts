// app/api/auth/register/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  // ตรวจสอบว่าผู้ใช้มีอยู่แล้วหรือไม่
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ message: 'User already exists' }, { status: 400 })
  }

  // เข้ารหัสรหัสผ่าน
  const hashedPassword = await bcrypt.hash(password, 10)

  // สร้างผู้ใช้ใหม่
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  })

  if (user) {
    return NextResponse.json({ user: { email, password } }, { status: 200 })
  } else {
    return NextResponse.json({ message: "failed to created" }, { status: 400 })
  }
}
