import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIResponse } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { role } = session.user;

    // 학원장, 선생님, 관리자만 접근 가능
    if (role !== "DIRECTOR" && role !== "TEACHER" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await req.json();
    const { studentName, analytics } = body;

    if (!studentName || !analytics) {
      return NextResponse.json(
        { error: "학생 이름과 분석 데이터가 필요합니다" },
        { status: 400 }
      );
    }

    // AI 프롬프트 생성
    const prompt = `
당신은 학원의 전문 학습 컨설턴트입니다. 다음 학생의 학습 데이터를 분석하여 학원장에게 제공할 종합 분석 리포트를 작성해주세요.

**학생 정보**
- 이름: ${studentName}
- 학년: ${analytics.student.grade || "미지정"}
- 수강 수업: ${analytics.classes.length}개

**학습 데이터**
1. 과제 현황:
   - 전체 과제: ${analytics.assignments.total}개
   - 완료: ${analytics.assignments.completed}개
   - 제출 대기: ${analytics.assignments.submitted}개
   - 미제출: ${analytics.assignments.pending}개
   - 평균 점수: ${analytics.assignments.averageScore.toFixed(1)}점
   - 제때 제출률: ${analytics.assignments.onTimeSubmissionRate.toFixed(1)}%

2. 시험 성적:
   - 평균 성적: ${analytics.testScores.average.toFixed(1)}%
   - 최근 시험 횟수: ${analytics.testScores.recent.length}회
   - 과목별 평균:
${analytics.testScores.bySubject.map((s: any) => `     * ${s.subject}: ${s.average.toFixed(1)}% (${s.count}회)`).join('\n')}

3. 출석 현황:
   - 출석률: ${analytics.attendance.rate.toFixed(1)}%
   - 출석: ${analytics.attendance.present}일
   - 결석: ${analytics.attendance.absent}일
   - 지각: ${analytics.attendance.late}일
   - 조퇴: ${analytics.attendance.excused}일

4. 학습 진도:
   - 전체 학습 자료: ${analytics.learningProgress.total}개
   - 완료: ${analytics.learningProgress.completed}개
   - 진행 중: ${analytics.learningProgress.inProgress}개
   - 미시작: ${analytics.learningProgress.notStarted}개
   - 평균 진도율: ${analytics.learningProgress.averageProgress.toFixed(1)}%
   - 총 학습 시간: ${Math.floor(analytics.learningProgress.totalTimeSpent / 60)}시간 ${analytics.learningProgress.totalTimeSpent % 60}분

**요청사항**
다음 항목들을 포함하여 **한국어로** 간결하고 실용적인 분석 리포트를 작성해주세요:

1. **종합 평가** (2-3줄): 학생의 전반적인 학습 상태를 한 문장으로 요약
2. **강점** (2-3개): 학생이 잘하고 있는 부분
3. **개선 필요 영역** (2-3개): 주의가 필요하거나 개선이 필요한 부분
4. **학습 성향 분석** (2-3줄): 데이터로 파악되는 학생의 학습 패턴과 성향
5. **적응도 평가** (1-2줄): 학원 수업에 얼마나 잘 적응하고 있는지
6. **추천 조치사항** (2-3개): 학원장이 취할 수 있는 구체적인 조치

**주의사항**
- 학원장이 바로 실행할 수 있는 구체적인 조언을 제공하세요
- 긍정적이면서도 솔직한 톤을 유지하세요
- 불필요한 수식어는 피하고 핵심만 전달하세요
- 각 항목은 명확한 제목과 함께 구조화하세요
`;

    const aiSummary = await generateAIResponse(prompt, "gemini-pro");

    return NextResponse.json(
      {
        summary: aiSummary,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ AI 요약 생성 중 오류:", error);
    return NextResponse.json(
      { error: "AI 요약 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
