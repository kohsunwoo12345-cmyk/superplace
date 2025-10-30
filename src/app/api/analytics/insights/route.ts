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

    const { platform, timeframe, metrics } = await req.json();

    if (!platform || !timeframe || !metrics) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다" },
        { status: 400 }
      );
    }

    // Generate marketing insights using AI
    const result = await AIService.generateMarketingInsights({
      platform,
      timeframe,
      metrics,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Insights generation error:", error);
    return NextResponse.json(
      { error: "인사이트 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
