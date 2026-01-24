import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 사용자의 특정 봇과의 대화 기록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');
    const userId = searchParams.get('userId'); // 관리자가 다른 사용자 대화 조회 시

    // 관리자가 아니면 자신의 대화만 조회 가능
    const targetUserId = session.user.role === 'SUPER_ADMIN' && userId ? userId : session.user.id;

    if (!botId) {
      // 모든 대화 목록 조회
      const conversations = await prisma.botConversation.findMany({
        where: {
          userId: targetUserId,
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        select: {
          id: true,
          botId: true,
          messageCount: true,
          lastMessageAt: true,
          createdAt: true,
        },
      });

      return NextResponse.json({ conversations });
    }

    // 특정 봇과의 대화 조회
    const conversation = await prisma.botConversation.findFirst({
      where: {
        userId: targetUserId,
        botId: botId,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('대화 조회 오류:', error);
    return NextResponse.json(
      { error: '대화 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 대화 메시지 저장
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { botId, messages } = await request.json();

    console.log('💾 대화 저장 요청:', { 
      userId: session.user.id, 
      botId, 
      messageCount: messages?.length 
    });

    if (!botId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'botId와 messages가 필요합니다.' },
        { status: 400 }
      );
    }

    // 메시지 카운트
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
    const botMessageCount = messages.filter((m: any) => m.role === 'assistant').length;

    // 기존 대화 찾기 (userId + botId로 사용자별 독립 저장)
    const existingConversation = await prisma.botConversation.findFirst({
      where: {
        userId: session.user.id,
        botId: botId,
      },
    });

    console.log('🔍 기존 대화:', existingConversation ? `찾음 (ID: ${existingConversation.id})` : '없음 - 새로 생성');

    if (existingConversation) {
      // 업데이트
      const updated = await prisma.botConversation.update({
        where: {
          id: existingConversation.id,
        },
        data: {
          messages: messages as any,
          messageCount: messages.length,
          userMessageCount,
          botMessageCount,
          lastMessageAt: new Date(),
        },
      });

      console.log('✅ 대화 업데이트 완료');

      return NextResponse.json({ success: true, conversation: updated });
    } else {
      // 새로 생성
      const created = await prisma.botConversation.create({
        data: {
          userId: session.user.id,
          botId: botId,
          messages: messages as any,
          messageCount: messages.length,
          userMessageCount,
          botMessageCount,
          lastMessageAt: new Date(),
        },
      });

      console.log('✅ 새 대화 생성 완료');

      return NextResponse.json({ success: true, conversation: created });
    }
  } catch (error) {
    console.error('❌ 대화 저장 오류:', error);
    return NextResponse.json(
      { error: '대화 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
