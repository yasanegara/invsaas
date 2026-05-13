import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  trustHost: true,
  providers: [
    Google({
      clientId: (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) as string,
      clientSecret: (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET) as string,
    }),
    ...(process.env.AUTH_GITHUB_ID ? [
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      })
    ] : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) return null

        return user
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const superadminEmails = (process.env.SUPERADMIN_EMAIL ?? '')
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean)

        const isSuperadminEmail = user.email && superadminEmails.includes(user.email.toLowerCase())

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })

        // Auto-promote via env var bootstrap (idempotent)
        if (isSuperadminEmail && dbUser?.role !== 'SUPERADMIN') {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'SUPERADMIN' },
          })
          token.role = 'SUPERADMIN'
        } else {
          token.role = dbUser?.role ?? 'USER'
        }
      }
      return token
    },
    session({ session, token }) {
      return {
        ...session,
        user: { ...session.user, id: token.sub ?? '', role: token.role as string ?? 'USER' },
      }
    },
  },
  pages: {
    signIn: '/login',
  },
})
