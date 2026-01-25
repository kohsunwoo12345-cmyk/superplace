import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/bot/auto-assign
 * 
 * 봇 자동 할당 및 새 채팅 시작
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { botId } = await request.json();

    if (!botId) {
      return NextResponse.json(
        { error: 'botId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. 봇 존재 확인
    const bot = await prisma.aIBot.findFirst({
      where: {
        botId,
        isActive: true,
      },
    });

    if (!bot) {
      return NextResponse.json(
        { error: '봇을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. 이미 할당되어 있는지 확인
    const existingAssignment = await prisma.botAssignment.findFirst({
      where: {
        userId: session.user.id,
        botId: bot.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    // 3. 할당되어 있지 않으면 자동 할당
    if (!existingAssignment) {
      console.log(`🤖 봇 자동 할당: ${session.user.email} → ${bot.name}`);
      
      await prisma.botAssignment.create({
        data: {
          userId: session.user.id,
          botId: bot.id,
          grantedById: session.user.id, // 본인이 자동 할당
          grantedByRole: session.user.role || 'STUDENT',
          isActive: true,
          expiresAt: null, // 무제한
        },
      });

      // 활동 로그
      try {
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            sessionId: `bot-auto-assign-${Date.now()}`,
            action: 'BOT_AUTO_ASSIGN',
            description: `사용자가 "${bot.name}" 봇을 클릭하여 자동 할당됨`,
          },
        });
      } catch (logError) {
        console.error('로그 기록 실패:', logError);
      }
    } else {
      console.log(`✅ 이미 할당됨: ${session.user.email} → ${bot.name}`);
    }

    // 4. 봇 정보 반환
    return NextResponse.json({
      success: true,
      message: existingAssignment ? '이미 할당된 봇입니다.' : '봇이 자동으로 할당되었습니다.',
      bot: {
        id: bot.id,
        botId: bot.botId,
        name: bot.name,
        icon: bot.icon,
        description: bot.description,
        systemPrompt: bot.systemPrompt,
        referenceFiles: bot.referenceFiles,
        starterMessages: bot.starterMessages,
        enableImageInput: bot.enableImageInput,
        enableVoiceOutput: bot.enableVoiceOutput,
        enableVoiceInput: bot.enableVoiceInput,
      },
      autoAssigned: !existingAssignment,
    });
  } catch (error: any) {
    console.error('봇 자동 할당 오류:', error);
    return NextResponse.json(
      { error: '봇 할당 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
