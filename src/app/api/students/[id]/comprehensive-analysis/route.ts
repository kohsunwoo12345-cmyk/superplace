import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

// POST: AI 종합 분석 생성 (Google AI 활용)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, academyId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 체크
    if (currentUser.role !== 'DIRECTOR' && currentUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'AI 분석 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const studentId = params.id;

    // 학생 정보 조회
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        academyId: true,
        grade: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 같은 학원인지 체크
    if (student.academyId !== currentUser.academyId) {
      return NextResponse.json(
        { error: '같은 학원 소속 학생만 분석할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 학생의 모든 대화 기록 조회
    const conversations = await prisma.botConversation.findMany({
      where: {
        userId: studentId,
      },
      select: {
        id: true,
        botId: true,
        messages: true,
        messageCount: true,
        sessionDuration: true,
        lastMessageAt: true,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: 100, // 최근 100개 대화
    });

    // 기존 분석 결과 조회
    const existingAnalyses = await prisma.conversationAnalysis.findMany({
      where: {
        userId: studentId,
      },
      select: {
        botId: true,
        engagementScore: true,
        strengths: true,
        weaknesses: true,
        summary: true,
      },
      orderBy: {
        analyzedAt: 'desc',
      },
      take: 20,
    });

    // 학생의 과제 정보 (있다면)
    const assignments = await prisma.assignment.findMany({
      where: {
        studentAssignments: {
          some: {
            studentId: studentId,
          },
        },
      },
      select: {
        title: true,
        subject: true,
        studentAssignments: {
          where: {
            studentId: studentId,
          },
          select: {
            status: true,
            submittedAt: true,
            score: true,
          },
        },
      },
      take: 50,
    });

    // Google AI API 키 확인
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Google Generative AI 초기화
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // 분석용 데이터 준비
    const analysisData = {
      studentName: student.name,
      grade: student.grade,
      totalConversations: conversations.length,
      conversationsByBot: conversations.reduce((acc: any, conv) => {
        acc[conv.botId] = (acc[conv.botId] || 0) + 1;
        return acc;
      }, {}),
      totalMessages: conversations.reduce((sum, conv) => sum + conv.messageCount, 0),
      averageSessionDuration: conversations.length > 0
        ? conversations.reduce((sum, conv) => sum + (conv.sessionDuration || 0), 0) / conversations.length
        : 0,
      recentConversationSamples: conversations.slice(0, 5).map((conv) => ({
        botId: conv.botId,
        messageCount: conv.messageCount,
        messages: conv.messages,
      })),
      existingAnalyses: existingAnalyses.map((analysis) => ({
        botId: analysis.botId,
        engagementScore: analysis.engagementScore,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
      })),
      assignments: assignments.map((assignment) => ({
        title: assignment.title,
        subject: assignment.subject,
        status: assignment.studentAssignments[0]?.status,
        score: assignment.studentAssignments[0]?.score,
      })),
    };

    // AI 프롬프트 생성
    const prompt = `
당신은 학생의 학습 데이터를 분석하는 교육 전문 AI입니다.
다음 학생의 데이터를 바탕으로 과목별 종합 분석을 수행해주세요.

학생 정보:
- 이름: ${analysisData.studentName}
- 학년: ${analysisData.grade || '미지정'}

AI 봇 대화 활동:
- 총 대화 수: ${analysisData.totalConversations}회
- 총 메시지 수: ${analysisData.totalMessages}개
- 평균 대화 시간: ${Math.round(analysisData.averageSessionDuration / 60)}분
- 봇별 대화 수: ${JSON.stringify(analysisData.conversationsByBot)}

최근 대화 샘플:
${JSON.stringify(analysisData.recentConversationSamples, null, 2)}

기존 분석 결과:
${JSON.stringify(analysisData.existingAnalyses, null, 2)}

과제 정보:
${JSON.stringify(analysisData.assignments, null, 2)}

다음 항목을 포함하여 종합 분석을 JSON 형식으로 제공해주세요:

{
  "overall_summary": "전체적인 학습 상태 요약 (3-5문장)",
  "subject_analysis": {
    "국어": {
      "level": "상/중/하",
      "strengths": ["강점1", "강점2"],
      "weaknesses": ["약점1", "약점2"],
      "recommendations": ["추천사항1", "추천사항2"],
      "score": 0-100 점수
    },
    "영어": { ... },
    "수학": { ... },
    "과학": { ... },
    "사회": { ... }
  },
  "learning_patterns": {
    "activity_level": "매우 활발/활발/보통/저조",
    "consistency": "매우 일관적/일관적/보통/비일관적",
    "engagement_trend": "상승/유지/하락",
    "preferred_subjects": ["과목1", "과목2"],
    "challenging_subjects": ["과목1", "과목2"]
  },
  "recommendations": {
    "immediate_actions": ["즉시 조치사항1", "즉시 조치사항2"],
    "short_term_goals": ["단기 목표1", "단기 목표2"],
    "long_term_goals": ["장기 목표1", "장기 목표2"],
    "parent_guidance": ["학부모 가이드1", "학부모 가이드2"]
  },
  "bot_usage_insights": {
    "most_used_bots": ["봇1", "봇2"],
    "effectiveness_by_bot": {
      "봇ID": "효과성 평가"
    },
    "recommended_bots": ["추천 봇1", "추천 봇2"]
  },
  "progress_indicators": {
    "question_quality": "향상/유지/저하",
    "response_depth": "향상/유지/저하",
    "self_directed_learning": "높음/보통/낮음"
  }
}

데이터가 부족한 과목은 "데이터 부족"으로 표시하고, 관찰 가능한 내용만 작성해주세요.
한국어로 작성하되, 구체적이고 실용적인 조언을 제공해주세요.
`;

    console.log('🤖 AI 종합 분석 시작:', studentId);

    // Google AI로 분석 요청
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    console.log('✅ AI 분석 완료');

    // JSON 파싱 시도
    let analysisResult;
    try {
      // Markdown 코드 블록 제거
      const jsonText = analysisText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysisResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      // 파싱 실패 시 원본 텍스트 사용
      analysisResult = {
        overall_summary: analysisText,
        raw_response: analysisText,
      };
    }

    // 분석 결과 저장 (선택적)
    // 종합 분석은 별도 테이블에 저장하거나 기존 ConversationAnalysis에 통합 가능

    return NextResponse.json({
      success: true,
      message: 'AI 종합 분석이 완료되었습니다.',
      data: {
        studentId,
        studentName: student.name,
        analyzedAt: new Date().toISOString(),
        analysis: analysisResult,
        metadata: {
          totalConversations: analysisData.totalConversations,
          totalMessages: analysisData.totalMessages,
          averageSessionDuration: Math.round(analysisData.averageSessionDuration),
          assignmentsCount: assignments.length,
        },
      },
    });
  } catch (error: any) {
    console.error('AI 종합 분석 오류:', error);
    return NextResponse.json(
      { 
        error: 'AI 종합 분석 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET: 최근 종합 분석 결과 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const studentId = params.id;

    // 기존 분석 결과들을 종합하여 반환
    const analyses = await prisma.conversationAnalysis.findMany({
      where: {
        userId: studentId,
      },
      orderBy: {
        analyzedAt: 'desc',
      },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error('분석 결과 조회 오류:', error);
    return NextResponse.json(
      { error: '분석 결과 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
