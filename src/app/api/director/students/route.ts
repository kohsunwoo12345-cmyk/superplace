import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 학원장이 자신의 학원 학생 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DIRECTOR') {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 현재 사용자 정보 확인
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { academyId: true },
    });

    if (!currentUser?.academyId) {
      return NextResponse.json(
        { error: '소속 학원 정보가 없습니다.' },
        { status: 400 }
      );
    }

    // 같은 학원의 학생들 조회
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        academyId: currentUser.academyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        studentId: true,
        assignedBots: {
          where: {
            isActive: true,
          },
          select: {
            botId: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // 할당된 봇 ID 목록 추출
    const studentsWithBots = students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      grade: student.grade,
      studentId: student.studentId,
      assignedBots: student.assignedBots.map((ab) => ab.botId),
    }));

    return NextResponse.json({ students: studentsWithBots });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: '학생 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
