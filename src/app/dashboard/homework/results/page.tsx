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
  Image as ImageIcon,
  Download,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface HomeworkSubmission {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  academyId?: number;
  code?: string;
  imageUrl?: string;
  imageCount?: number;
  score: number;
  feedback: string;
  subject: string;
  completion: string;
  effort: string | number;
  pageCount?: number;
  submittedAt: string;
  gradedAt: string;
  totalQuestions?: number;
  correctAnswers?: number;
  problemAnalysis?: any[];
  weaknessTypes?: string[];
  // 새로운 상세 필드
  weaknesses?: string[];
  conceptsNeeded?: string[];
  mistakes?: string[];
  suggestionsArray?: string[];
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
  const [submissionImages, setSubmissionImages] = useState<string[]>([]);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  
  // 검색 기능 추가
  const [searchTerm, setSearchTerm] = useState("");

  // 필터링된 제출 목록
  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      submission.userName?.toLowerCase().includes(search) ||
      submission.userEmail?.toLowerCase().includes(search) ||
      submission.subject?.toLowerCase().includes(search)
    );
  });

  // AI 채점 함수 추가
  const handleGradeSubmission = async (submissionId: string) => {
    try {
      setGradingSubmissionId(submissionId);
      console.log('🤖 AI 채점 시작:', submissionId);
      
      const response = await fetch("/api/homework/process-grading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '채점 실패');
      }
      
      const data = await response.json();
      console.log('✅ 채점 완료:', data);
      
      // 결과 페이지 새로고침
      if (currentUser) {
        await fetchHomeworkResults(currentUser, selectedDate, startDate, endDate);
      }
      
      alert(`✅ 채점 완료!\n점수: ${data.grading?.score || '확인 중'}점`);
    } catch (error: any) {
      console.error('❌ 채점 오류:', error);
      alert('채점 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setGradingSubmissionId(null);
    }
  };

  // 제출 상세 보기 + 이미지 로드
  const handleViewSubmission = async (submission: HomeworkSubmission) => {
    setSelectedSubmission(submission);
    setSubmissionImages([]); // 초기화
    
    try {
      // 이미지 API 호출
      const response = await fetch(`/api/homework/images?submissionId=${submission.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.images) {
          setSubmissionImages(data.images);
          console.log(`✅ 이미지 ${data.count}장 로드 완료`);
        }
      }
    } catch (error) {
      console.error('이미지 로드 실패:', error);
    }
  };
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single');

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      // 기본값: 전체 기간 조회 (최근 6개월)
      const now = new Date();
      const kstOffset = 9 * 60; // 한국 시간 UTC+9
      const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
      const today = kstDate.toISOString().split('T')[0];
      
      // 6개월 전부터 오늘까지
      const sixMonthsAgo = new Date(kstDate);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const start = sixMonthsAgo.toISOString().split('T')[0];
      
      console.log('📅 기본 조회 기간:', start, '~', today);
      setStartDate(start);
      setEndDate(today);
      setDateMode('range');
      fetchHomeworkResults(user, undefined, start, today);
    } else {
      router.push("/login");
    }
  }, []);

  const fetchHomeworkResults = async (user: any, date?: string, start?: string, end?: string) => {
    try {
      setLoading(true);
      console.log('📊 숙제 결과 조회:', { 
        date, 
        start, 
        end, 
        role: user.role,
        email: user.email,
        academyId: user.academyId || user.academy_id 
      });
      
      const params = new URLSearchParams();
      
      // 날짜 파라미터
      if (start && end) {
        params.append('startDate', start);
        params.append('endDate', end);
      } else if (date) {
        params.append('date', date);
      }
      
      // 권한 파라미터
      params.append('role', user.role || 'ADMIN');
      
      // 이메일 파라미터 (관리자 판별용)
      if (user.email) {
        params.append('email', user.email);
      }
      
      // academyId 파라미터 (관리자가 아닌 경우)
      const academyId = user.academyId || user.academy_id || user.AcademyId;
      if (academyId && user.email !== 'admin@superplace.co.kr') {
        params.append('academyId', academyId.toString());
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/homework/results?${params.toString()}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      
      console.log('✅ API 응답 상태:', response.status);
      const data = await response.json();
      console.log('📦 받은 데이터:', data);
      console.log('📊 데이터 구조 확인:', {
        success: data.success,
        hasResults: !!data.results,
        resultsType: typeof data.results,
        resultsLength: data.results?.length,
        firstResult: data.results?.[0]
      });

      if (data.success) {
        // API는 results를 반환하므로 results를 submissions로 설정
        // grading 정보를 최상위 레벨로 끌어올림
        const formattedResults = (data.results || []).map((result: any) => {
          // JSON 문자열을 안전하게 파싱하는 헬퍼 함수
          const safeJsonParse = (value: any, defaultValue: any = null) => {
            if (!value) return defaultValue;
            if (typeof value === 'string') {
              try {
                return JSON.parse(value);
              } catch {
                return defaultValue;
              }
            }
            return value;
          };

          // feedback 우선순위: feedback > strengths + improvements 조합
          let feedback = result.grading?.feedback || '';
          if (!feedback && (result.grading?.strengths || result.grading?.improvements)) {
            const parts = [];
            if (result.grading?.strengths) parts.push(`✅ 잘한 점:\n${result.grading.strengths}`);
            if (result.grading?.improvements) parts.push(`📝 개선할 점:\n${result.grading.improvements}`);
            feedback = parts.join('\n\n');
          }

          return {
            ...result,
            // API 응답 구조: { submission: {...}, grading: {...} }
            id: result.submission?.id || result.submissionId,
            userId: result.submission?.userId,
            userName: result.submission?.userName || '이름 없음',
            userEmail: result.submission?.userEmail || '',
            code: result.submission?.code,
            imageUrl: result.submission?.imageUrl,
            imageCount: result.submission?.imageCount || 0,
            submittedAt: result.submission?.submittedAt,
            status: result.submission?.status || 'pending',
            // grading 정보를 최상위로 복사
            // score 정규화: 0~1 범위이면 100을 곱해 백분율로 변환, 소수점 반올림
            score: (function(s: number | undefined | null) {
              if (!s) return 0;
              if (s > 0 && s <= 1) return Math.round(s * 100);
              return Math.round(s);
            })(result.grading?.score),
            feedback: feedback,
            subject: result.grading?.subject || '미지정',
            completion: result.grading?.completion || 'pending',
            effort: result.grading?.effort || 'submitted',
            gradedAt: result.grading?.gradedAt || null,
            totalQuestions: result.grading?.totalQuestions || 0,
            correctAnswers: result.grading?.correctAnswers || 0,
            strengths: result.grading?.strengths || '',
            improvements: result.grading?.improvements || '',
            weaknessTypes: safeJsonParse(result.grading?.weaknessTypes, []),
            detailedAnalysis: result.grading?.detailedAnalysis || '',
            studyDirection: result.grading?.studyDirection || '',
            problemAnalysis: safeJsonParse(result.grading?.problemAnalysis, []),
            conceptsNeeded: safeJsonParse(result.grading?.conceptsNeeded, []),
            mistakes: safeJsonParse(result.grading?.mistakes, []),
            suggestionsArray: safeJsonParse(result.grading?.suggestionsArray || result.grading?.suggestions, []),
            // 원본 submission과 grading도 유지
            submission: result.submission,
            grading: result.grading
          };
        });
        
        console.log('✅ 포맷팅된 결과:', formattedResults.length, '건');
        console.log('📋 첫 번째 아이템:', formattedResults[0]);
        
        setSubmissions(formattedResults);
        setStats(data.statistics ? {
          totalSubmissions: data.statistics.total || 0,
          averageScore: data.statistics.averageScore || 0,
          todaySubmissions: data.statistics.todaySubmissions || 0,
          pendingReview: data.statistics.pending || 0,
        } : null);
      } else {
        console.error('❌ API 오류:', data.error);
      }
    } catch (error) {
      console.error('❌ 숙제 결과 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setDateMode('single');
    if (currentUser) {
      fetchHomeworkResults(currentUser, date);
    }
  };

  const handleRangeSearch = () => {
    if (startDate && endDate && currentUser) {
      setDateMode('range');
      fetchHomeworkResults(currentUser, undefined, startDate, endDate);
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

      {/* 날짜 선택 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            조회 기간 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={dateMode} onValueChange={(v) => setDateMode(v as 'single' | 'range')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="single">특정 날짜</TabsTrigger>
              <TabsTrigger value="range">기간 선택</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => handleDateChange(selectedDate)}>
                  조회
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="range" className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="시작 날짜"
                  className="flex-1"
                />
                <span className="text-gray-500">~</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="종료 날짜"
                  className="flex-1"
                />
                <Button onClick={handleRangeSearch}>
                  조회
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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

      {/* 학생 검색 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            학생 검색
          </CardTitle>
          <CardDescription>
            학생 이름, 이메일, 과목으로 검색하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="학생 이름, 이메일 또는 과목 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
              >
                초기화
              </Button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              검색 결과: {filteredSubmissions.length}건
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">전체 ({filteredSubmissions.length})</TabsTrigger>
          <TabsTrigger value="high">
            높은 점수 ({filteredSubmissions.filter((s) => s.score >= 80).length})
          </TabsTrigger>
          <TabsTrigger value="low">
            낮은 점수 ({filteredSubmissions.filter((s) => s.score < 60).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? '검색 결과가 없습니다' : '아직 제출된 숙제가 없습니다'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? '다른 검색어를 입력하거나 검색을 초기화해보세요.' 
                    : '학생들이 숙제를 제출하면 여기에 표시됩니다.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSubmissions.map((submission) => (
                <Card
                  key={submission.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewSubmission(submission)}
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
                          {submission.subject || '미지정'}
                        </Badge>
                        {submission.score > 0 && (
                          <Badge className="bg-green-100 text-green-800 mb-2 ml-2">
                            ✅ 숙제 검사 완료
                          </Badge>
                        )}
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
                      {submission.imageUrl && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" />
                          사진 {submission.imageUrl.includes('image') ? submission.imageUrl.match(/\d+/)?.[0] || '1' : '1'}장
                        </Badge>
                      )}
                    </div>
                    {submission.feedback && (
                      <p className="text-gray-700 line-clamp-2 mb-3">
                        {submission.feedback}
                      </p>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      {/* 상세 보기 버튼만 표시 - AI 채점은 백그라운드 자동 처리 */}
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSubmission(submission);
                        }}
                      >
                        상세 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredSubmissions
              .filter((s) => s.score >= 80)
              .map((submission) => (
                <Card
                  key={submission.id}
                  className="border-2 border-green-300 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewSubmission(submission)}
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
                      <Badge variant="outline">{submission.subject || '미지정'}</Badge>
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
            {filteredSubmissions
              .filter((s) => s.score < 60)
              .map((submission) => (
                <Card
                  key={submission.id}
                  className="border-2 border-orange-300 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewSubmission(submission)}
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
                      <Badge variant="outline">{submission.subject || '미지정'}</Badge>
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
                {selectedSubmission.score > 0 && (
                  <Badge className="bg-green-100 text-green-800 text-lg py-2 px-3">
                    ✅ 숙제 검사 완료
                  </Badge>
                )}
                <Badge variant="outline" className="text-lg py-2 px-3">
                  {selectedSubmission.subject || '미지정'}
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
              {/* 제출된 이미지 표시 */}
              {submissionImages.length > 0 && (
                <Card className="border-2 border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <ImageIcon className="w-5 h-5" />
                      제출된 숙제 사진 ({submissionImages.length}장)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {submissionImages.map((imageUrl: string, index: number) => (
                        <div key={index} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`숙제 사진 ${index + 1}`}
                            className="w-full h-auto object-contain bg-gray-50"
                          />
                          <div className="p-2 bg-gray-100 text-center">
                            <p className="text-sm text-gray-600">사진 {index + 1}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 채점 통계 */}
              {selectedSubmission.totalQuestions && selectedSubmission.totalQuestions > 0 && (
                <Card className="border-2 border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      채점 통계
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">전체 문제 수</p>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedSubmission.totalQuestions}문제
                        </p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">정답 수</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedSubmission.correctAnswers}개
                        </p>
                      </div>
                    </div>
                    {selectedSubmission.correctAnswers && selectedSubmission.totalQuestions && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          정답률: {((selectedSubmission.correctAnswers / selectedSubmission.totalQuestions) * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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
                    {selectedSubmission.feedback || selectedSubmission.strengths || selectedSubmission.improvements || "피드백이 없습니다."}
                  </p>
                </CardContent>
              </Card>

              {/* 잘한 점 */}
              {selectedSubmission.strengths && (
                <Card className="border-2 border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      ✅ 잘한 점
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedSubmission.strengths}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 개선할 점 */}
              {selectedSubmission.improvements && (
                <Card className="border-2 border-orange-200">
                  <CardHeader className="bg-orange-50">
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <TrendingUp className="w-5 h-5" />
                      📝 개선할 점
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedSubmission.improvements}
                    </p>
                  </CardContent>
                </Card>
              )}

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

              {/* 문제별 분석 */}
              {selectedSubmission.problemAnalysis && Array.isArray(selectedSubmission.problemAnalysis) && selectedSubmission.problemAnalysis.length > 0 && (
                <Card className="border-2 border-purple-200">
                  <CardHeader className="bg-purple-50">
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <FileText className="w-5 h-5" />
                      문제별 분석 ({selectedSubmission.problemAnalysis.length}개)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {selectedSubmission.problemAnalysis.map((problem: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border-2 text-center ${
                            problem.isCorrect
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <Badge className={`${problem.isCorrect ? 'bg-green-600' : 'bg-red-600'} text-sm`}>
                            {problem.questionNumber ? `문제 ${problem.questionNumber}` : `문제 ${index + 1}`}
                          </Badge>
                          <div className={`mt-2 font-bold text-lg ${
                            problem.isCorrect ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {problem.isCorrect ? '✓ 정답' : '✗ 오답'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {/* 약점 유형 */}
                {selectedSubmission.weaknessTypes && Array.isArray(selectedSubmission.weaknessTypes) &&
                  selectedSubmission.weaknessTypes.length > 0 && (
                    <Card className="border-2 border-orange-200 bg-orange-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                          <AlertTriangle className="w-5 h-5" />
                          약점 유형
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedSubmission.weaknessTypes.map(
                            (weakness, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-orange-900 p-2 bg-white rounded"
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
                {selectedSubmission.conceptsNeeded && Array.isArray(selectedSubmission.conceptsNeeded) &&
                  selectedSubmission.conceptsNeeded.length > 0 && (
                    <Card className="border-2 border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                          <BookOpen className="w-5 h-5" />
                          복습이 필요한 개념
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedSubmission.conceptsNeeded.map(
                            (concept, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-blue-900 p-2 bg-white rounded"
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
              {selectedSubmission.mistakes && Array.isArray(selectedSubmission.mistakes) &&
                selectedSubmission.mistakes.length > 0 && (
                  <Card className="border-2 border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        틀린 문제
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
              {selectedSubmission.suggestionsArray && Array.isArray(selectedSubmission.suggestionsArray) &&
                selectedSubmission.suggestionsArray.length > 0 && (
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <TrendingUp className="w-5 h-5" />
                        개선 방법 및 제안
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedSubmission.suggestionsArray.map(
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
