import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 출석 통계 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 권한 체크
    if (!['DIRECTOR', 'TEACHER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json(
        { error: 'classId is required' },
        { status: 400 }
      );
    }

    // 수업의 학생 수 조회
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const totalStudents = classData._count.students;

    // 최근 30일간의 출석 데이터 조회
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendances = await prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // 상태별 카운트
    const statusCounts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    attendances.forEach((attendance) => {
      switch (attendance.status) {
        case 'PRESENT':
          statusCounts.present++;
          break;
        case 'ABSENT':
          statusCounts.absent++;
          break;
        case 'LATE':
          statusCounts.late++;
          break;
        case 'EXCUSED':
          statusCounts.excused++;
          break;
      }
    });

    // 출석률 계산 (출석 + 지각 + 조퇴를 출석으로 간주)
    const totalRecords = attendances.length;
    const presentCount = statusCounts.present + statusCounts.late + statusCounts.excused;
    const presentRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    return NextResponse.json({
      total: totalStudents,
      present: statusCounts.present,
      absent: statusCounts.absent,
      late: statusCounts.late,
      excused: statusCounts.excused,
      presentRate,
      totalRecords,
      period: '최근 30일',
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance stats' },
      { status: 500 }
    );
  }
}
