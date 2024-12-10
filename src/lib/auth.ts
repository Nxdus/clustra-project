import { PrismaAdapter } from "@auth/prisma-adapter"
import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }
}

export const authOptions: AuthOptions = {
  debug: true,
  logger: {
    error: (code, ...message) => {
      console.error(code, message)
    },
    warn: (code, ...message) => {
      console.warn(code, message)
    },
    debug: (code, ...message) => {
      console.debug(code, message)
    },
  },
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/',
  },
}