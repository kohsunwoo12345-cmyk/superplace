import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncTeacher, logSync } from '@/lib/sync-utils';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * 선생님 생성 API (동기화 포함)
 * POST /api/sync/teachers
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'DIRECTOR') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, password, phone, academyId } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: '필수 필드를 모두 입력해주세요' },
        { status: 400 }
      );
    }

    const targetAcademyId = session.user.role === 'SUPER_ADMIN' 
      ? academyId 
      : session.user.academyId;

    if (!targetAcademyId) {
      return NextResponse.json(
        { error: '학원 정보가 없습니다' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacherData = {
      email,
      name,
      password: hashedPassword,
      phone: phone || null,
      academyId: targetAcademyId,
      approved: true,
      approvedAt: new Date(),
      approvedBy: session.user.id,
    };

    // 동기화 수행
    const syncResult = await syncTeacher('CREATE', teacherData);
    await logSync(syncResult);

    if (!syncResult.success) {
      return NextResponse.json(
        { error: '선생님 생성 중 오류가 발생했습니다', details: syncResult.error },
        { status: 500 }
      );
    }

    const createdTeacher = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        academyId: true,
        approved: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      teacher: createdTeacher,
      sync: {
        local: syncResult.localId,
        external: syncResult.externalId,
        timestamp: syncResult.timestamp,
      },
    });
  } catch (error) {
    console.error('선생님 생성 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 선생님 목록 조회 API
 * GET /api/sync/teachers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const academyId = session.user.role === 'SUPER_ADMIN'
      ? request.nextUrl.searchParams.get('academyId')
      : session.user.academyId;

    if (!academyId) {
      return NextResponse.json(
        { error: '학원 정보가 없습니다' },
        { status: 400 }
      );
    }

    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        academyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        approved: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      teachers,
      count: teachers.length,
    });
  } catch (error) {
    console.error('선생님 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
