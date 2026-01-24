import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: 대화 저장
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { botId, messages, sessionDuration } = await req.json();

    if (!botId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'botId와 messages가 필요합니다' },
        { status: 400 }
      );
    }

    // 메시지 통계 계산
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const botMessages = messages.filter((m: any) => m.role === 'assistant');
    const lastMessage = messages[messages.length - 1];

    // 대화 저장
    const conversation = await prisma.botConversation.create({
      data: {
        userId: session.user.id,
        botId,
        messages,
        messageCount: messages.length,
        userMessageCount: userMessages.length,
        botMessageCount: botMessages.length,
        sessionDuration,
        lastMessageAt: lastMessage?.timestamp ? new Date(lastMessage.timestamp) : new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      conversationId: conversation.id 
    });
  } catch (error) {
    console.error('대화 저장 오류:', error);
    return NextResponse.json(
      { error: '대화 저장 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET: 사용자의 대화 기록 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const botId = searchParams.get('botId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { userId: session.user.id };
    if (botId) {
      where.botId = botId;
    }

    const conversations = await prisma.botConversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      include: {
        analysis: true,
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('대화 기록 조회 오류:', error);
    return NextResponse.json(
      { error: '대화 기록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
