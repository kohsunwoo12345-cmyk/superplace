import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sign } from 'jsonwebtoken';

// POST: 원장님이 학생 계정으로 로그인
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 원장님 또는 관리자만 가능
    if (!['DIRECTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: '권한이 없습니다. 원장님만 학생 계정으로 로그인할 수 있습니다.' },
        { status: 403 }
      );
    }

    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: '학생 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 학생 정보 조회
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        academyId: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 학생인지 확인
    if (student.role !== 'STUDENT') {
      return NextResponse.json(
        { error: '학생 계정만 로그인할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 원장님인 경우 같은 학원 소속 확인
    if (session.user.role === 'DIRECTOR') {
      const director = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { academyId: true },
      });

      if (director?.academyId !== student.academyId) {
        return NextResponse.json(
          { error: '같은 학원 소속 학생만 로그인할 수 있습니다.' },
          { status: 403 }
        );
      }
    }

    // 임시 토큰 생성 (실제로는 next-auth 세션을 업데이트해야 함)
    const impersonationToken = {
      originalUserId: session.user.id,
      originalUserRole: session.user.role,
      impersonatedUserId: student.id,
      impersonatedUserEmail: student.email,
      impersonatedUserName: student.name,
      impersonatedUserRole: student.role,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      message: `${student.name}님의 계정으로 로그인합니다.`,
      student: {
        id: student.id,
        email: student.email,
        name: student.name,
        role: student.role,
      },
      impersonationToken,
      redirectUrl: '/dashboard',
    });
  } catch (error) {
    console.error('학생 계정 로그인 오류:', error);
    return NextResponse.json(
      { error: '학생 계정 로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
