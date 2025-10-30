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

    const { reviews } = await req.json();

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        { error: "분석할 리뷰를 입력해주세요" },
        { status: 400 }
      );
    }

    // Analyze sentiment using AI
    const result = await AIService.analyzeSentiment(reviews);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return NextResponse.json(
      { error: "리뷰 분석 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
