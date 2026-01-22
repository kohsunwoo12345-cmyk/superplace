import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 학생 대시보드 통계 API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // 오늘의 학습 시간 (분)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayProgress = await prisma.learningProgress.aggregate({
      where: {
        userId,
        lastAccessedAt: {
          gte: today,
        },
      },
      _sum: {
        timeSpent: true,
      },
    });

    const todayStudyTime = todayProgress._sum.timeSpent || 0;

    // 완료한 강의 수
    const completedMaterials = await prisma.learningProgress.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    });

    // 전체 강의 수
    const totalMaterials = await prisma.learningProgress.count({
      where: {
        userId,
      },
    });

    // 제출할 과제 수
    const pendingAssignments = await prisma.assignment.count({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    // 마감 임박 과제 (3일 이내)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const urgentAssignments = await prisma.assignment.count({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          lte: threeDaysLater,
        },
      },
    });

    // 평균 점수
    const avgScore = await prisma.testScore.aggregate({
      where: {
        userId,
      },
      _avg: {
        score: true,
      },
    });

    const averageScore = Math.round(avgScore._avg.score || 0);

    // 오늘의 학습 일정
    const todaySchedule = await prisma.learningMaterial.findMany({
      where: {
        progress: {
          some: {
            userId,
            status: {
              in: ['NOT_STARTED', 'IN_PROGRESS'],
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        subject: true,
        duration: true,
        progress: {
          where: {
            userId,
          },
          select: {
            status: true,
          },
        },
      },
      take: 4,
    });

    // 제출할 과제 목록
    const assignmentsList = await prisma.assignment.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      select: {
        id: true,
        title: true,
        subject: true,
        dueDate: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 4,
    });

    // 과목별 학습 진도
    const progressBySubject = await prisma.learningMaterial.groupBy({
      by: ['subject'],
      where: {
        progress: {
          some: {
            userId,
          },
        },
      },
      _count: {
        id: true,
      },
    });

    const subjectProgress = await Promise.all(
      progressBySubject.map(async (subject) => {
        const completedCount = await prisma.learningProgress.count({
          where: {
            userId,
            material: {
              subject: subject.subject,
            },
            status: 'COMPLETED',
          },
        });

        const totalCount = await prisma.learningProgress.count({
          where: {
            userId,
            material: {
              subject: subject.subject,
            },
          },
        });

        return {
          subject: subject.subject,
          completed: completedCount,
          total: totalCount,
          progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        };
      })
    );

    // 날짜 계산 함수
    const getDueDateLabel = (dueDate: Date) => {
      const now = new Date();
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return '기한 만료';
      if (diffDays === 0) return '오늘';
      if (diffDays === 1) return '내일';
      return `${diffDays}일 후`;
    };

    return NextResponse.json({
      todayStudyTime,
      completedMaterials,
      totalMaterials,
      pendingAssignments,
      urgentAssignments,
      averageScore,
      todaySchedule: todaySchedule.map((item) => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        duration: item.duration,
        status: item.progress[0]?.status || 'NOT_STARTED',
      })),
      assignmentsList: assignmentsList.map((item) => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        dueDate: getDueDateLabel(item.dueDate),
        isUrgent: item.dueDate <= threeDaysLater,
      })),
      subjectProgress,
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
