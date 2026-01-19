import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 출석 목록 조회
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
    const date = searchParams.get('date');

    if (!classId || !date) {
      return NextResponse.json(
        { error: 'classId and date are required' },
        { status: 400 }
      );
    }

    // 날짜 범위 설정 (해당 날짜의 00:00:00 ~ 23:59:59)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            studentId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendances' },
      { status: 500 }
    );
  }
}

// POST: 출석 체크
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 권한 체크
    if (!['DIRECTOR', 'TEACHER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, classId, date, status, notes } = body;

    // 입력 검증
    if (!userId || !date || !status) {
      return NextResponse.json(
        { error: 'userId, date, and status are required' },
        { status: 400 }
      );
    }

    // 유효한 상태 확인
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // 날짜 설정
    const attendanceDate = new Date(date);
    attendanceDate.setHours(12, 0, 0, 0); // 정오로 설정

    // 출석 생성 또는 업데이트
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_classId_date: {
          userId,
          classId: classId || '',
          date: attendanceDate,
        },
      },
      update: {
        status,
        notes: notes || null,
      },
      create: {
        userId,
        classId: classId || null,
        date: attendanceDate,
        status,
        notes: notes || null,
      },
      include: {
        user: {
          select: {
            name: true,
            studentId: true,
          },
        },
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}
