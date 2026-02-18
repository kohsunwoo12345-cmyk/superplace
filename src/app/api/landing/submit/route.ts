export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

// 인메모리 저장소 (프로덕션에서는 D1 Database 사용)
let formSubmissions: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, data } = body;

    if (!slug || !data) {
      return NextResponse.json(
        { error: "필수 데이터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const submission = {
      id: Date.now(),
      slug,
      data,
      submitted_at: new Date().toISOString(),
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    };

    formSubmissions.push(submission);

    return NextResponse.json({
      success: true,
      message: "신청이 완료되었습니다.",
      submission_id: submission.id,
    });
  } catch (error) {
    console.error("폼 제출 오류:", error);
    return NextResponse.json(
      { error: "폼 제출 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 신청자 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    let submissions = formSubmissions;
    if (slug) {
      submissions = formSubmissions.filter((s) => s.slug === slug);
    }

    return NextResponse.json({
      success: true,
      submissions,
      total: submissions.length,
    });
  } catch (error) {
    console.error("신청자 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "신청자 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
