import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { ActivityType, ResourceType } from "./activity-logger";
import { syncOnLogin } from "./auto-sync";

// 런타임 환경 변수 검증 함수
export function validateAuthConfig() {
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

          // 1단계: 현재 DB에서 사용자 찾기
          let user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          // 2단계: 현재 DB에 사용자가 없으면 Cloudflare에서 확인
          if (!user) {
            console.log(`🔍 현재 DB에 사용자 없음. Cloudflare 확인 중: ${credentials.email}`);
            
            try {
              // Cloudflare 로그인 API 호출
              const cloudflareResponse = await fetch(
                `${process.env.CLOUDFLARE_SITE_URL || 'https://superplace-academy.pages.dev'}/api/login`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                  }),
                }
              );

              if (cloudflareResponse.ok) {
                const cloudflareData = await cloudflareResponse.json();
                
                if (cloudflareData.success && cloudflareData.user) {
                  console.log(`✅ Cloudflare 인증 성공! 자동 계정 생성 중...`);
                  
                  // Cloudflare에서 인증 성공 → 자동으로 현재 DB에 계정 생성
                  const hashedPassword = await bcrypt.hash(credentials.password, 10);
                  
                  user = await prisma.user.create({
                    data: {
                      email: credentials.email,
                      password: hashedPassword,
                      name: cloudflareData.user.name || credentials.email.split('@')[0],
                      role: cloudflareData.user.role || 'STUDENT',
                      phone: cloudflareData.user.phone || null,
                      grade: cloudflareData.user.grade || null,
                      parentPhone: cloudflareData.user.parentPhone || null,
                      approved: true, // Cloudflare 인증된 사용자는 자동 승인
                      emailVerified: new Date(),
                    },
                  });
                  
                  console.log(`🎉 Cloudflare 사용자 자동 생성 완료: ${user.email}`);
                  
                  // 활동 로그 기록
                  try {
                    await prisma.activityLog.create({
                      data: {
                        userId: user.id,
                        sessionId: `cloudflare-auto-${Date.now()}`,
                        action: 'CLOUDFLARE_AUTO_REGISTER',
                        description: `Cloudflare 인증으로 자동 가입: ${user.email}`,
                      },
                    });
                  } catch (logError) {
                    console.error('로그 기록 실패:', logError);
                  }
                }
              } else {
                console.log(`❌ Cloudflare 인증 실패: ${credentials.email}`);
              }
            } catch (cloudflareError) {
              console.error('Cloudflare 인증 중 오류:', cloudflareError);
              // Cloudflare 오류는 무시하고 일반 로그인 프로세스 계속
            }
          }

          // 3단계: 여전히 사용자가 없으면 로그인 실패
          if (!user || !user.password) {
            return null;
          }

          // 4단계: 비밀번호 검증
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

          // 로그인 활동 로그 기록
          try {
            await prisma.activityLog.create({
              data: {
                userId: user.id,
                action: ActivityType.LOGIN,
                resource: ResourceType.AUTH,
                description: `${user.name || user.email}님이 로그인했습니다.`,
                metadata: {
                  email: user.email,
                  role: user.role,
                },
              },
            });
          } catch (logError) {
            console.error('로그인 활동 로그 기록 실패:', logError);
            // 로그 실패해도 로그인은 계속 진행
          }

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
