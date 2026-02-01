import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncStudent, logSync } from '@/lib/sync-utils';
import { prisma } from '@/lib/prisma';

/**
 * 특정 학생 수정 API (동기화 포함)
 * PATCH /api/sync/students/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const studentId = params.id;
    const body = await request.json();

    // 학생 존재 확인
    const existingStudent = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 권한 확인 (DIRECTOR는 자기 학원 학생만)
    if (
      session.user.role === 'DIRECTOR' &&
      existingStudent.academyId !== session.user.academyId
    ) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData: any = {
      id: studentId,
      email: existingStudent.email, // 이메일은 동기화 키로 사용
    };

    // 허용된 필드만 업데이트
    if (body.name !== undefined) updateData.name = body.name;
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.parentPhone !== undefined) updateData.parentPhone = body.parentPhone;
    if (body.approved !== undefined) updateData.approved = body.approved;

    // 동기화 수행
    const syncResult = await syncStudent('UPDATE', updateData);
    await logSync(syncResult);

    if (!syncResult.success) {
      return NextResponse.json(
        { error: '학생 수정 중 오류가 발생했습니다', details: syncResult.error },
        { status: 500 }
      );
    }

    // 수정된 학생 정보 조회
    const updatedStudent = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        email: true,
        name: true,
        grade: true,
        studentId: true,
        phone: true,
        parentPhone: true,
        approved: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      student: updatedStudent,
      sync: {
        local: syncResult.localId,
        external: syncResult.externalId,
        timestamp: syncResult.timestamp,
      },
    });
  } catch (error) {
    console.error('학생 수정 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 특정 학생 삭제 API (동기화 포함)
 * DELETE /api/sync/students/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const studentId = params.id;

    // 학생 존재 확인
    const existingStudent = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 권한 확인
    if (
      session.user.role === 'DIRECTOR' &&
      existingStudent.academyId !== session.user.academyId
    ) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // 동기화 수행
    const syncResult = await syncStudent('DELETE', {
      id: studentId,
      email: existingStudent.email,
    });
    await logSync(syncResult);

    if (!syncResult.success) {
      return NextResponse.json(
        { error: '학생 삭제 중 오류가 발생했습니다', details: syncResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '학생이 삭제되었습니다',
      sync: {
        local: syncResult.localId,
        external: syncResult.externalId,
        timestamp: syncResult.timestamp,
      },
    });
  } catch (error) {
    console.error('학생 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
