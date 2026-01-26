import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST: 학원장 비밀번호 변경
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔒 [PASSWORD] 학원 비밀번호 변경 요청:', params.id);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // SUPER_ADMIN만 가능
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const academyId = params.id;
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 해당 학원의 학원장 계정 찾기
    const director = await prisma.user.findFirst({
      where: {
        academyId: academyId,
        role: 'DIRECTOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!director) {
      return NextResponse.json({ error: '학원장 계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: director.id },
      data: { password: hashedPassword },
    });

    console.log('✅ [PASSWORD] 비밀번호 변경 성공:', director.name);

    return NextResponse.json({
      success: true,
      message: '학원장 비밀번호가 변경되었습니다.',
      director: {
        name: director.name,
        email: director.email,
      },
    });

  } catch (error: any) {
    console.error('❌ [PASSWORD] 오류:', error);
    return NextResponse.json(
      {
        error: '비밀번호 변경 중 오류가 발생했습니다.',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
