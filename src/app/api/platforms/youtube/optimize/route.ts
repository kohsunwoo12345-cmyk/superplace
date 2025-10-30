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

    const { originalTitle, videoTopic, keywords } = await req.json();

    if (!originalTitle || !videoTopic || !keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: "제목, 주제, 키워드를 모두 입력해주세요" },
        { status: 400 }
      );
    }

    // Optimize YouTube content using AI
    const result = await AIService.optimizeYouTubeContent({
      originalTitle,
      videoTopic,
      keywords,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("YouTube optimization error:", error);
    return NextResponse.json(
      { error: "YouTube 콘텐츠 최적화 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
