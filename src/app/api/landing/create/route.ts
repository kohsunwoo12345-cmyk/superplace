export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

// 인메모리 저장소 (프로덕션에서는 D1 Database 사용)
let landingPages: any[] = [];
let formSubmissions: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      slug,
      title,
      subtitle,
      description,
      template_type,
      template_html,
      input_data,
      og_title,
      og_description,
      thumbnail,
      folder_id,
      show_qr_code,
      qr_code_position,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "제목은 필수입니다." },
        { status: 400 }
      );
    }

    // 고유 slug (프론트엔드에서 전달하거나 생성)
    const finalSlug = slug || `lp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // QR 코드 URL 생성
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://superplacestudy.pages.dev";
    const landingUrl = `${baseUrl}/landing/${finalSlug}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(landingUrl)}`;

    const newLandingPage = {
      id: Date.now(),
      slug: finalSlug,
      title,
      subtitle: subtitle || "",
      description: description || "",
      template_type: template_type || "basic",
      template_html: template_html || "",
      input_data: input_data || [],
      og_title: og_title || title,
      og_description: og_description || description,
      thumbnail: thumbnail || "",
      folder_id: folder_id || null,
      show_qr_code: show_qr_code !== false,
      qr_code_position: qr_code_position || "bottom",
      qr_code_url: qrCodeUrl,
      views: 0,
      submissions: 0,
      created_at: new Date().toISOString(),
      url: `/landing/${finalSlug}`,
      is_active: true,
    };

    landingPages.push(newLandingPage);

    return NextResponse.json({
      success: true,
      landingPage: newLandingPage,
      url: landingUrl,
      qr_code_url: qrCodeUrl,
    });
  } catch (error) {
    console.error("랜딩페이지 생성 오류:", error);
    return NextResponse.json(
      { error: "랜딩페이지 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 랜딩페이지 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      pages: landingPages,
      total: landingPages.length,
    });
  } catch (error) {
    console.error("랜딩페이지 조회 오류:", error);
    return NextResponse.json(
      { error: "랜딩페이지 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
