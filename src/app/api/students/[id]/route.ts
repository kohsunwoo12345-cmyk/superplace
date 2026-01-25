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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, academyId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

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

    // 학생 기본 정보 조회
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
      return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
    }

    // SUPER_ADMIN이 아닌 경우 같은 학원인지 체크
    if (currentUser.role !== 'SUPER_ADMIN' && student.academyId !== currentUser.academyId) {
      return NextResponse.json(
        { error: '같은 학원 소속 학생만 조회할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 학생의 봇 대화 기록 조회 (최근 50개, 한국 시간으로 변환)
    const conversations = await prisma.botConversation.findMany({
      where: {
        userId: studentId,
      },
      select: {
        id: true,
        botId: true,
        messages: true,
        messageCount: true,
        userMessageCount: true,
        botMessageCount: true,
        sessionDuration: true,
        lastMessageAt: true,
        createdAt: true,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: 50,
    });

    // 학생의 할당된 봇 목록
    const assignedBots = await prisma.botAssignment.findMany({
      where: {
        userId: studentId,
        isActive: true,
      },
      select: {
        botId: true,
        createdAt: true,
      },
    });

    // 학생의 AI 사용 통계
    const aiUsageStats = await prisma.botConversation.groupBy({
      by: ['botId'],
      where: {
        userId: studentId,
      },
      _count: {
        id: true,
      },
      _sum: {
        messageCount: true,
        sessionDuration: true,
      },
    });

    // 대화 분석 결과 조회
    const analyses = await prisma.conversationAnalysis.findMany({
      where: {
        userId: studentId,
      },
      select: {
        id: true,
        conversationId: true,
        botId: true,
        engagementScore: true,
        responseQuality: true,
        questionDepth: true,
        consistency: true,
        strengths: true,
        weaknesses: true,
        recommendations: true,
        summary: true,
        analyzedAt: true,
      },
      orderBy: {
        analyzedAt: 'desc',
      },
      take: 10,
    });

    // 출결 정보 조회
    const attendances = await prisma.attendance.findMany({
      where: {
        studentId: studentId,
      },
      select: {
        id: true,
        date: true,
        status: true,
        notes: true,
        createdAt: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 30, // 최근 30일
    });

    // 출결 통계 계산
    const attendanceStats = {
      total: attendances.length,
      present: attendances.filter(a => a.status === 'PRESENT').length,
      absent: attendances.filter(a => a.status === 'ABSENT').length,
      late: attendances.filter(a => a.status === 'LATE').length,
      excused: attendances.filter(a => a.status === 'EXCUSED').length,
    };

    // 학습 기록 조회 (숙제 제출)
    const homeworkSubmissions = await prisma.homeworkSubmission.findMany({
      where: {
        studentId: studentId,
      },
      select: {
        id: true,
        imageUrl: true,
        aiAnalysis: true,
        approved: true,
        submittedAt: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 20,
    });

    // 성적 정보 조회
    const testScores = await prisma.testScore.findMany({
      where: {
        studentId: studentId,
      },
      select: {
        id: true,
        subject: true,
        score: true,
        maxScore: true,
        testDate: true,
        notes: true,
      },
      orderBy: {
        testDate: 'desc',
      },
      take: 10,
    });

    // AI 기반 학습 특성 분석
    const learningCharacteristics = await analyzeLearningCharacteristics(
      conversations,
      analyses,
      attendances,
      homeworkSubmissions
    );

    return NextResponse.json({
      success: true,
      student: {
        ...student,
        // 한국 시간 포맷팅
        createdAt: student.createdAt.toISOString(),
        lastLoginAt: student.lastLoginAt?.toISOString() || null,
      },
      conversations: conversations.map((conv) => ({
        ...conv,
        // 한국 시간 포맷팅
        createdAt: conv.createdAt.toISOString(),
        lastMessageAt: conv.lastMessageAt.toISOString(),
        // 대화 링크 생성
        chatLink: `/dashboard/ai-gems/${conv.botId}`,
      })),
      assignedBots,
      aiUsageStats,
      analyses: analyses.map((analysis) => ({
        ...analysis,
        analyzedAt: analysis.analyzedAt.toISOString(),
      })),
      attendances: attendances.map((att) => ({
        ...att,
        date: att.date.toISOString(),
        createdAt: att.createdAt.toISOString(),
      })),
      attendanceStats,
      homeworkSubmissions: homeworkSubmissions.map((hw) => ({
        ...hw,
        submittedAt: hw.submittedAt.toISOString(),
      })),
      testScores: testScores.map((score) => ({
        ...score,
        testDate: score.testDate.toISOString(),
      })),
      learningCharacteristics,
    });
  } catch (error) {
    console.error('학생 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '학생 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// AI 기반 학습 특성 분석 함수
async function analyzeLearningCharacteristics(
  conversations: any[],
  analyses: any[],
  attendances: any[],
  homeworkSubmissions: any[]
) {
  const characteristics: any = {
    studySpeed: '',
    attitude: '',
    personality: '',
    strengths: [] as string[],
    weaknesses: [] as string[],
    recommendations: [] as string[],
  };

  // 1. 공부 속도 분석
  if (conversations.length > 0) {
    const avgMessageCount = conversations.reduce((sum, c) => sum + c.messageCount, 0) / conversations.length;
    const avgDuration = conversations.reduce((sum, c) => sum + (c.sessionDuration || 0), 0) / conversations.length;
    
    if (avgMessageCount > 20 && avgDuration < 600) {
      characteristics.studySpeed = '빠름 - 집중력이 높고 질문에 신속하게 응답합니다';
    } else if (avgMessageCount > 10 && avgDuration > 1200) {
      characteristics.studySpeed = '신중함 - 충분히 생각하고 답변하는 스타일입니다';
    } else if (avgMessageCount < 10) {
      characteristics.studySpeed = '느림 - 더 많은 시간과 설명이 필요합니다';
    } else {
      characteristics.studySpeed = '보통 - 적절한 페이스로 학습합니다';
    }
  }

  // 2. 학습 태도 분석
  const recentAttendanceRate = attendances.length > 0
    ? (attendances.filter(a => a.status === 'PRESENT').length / attendances.length) * 100
    : 0;

  if (recentAttendanceRate >= 90) {
    characteristics.attitude = '매우 성실함 - 꾸준히 출석하고 학습에 임합니다';
  } else if (recentAttendanceRate >= 70) {
    characteristics.attitude = '성실함 - 대체로 규칙적으로 학습합니다';
  } else if (recentAttendanceRate >= 50) {
    characteristics.attitude = '보통 - 출석률 개선이 필요합니다';
  } else {
    characteristics.attitude = '개선 필요 - 학습 규칙성을 높여야 합니다';
  }

  // 3. 성향 분석
  if (analyses.length > 0) {
    const avgEngagement = analyses.reduce((sum, a) => sum + a.engagementScore, 0) / analyses.length;
    const avgQuality = analyses.reduce((sum, a) => sum + a.responseQuality, 0) / analyses.length;
    
    if (avgEngagement > 7 && avgQuality > 7) {
      characteristics.personality = '적극적이고 탐구적 - 질문을 많이 하고 깊이 있게 학습합니다';
    } else if (avgEngagement > 5 && avgQuality > 5) {
      characteristics.personality = '안정적 - 주어진 학습을 성실히 수행합니다';
    } else if (avgEngagement < 5) {
      characteristics.personality = '소극적 - 학습 동기 부여가 필요합니다';
    } else {
      characteristics.personality = '발전 중 - 학습 방법을 찾아가는 단계입니다';
    }
  }

  // 4. 강점/약점 분석
  if (analyses.length > 0) {
    const allStrengths = analyses.flatMap(a => a.strengths);
    const allWeaknesses = analyses.flatMap(a => a.weaknesses);
    
    // 중복 제거 및 빈도수 계산
    const strengthCounts: Record<string, number> = {};
    allStrengths.forEach(s => {
      strengthCounts[s] = (strengthCounts[s] || 0) + 1;
    });
    
    const weaknessCounts: Record<string, number> = {};
    allWeaknesses.forEach(w => {
      weaknessCounts[w] = (weaknessCounts[w] || 0) + 1;
    });
    
    // 상위 3개만 추출
    characteristics.strengths = Object.entries(strengthCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([strength]) => strength);
    
    characteristics.weaknesses = Object.entries(weaknessCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([weakness]) => weakness);
  }

  // 5. 추천 사항
  if (recentAttendanceRate < 80) {
    characteristics.recommendations.push('규칙적인 출석을 위한 학습 일정 관리가 필요합니다');
  }
  
  if (homeworkSubmissions.length < 5) {
    characteristics.recommendations.push('숙제 제출 횟수를 늘려 학습 습관을 기르세요');
  }
  
  if (conversations.length < 10) {
    characteristics.recommendations.push('AI 봇과의 대화를 통해 더 많은 학습 기회를 가지세요');
  }
  
  if (analyses.length > 0) {
    const avgEngagement = analyses.reduce((sum, a) => sum + a.engagementScore, 0) / analyses.length;
    if (avgEngagement < 5) {
      characteristics.recommendations.push('학습 동기 부여를 위한 흥미로운 주제나 활동을 제공하세요');
    }
  }

  return characteristics;
}
