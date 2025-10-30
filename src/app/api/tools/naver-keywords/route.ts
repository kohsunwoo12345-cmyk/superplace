import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { keyword } = await req.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "키워드를 입력해주세요" },
        { status: 400 }
      );
    }

    // 네이버 광고 API 호출 (실제 API 키가 필요합니다)
    // 여기서는 Mock 데이터를 반환합니다
    
    // Mock data for demonstration
    const mockData = {
      keyword: keyword,
      monthlySearchVolume: Math.floor(Math.random() * 50000) + 1000,
      yearlySearchVolume: Math.floor(Math.random() * 600000) + 12000,
      competition: ["높음", "중간", "낮음"][Math.floor(Math.random() * 3)],
      relatedKeywords: [
        {
          keyword: `${keyword} 방법`,
          searchVolume: Math.floor(Math.random() * 10000) + 500,
        },
        {
          keyword: `${keyword} 추천`,
          searchVolume: Math.floor(Math.random() * 8000) + 400,
        },
        {
          keyword: `${keyword} 비용`,
          searchVolume: Math.floor(Math.random() * 6000) + 300,
        },
        {
          keyword: `${keyword} 후기`,
          searchVolume: Math.floor(Math.random() * 5000) + 200,
        },
        {
          keyword: `${keyword} 업체`,
          searchVolume: Math.floor(Math.random() * 4000) + 100,
        },
      ],
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Keyword search error:", error);
    return NextResponse.json(
      { error: "키워드 검색 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
