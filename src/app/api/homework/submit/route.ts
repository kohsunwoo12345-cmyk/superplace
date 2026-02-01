import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * POST /api/homework/submit
 * 숙제 제출 및 AI 분석
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "숙제 이미지를 업로드해주세요." },
        { status: 400 }
      );
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { academy: true },
    });

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "학생만 숙제를 제출할 수 있습니다." },
        { status: 403 }
      );
    }

    if (!user.academyId) {
      return NextResponse.json(
        { error: "학원에 소속되어 있지 않습니다." },
        { status: 403 }
      );
    }

    console.log("✅ 숙제 제출 시작:", {
      userId: user.id,
      userName: user.name,
      academyId: user.academyId,
    });

    // AI 분석
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error("❌ Google Gemini API 키가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "AI 분석 서비스 설정 오류" },
        { status: 500 }
      );
    }

    console.log("🤖 AI 분석 시작...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const prompt = `다음 숙제 이미지를 분석하고 다음 기준으로 평가해주세요:

1. 완성도 (0-100): 문제를 얼마나 완전히 풀었는지
2. 정확도 (0-100): 풀이 과정과 답이 얼마나 정확한지
3. 노력도 (0-100): 글씨, 정리 상태 등 노력한 흔적
4. 종합 점수 (0-100): 전체적인 평가

**응답 형식 (JSON):**
\`\`\`json
{
  "completeness": 점수,
  "accuracy": 점수,
  "effort": 점수,
  "overallScore": 점수,
  "analysis": "전반적인 분석 (2-3문장)",
  "feedback": "학생에게 주는 피드백 (긍정적이고 건설적으로, 3-4문장)"
}
\`\`\`

이미지가 숙제가 아니거나 명확하지 않으면 모든 점수를 0으로 하고 analysis에 "숙제 이미지가 명확하지 않습니다"라고 적어주세요.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageUrl.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text();
    console.log("🤖 AI 응답:", responseText);

    let aiResult;
    try {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      aiResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("❌ JSON 파싱 실패:", parseError);
      aiResult = {
        completeness: 0,
        accuracy: 0,
        effort: 0,
        overallScore: 0,
        analysis: "AI 분석 결과를 처리할 수 없습니다.",
        feedback: "관리자에게 문의해주세요.",
      };
    }

    console.log("✅ AI 분석 결과:", aiResult);

    const submission = await prisma.homeworkSubmission.create({
      data: {
        userId: user.id,
        academyId: user.academyId,
        imageUrl,
        aiAnalysis: aiResult.analysis || "",
        aiFeedback: aiResult.feedback || "",
        completeness: aiResult.completeness || 0,
        accuracy: aiResult.accuracy || 0,
        effort: aiResult.effort || 0,
        overallScore: aiResult.overallScore || 0,
        analyzedAt: new Date(),
      },
    });

    console.log("💾 숙제 제출 저장 완료:", submission.id);

    // 출석 인정
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!existingAttendance) {
      await prisma.attendance.create({
        data: {
          userId: user.id,
          date: new Date(),
          status: "PRESENT",
          notes: "숙제 제출로 자동 출석 인정",
        },
      });

      await prisma.homeworkSubmission.update({
        where: { id: submission.id },
        data: { attendanceMarked: true },
      });

      console.log("✅ 출석 인정 완료");
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        completeness: aiResult.completeness,
        accuracy: aiResult.accuracy,
        effort: aiResult.effort,
        overallScore: aiResult.overallScore,
        analysis: aiResult.analysis,
        feedback: aiResult.feedback,
        attendanceMarked: !existingAttendance,
      },
    });
  } catch (error) {
    console.error("❌ 숙제 제출 오류:", error);
    return NextResponse.json(
      { error: "숙제 제출 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
