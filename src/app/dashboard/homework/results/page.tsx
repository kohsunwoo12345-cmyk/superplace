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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  Star,
  AlertTriangle,
  BookOpen,
  Brain,
} from "lucide-react";

interface HomeworkSubmission {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  score: number;
  feedback: string;
  subject: string;
  completion: string;
  effort: string;
  submittedAt: string;
  gradedAt: string;
  // 새로운 상세 필드
  weaknesses?: string[];
  conceptsNeeded?: string[];
  mistakes?: string[];
  suggestions?: string[];
  studyDirection?: string;
  detailedAnalysis?: string;
}

interface SubmissionStats {
  totalSubmissions: number;
  averageScore: number;
  todaySubmissions: number;
  pendingReview: number;
}

export default function TeacherHomeworkResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<HomeworkSubmission | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      fetchHomeworkResults(user.id, user.academyId);
    } else {
      router.push("/login");
    }
  }, []);

  const fetchHomeworkResults = async (teacherId: number, academyId?: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (academyId) {
        params.append("academyId", academyId.toString());
      }

      const response = await fetch(
        `/api/homework/results/teacher?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.submissions || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Failed to fetch homework results:", error);
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 70) return "text-blue-600 bg-blue-100";
    if (score >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return "🎉";
    if (score >= 70) return "👍";
    if (score >= 50) return "💪";
    return "🔥";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← 돌아가기
        </Button>
        <h1 className="text-3xl font-bold mb-2">📋 숙제 검사 결과</h1>
        <p className="text-gray-600">
          학생들이 제출한 숙제의 AI 채점 결과를 확인하세요
        </p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                전체 제출
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-blue-600">
                  {stats.totalSubmissions}
                </span>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                평균 점수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-green-600">
                  {stats.averageScore.toFixed(1)}점
                </span>
                <Award className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                오늘 제출
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-orange-600">
                  {stats.todaySubmissions}
                </span>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                검토 대기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-purple-600">
                  {stats.pendingReview}
                </span>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">전체 ({submissions.length})</TabsTrigger>
          <TabsTrigger value="high">
            높은 점수 ({submissions.filter((s) => s.score >= 80).length})
          </TabsTrigger>
          <TabsTrigger value="low">
            낮은 점수 ({submissions.filter((s) => s.score < 60).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {submissions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  아직 제출된 숙제가 없습니다
                </h3>
                <p className="text-gray-600">
                  학생들이 숙제를 제출하면 여기에 표시됩니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {submissions.map((submission) => (
                <Card
                  key={submission.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">
                            {submission.userName}
                          </CardTitle>
                          <Badge
                            className={`text-lg font-bold ${getScoreColor(
                              submission.score
                            )}`}
                          >
                            {getScoreEmoji(submission.score)} {submission.score}점
                          </Badge>
                        </div>
                        <CardDescription>
                          {submission.userEmail}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {submission.subject}
                        </Badge>
                        <p className="text-sm text-gray-600">
                          {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-3">
                      <Badge variant="outline">
                        완성도: {submission.completion}
                      </Badge>
                      <Badge variant="outline">
                        노력도: {submission.effort}
                      </Badge>
                    </div>
                    <p className="text-gray-700 line-clamp-2">
                      {submission.feedback}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubmission(submission);
                      }}
                    >
                      상세 보기
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {submissions
              .filter((s) => s.score >= 80)
              .map((submission) => (
                <Card
                  key={submission.id}
                  className="border-2 border-green-300 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">
                            {submission.userName}
                          </CardTitle>
                          <Badge className="text-lg font-bold bg-green-600">
                            🎉 {submission.score}점
                          </Badge>
                        </div>
                        <CardDescription>
                          {submission.userEmail}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{submission.subject}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-2">
                      {submission.feedback}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="low" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {submissions
              .filter((s) => s.score < 60)
              .map((submission) => (
                <Card
                  key={submission.id}
                  className="border-2 border-orange-300 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">
                            {submission.userName}
                          </CardTitle>
                          <Badge className="text-lg font-bold bg-orange-600">
                            💪 {submission.score}점
                          </Badge>
                        </div>
                        <CardDescription>
                          {submission.userEmail}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{submission.subject}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-2">
                      {submission.feedback}
                    </p>
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800 font-medium">
                        💡 추가 지도가 필요할 수 있습니다
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 상세 모달 */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedSubmission.userName}님의 숙제
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSubmission(null)}
                >
                  ✕ 닫기
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={`text-2xl font-bold ${getScoreColor(
                    selectedSubmission.score
                  )} px-4 py-2`}
                >
                  {getScoreEmoji(selectedSubmission.score)}{" "}
                  {selectedSubmission.score}점
                </Badge>
                <Badge variant="outline" className="text-lg py-2 px-3">
                  {selectedSubmission.subject}
                </Badge>
                <Badge variant="outline" className="text-lg py-2 px-3">
                  완성도: {selectedSubmission.completion}
                </Badge>
                <Badge variant="outline" className="text-lg py-2 px-3">
                  노력도: {selectedSubmission.effort}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {/* 종합 피드백 */}
              <Card className="border-2 border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Award className="w-5 h-5" />
                    종합 평가
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission.feedback}
                  </p>
                </CardContent>
              </Card>

              {/* 상세 분석 */}
              {selectedSubmission.detailedAnalysis && (
                <Card className="border-2 border-indigo-200">
                  <CardHeader className="bg-indigo-50">
                    <CardTitle className="flex items-center gap-2 text-indigo-700">
                      <Brain className="w-5 h-5" />
                      상세 분석
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedSubmission.detailedAnalysis}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {/* 부족한 점 */}
                {selectedSubmission.weaknesses &&
                  selectedSubmission.weaknesses.length > 0 && (
                    <Card className="border-2 border-orange-200 bg-orange-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                          <AlertTriangle className="w-5 h-5" />
                          부족한 점
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedSubmission.weaknesses.map(
                            (weakness, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-orange-900"
                              >
                                <span className="font-bold mt-0.5">!</span>
                                <span>{weakness}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                {/* 필요한 개념 */}
                {selectedSubmission.conceptsNeeded &&
                  selectedSubmission.conceptsNeeded.length > 0 && (
                    <Card className="border-2 border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                          <BookOpen className="w-5 h-5" />
                          필요한 개념
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedSubmission.conceptsNeeded.map(
                            (concept, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-blue-900"
                              >
                                <span className="font-bold mt-0.5">
                                  {index + 1}.
                                </span>
                                <span>{concept}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
              </div>

              {/* 발견된 실수 */}
              {selectedSubmission.mistakes &&
                selectedSubmission.mistakes.length > 0 && (
                  <Card className="border-2 border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        발견된 실수
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedSubmission.mistakes.map((mistake, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-red-900 p-2 bg-white rounded"
                          >
                            <span className="font-bold mt-0.5 text-red-600">
                              ✗
                            </span>
                            <span>{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

              {/* 개선 방법 */}
              {selectedSubmission.suggestions &&
                selectedSubmission.suggestions.length > 0 && (
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <TrendingUp className="w-5 h-5" />
                        개선 방법
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedSubmission.suggestions.map(
                          (suggestion, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-green-900 p-2 bg-white rounded"
                            >
                              <span className="font-bold mt-0.5 text-green-600">
                                ➜
                              </span>
                              <span>{suggestion}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}

              {/* 학습 방향 */}
              {selectedSubmission.studyDirection && (
                <Card className="border-2 border-teal-200 bg-teal-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-teal-700">
                      <Star className="w-5 h-5" />
                      앞으로 학습 방향
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-teal-900 leading-relaxed whitespace-pre-wrap p-3 bg-white rounded">
                      {selectedSubmission.studyDirection}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 제출 정보 */}
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      📅 제출 시간:{" "}
                      {formatDate(selectedSubmission.submittedAt)}
                    </p>
                    <p>
                      ✅ 채점 시간:{" "}
                      {formatDate(selectedSubmission.gradedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
