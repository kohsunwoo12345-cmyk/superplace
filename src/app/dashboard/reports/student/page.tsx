"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingDown, TrendingUp, Clock, User, BarChart } from "lucide-react";

interface Report {
  id: string;
  userId: number;
  studentName: string;
  studentEmail: string;
  averageScore: number;
  createdAt: string;
  summary: {
    summary: string;
    strengths: string;
    weaknesses: string;
    suggestions: string;
  } | null;
  weaknesses: Array<{ weaknessType: string; count: number }>;
}

export default function StudentReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchReports();
    }
  }, [session]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // 학원 ID 가져오기 (실제로는 session에서 가져와야 함)
      const academyId = (session?.user as any)?.academyId || 1;
      
      const response = await fetch(`/api/reports/student?academyId=${academyId}`);
      const data = await response.json();

      if (data.success) {
        setReports(data.reports);
      } else {
        console.error("Failed to fetch reports:", data.error);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            onClick={() => setSelectedReport(null)}
            variant="outline"
            className="mb-4"
          >
            ← 목록으로 돌아가기
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6" />
                학생 분석 보고서
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{selectedReport.studentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(selectedReport.createdAt)}</span>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 평균 점수 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-blue-600" />
                  평균 점수
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {selectedReport.averageScore.toFixed(1)}점
                </p>
              </div>

              {/* 종합 분석 */}
              {selectedReport.summary && (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">📊 종합 분석</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedReport.summary.summary}
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        잘하는 부분
                      </h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedReport.summary.strengths}
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-yellow-600" />
                        보완이 필요한 부분
                      </h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedReport.summary.weaknesses}
                      </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-2">💡 지도 방안</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedReport.summary.suggestions}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* 자주 틀리는 유형 */}
              {selectedReport.weaknesses && selectedReport.weaknesses.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">❌ 자주 틀리는 유형</h3>
                  <div className="space-y-2">
                    {selectedReport.weaknesses.map((w, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white rounded p-3"
                      >
                        <span className="font-medium">{w.weaknessType}</span>
                        <span className="text-red-600 font-bold">{w.count}회</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <FileText className="w-8 h-8" />
              학생 분석 보고서
            </CardTitle>
            <CardDescription>
              학생들의 학습 상태를 분석한 보고서를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">아직 생성된 보고서가 없습니다</p>
                <p className="text-sm mt-2">
                  학생이 숙제를 3번 제출하면 자동으로 분석 보고서가 생성됩니다
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {report.studentName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {formatDate(report.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">평균 점수</span>
                          <span className="font-bold text-lg text-blue-600">
                            {report.averageScore.toFixed(1)}점
                          </span>
                        </div>
                        
                        {report.weaknesses && report.weaknesses.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-gray-500 mb-2">자주 틀리는 유형:</p>
                            <div className="flex flex-wrap gap-1">
                              {report.weaknesses.slice(0, 3).map((w, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                                >
                                  {w.weaknessType}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
