import { NextRequest, NextResponse } from "next/server";

let landingPages: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      template_html,
      custom_fields,
      og_title,
      og_description,
      thumbnail_url,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "제목은 필수입니다." },
        { status: 400 }
      );
    }

    // 고유 slug 생성
    const slug = `lp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newLandingPage = {
      id: Date.now(),
      slug,
      title,
      description,
      template_html: template_html || "",
      custom_fields: custom_fields || [],
      og_title: og_title || title,
      og_description: og_description || description,
      thumbnail_url: thumbnail_url || "",
      views: 0,
      submissions: 0,
      created_at: new Date().toISOString(),
      url: `/landing/${slug}`,
    };

    landingPages.push(newLandingPage);

    return NextResponse.json({
      success: true,
      landingPage: newLandingPage,
    });
  } catch (error) {
    console.error("랜딩페이지 생성 오류:", error);
    return NextResponse.json(
      { error: "랜딩페이지 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
