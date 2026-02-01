import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
);

/**
 * POST /api/learning/analyze-conversations
 * 학생의 AI 봇 대화 내역을 분석하여 학습 태도 및 심리 파악
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { userId: studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: "학생 ID가 필요합니다." }, { status: 400 });
    }

    const { role, academyId } = session.user;

    // 권한 확인 (학원장, 선생님, 관리자만)
    if (role !== "DIRECTOR" && role !== "TEACHER" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 학생 정보 조회
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        studentCode: true,
        grade: true,
        academyId: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
    }

    // 같은 학원 학생인지 확인
    if (role !== "SUPER_ADMIN" && student.academyId !== academyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 최근 대화 내역 조회 (최근 30일, 최대 20개)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const conversations = await prisma.botConversation.findMany({
      where: {
        userId: studentId,
        lastMessageAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      take: 20,
    });

    if (conversations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "분석할 대화 내역이 없습니다.",
        analyses: [],
      });
    }

    // 각 대화를 분석
    const analyses = [];

    for (const conversation of conversations) {
      // 이미 분석된 대화인지 확인
      const existingAnalysis = await prisma.conversationAnalysis.findUnique({
        where: { conversationId: conversation.id },
      });

      if (existingAnalysis) {
        analyses.push(existingAnalysis);
        continue;
      }

      // AI로 대화 분석
      const messages = conversation.messages as any[];
      
      if (!messages || messages.length === 0) {
        continue;
      }

      // 대화 내용 포맷팅
      const conversationText = messages
        .map((msg: any) => `${msg.role === "user" ? "학생" : "AI"}: ${msg.content}`)
        .join("\n");

      // AI 분석 프롬프트
      const prompt = `다음은 학생과 AI 학습 봇의 대화 내역입니다. 이 대화를 분석하여 학생의 학습 태도, 심리 상태, 참여도를 평가해주세요.

# 대화 내역
${conversationText}

# 분석 지침
1. **참여도** (0-100점): 학생이 얼마나 적극적으로 대화에 참여하는가?
2. **응답 품질** (0-100점): 학생의 답변이 얼마나 구체적이고 사려 깊은가?
3. **질문 깊이** (0-100점): 학생의 질문이 얼마나 깊이 있고 의미 있는가?
4. **일관성** (0-100점): 학생이 주제에 집중하고 있는가, 아니면 산만한가?

# 학습 태도 분석
- 열심히 하는지, 대충 하는지
- 진지한지, 장난스러운지
- 질문이 구체적인지, 막연한지
- 봇의 답변을 활용하는지, 무시하는지

# 심리 상태 분석
- 자신감 있는지, 불안해하는지
- 적극적인지, 소극적인지
- 스트레스를 받는지, 여유로운지
- 호기심이 있는지, 의무감으로 하는지

다음 JSON 형식으로 응답해주세요:
{
  "engagementScore": 숫자,
  "responseQuality": 숫자,
  "questionDepth": 숫자,
  "consistency": 숫자,
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "recommendations": ["추천1", "추천2", "추천3"],
  "summary": "종합 분석 (3-5문장, 학습 태도와 심리 상태 포함)"
}`;

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // JSON 파싱
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("AI 응답 파싱 실패:", text);
          continue;
        }

        const analysisData = JSON.parse(jsonMatch[0]);

        // 분석 결과 저장
        const analysis = await prisma.conversationAnalysis.create({
          data: {
            conversationId: conversation.id,
            userId: studentId,
            botId: conversation.botId,
            engagementScore: analysisData.engagementScore || 0,
            responseQuality: analysisData.responseQuality || 0,
            questionDepth: analysisData.questionDepth || 0,
            consistency: analysisData.consistency || 0,
            avgMessageLength: Math.round(
              messages
                .filter((m: any) => m.role === "user")
                .reduce((sum: number, m: any) => sum + (m.content?.length || 0), 0) /
                Math.max(conversation.userMessageCount, 1)
            ),
            strengths: analysisData.strengths || [],
            weaknesses: analysisData.weaknesses || [],
            recommendations: analysisData.recommendations || [],
            summary: analysisData.summary || "",
            analyzedBy: session.user.id,
          },
        });

        analyses.push(analysis);
      } catch (error) {
        console.error("대화 분석 오류:", error);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${analyses.length}개의 대화를 분석했습니다.`,
      analyses,
    });
  } catch (error) {
    console.error("❌ 대화 분석 API 오류:", error);
    return NextResponse.json(
      { error: "대화 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learning/analyze-conversations?studentId=xxx
 * 학생의 대화 분석 결과 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "학생 ID가 필요합니다." }, { status: 400 });
    }

    const { role, academyId } = session.user;

    // 권한 확인
    if (role !== "DIRECTOR" && role !== "TEACHER" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 학생 정보 조회
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { academyId: true },
    });

    if (!student) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
    }

    // 같은 학원 학생인지 확인
    if (role !== "SUPER_ADMIN" && student.academyId !== academyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 분석 결과 조회
    const analyses = await prisma.conversationAnalysis.findMany({
      where: { userId: studentId },
      include: {
        conversation: {
          select: {
            id: true,
            botId: true,
            messageCount: true,
            userMessageCount: true,
            botMessageCount: true,
            sessionDuration: true,
            lastMessageAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        analyzedAt: "desc",
      },
      take: 50,
    });

    // 전체 평균 계산
    const avgScores = {
      engagementScore: 0,
      responseQuality: 0,
      questionDepth: 0,
      consistency: 0,
      totalAnalyses: analyses.length,
    };

    if (analyses.length > 0) {
      avgScores.engagementScore = analyses.reduce((sum, a) => sum + a.engagementScore, 0) / analyses.length;
      avgScores.responseQuality = analyses.reduce((sum, a) => sum + a.responseQuality, 0) / analyses.length;
      avgScores.questionDepth = analyses.reduce((sum, a) => sum + a.questionDepth, 0) / analyses.length;
      avgScores.consistency = analyses.reduce((sum, a) => sum + a.consistency, 0) / analyses.length;
    }

    return NextResponse.json({
      success: true,
      analyses,
      avgScores,
    });
  } catch (error) {
    console.error("❌ 대화 분석 조회 오류:", error);
    return NextResponse.json(
      { error: "대화 분석 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
