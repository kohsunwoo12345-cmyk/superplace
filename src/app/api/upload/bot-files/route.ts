import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/upload/bot-files
 * 봇 참고 파일 업로드 (PDF, DOCX, TXT 등)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다" },
        { status: 401 }
      );
    }

    // SUPER_ADMIN만 접근 가능
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "파일이 선택되지 않았습니다" },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];
    const uploadDir = path.join(process.cwd(), "public", "uploads", "bot-files");

    // 업로드 디렉토리 생성
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // 디렉토리가 이미 존재하는 경우 무시
    }

    for (const file of files) {
      // 파일 확장자 검증
      const allowedExtensions = [".pdf", ".doc", ".docx", ".txt", ".md"];
      const fileExtension = path.extname(file.name).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        return NextResponse.json(
          { error: `허용되지 않는 파일 형식입니다: ${file.name}` },
          { status: 400 }
        );
      }

      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `파일이 너무 큽니다 (최대 10MB): ${file.name}` },
          { status: 400 }
        );
      }

      // 고유한 파일명 생성
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueFileName = `${timestamp}-${randomString}-${safeFileName}`;

      // 파일 저장
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(uploadDir, uniqueFileName);
      
      await writeFile(filePath, buffer);

      // 공개 URL 생성
      const publicUrl = `/uploads/bot-files/${uniqueFileName}`;
      uploadedUrls.push(publicUrl);
    }

    return NextResponse.json({
      message: `${files.length}개 파일이 업로드되었습니다`,
      files: uploadedUrls,
    });
  } catch (error) {
    console.error("파일 업로드 오류:", error);
    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
