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

    const { productName, condition, price, category } = await req.json();

    if (!productName || !condition || !price || !category) {
      return NextResponse.json(
        { error: "모든 정보를 입력해주세요" },
        { status: 400 }
      );
    }

    // Generate Karrot description using AI
    const result = await AIService.generateKarrotDescription({
      productName,
      condition,
      price: Number(price),
      category,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Karrot generation error:", error);
    return NextResponse.json(
      { error: "당근마켓 설명 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
