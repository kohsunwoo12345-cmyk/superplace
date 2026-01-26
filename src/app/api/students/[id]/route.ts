import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 학생 상세 정보 조회 - 안전한 버전
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;
  console.log('🔍 [API START] 학생 상세 조회:', studentId);
  
  try {
    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ [AUTH] 인증 실패');
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    console.log('✅ [AUTH] 인증 성공:', session.user.email);

    // 2. 현재 사용자 조회
    let currentUser;
    try {
      currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, academyId: true },
      });
      if (!currentUser) {
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
      }
      console.log('✅ [USER] 사용자 조회 성공:', currentUser.role);
    } catch (e: any) {
      console.error('❌ [USER] 사용자 조회 실패:', e.message);
      return NextResponse.json({ 
        error: '사용자 조회 중 오류가 발생했습니다.',
        details: e.message 
      }, { status: 500 });
    }

    // 3. 권한 체크
    if (
      currentUser.role !== 'SUPER_ADMIN' &&
      currentUser.role !== 'DIRECTOR' &&
      currentUser.role !== 'TEACHER'
    ) {
      console.log('❌ [PERMISSION] 권한 없음:', currentUser.role);
      return NextResponse.json({ error: '학생 정보 조회 권한이 없습니다.' }, { status: 403 });
    }

    // 4. 학생 기본 정보 조회
    let student;
    try {
      student = await prisma.user.findUnique({
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
        console.log('❌ [STUDENT] 학생을 찾을 수 없음');
        return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
      }
      console.log('✅ [STUDENT] 학생 조회 성공:', student.name);
    } catch (e: any) {
      console.error('❌ [STUDENT] 학생 조회 실패:', e.message);
      return NextResponse.json({ 
        error: '학생 조회 중 오류가 발생했습니다.',
        details: e.message 
      }, { status: 500 });
    }

    // 5. 학원 체크
    if (currentUser.role !== 'SUPER_ADMIN' && student.academyId !== currentUser.academyId) {
      console.log('❌ [ACADEMY] 학원 불일치');
      return NextResponse.json({ error: '같은 학원 소속 학생만 조회할 수 있습니다.' }, { status: 403 });
    }

    // 6. 대화 기록 조회 (안전)
    let conversations = [];
    try {
      conversations = await prisma.botConversation.findMany({
        where: { userId: studentId },
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
        orderBy: { lastMessageAt: 'desc' },
        take: 50,
      });
      console.log(`✅ [CONVERSATIONS] 대화 기록: ${conversations.length}개`);
    } catch (e: any) {
      console.error('⚠️ [CONVERSATIONS] 대화 기록 조회 실패:', e.message);
      // 실패해도 계속 진행
    }

    // 7. 할당된 봇 조회 (안전)
    let assignedBots = [];
    try {
      assignedBots = await prisma.botAssignment.findMany({
        where: { userId: studentId, isActive: true },
        select: { botId: true, createdAt: true },
      });
      console.log(`✅ [BOTS] 할당된 봇: ${assignedBots.length}개`);
    } catch (e: any) {
      console.error('⚠️ [BOTS] 봇 조회 실패:', e.message);
    }

    // 8. AI 사용 통계 (안전)
    let aiUsageStats = [];
    try {
      aiUsageStats = await prisma.botConversation.groupBy({
        by: ['botId'],
        where: { userId: studentId },
        _count: { id: true },
        _sum: { messageCount: true, sessionDuration: true },
      });
      console.log(`✅ [AI_STATS] AI 통계: ${aiUsageStats.length}개`);
    } catch (e: any) {
      console.error('⚠️ [AI_STATS] AI 통계 조회 실패:', e.message);
    }

    // 9. 대화 분석 (안전)
    let analyses = [];
    try {
      analyses = await prisma.conversationAnalysis.findMany({
        where: { userId: studentId },
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
        orderBy: { analyzedAt: 'desc' },
        take: 10,
      });
      console.log(`✅ [ANALYSES] 대화 분석: ${analyses.length}개`);
    } catch (e: any) {
      console.error('⚠️ [ANALYSES] 대화 분석 조회 실패:', e.message);
    }

    // 10. 출결 정보 (안전)
    let attendances = [];
    try {
      attendances = await prisma.attendance.findMany({
        where: { userId: studentId },
        select: {
          id: true,
          date: true,
          status: true,
          notes: true,
          createdAt: true,
        },
        orderBy: { date: 'desc' },
        take: 30,
      });
      console.log(`✅ [ATTENDANCE] 출결: ${attendances.length}개`);
    } catch (e: any) {
      console.error('⚠️ [ATTENDANCE] 출결 조회 실패:', e.message);
    }

    // 11. 출결 통계
    const attendanceStats = {
      total: attendances.length,
      present: attendances.filter(a => a.status === 'PRESENT').length,
      absent: attendances.filter(a => a.status === 'ABSENT').length,
      late: attendances.filter(a => a.status === 'LATE').length,
      excused: attendances.filter(a => a.status === 'EXCUSED').length,
    };

    // 12. 숙제 제출 (안전)
    let homeworkSubmissions = [];
    try {
      homeworkSubmissions = await prisma.homeworkSubmission.findMany({
        where: { userId: studentId },
        select: {
          id: true,
          imageUrl: true,
          aiAnalysis: true,
          approved: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: 'desc' },
        take: 20,
      });
      console.log(`✅ [HOMEWORK] 숙제: ${homeworkSubmissions.length}개`);
    } catch (e: any) {
      console.error('⚠️ [HOMEWORK] 숙제 조회 실패:', e.message);
    }

    // 13. 성적 (안전)
    let testScores = [];
    try {
      testScores = await prisma.testScore.findMany({
        where: { userId: studentId },
        select: {
          id: true,
          subject: true,
          score: true,
          maxScore: true,
          testDate: true,
          notes: true,
        },
        orderBy: { testDate: 'desc' },
        take: 10,
      });
      console.log(`✅ [SCORES] 성적: ${testScores.length}개`);
    } catch (e: any) {
      console.error('⚠️ [SCORES] 성적 조회 실패:', e.message);
    }

    // 14. 학습 특성 분석 (간단 버전)
    const learningCharacteristics = {
      studySpeed: conversations.length > 10 ? '보통' : '데이터 수집 중',
      attitude: attendances.length > 5 ? '성실함' : '데이터 수집 중',
      personality: analyses.length > 0 ? '발전 중' : '데이터 수집 중',
      strengths: [],
      weaknesses: [],
      recommendations: ['학습 데이터가 쌓이면 맞춤형 분석을 제공합니다'],
    };

    // 15. 응답 반환
    console.log('🎉 [SUCCESS] 모든 데이터 조회 완료');
    return NextResponse.json({
      success: true,
      student: {
        ...student,
        createdAt: student.createdAt.toISOString(),
        lastLoginAt: student.lastLoginAt?.toISOString() || null,
      },
      conversations: conversations.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        lastMessageAt: c.lastMessageAt.toISOString(),
        chatLink: `/dashboard/ai-gems/${c.botId}`,
      })),
      assignedBots,
      aiUsageStats,
      analyses: analyses.map(a => ({
        ...a,
        analyzedAt: a.analyzedAt.toISOString(),
      })),
      attendances: attendances.map(a => ({
        ...a,
        date: a.date.toISOString(),
        createdAt: a.createdAt.toISOString(),
      })),
      attendanceStats,
      homeworkSubmissions: homeworkSubmissions.map(h => ({
        ...h,
        submittedAt: h.submittedAt.toISOString(),
      })),
      testScores: testScores.map(s => ({
        ...s,
        testDate: s.testDate.toISOString(),
      })),
      learningCharacteristics,
    });

  } catch (error: any) {
    console.error('❌ [FATAL] 치명적 오류:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error meta:', error?.meta);
    
    return NextResponse.json(
      { 
        error: '학생 정보 조회 중 오류가 발생했습니다.',
        details: error?.message || '알 수 없는 오류',
        errorName: error?.name || 'Unknown',
        errorCode: error?.code || 'Unknown',
      },
      { status: 500 }
    );
  }
}
