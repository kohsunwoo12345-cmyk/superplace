import { NextRequest, NextResponse } from "next/server";

// 메모리 저장소 (실제로는 데이터베이스 사용)
let landingPages: any[] = [];

export async function GET(request: NextRequest) {
  try {
    // 인증 체크 (실제로는 JWT 검증)
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      landingPages: landingPages.map(lp => ({
        ...lp,
        viewCount: lp.viewCount || 0,
        isActive: lp.isActive !== false,
      })),
    });
  } catch (error) {
    console.error("Error fetching landing pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 인증 체크
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, title, dataOptions } = body;

    if (!studentId || !title) {
      return NextResponse.json(
        { error: "studentId and title are required" },
        { status: 400 }
      );
    }

    // 고유 ID 생성
    const id = `lp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = `/report/${id}`;

    // 학생 정보 조회 (실제로는 DB에서 가져옴)
    const studentName = `학생 ${studentId}`;

    const newLandingPage = {
      id,
      studentId,
      studentName,
      title,
      url,
      dataOptions,
      createdAt: new Date().toISOString(),
      viewCount: 0,
      isActive: true,
    };

    landingPages.push(newLandingPage);

    return NextResponse.json({
      success: true,
      landingPage: newLandingPage,
    });
  } catch (error) {
    console.error("Error creating landing page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
