import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncStudent, logSync } from '@/lib/sync-utils';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * 학생 생성 API (동기화 포함)
 * POST /api/sync/students
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

    // 권한 확인: SUPER_ADMIN 또는 DIRECTOR만 가능
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'DIRECTOR') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, password, grade, studentId, phone, parentPhone, academyId } = body;

    // 필수 필드 검증
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: '필수 필드를 모두 입력해주세요' },
        { status: 400 }
      );
    }

    // 학원 ID 확인 (DIRECTOR는 자신의 학원만)
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

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 학생 데이터 준비
    const studentData = {
      email,
      name,
      password: hashedPassword,
      grade: grade || null,
      studentId: studentId || null,
      phone: phone || null,
      parentPhone: parentPhone || null,
      academyId: targetAcademyId,
      approved: true, // 학원장이 직접 생성하면 자동 승인
      approvedAt: new Date(),
      approvedBy: session.user.id,
    };

    // 동기화 수행
    const syncResult = await syncStudent('CREATE', studentData);
    await logSync(syncResult);

    if (!syncResult.success) {
      return NextResponse.json(
        { error: '학생 생성 중 오류가 발생했습니다', details: syncResult.error },
        { status: 500 }
      );
    }

    // 생성된 학생 정보 조회
    const createdStudent = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        grade: true,
        studentId: true,
        phone: true,
        parentPhone: true,
        academyId: true,
        approved: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      student: createdStudent,
      sync: {
        local: syncResult.localId,
        external: syncResult.externalId,
        timestamp: syncResult.timestamp,
      },
    });
  } catch (error) {
    console.error('학생 생성 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 학생 목록 조회 API
 * GET /api/sync/students
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

    // 학원 ID 확인
    const academyId = session.user.role === 'SUPER_ADMIN'
      ? request.nextUrl.searchParams.get('academyId')
      : session.user.academyId;

    if (!academyId) {
      return NextResponse.json(
        { error: '학원 정보가 없습니다' },
        { status: 400 }
      );
    }

    // 로컬 DB에서 학생 목록 조회
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        academyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        grade: true,
        studentId: true,
        phone: true,
        parentPhone: true,
        approved: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      students,
      count: students.length,
    });
  } catch (error) {
    console.error('학생 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
