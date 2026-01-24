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

    // 권한 체크: DIRECTOR, TEACHER만 접근 가능
    if (currentUser.role !== 'DIRECTOR' && currentUser.role !== 'TEACHER') {
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
        studentId: true,
        grade: true,
        parentPhone: true,
        points: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 같은 학원인지 체크
    if (student.academyId !== currentUser.academyId) {
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
    });
  } catch (error) {
    console.error('학생 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '학생 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
