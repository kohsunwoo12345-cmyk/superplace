import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// 환경 변수 검증
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "NEXTAUTH_SECRET 환경 변수가 설정되지 않았습니다. Vercel 대시보드에서 환경 변수를 설정해주세요."
  );
}

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === "production") {
  console.warn(
    "⚠️  NEXTAUTH_URL 환경 변수가 설정되지 않았습니다. 프로덕션 환경에서는 반드시 설정해야 합니다."
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // 승인 여부 확인
          if (!user.approved) {
            throw new Error("승인 대기 중입니다. 관리자에게 문의하세요.");
          }

          // 마지막 로그인 시간 업데이트
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/",
    error: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        
        // academyId 추가
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { academyId: true },
        });
        
        token.academyId = dbUser?.academyId || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.academyId = token.academyId as string;
      }
      return session;
    },
  },
};
