"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Award,
  TrendingUp,
} from "lucide-react";

interface HomeworkAssignment {
  id: string;
  teacherId: number;
  teacherName: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  createdAt: string;
  targetType: string;
  submissionStatus?: string;
  submissionId?: string;
}

interface SubmittedHomework {
  id: string;
  score: number;
  feedback: string;
  subject: string;
  completion: string;
  effort: string;
  submittedAt: string;
  gradedAt: string;
}

interface HomeworkData {
  success: boolean;
  today: string;
  todayHomework: HomeworkAssignment[];
  upcomingHomework: HomeworkAssignment[];
  allAssignments: HomeworkAssignment[];
  submittedHomework: SubmittedHomework[];
  summary: {
    todayCount: number;
    upcomingCount: number;
    submittedCount: number;
  };
}

export default function StudentHomeworkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [homeworkData, setHomeworkData] = useState<HomeworkData | null>(null);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchHomework(user.id, user.academyId);
    } else {
      router.push("/login");
    }
  }, []);

  const fetchHomework = async (studentId: string | number, academyId?: string | number) => {
    try {
      setLoading(true);
      console.log('========== 학생 숙제 조회 시작 ==========');
      console.log('🔑 studentId:', studentId, '타입:', typeof studentId);
      console.log('🏫 academyId:', academyId, '타입:', typeof academyId);
      
      const params = new URLSearchParams({
        studentId: String(studentId),
      });
      if (academyId) {
        params.append("academyId", String(academyId));
      }

      console.log("📚 API URL:", `/api/homework/assignments/student?${params.toString()}`);
      
      const response = await fetch(
        `/api/homework/assignments/student?${params.toString()}`
      );
      
      console.log('📡 HTTP 상태:', response.status);
      const data = await response.json();

      console.log("📦 전체 응답:", data);
      console.log("📊 통계:", data.summary);

      if (data.success) {
        console.log('✅ 숙제 조회 성공!');
        console.log('   오늘 숙제:', data.todayHomework?.length || 0, '개');
        console.log('   다가오는 숙제:', data.upcomingHomework?.length || 0, '개');
        console.log('   전체 숙제:', data.allAssignments?.length || 0, '개');
        console.log('   제출한 숙제:', data.submittedHomework?.length || 0, '개');
        setHomeworkData(data);
      } else {
        console.error("❌ Failed to fetch homework:", data.error);
        // 빈 데이터라도 설정
        setHomeworkData({
          success: true,
          today: new Date().toISOString().split('T')[0],
          todayHomework: [],
          upcomingHomework: [],
          allAssignments: [],
          submittedHomework: [],
          summary: {
            todayCount: 0,
            upcomingCount: 0,
            submittedCount: 0,
          }
        });
      }
      console.log('========== 학생 숙제 조회 완료 ==========');
    } catch (error) {
      console.error("❌ Failed to fetch homework:", error);
      // 오류 발생 시에도 빈 데이터 설정
      setHomeworkData({
        success: true,
        today: new Date().toISOString().split('T')[0],
        todayHomework: [],
        upcomingHomework: [],
        allAssignments: [],
        submittedHomework: [],
        summary: {
          todayCount: 0,
          upcomingCount: 0,
          submittedCount: 0,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCompletionColor = (completion: string) => {
    switch (completion) {
      case "상":
        return "text-green-600";
      case "중":
        return "text-yellow-600";
      case "하":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!homeworkData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>데이터를 불러올 수 없습니다</CardTitle>
            <CardDescription>
              잠시 후 다시 시도해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">페이지를 새로고침해주세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">📚 나의 숙제</h1>
        <p className="text-gray-600">
          {currentUser?.name}님의 숙제 현황입니다
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              오늘 할 숙제
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-orange-600">
                {homeworkData.summary.todayCount}
              </span>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              다가오는 숙제
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-blue-600">
                {homeworkData.summary.upcomingCount}
              </span>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              제출한 숙제
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">
                {homeworkData.summary.submittedCount}
              </span>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 오늘의 숙제 */}
      {homeworkData.todayHomework.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-600" />
            오늘 할 숙제 ({homeworkData.todayHomework.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeworkData.todayHomework.map((hw) => (
              <Card
                key={hw.id}
                className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{hw.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{hw.teacherName} 선생님</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-orange-50">
                      {hw.subject}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {hw.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>마감: {formatDate(hw.dueDate)}</span>
                    </div>
                    {hw.submissionStatus === "submitted" ? (
                      <Badge className="bg-green-600">제출 완료</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/homework-check?userId=${currentUser.id}&assignmentId=${hw.id}`
                          )
                        }
                      >
                        제출하기
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 다가오는 숙제 */}
      {homeworkData.upcomingHomework.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            다가오는 숙제 ({homeworkData.upcomingHomework.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeworkData.upcomingHomework.map((hw) => (
              <Card
                key={hw.id}
                className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{hw.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{hw.teacherName} 선생님</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                      {hw.subject}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {hw.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>마감: {formatDate(hw.dueDate)}</span>
                    </div>
                    {hw.submissionStatus === "submitted" ? (
                      <Badge className="bg-green-600">제출 완료</Badge>
                    ) : (
                      <Badge variant="outline">진행 중</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 제출한 숙제 (AI 채점 결과) */}
      {homeworkData.submittedHomework.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-green-600" />
            제출한 숙제 - AI 채점 결과 ({homeworkData.submittedHomework.length})
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {homeworkData.submittedHomework.map((hw) => (
              <Card
                key={hw.id}
                className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="bg-blue-50">
                          {hw.subject}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-green-600">
                            {hw.score}점
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>제출: {formatDate(hw.submittedAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className={getCompletionColor(hw.completion)}
                        >
                          완성도: {hw.completion}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getCompletionColor(hw.effort)}
                        >
                          노력도: {hw.effort}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">
                          AI 선생님 피드백
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {hw.feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {homeworkData.todayHomework.length === 0 &&
        homeworkData.upcomingHomework.length === 0 &&
        homeworkData.submittedHomework.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                아직 숙제가 없습니다
              </h3>
              <p className="text-gray-600">
                선생님이 숙제를 내주시면 여기에 표시됩니다.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
