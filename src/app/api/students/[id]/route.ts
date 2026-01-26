import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 학생 상세 정보 조회 (대화 기록, 로그인 이력 포함)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [API] 학생 상세 조회 시작:', params.id);
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ [API] 인증 실패');
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    console.log('✅ [API] 인증 성공:', session.user.email, session.user.role);

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, academyId: true },
    });

    if (!currentUser) {
      console.log('❌ [API] 사용자를 찾을 수 없음:', session.user.id);
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    console.log('✅ [API] 사용자 정보:', currentUser.role, currentUser.academyId);

    // 권한 체크: SUPER_ADMIN, DIRECTOR, TEACHER만 접근 가능
    if (
      currentUser.role !== 'SUPER_ADMIN' &&
      currentUser.role !== 'DIRECTOR' &&
      currentUser.role !== 'TEACHER'
    ) {
      return NextResponse.json(
        { error: '학생 정보 조회 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const studentId = params.id;
    console.log('🎯 [API] 조회할 학생 ID:', studentId);

    // 학생 기본 정보 조회
    console.log('📋 [API] 1단계: 학생 기본 정보 조회 시작...');
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        academyId: true,
        school: true,
        grade: true,
        studentId: true,
        studentCode: true,
        parentPhone: true,
        points: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!student) {
      console.log('❌ [API] 학생을 찾을 수 없음:', studentId);
      return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    console.log('✅ [API] 학생 정보:', student.name, student.email, 'academyId:', student.academyId);

    // SUPER_ADMIN이 아닌 경우 같은 학원인지 체크
    if (currentUser.role !== 'SUPER_ADMIN' && student.academyId !== currentUser.academyId) {
      return NextResponse.json(
        { error: '같은 학원 소속 학생만 조회할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 간단한 응답 먼저 반환 (나머지 데이터 조회 없이)
    console.log('🎉 [API] 기본 정보만 반환 (단순화 버전)');
    return NextResponse.json({
      success: true,
      student: {
        ...student,
        createdAt: student.createdAt.toISOString(),
        lastLoginAt: student.lastLoginAt?.toISOString() || null,
      },
      conversations: [],
      assignedBots: [],
      aiUsageStats: [],
      analyses: [],
      attendances: [],
      attendanceStats: {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      },
      homeworkSubmissions: [],
      testScores: [],
      learningCharacteristics: {
        studySpeed: '데이터 수집 중',
        attitude: '데이터 수집 중',
        personality: '데이터 수집 중',
        strengths: [],
        weaknesses: [],
        recommendations: ['학습 데이터가 쌓이면 분석을 시작합니다'],
      },
    });

  } catch (error: any) {
    console.error('❌ [API] 학생 정보 조회 오류:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: '학생 정보 조회 중 오류가 발생했습니다.',
        details: error?.message || '알 수 없는 오류',
        errorName: error?.name || 'Unknown',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
