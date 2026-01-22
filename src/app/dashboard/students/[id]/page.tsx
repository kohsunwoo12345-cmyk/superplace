"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Calendar,
  Award,
  Target,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface Analytics {
  student: {
    id: string;
    name: string;
    email: string;
    grade?: string;
    studentId?: string;
  };
  classes: any[];
  assignments: {
    total: number;
    completed: number;
    pending: number;
    submitted: number;
    averageScore: number;
    onTimeSubmissionRate: number;
  };
  testScores: {
    recent: any[];
    average: number;
    bySubject: Array<{ subject: string; average: number; count: number }>;
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
  learningProgress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    averageProgress: number;
    totalTimeSpent: number;
  };
}

export default function StudentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session) {
      fetchAnalytics();
    }
  }, [session, status, studentId, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/students/analytics?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        alert("학생 정보를 불러오는데 실패했습니다.");
        router.push("/dashboard/students");
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      alert("오류가 발생했습니다.");
      router.push("/dashboard/students");
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async () => {
    if (!analytics) return;

    try {
      setLoadingAI(true);
      const response = await fetch("/api/students/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: analytics.student.name,
          analytics,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
      } else {
        alert("AI 분석 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to generate AI summary:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const isDirectorOrTeacher =
    session?.user?.role === "DIRECTOR" ||
    session?.user?.role === "TEACHER" ||
    session?.user?.role === "SUPER_ADMIN";

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/students")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          학생 목록으로
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{analytics.student.name}</h1>
            <div className="flex gap-4 text-sm text-gray-600">
              {analytics.student.grade && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {analytics.student.grade}
                </span>
              )}
              {analytics.student.studentId && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {analytics.student.studentId}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {analytics.student.email}
              </span>
            </div>
          </div>
          {isDirectorOrTeacher && (
            <Button
              onClick={generateAISummary}
              disabled={loadingAI}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Brain className="w-4 h-4 mr-2" />
              {loadingAI ? "AI 분석 중..." : "AI 종합 분석"}
            </Button>
          )}
        </div>
      </div>

      {/* AI 분석 결과 */}
      {aiSummary && isDirectorOrTeacher && (
        <Card className="mb-6 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI 종합 분석 리포트
            </CardTitle>
            <CardDescription>
              Gemini AI가 학생의 학습 데이터를 분석한 결과입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
              {aiSummary}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 통계 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 출석률 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              출석률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {analytics.attendance.rate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.attendance.present}/{analytics.attendance.total}일
            </p>
          </CardContent>
        </Card>

        {/* 평균 성적 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="w-4 h-4" />
              평균 성적
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.testScores.average.toFixed(1)}점
            </div>
            <p className="text-xs text-gray-500 mt-1">
              최근 {analytics.testScores.recent.length}회 평균
            </p>
          </CardContent>
        </Card>

        {/* 과제 완료율 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              과제 완료율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {analytics.assignments.total > 0
                ? ((analytics.assignments.completed / analytics.assignments.total) * 100).toFixed(
                    1
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.assignments.completed}/{analytics.assignments.total}개
            </p>
          </CardContent>
        </Card>

        {/* 학습 진도율 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              학습 진도율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {analytics.learningProgress.averageProgress.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.floor(analytics.learningProgress.totalTimeSpent / 60)}시간 학습
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 수강 수업 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              수강 수업
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.classes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">수강 중인 수업이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {analytics.classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      {cls.grade && (
                        <p className="text-sm text-gray-500">{cls.grade}</p>
                      )}
                    </div>
                    <Badge
                      variant={cls.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {cls.status === "ACTIVE" ? "수강중" : cls.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 과목별 성적 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              과목별 성적
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.testScores.bySubject.length === 0 ? (
              <p className="text-gray-500 text-center py-4">시험 성적이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {analytics.testScores.bySubject.map((subject) => (
                  <div key={subject.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{subject.subject}</span>
                      <span className="text-sm text-gray-600">
                        {subject.average.toFixed(1)}점
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${subject.average}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {subject.count}회 응시
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 출석 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              출석 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">출석</p>
                  <p className="text-xl font-bold text-green-600">
                    {analytics.attendance.present}일
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">결석</p>
                  <p className="text-xl font-bold text-red-600">
                    {analytics.attendance.absent}일
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">지각</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {analytics.attendance.late}일
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">조퇴</p>
                  <p className="text-xl font-bold text-blue-600">
                    {analytics.attendance.excused}일
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 학습 진행도 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              학습 진행도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">전체 진도율</span>
                  <span className="text-sm font-bold text-blue-600">
                    {analytics.learningProgress.averageProgress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${analytics.learningProgress.averageProgress}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.learningProgress.completed}
                  </p>
                  <p className="text-xs text-gray-600">완료</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {analytics.learningProgress.inProgress}
                  </p>
                  <p className="text-xs text-gray-600">진행중</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">
                    {analytics.learningProgress.notStarted}
                  </p>
                  <p className="text-xs text-gray-600">미시작</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">
                  총 학습 시간:{" "}
                  <span className="font-bold">
                    {Math.floor(analytics.learningProgress.totalTimeSpent / 60)}시간{" "}
                    {analytics.learningProgress.totalTimeSpent % 60}분
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
