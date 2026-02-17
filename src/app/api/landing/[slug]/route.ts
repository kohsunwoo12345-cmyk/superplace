export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

// 인메모리 저장소 (프로덕션에서는 D1 Database 사용)
// 이 배열은 /api/landing/create에서 공유되어야 하지만 Edge Runtime의 제약으로 여기서 재정의
// 실제 프로덕션에서는 D1 Database나 KV를 사용하세요
let landingPages: any[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // 랜딩페이지 조회
    const landingPage = landingPages.find((page) => page.slug === slug);

    if (!landingPage) {
      return NextResponse.json(
        { error: "페이지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 조회수 증가
    landingPage.views = (landingPage.views || 0) + 1;

    return NextResponse.json({
      success: true,
      page: landingPage,
    });
  } catch (error) {
    console.error("랜딩페이지 조회 실패:", error);
    return NextResponse.json(
      { error: "페이지를 찾을 수 없습니다." },
      { status: 404 }
    );
  }
}

// 랜딩페이지 수정 API
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    const body = await request.json();

    const pageIndex = landingPages.findIndex((page) => page.slug === slug);

    if (pageIndex === -1) {
      return NextResponse.json(
        { error: "페이지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업데이트
    landingPages[pageIndex] = {
      ...landingPages[pageIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      page: landingPages[pageIndex],
    });
  } catch (error) {
    console.error("랜딩페이지 수정 실패:", error);
    return NextResponse.json(
      { error: "페이지 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 랜딩페이지 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;

    const pageIndex = landingPages.findIndex((page) => page.slug === slug);

    if (pageIndex === -1) {
      return NextResponse.json(
        { error: "페이지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제
    landingPages.splice(pageIndex, 1);

    return NextResponse.json({
      success: true,
      message: "랜딩페이지가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("랜딩페이지 삭제 실패:", error);
    return NextResponse.json(
      { error: "페이지 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
