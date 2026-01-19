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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Bot,
  Calendar,
  Award,
  Target,
} from "lucide-react";

interface StudentDetail {
  id: string;
  email: string;
  name: string;
  phone?: string;
  grade?: string;
  studentId?: string;
  parentPhone?: string;
  points: number;
  aiChatEnabled: boolean;
  aiHomeworkEnabled: boolean;
  aiStudyEnabled: boolean;
  approved: boolean;
  createdAt: string;
  lastLoginAt?: string;
  academy?: {
    name: string;
    code: string;
  };
  enrolledClasses: {
    class: {
      id: string;
      name: string;
      grade?: string;
    };
  }[];
  learningProgress: {
    id: string;
    subject: string;
    progress: number;
    totalLessons: number;
    completedLessons: number;
    lastAccessedAt: string;
  }[];
  assignments: {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    status: string;
    score?: number;
    submittedAt?: string;
    material?: {
      title: string;
    };
  }[];
  testScores: {
    id: string;
    subject: string;
    testName: string;
    testDate: string;
    score: number;
    maxScore: number;
    grade?: string;
    rank?: number;
  }[];
  aiUsages: {
    id: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    createdAt: string;
  }[];
  _count: {
    assignments: number;
    testScores: number;
    aiUsages: number;
  };
}

export default function StudentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (
      session?.user?.role !== "DIRECTOR" &&
      session?.user?.role !== "TEACHER" &&
      session?.user?.role !== "SUPER_ADMIN"
    ) {
      router.push("/dashboard");
      return;
    }

    fetchStudentDetail();
  }, [session, status, router, studentId]);

  const fetchStudentDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/academy/students/${studentId}/detail`);
      if (response.ok) {
        const data = await response.json();
        setStudent(data.student);
      }
    } catch (error) {
      console.error("학생 정보 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">대기중</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-blue-500">제출완료</Badge>;
      case "GRADED":
        return <Badge className="bg-green-500">채점완료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading || !student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 통계 계산
  const stats = {
    totalAssignments: student.assignments.length,
    submittedAssignments: student.assignments.filter((a) => a.status !== "PENDING").length,
    completedAssignments: student.assignments.filter((a) => a.status === "GRADED").length,
    avgScore:
      student.assignments.filter((a) => a.score !== null && a.score !== undefined).length > 0
        ? Math.round(
            student.assignments
              .filter((a) => a.score !== null && a.score !== undefined)
              .reduce((sum, a) => sum + (a.score || 0), 0) /
              student.assignments.filter((a) => a.score !== null && a.score !== undefined).length
          )
        : 0,
    totalTests: student.testScores.length,
    avgTestScore:
      student.testScores.length > 0
        ? Math.round(
            student.testScores.reduce((sum, t) => sum + (t.score / t.maxScore) * 100, 0) /
              student.testScores.length
          )
        : 0,
    totalAIUsage: student._count.aiUsages,
    totalTokens: student.aiUsages.reduce((sum, u) => sum + u.totalTokens, 0),
  };

  const avgProgress =
    student.learningProgress.length > 0
      ? Math.round(
          student.learningProgress.reduce((sum, p) => sum + p.progress, 0) /
            student.learningProgress.length
        )
      : 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{student.name}</h1>
            <p className="text-gray-600">학생 상세 정보</p>
          </div>
        </div>
      </div>

      {/* 기본 정보 카드 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">이름</p>
              <p className="font-semibold">{student.name}</p>
            </div>
            {student.studentId && (
              <div>
                <p className="text-sm text-gray-600 mb-1">학번</p>
                <p className="font-semibold font-mono">{student.studentId}</p>
              </div>
            )}
            {student.grade && (
              <div>
                <p className="text-sm text-gray-600 mb-1">학년</p>
                <p className="font-semibold">{student.grade}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">이메일</p>
              <p className="font-semibold">{student.email}</p>
            </div>
            {student.phone && (
              <div>
                <p className="text-sm text-gray-600 mb-1">전화번호</p>
                <p className="font-semibold">{student.phone}</p>
              </div>
            )}
            {student.parentPhone && (
              <div>
                <p className="text-sm text-gray-600 mb-1">학부모 연락처</p>
                <p className="font-semibold">{student.parentPhone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">포인트</p>
              <p className="font-semibold text-yellow-600">{student.points}P</p>
            </div>
            {student.academy && (
              <div>
                <p className="text-sm text-gray-600 mb-1">소속 학원</p>
                <p className="font-semibold">{student.academy.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">가입일</p>
              <p className="font-semibold">{new Date(student.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* 수강 중인 수업 */}
          {student.enrolledClasses.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-2">수강 중인 수업</p>
              <div className="flex flex-wrap gap-2">
                {student.enrolledClasses.map((ec) => (
                  <Badge key={ec.class.id} variant="outline">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {ec.class.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* AI 봇 권한 */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-2">AI 봇 권한</p>
            <div className="flex flex-wrap gap-2">
              {student.aiChatEnabled && (
                <Badge className="bg-blue-500">
                  <Bot className="w-3 h-3 mr-1" />
                  AI 채팅
                </Badge>
              )}
              {student.aiHomeworkEnabled && (
                <Badge className="bg-indigo-500">
                  <Bot className="w-3 h-3 mr-1" />
                  AI 숙제
                </Badge>
              )}
              {student.aiStudyEnabled && (
                <Badge className="bg-purple-500">
                  <Bot className="w-3 h-3 mr-1" />
                  AI 학습
                </Badge>
              )}
              {!student.aiChatEnabled && !student.aiHomeworkEnabled && !student.aiStudyEnabled && (
                <span className="text-sm text-gray-500">AI 봇 권한 없음</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">평균 진도율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">{avgProgress}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">과제 제출률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">
                {stats.totalAssignments > 0
                  ? Math.round((stats.submittedAssignments / stats.totalAssignments) * 100)
                  : 0}
                %
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.submittedAssignments} / {stats.totalAssignments}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">평균 시험 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold">{stats.avgTestScore}점</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.totalTests}회 시험</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">AI 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span className="text-2xl font-bold">{stats.totalAIUsage}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.totalTokens.toLocaleString()} 토큰</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">
            <Target className="w-4 h-4 mr-2" />
            학습 진도
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <ClipboardList className="w-4 h-4 mr-2" />
            과제 ({stats.totalAssignments})
          </TabsTrigger>
          <TabsTrigger value="scores">
            <TrendingUp className="w-4 h-4 mr-2" />
            성적 ({stats.totalTests})
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Bot className="w-4 h-4 mr-2" />
            AI 사용 내역
          </TabsTrigger>
        </TabsList>

        {/* 학습 진도 탭 */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>과목별 학습 진도</CardTitle>
              <CardDescription>각 과목별 진행 상황을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              {student.learningProgress.length > 0 ? (
                <div className="space-y-4">
                  {student.learningProgress.map((progress) => (
                    <div key={progress.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{progress.subject}</p>
                          <p className="text-sm text-gray-600">
                            {progress.completedLessons} / {progress.totalLessons} 강의 완료
                          </p>
                        </div>
                        <span className="text-lg font-bold">{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${getProgressColor(
                            progress.progress
                          )}`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        마지막 접속: {new Date(progress.lastAccessedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">학습 진도 데이터가 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 과제 탭 */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>과제 제출 내역</CardTitle>
              <CardDescription>
                과제 제출 현황 및 점수를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {student.assignments.length > 0 ? (
                <div className="space-y-4">
                  {student.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{assignment.title}</h4>
                            {getStatusBadge(assignment.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {assignment.subject}
                            {assignment.material && ` - ${assignment.material.title}`}
                          </p>
                        </div>
                        {assignment.score !== null && assignment.score !== undefined && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {assignment.score}점
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            마감: {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        {assignment.submittedAt && (
                          <div className="flex items-center gap-1">
                            <ClipboardList className="w-4 h-4" />
                            <span>
                              제출: {new Date(assignment.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  과제 내역이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 성적 탭 */}
        <TabsContent value="scores">
          <Card>
            <CardHeader>
              <CardTitle>시험 성적 내역</CardTitle>
              <CardDescription>
                과목별 시험 점수 및 석차를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {student.testScores.length > 0 ? (
                <div className="space-y-4">
                  {student.testScores.map((test) => (
                    <div
                      key={test.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{test.testName}</h4>
                            <Badge variant="outline">{test.subject}</Badge>
                            {test.grade && (
                              <Badge className="bg-purple-500">{test.grade}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(test.testDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {test.score} / {test.maxScore}
                          </p>
                          <p className="text-sm text-gray-600">
                            {Math.round((test.score / test.maxScore) * 100)}%
                          </p>
                        </div>
                      </div>
                      {test.rank && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Award className="w-4 h-4 text-yellow-600" />
                            <span className="font-semibold">
                              {test.rank}등
                            </span>
                            <span className="text-gray-600">
                              / 전체 응시자
                            </span>
                          </div>
                        </div>
                      )}
                      {/* 성적 그래프 바 */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{
                              width: `${(test.score / test.maxScore) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  시험 성적 데이터가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI 사용 내역 탭 */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI 사용 내역</CardTitle>
              <CardDescription>
                AI 봇 사용 내역 및 토큰 사용량을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {student.aiUsages.length > 0 ? (
                <div className="space-y-4">
                  {/* 토큰 사용량 요약 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">총 사용 횟수</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.totalAIUsage}회
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">총 토큰 사용량</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.totalTokens.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">평균 토큰/회</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {stats.totalAIUsage > 0
                          ? Math.round(stats.totalTokens / stats.totalAIUsage).toLocaleString()
                          : 0}
                      </p>
                    </div>
                  </div>

                  {/* AI 사용 내역 목록 */}
                  <div className="space-y-3">
                    {student.aiUsages.slice(0, 10).map((usage) => (
                      <div
                        key={usage.id}
                        className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium">{usage.model}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {new Date(usage.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">입력 토큰</p>
                            <p className="font-semibold">
                              {usage.promptTokens.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">출력 토큰</p>
                            <p className="font-semibold">
                              {usage.completionTokens.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">총 토큰</p>
                            <p className="font-semibold text-indigo-600">
                              {usage.totalTokens.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {student.aiUsages.length > 10 && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      최근 10개 항목만 표시됩니다 (전체: {student.aiUsages.length}개)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  AI 사용 내역이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
