import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AIService } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { niche, currentTrends } = await req.json();

    if (!niche) {
      return NextResponse.json(
        { error: "분야를 입력해주세요" },
        { status: 400 }
      );
    }

    // Analyze TikTok trends using AI
    const result = await AIService.analyzeTikTokTrends({
      niche,
      currentTrends,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("TikTok analysis error:", error);
    return NextResponse.json(
      { error: "TikTok 트렌드 분석 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
