
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  User,
  Mail,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  MessageSquare,
  AlertTriangle,
  Loader2,
  BookOpen,
} from "lucide-react";

interface LandingPageData {
  id: string;
  title: string;
  studentName: string;
  studentEmail: string;
  academyName?: string;
  createdAt: string;
  dataOptions: {
    showBasicInfo: boolean;
    showAttendance: boolean;
    showAIChats: boolean;
    showConcepts: boolean;
    showHomework: boolean;
  };
  studentData: {
    basicInfo?: {
      name: string;
      email: string;
      academy?: string;
      joinedAt?: string;
    };
    attendance?: {
      total: number;
      present: number;
      late: number;
      absent: number;
      attendanceRate: number;
      recentRecords: Array<{
        date: string;
        status: string;
      }>;
    };
    aiChats?: {
      totalChats: number;
      recentActivity: string;
      analysis?: {
        summary: string;
        strengths: string[];
        weaknesses: string[];
      };
    };
    concepts?: {
      summary: string;
      weakConcepts: Array<{
        concept: string;
        description: string;
        severity: string;
      }>;
      recommendations: Array<{
        concept: string;
        action: string;
      }>;
    };
    homework?: {
      totalAssignments: number;
      completed: number;
      averageScore: number;
      recentSubmissions: Array<{
        title: string;
        submittedAt: string;
        score?: number;
      }>;
    };
  };
}

export default function PublicLandingPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchLandingPageData();
    }
  }, [id]);

  const fetchLandingPageData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/report/${id}`);

      if (!response.ok) {
        throw new Error("랜딩페이지를 찾을 수 없습니다.");
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500">출석</Badge>;
      case "late":
        return <Badge className="bg-yellow-500">지각</Badge>;
      case "absent":
        return <Badge className="bg-red-500">결석</Badge>;
      case "excused":
        return <Badge className="bg-blue-500">병결</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 border-red-300 text-red-800";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "low":
        return "bg-blue-100 border-blue-300 text-blue-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">학습 리포트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">페이지를 찾을 수 없습니다</h2>
              <p className="text-gray-600">{error || "존재하지 않는 페이지입니다."}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-full mb-4">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">{data.title}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            학생의 학습 현황을 한눈에 확인하세요
          </p>
          <p className="text-sm text-gray-500">
            생성일: {new Date(data.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>

        {/* 기본 정보 */}
        {data.dataOptions.showBasicInfo && data.studentData.basicInfo && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <User className="w-6 h-6" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">학생 이름</p>
                    <p className="text-lg font-semibold">{data.studentData.basicInfo.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">이메일</p>
                    <p className="text-lg font-semibold">{data.studentData.basicInfo.email}</p>
                  </div>
                </div>

                {data.studentData.basicInfo.academy && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">소속 학원</p>
                      <p className="text-lg font-semibold">{data.studentData.basicInfo.academy}</p>
                    </div>
                  </div>
                )}

                {data.studentData.basicInfo.joinedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">등록일</p>
                      <p className="text-lg font-semibold">
                        {new Date(data.studentData.basicInfo.joinedAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 출결 현황 */}
        {data.dataOptions.showAttendance && data.studentData.attendance && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-6 h-6" />
                출결 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">총 출결</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.studentData.attendance.total}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">출석</p>
                  <p className="text-3xl font-bold text-green-600">
                    {data.studentData.attendance.present}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">지각</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {data.studentData.attendance.late}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">결석</p>
                  <p className="text-3xl font-bold text-red-600">
                    {data.studentData.attendance.absent}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">출석률</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {data.studentData.attendance.attendanceRate}%
                  </p>
                </div>
              </div>

              {data.studentData.attendance.recentRecords && data.studentData.attendance.recentRecords.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">최근 출결 기록</h4>
                  <div className="space-y-2">
                    {data.studentData.attendance.recentRecords.slice(0, 5).map((record, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-700">
                          {new Date(record.date).toLocaleDateString("ko-KR")}
                        </span>
                        {getStatusBadge(record.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI 대화 활동 */}
        {data.dataOptions.showAIChats && data.studentData.aiChats && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                AI 학습 활동
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">총 AI 대화</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {data.studentData.aiChats.totalChats}회
                  </span>
                </div>

                {data.studentData.aiChats.analysis && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">AI 분석 요약</h4>
                      <p className="text-gray-700 text-sm">
                        {data.studentData.aiChats.analysis.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          강점
                        </h4>
                        <ul className="space-y-1">
                          {data.studentData.aiChats.analysis.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-green-600">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-orange-600" />
                          개선 필요
                        </h4>
                        <ul className="space-y-1">
                          {data.studentData.aiChats.analysis.weaknesses.map((weakness, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-orange-600">→</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 부족한 개념 */}
        {data.dataOptions.showConcepts && data.studentData.concepts && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                부족한 개념 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {data.studentData.concepts.summary && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">종합 분석</h4>
                    <p className="text-gray-700 text-sm">{data.studentData.concepts.summary}</p>
                  </div>
                )}

                {data.studentData.concepts.weakConcepts && data.studentData.concepts.weakConcepts.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">집중 학습이 필요한 개념</h4>
                    <div className="space-y-3">
                      {data.studentData.concepts.weakConcepts.map((concept, idx) => (
                        <div
                          key={idx}
                          className={`p-4 border-2 rounded-lg ${getSeverityColor(concept.severity)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold">{concept.concept}</h5>
                            <Badge
                              variant={concept.severity === "high" ? "destructive" : "outline"}
                            >
                              {concept.severity === "high"
                                ? "높음"
                                : concept.severity === "medium"
                                ? "중간"
                                : "낮음"}
                            </Badge>
                          </div>
                          <p className="text-sm">{concept.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.studentData.concepts.recommendations && data.studentData.concepts.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">학습 개선 제안</h4>
                    <div className="space-y-2">
                      {data.studentData.concepts.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{rec.concept}</p>
                            <p className="text-sm text-gray-700">{rec.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 숙제 현황 */}
        {data.dataOptions.showHomework && data.studentData.homework && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                숙제 제출 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">총 과제</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.studentData.homework.totalAssignments}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">완료</p>
                  <p className="text-3xl font-bold text-green-600">
                    {data.studentData.homework.completed}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">평균 점수</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {data.studentData.homework.averageScore}점
                  </p>
                </div>
              </div>

              {data.studentData.homework.recentSubmissions &&
                data.studentData.homework.recentSubmissions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">최근 제출 과제</h4>
                    <div className="space-y-2">
                      {data.studentData.homework.recentSubmissions.map((submission, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{submission.title}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(submission.submittedAt).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                          {submission.score !== undefined && (
                            <Badge className="bg-teal-600">{submission.score}점</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* 푸터 */}
        <div className="text-center py-8 text-gray-500 text-sm border-t">
          <p>본 리포트는 학생의 학습 현황을 학부모님께 공유하기 위해 제작되었습니다.</p>
          <p className="mt-2">© 2024 SUPER PLACE. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
