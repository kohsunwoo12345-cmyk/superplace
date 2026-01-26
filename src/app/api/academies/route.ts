import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 학원 목록 조회
export async function GET(req: NextRequest) {
  try {
    console.log('🏫 [ACADEMIES LIST] 학원 목록 조회 시작');

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

    // 3. 학원 목록 조회
    const academies = await prisma.academy.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        subscriptionPlan: true,
        maxStudents: true,
        maxTeachers: true,
        aiUsageLimit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ [ACADEMIES LIST] 학원 수: ${academies.length}`);

    // 4. 각 학원의 상세 통계 조회
    const academiesWithStats = await Promise.all(
      academies.map(async (academy) => {
        // 학원장 조회
        const director = await prisma.user.findFirst({
          where: {
            academyId: academy.id,
            role: 'DIRECTOR',
          },
          select: {
            name: true,
            email: true,
          },
        });

        // 학생 수 조회
        const studentCount = await prisma.user.count({
          where: {
            academyId: academy.id,
            role: 'STUDENT',
          },
        });

        // 선생님 수 조회
        const teacherCount = await prisma.user.count({
          where: {
            academyId: academy.id,
            role: 'TEACHER',
          },
        });

        return {
          ...academy,
          director: director?.name || '없음',
          directorEmail: director?.email || '',
          studentCount,
          teacherCount,
          status: academy.isActive ? 'active' : 'inactive',
          createdAt: academy.createdAt.toISOString(),
          updatedAt: academy.updatedAt.toISOString(),
        };
      })
    );

    console.log('✅ [ACADEMIES LIST] 통계 조회 완료');

    return NextResponse.json({
      success: true,
      academies: academiesWithStats,
    });

  } catch (error: any) {
    console.error('❌ [ACADEMIES LIST] 오류:', error);
    return NextResponse.json(
      {
        error: '학원 목록 조회 중 오류가 발생했습니다.',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

// POST: 새 학원 생성
export async function POST(req: NextRequest) {
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

    const body = await req.json();

    // 학원 코드 생성 (8자리 영숫자)
    const generateAcademyCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let academyCode = generateAcademyCode();
    
    // 중복 체크
    let existing = await prisma.academy.findUnique({
      where: { code: academyCode },
    });
    
    while (existing) {
      academyCode = generateAcademyCode();
      existing = await prisma.academy.findUnique({
        where: { code: academyCode },
      });
    }

    // 학원 생성
    const newAcademy = await prisma.academy.create({
      data: {
        name: body.name,
        code: academyCode,
        description: body.description || null,
        address: body.address || null,
        phone: body.phone || null,
        email: body.email || null,
        subscriptionPlan: body.subscriptionPlan || 'FREE',
        maxStudents: body.maxStudents || 10,
        maxTeachers: body.maxTeachers || 2,
        aiUsageLimit: body.aiUsageLimit || 100,
        isActive: true,
      },
    });

    console.log('✅ [ACADEMY CREATE] 학원 생성 완료:', newAcademy.name);

    return NextResponse.json({
      success: true,
      academy: newAcademy,
    });

  } catch (error: any) {
    console.error('❌ [ACADEMY CREATE] 오류:', error);
    return NextResponse.json(
      {
        error: '학원 생성 중 오류가 발생했습니다.',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
