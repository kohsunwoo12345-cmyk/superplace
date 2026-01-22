import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 학원장/선생님 대시보드 통계 API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'DIRECTOR' && session.user.role !== 'TEACHER')) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 현재 사용자 정보
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

    const academyId = currentUser.academyId;

    // 전체 학생 수
    const totalStudents = await prisma.user.count({
      where: {
        academyId,
        role: 'STUDENT',
      },
    });

    // 이번 달 신규 학생
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const newStudentsThisMonth = await prisma.user.count({
      where: {
        academyId,
        role: 'STUDENT',
        createdAt: {
          gte: thisMonthStart,
        },
      },
    });

    // 학습 자료 수
    const totalMaterials = await prisma.learningMaterial.count({
      where: {
        academyId,
      },
    });

    // 이번 주 추가된 자료
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const newMaterialsThisWeek = await prisma.learningMaterial.count({
      where: {
        academyId,
        createdAt: {
          gte: thisWeekStart,
        },
      },
    });

    // 진행 중인 과제 (제출 안됨)
    const pendingAssignments = await prisma.assignment.count({
      where: {
        user: {
          academyId,
        },
        status: 'PENDING',
      },
    });

    // 전체 출석률 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalAttendances = await prisma.attendance.count({
      where: {
        user: {
          academyId,
        },
        date: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const presentAttendances = await prisma.attendance.count({
      where: {
        user: {
          academyId,
        },
        date: {
          gte: thirtyDaysAgo,
        },
        status: 'PRESENT',
      },
    });

    const attendanceRate = totalAttendances > 0 
      ? Math.round((presentAttendances / totalAttendances) * 100) 
      : 0;

    // 최근 등록 학생 (7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentStudents = await prisma.user.findMany({
      where: {
        academyId,
        role: 'STUDENT',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // 검토 대기 과제 (제출됨, 미채점)
    const pendingGrading = await prisma.assignment.findMany({
      where: {
        user: {
          academyId,
        },
        status: 'SUBMITTED',
      },
      select: {
        id: true,
        title: true,
        subject: true,
        submittedAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
      take: 5,
    });

    // 과목별 학습 진도 (평균)
    const learningProgressBySubject = await prisma.learningMaterial.groupBy({
      by: ['subject'],
      where: {
        academyId,
      },
      _count: {
        id: true,
      },
    });

    // 각 과목의 평균 진도율 계산
    const subjectProgress = await Promise.all(
      learningProgressBySubject.map(async (subject) => {
        const avgProgress = await prisma.learningProgress.aggregate({
          where: {
            material: {
              academyId,
              subject: subject.subject,
            },
          },
          _avg: {
            progress: true,
          },
        });

        return {
          subject: subject.subject,
          progress: Math.round(avgProgress._avg.progress || 0),
        };
      })
    );

    return NextResponse.json({
      totalStudents,
      newStudentsThisMonth,
      totalMaterials,
      newMaterialsThisWeek,
      pendingAssignments,
      attendanceRate,
      recentStudents: recentStudents.map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        grade: student.grade || '미설정',
        createdAt: student.createdAt,
      })),
      pendingGrading: pendingGrading.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        subject: assignment.subject,
        student: assignment.user.name,
        submittedAt: assignment.submittedAt,
      })),
      subjectProgress,
    });
  } catch (error) {
    console.error('Error fetching director/teacher stats:', error);
    return NextResponse.json(
      { error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
