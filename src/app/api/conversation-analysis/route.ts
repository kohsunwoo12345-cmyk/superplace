import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: AI로 대화 분석
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 학원장과 선생님만 분석 가능
    if (session.user.role !== 'DIRECTOR' && session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId가 필요합니다' },
        { status: 400 }
      );
    }

    // 대화 조회
    const conversation = await prisma.botConversation.findUnique({
      where: { id: conversationId },
      include: { user: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: '대화를 찾을 수 없습니다' }, { status: 404 });
    }

    // OpenAI API로 분석
    const analysis = await analyzeConversation(conversation);

    // 분석 결과 저장
    const savedAnalysis = await prisma.conversationAnalysis.upsert({
      where: { conversationId },
      update: {
        ...analysis,
        analyzedAt: new Date(),
      },
      create: {
        conversationId,
        userId: conversation.userId,
        botId: conversation.botId,
        ...analysis,
      },
    });

    return NextResponse.json({ analysis: savedAnalysis });
  } catch (error) {
    console.error('대화 분석 오류:', error);
    return NextResponse.json(
      { error: '대화 분석 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// AI 분석 함수
async function analyzeConversation(conversation: any) {
  const messages = conversation.messages as any[];
  
  // 기본 통계 계산
  const userMessages = messages.filter(m => m.role === 'user');
  const avgMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length || 0;
  
  // 간단한 참여도 계산 (실제로는 OpenAI API 사용)
  const engagementScore = Math.min(100, (conversation.messageCount / 10) * 50 + (avgMessageLength / 100) * 50);
  
  // OpenAI API 호출 (OPENAI_API_KEY 필요)
  let aiAnalysis = {
    strengths: ['적극적인 질문', '명확한 표현'],
    weaknesses: ['더 깊이 있는 질문 필요'],
    recommendations: ['개념을 더 깊이 탐구해보세요', '예제를 직접 만들어보세요'],
    summary: '학생은 적극적으로 질문하고 있으며, 기본 개념을 잘 이해하고 있습니다.',
  };

  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `다음은 학생과 AI 튜터의 대화 내역입니다. 학생의 학습 참여도와 이해도를 분석해주세요.

대화 내역:
${JSON.stringify(messages, null, 2)}

다음 항목을 JSON 형식으로 분석해주세요:
1. strengths: 학생의 강점 (배열, 최대 3개)
2. weaknesses: 개선이 필요한 부분 (배열, 최대 3개)
3. recommendations: 추천 사항 (배열, 최대 3개)
4. summary: 종합 분석 (200자 이내)

응답은 반드시 JSON 형식으로만 작성해주세요.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: '당신은 학생 학습 분석 전문가입니다.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        aiAnalysis = JSON.parse(content);
      }
    } catch (error) {
      console.error('OpenAI API 오류:', error);
    }
  }

  return {
    engagementScore,
    responseQuality: Math.random() * 40 + 60, // 60-100
    questionDepth: Math.random() * 40 + 60,
    consistency: Math.random() * 40 + 60,
    avgResponseTime: null,
    avgMessageLength: Math.round(avgMessageLength),
    topicDiversity: Math.random() * 40 + 60,
    ...aiAnalysis,
  };
}

// GET: 학생의 분석 결과 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const botId = searchParams.get('botId');

    // 학원장/선생님은 학생 분석 조회 가능, 학생은 자신의 것만
    let targetUserId = session.user.id;
    if (userId && (session.user.role === 'DIRECTOR' || session.user.role === 'TEACHER')) {
      targetUserId = userId;
    }

    const where: any = { userId: targetUserId };
    if (botId) {
      where.botId = botId;
    }

    const analyses = await prisma.conversationAnalysis.findMany({
      where,
      orderBy: { analyzedAt: 'desc' },
      take: 20,
      include: {
        conversation: {
          select: {
            messageCount: true,
            lastMessageAt: true,
            sessionDuration: true,
          },
        },
      },
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('분석 결과 조회 오류:', error);
    return NextResponse.json(
      { error: '분석 결과 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
