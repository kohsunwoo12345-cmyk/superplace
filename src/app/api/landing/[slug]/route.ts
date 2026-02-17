import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // TODO: 실제로는 데이터베이스에서 조회
    // 조회수 증가 로직도 추가
    
    const landingPage = {
      id: 1,
      slug,
      title: "샘플 랜딩페이지",
      template_type: "basic",
      input_data: {
        heading: "환영합니다",
        description: "샘플 랜딩페이지입니다.",
        buttonText: "시작하기",
      },
      thumbnail_url: null,
      views: 100,
      submissions: 10,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      landingPage,
    });
  } catch (error) {
    console.error("랜딩페이지 조회 실패:", error);
    return NextResponse.json(
      { error: "페이지를 찾을 수 없습니다." },
      { status: 404 }
    );
  }
}
