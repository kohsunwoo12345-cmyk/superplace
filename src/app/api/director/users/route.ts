import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 학원장이 자신의 학원 소속 선생님/학생 목록 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, academyId: true },
    });

    if (!currentUser || currentUser.role !== 'DIRECTOR') {
      return NextResponse.json(
        { error: '학원장 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    if (!currentUser.academyId) {
      return NextResponse.json(
        { error: '학원 정보가 없습니다.' },
        { status: 400 }
      );
    }

    // 같은 학원의 선생님과 학생 조회
    const users = await prisma.user.findMany({
      where: {
        academyId: currentUser.academyId,
        role: {
          in: ['TEACHER', 'STUDENT'],
        },
        approved: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' }, // TEACHER 먼저
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '사용자 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
