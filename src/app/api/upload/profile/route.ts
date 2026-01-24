import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST: 프로필 사진 업로드
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다. JPG, PNG, GIF, WebP만 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 저장 디렉토리 생성
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // 디렉토리가 이미 존재하면 무시
    }

    // 파일명 생성 (타임스탬프 + 랜덤 + 원본 확장자)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.name);
    const safeFileName = `${timestamp}-${randomStr}${ext}`;
    const filePath = path.join(uploadDir, safeFileName);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 공개 URL 반환
    const publicUrl = `/uploads/profiles/${safeFileName}`;

    return NextResponse.json({
      success: true,
      message: '파일이 업로드되었습니다.',
      url: publicUrl,
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
