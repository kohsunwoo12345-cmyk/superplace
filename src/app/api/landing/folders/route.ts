export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folders = []; // TODO: DB 조회

    return NextResponse.json({ success: true, folders });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "폴더 이름은 필수입니다." }, { status: 400 });
    }

    const newFolder = {
      id: Date.now(),
      name,
      landing_page_count: 0,
      created_at: new Date().toISOString(),
    };

    // TODO: DB 저장

    return NextResponse.json({ success: true, folder: newFolder });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
