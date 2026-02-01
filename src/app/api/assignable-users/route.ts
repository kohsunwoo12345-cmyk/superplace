import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * 역할별 할당 가능한 사용자 목록 조회
 * - SUPER_ADMIN: 모든 학원장
 * - DIRECTOR: 같은 학원의 선생님/학생
 * - TEACHER: 같은 학원의 학생
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const role = session.user.role;
    let users = [];

    if (role === 'SUPER_ADMIN') {
      // 모든 학원장 조회
      users = await prisma.user.findMany({
        where: {
          role: 'DIRECTOR',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          academyId: true,
          academy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    } else if (role === 'DIRECTOR') {
      // 같은 학원의 선생님과 학생
      const director = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { academyId: true },
      });

      if (!director?.academyId) {
        return NextResponse.json(
          { error: '학원 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      users = await prisma.user.findMany({
        where: {
          academyId: director.academyId,
          role: {
            in: ['TEACHER', 'STUDENT'],
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          academyId: true,
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' },
        ],
      });
    } else if (role === 'TEACHER') {
      // 같은 학원의 학생만
      const teacher = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { academyId: true },
      });

      if (!teacher?.academyId) {
        return NextResponse.json(
          { error: '학원 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      users = await prisma.user.findMany({
        where: {
          academyId: teacher.academyId,
          role: 'STUDENT',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          academyId: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    } else {
      return NextResponse.json(
        { error: '할당 권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        academyName: 'academy' in u ? (u as any).academy?.name : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    return NextResponse.json(
      { error: '사용자 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
