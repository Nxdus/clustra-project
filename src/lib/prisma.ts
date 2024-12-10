import { PrismaClient } from "@prisma/client"

declare global {
  let prisma: PrismaClient | undefined
}

export const prisma = (global as { prisma?: PrismaClient }).prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  (global as { prisma?: PrismaClient }).prisma = prisma
}