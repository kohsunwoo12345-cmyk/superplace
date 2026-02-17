export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

// 실제로는 데이터베이스에서 가져옴
// 임시로 메모리에서 가져오는 함수
const getLandingPageById = (id: string) => {
  // 이 부분은 실제로 데이터베이스 쿼리로 대체되어야 합니다
  return null;
};

// 학생 데이터를 가져오는 함수 (실제로는 DB 쿼리)
const getStudentData = async (studentId: number, dataOptions: any) => {
  // 실제 구현에서는 API를 호출하거나 DB에서 데이터를 가져옵니다
  return {
    basicInfo: dataOptions.showBasicInfo ? {
      name: "김철수",
      email: "student@example.com",
      academy: "슈퍼플레이스 학원",
      joinedAt: "2024-01-15",
    } : undefined,
    attendance: dataOptions.showAttendance ? {
      total: 45,
      present: 40,
      late: 3,
      absent: 2,
      attendanceRate: 89,
      recentRecords: [
        { date: "2024-02-16", status: "present" },
        { date: "2024-02-15", status: "present" },
        { date: "2024-02-14", status: "late" },
        { date: "2024-02-13", status: "present" },
        { date: "2024-02-12", status: "present" },
      ],
    } : undefined,
    aiChats: dataOptions.showAIChats ? {
      totalChats: 127,
      recentActivity: "2024-02-17",
      analysis: {
        summary: "학생은 수학 문제 해결에 적극적이며, AI와의 대화를 통해 꾸준히 학습하고 있습니다.",
        strengths: [
          "논리적 사고력이 뛰어남",
          "질문을 구체적으로 잘 표현함",
          "학습 의욕이 높음",
        ],
        weaknesses: [
          "복잡한 문제에서 인내심 부족",
          "기초 개념 복습 필요",
        ],
      },
    } : undefined,
    concepts: dataOptions.showConcepts ? {
      summary: "전반적인 이해도는 양호하나, 일부 개념에서 추가 학습이 필요합니다.",
      weakConcepts: [
        {
          concept: "이차방정식 응용",
          description: "실생활 문제에 이차방정식을 적용하는 데 어려움을 겪고 있습니다.",
          severity: "high",
        },
        {
          concept: "함수의 그래프",
          description: "함수의 그래프를 해석하고 그리는 연습이 더 필요합니다.",
          severity: "medium",
        },
      ],
      recommendations: [
        {
          concept: "이차방정식",
          action: "다양한 응용 문제를 풀어보며 실전 감각을 익히세요.",
        },
        {
          concept: "함수",
          action: "그래프 그리기 연습을 매일 10분씩 진행하세요.",
        },
      ],
    } : undefined,
    homework: dataOptions.showHomework ? {
      totalAssignments: 28,
      completed: 25,
      averageScore: 87,
      recentSubmissions: [
        {
          title: "방정식 풀이 과제",
          submittedAt: "2024-02-15",
          score: 92,
        },
        {
          title: "함수 그래프 그리기",
          submittedAt: "2024-02-12",
          score: 85,
        },
        {
          title: "문장제 문제 풀이",
          submittedAt: "2024-02-08",
          score: 88,
        },
      ],
    } : undefined,
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 랜딩페이지 정보 조회 (실제로는 DB에서)
    const landingPage = getLandingPageById(id);

    // 임시 데이터 (실제로는 DB에서 가져와야 함)
    const mockLandingPage = {
      id,
      title: "김철수 학생의 학습 리포트",
      studentId: 1,
      studentName: "김철수",
      studentEmail: "student@example.com",
      academyName: "슈퍼플레이스 학원",
      createdAt: new Date().toISOString(),
      dataOptions: {
        showBasicInfo: true,
        showAttendance: true,
        showAIChats: true,
        showConcepts: true,
        showHomework: true,
      },
    };

    // 조회수 증가 (실제로는 DB 업데이트)
    
    // 학생 데이터 가져오기
    const studentData = await getStudentData(
      mockLandingPage.studentId,
      mockLandingPage.dataOptions
    );

    return NextResponse.json({
      success: true,
      data: {
        ...mockLandingPage,
        studentData,
      },
    });
  } catch (error) {
    console.error("Error fetching landing page:", error);
    return NextResponse.json(
      { error: "Landing page not found" },
      { status: 404 }
    );
  }
}
