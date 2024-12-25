import { PrismaAdapter } from "@auth/prisma-adapter"
import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "./prisma"
import bcrypt from 'bcryptjs'
import Credentials from "next-auth/providers/credentials"

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
  adapter: {
    ...PrismaAdapter(prisma),
    getUserByEmail: async (email: string) => {
      const user = await prisma.user.findUnique({
        where: { email: email || '' }
      })
      return user ? {
        ...user,
        email: user.email || '',
      } : null
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        domain: '.clustra.tech',
        path: '/api/',
        sameSite: 'lax',
        httpOnly: true,
        secure: true,
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) return null
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null
        return user
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) session.user.id = token.id as string
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