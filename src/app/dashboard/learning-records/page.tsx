"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Award,
  Target,
  Activity,
  Search,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Brain,
  Sparkles,
  MessageCircle,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface LearningRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  grade: string | null;
  totalAssignments: number;
  completedAssignments: number;
  avgScore: number;
  totalTests: number;
  avgTestScore: number;
  attendanceRate: number;
  totalClasses: number;
  aiChatCount: number;
  lastActivity: string | null;
  progress: {
    week: number;
    month: number;
  };
  subjects: {
    name: string;
    score: number;
    count: number;
  }[];
  aiAnalysis?: {
    engagementScore: number;
    responseQuality: number;
    questionDepth: number;
    consistency: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    lastAnalyzedAt: string;
  };
}

export default function LearningRecordsPage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  useEffect(() => {
    fetchLearningRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [searchQuery, selectedGrade, records]);

  const fetchLearningRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/learning/records/all");
      
      if (!response.ok) {
        throw new Error("Failed to fetch learning records");
      }

      const data = await response.json();
      setRecords(data.records || []);
      setFilteredRecords(data.records || []);
    } catch (error) {
      console.error("❌ 학습 기록 조회 오류:", error);
      alert("학습 기록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    // 검색어 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.studentName.toLowerCase().includes(query) ||
          record.studentCode.toLowerCase().includes(query) ||
          record.grade?.toLowerCase().includes(query)
      );
    }

    // 학년 필터링
    if (selectedGrade !== "all") {
      filtered = filtered.filter((record) => record.grade === selectedGrade);
    }

    setFilteredRecords(filtered);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">우수</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500">양호</Badge>;
    return <Badge className="bg-red-500">개선필요</Badge>;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const grades = ["all", "초1", "초2", "초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"];

  // 전체 통계
  const totalStats = {
    totalStudents: records.length,
    avgScore: records.length > 0 
      ? (records.reduce((sum, r) => sum + r.avgScore, 0) / records.length).toFixed(1)
      : "0.0",
    avgAttendance: records.length > 0
      ? (records.reduce((sum, r) => sum + r.attendanceRate, 0) / records.length).toFixed(1)
      : "0.0",
    totalAIChats: records.reduce((sum, r) => sum + r.aiChatCount, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">학습 기록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">학생 학습 기록</h1>
        <p className="text-gray-600">학생들의 학습 진행 상황과 성과를 추적합니다</p>
      </div>

      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 학생 수</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalStudents}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgScore}점</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 출석률</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgAttendance}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI 대화 총횟수</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalAIChats}회</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="학생 이름, 코드, 학년으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {grades.map((grade) => (
                <Button
                  key={grade}
                  variant={selectedGrade === grade ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedGrade(grade)}
                >
                  {grade === "all" ? "전체" : grade}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 학생별 학습 기록 */}
      <div className="grid grid-cols-1 gap-6">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">검색 결과가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {record.studentName}
                      {getPerformanceBadge(record.avgScore)}
                    </CardTitle>
                    <CardDescription>
                      학생코드: {record.studentCode} | 학년: {record.grade || "미지정"}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      마지막 활동: {record.lastActivity ? new Date(record.lastActivity).toLocaleDateString('ko-KR') : "없음"}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 과제 완성도 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      과제 완성도
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>완료율</span>
                        <span className={getPerformanceColor((record.completedAssignments / record.totalAssignments) * 100 || 0)}>
                          {record.totalAssignments > 0 
                            ? ((record.completedAssignments / record.totalAssignments) * 100).toFixed(0)
                            : 0}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.completedAssignments} / {record.totalAssignments} 완료
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>평균 점수</span>
                        <span className={getPerformanceColor(record.avgScore)}>
                          {record.avgScore.toFixed(1)}점
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 시험 성적 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Award className="h-4 w-4" />
                      시험 성적
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>평균 점수</span>
                        <span className={getPerformanceColor(record.avgTestScore)}>
                          {record.avgTestScore.toFixed(1)}점
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        총 {record.totalTests}회 응시
                      </div>
                      {record.subjects && record.subjects.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-medium">과목별 점수</div>
                          {record.subjects.map((subject, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span>{subject.name}</span>
                              <span className={getPerformanceColor(subject.score)}>
                                {subject.score.toFixed(1)}점 ({subject.count}회)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 출석 및 AI 활용 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Activity className="h-4 w-4" />
                      출석 및 학습 활동
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>출석률</span>
                        <span className={getPerformanceColor(record.attendanceRate)}>
                          {record.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        총 {record.totalClasses}회 수업
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>AI 대화</span>
                        <span className="text-blue-600">{record.aiChatCount}회</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="text-xs font-medium">학습 추이</div>
                        <div className="flex items-center justify-between text-xs">
                          <span>주간</span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(record.progress.week)}
                            <span>{Math.abs(record.progress.week).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>월간</span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(record.progress.month)}
                            <span>{Math.abs(record.progress.month).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI 분석 결과 (있는 경우에만 표시) */}
                {record.aiAnalysis && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <h4 className="text-lg font-semibold text-purple-900">AI 학습 분석</h4>
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                    </div>

                    {/* AI 분석 점수 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">참여도</div>
                        <div className="flex items-center gap-2">
                          <div className={`text-2xl font-bold ${getPerformanceColor(record.aiAnalysis.engagementScore)}`}>
                            {record.aiAnalysis.engagementScore.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">/100</div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">응답 품질</div>
                        <div className="flex items-center gap-2">
                          <div className={`text-2xl font-bold ${getPerformanceColor(record.aiAnalysis.responseQuality)}`}>
                            {record.aiAnalysis.responseQuality.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">/100</div>
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">질문 깊이</div>
                        <div className="flex items-center gap-2">
                          <div className={`text-2xl font-bold ${getPerformanceColor(record.aiAnalysis.questionDepth)}`}>
                            {record.aiAnalysis.questionDepth.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">/100</div>
                        </div>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">일관성</div>
                        <div className="flex items-center gap-2">
                          <div className={`text-2xl font-bold ${getPerformanceColor(record.aiAnalysis.consistency)}`}>
                            {record.aiAnalysis.consistency.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">/100</div>
                        </div>
                      </div>
                    </div>

                    {/* 종합 분석 */}
                    <div className="bg-purple-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-900">AI 종합 분석</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {record.aiAnalysis.summary}
                      </p>
                    </div>

                    {/* 강점과 약점 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 강점 */}
                      {record.aiAnalysis.strengths.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-900">강점</span>
                          </div>
                          <ul className="space-y-1">
                            {record.aiAnalysis.strengths.map((strength, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600 mt-1">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 약점/개선점 */}
                      {record.aiAnalysis.weaknesses.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ThumbsDown className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-semibold text-red-900">개선 필요</span>
                          </div>
                          <ul className="space-y-1">
                            {record.aiAnalysis.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* 추천 사항 */}
                    {record.aiAnalysis.recommendations.length > 0 && (
                      <div className="mt-4 bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">추천 사항</span>
                        </div>
                        <ul className="space-y-1">
                          {record.aiAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-blue-600 mt-1">→</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 분석 시간 */}
                    <div className="mt-3 text-xs text-gray-500 text-right">
                      마지막 분석: {new Date(record.aiAnalysis.lastAnalyzedAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
