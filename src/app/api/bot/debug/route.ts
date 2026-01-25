import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/bot/debug
 * 
 * AI 채팅 디버깅 정보 확인
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. 세션 정보
    const sessionInfo = {
      authenticated: !!session,
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
      role: session?.user?.role || null,
    };

    // 2. 모든 AI 봇 목록
    const allBots = await prisma.aIBot.findMany({
      select: {
        id: true,
        botId: true,
        name: true,
        nameEn: true,
        description: true,
        icon: true,
        systemPrompt: true,
        enableImageInput: true,
        enableVoiceOutput: true,
        enableVoiceInput: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. 현재 사용자의 봇 할당 (로그인된 경우)
    let myAssignments = [];
    if (session?.user?.id) {
      myAssignments = await prisma.botAssignment.findMany({
        where: {
          userId: session.user.id,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          bot: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // 4. 전체 봇 할당 현황 (관리자만)
    let allAssignments = [];
    if (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'DIRECTOR') {
      allAssignments = await prisma.botAssignment.findMany({
        where: {
          isActive: true,
        },
        include: {
          bot: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });
    }

    // 5. 환경변수 확인
    const envCheck = {
      GOOGLE_GEMINI_API_KEY: !!process.env.GOOGLE_GEMINI_API_KEY,
      GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
      CLOUDFLARE_SYNC_API_KEY: !!process.env.CLOUDFLARE_SYNC_API_KEY,
    };

    return NextResponse.json({
      success: true,
      debug: {
        session: sessionInfo,
        allBots: allBots.map(bot => ({
          id: bot.id,
          botId: bot.botId,
          name: bot.name,
          nameEn: bot.nameEn,
          icon: bot.icon,
          description: bot.description,
          isActive: bot.isActive,
          features: {
            imageInput: bot.enableImageInput,
            voiceOutput: bot.enableVoiceOutput,
            voiceInput: bot.enableVoiceInput,
            systemPrompt: !!bot.systemPrompt,
          },
          createdAt: bot.createdAt,
        })),
        myAssignments: myAssignments.map(a => ({
          botId: a.botId,
          botName: a.bot.name,
          assignedAt: a.createdAt,
          expiresAt: a.expiresAt,
        })),
        allAssignments: allAssignments.map(a => ({
          botId: a.botId,
          botName: a.bot.name,
          userId: a.userId,
          userEmail: a.user.email,
          userName: a.user.name,
          userRole: a.user.role,
        })),
        environment: envCheck,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Debug API 오류:', error);
    return NextResponse.json(
      { 
        error: '디버그 정보를 가져오는 중 오류가 발생했습니다.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
