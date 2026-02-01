import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST: 학생 비밀번호 초기화 (관리자/원장님/선생님 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 권한 체크: 관리자, 원장님, 선생님만 가능
    const allowedRoles = ['SUPER_ADMIN', 'DIRECTOR', 'TEACHER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const { userId, newPassword } = await request.json();

    // 유효성 검사
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: '새 비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 대상 사용자 조회
    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        academyId: true,
        name: true,
        email: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한별 체크
    if (session.user.role === 'TEACHER') {
      // 선생님은 학생만 초기화 가능
      if (targetUser.role !== 'STUDENT') {
        return NextResponse.json(
          { error: '선생님은 학생의 비밀번호만 초기화할 수 있습니다.' },
          { status: 403 }
        );
      }
      
      // 같은 학원 소속 체크
      const teacher = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { academyId: true },
      });
      
      if (teacher?.academyId !== targetUser.academyId) {
        return NextResponse.json(
          { error: '같은 학원 소속 학생만 초기화할 수 있습니다.' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'DIRECTOR') {
      // 원장님은 같은 학원의 선생님과 학생만 초기화 가능
      if (!['TEACHER', 'STUDENT'].includes(targetUser.role)) {
        return NextResponse.json(
          { error: '원장님은 선생님과 학생의 비밀번호만 초기화할 수 있습니다.' },
          { status: 403 }
        );
      }
      
      // 같은 학원 소속 체크
      const director = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { academyId: true },
      });
      
      if (director?.academyId !== targetUser.academyId) {
        return NextResponse.json(
          { error: '같은 학원 소속 사용자만 초기화할 수 있습니다.' },
          { status: 403 }
        );
      }
    }
    // SUPER_ADMIN은 모든 사용자 가능

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${targetUser.name}님의 비밀번호가 초기화되었습니다.`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    console.error('비밀번호 초기화 오류:', error);
    return NextResponse.json(
      { error: '비밀번호 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
