import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 학원 상세 정보 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [ACADEMY API] 학원 상세 조회:', params.id);

    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 2. 권한 확인 (SUPER_ADMIN만)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const academyId = params.id;

    // 3. 학원 기본 정보 조회
    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        naverPlaceUrl: true,
        naverBlogUrl: true,
        subscriptionPlan: true,
        maxStudents: true,
        maxTeachers: true,
        aiUsageLimit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!academy) {
      return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
    }

    console.log('✅ [ACADEMY] 학원 조회 성공:', academy.name);

    // 4. 학원장 정보 조회
    const director = await prisma.user.findFirst({
      where: {
        academyId: academyId,
        role: 'DIRECTOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    console.log('✅ [DIRECTOR] 학원장:', director?.name || '없음');

    // 5. 학생 목록 조회
    const students = await prisma.user.findMany({
      where: {
        academyId: academyId,
        role: 'STUDENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        studentId: true,
        studentCode: true,
        grade: true,
        school: true,
        approved: true,
        points: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('✅ [STUDENTS] 학생 수:', students.length);

    // 6. 선생님 목록 조회
    const teachers = await prisma.user.findMany({
      where: {
        academyId: academyId,
        role: 'TEACHER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        approved: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('✅ [TEACHERS] 선생님 수:', teachers.length);

    // 7. 할당된 봇 목록 조회
    const assignedBots = await prisma.botAssignment.findMany({
      where: {
        user: {
          academyId: academyId,
        },
        isActive: true,
      },
      select: {
        id: true,
        botId: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['botId'],
    });

    console.log('✅ [BOTS] 할당된 봇:', assignedBots.length);

    // 8. 통계 계산
    const stats = {
      totalStudents: students.length,
      approvedStudents: students.filter(s => s.approved).length,
      pendingStudents: students.filter(s => !s.approved).length,
      totalTeachers: teachers.length,
      approvedTeachers: teachers.filter(t => t.approved).length,
      pendingTeachers: teachers.filter(t => !t.approved).length,
      totalBots: assignedBots.length,
    };

    console.log('✅ [STATS] 통계:', stats);

    // 9. 응답 반환
    return NextResponse.json({
      success: true,
      academy: {
        ...academy,
        createdAt: academy.createdAt.toISOString(),
        updatedAt: academy.updatedAt.toISOString(),
      },
      director: director ? {
        ...director,
        createdAt: director.createdAt.toISOString(),
        lastLoginAt: director.lastLoginAt?.toISOString() || null,
      } : null,
      students: students.map(s => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        lastLoginAt: s.lastLoginAt?.toISOString() || null,
      })),
      teachers: teachers.map(t => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        lastLoginAt: t.lastLoginAt?.toISOString() || null,
      })),
      assignedBots,
      stats,
    });

  } catch (error: any) {
    console.error('❌ [ACADEMY API] 오류:', error);
    return NextResponse.json(
      {
        error: '학원 정보 조회 중 오류가 발생했습니다.',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

// PATCH: 학원 정보 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const academyId = params.id;
    const body = await req.json();

    // 학원 정보 업데이트
    const updatedAcademy = await prisma.academy.update({
      where: { id: academyId },
      data: {
        name: body.name,
        description: body.description,
        address: body.address,
        phone: body.phone,
        email: body.email,
        subscriptionPlan: body.subscriptionPlan,
        maxStudents: body.maxStudents,
        maxTeachers: body.maxTeachers,
        aiUsageLimit: body.aiUsageLimit,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      academy: updatedAcademy,
    });

  } catch (error: any) {
    console.error('❌ [ACADEMY UPDATE] 오류:', error);
    return NextResponse.json(
      {
        error: '학원 정보 수정 중 오류가 발생했습니다.',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
