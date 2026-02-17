export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

// 실제로는 외부 모듈에서 가져옴
declare const landingPages: any[];

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 인증 체크
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // 랜딩페이지 삭제 (메모리에서)
    // 실제로는 데이터베이스에서 삭제
    const index = landingPages.findIndex(lp => lp.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Landing page not found" },
        { status: 404 }
      );
    }

    landingPages.splice(index, 1);

    return NextResponse.json({
      success: true,
      message: "Landing page deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting landing page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
