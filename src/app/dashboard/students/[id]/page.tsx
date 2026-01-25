'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  User,
  MessageSquare,
  Clock,
  Calendar,
  ExternalLink,
  TrendingUp,
  Activity,
  Brain,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  Target,
  Zap,
  Heart,
  BookOpen,
} from 'lucide-react';

interface StudentData {
  id: string;
  name: string | null;
  email: string | null;
  school: string | null;
  grade: string | null;
  parentPhone: string | null;
  points: number;
  createdAt: string;
  lastLoginAt: string | null;
  studentId: string | null;
  studentCode: string | null;
}

interface Conversation {
  id: string;
  botId: string;
  messages: any[];
  messageCount: number;
  userMessageCount: number;
  botMessageCount: number;
  sessionDuration: number | null;
  lastMessageAt: string;
  createdAt: string;
  chatLink: string;
}

interface AIUsageStat {
  botId: string;
  _count: { id: number };
  _sum: {
    messageCount: number | null;
    sessionDuration: number | null;
  };
}

interface Analysis {
  id: string;
  botId: string;
  engagementScore: number;
  responseQuality: number;
  questionDepth: number;
  consistency: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
  analyzedAt: string;
}

interface ComprehensiveAnalysis {
  overall_summary?: string;
  subject_analysis?: any;
  learning_patterns?: any;
  recommendations?: any;
  bot_usage_insights?: any;
  progress_indicators?: any;
  raw_response?: string;
}

interface Attendance {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

interface HomeworkSubmission {
  id: string;
  imageUrl: string | null;
  aiAnalysis: any;
  approved: boolean;
  submittedAt: string;
}

interface TestScore {
  id: string;
  subject: string | null;
  score: number;
  maxScore: number;
  testDate: string;
  notes: string | null;
}

interface LearningCharacteristics {
  studySpeed: string;
  attitude: string;
  personality: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export default function StudentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [aiUsageStats, setAiUsageStats] = useState<AIUsageStat[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] =
    useState<ComprehensiveAnalysis | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  });
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<HomeworkSubmission[]>([]);
  const [testScores, setTestScores] = useState<TestScore[]>([]);
  const [learningCharacteristics, setLearningCharacteristics] = useState<LearningCharacteristics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchStudentData();
    }
  }, [status, studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/students/${studentId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '학생 정보를 불러올 수 없습니다.');
      }

      const data = await res.json();
      setStudent(data.student);
      setConversations(data.conversations || []);
      setAiUsageStats(data.aiUsageStats || []);
      setAnalyses(data.analyses || []);
      setAttendances(data.attendances || []);
      setAttendanceStats(data.attendanceStats || { total: 0, present: 0, absent: 0, late: 0, excused: 0 });
      setHomeworkSubmissions(data.homeworkSubmissions || []);
      setTestScores(data.testScores || []);
      setLearningCharacteristics(data.learningCharacteristics || null);
    } catch (error: any) {
      console.error('학생 정보 로딩 오류:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComprehensiveAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError('');

      const res = await fetch(`/api/students/${studentId}/comprehensive-analysis`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'AI 분석에 실패했습니다.');
      }

      const data = await res.json();
      setComprehensiveAnalysis(data.data.analysis);
    } catch (error: any) {
      console.error('AI 분석 오류:', error);
      setError(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    // 한국 시간으로 변환
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0분';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}분 ${secs}초` : `${secs}초`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>학생 정보를 찾을 수 없습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <User className="h-7 w-7" />
              {student.name} 학생 상세
            </h1>
            <p className="text-muted-foreground mt-1">학습 활동 및 AI 대화 기록</p>
          </div>
        </div>
        <Button
          onClick={handleComprehensiveAnalysis}
          disabled={analyzing}
          className="gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              AI 종합 분석
            </>
          )}
        </Button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 학생 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">이메일</p>
              <p className="font-medium">{student.email || '-'}</p>
            </div>
            {student.studentId && (
              <div>
                <p className="text-sm text-muted-foreground">학번</p>
                <p className="font-medium font-mono text-indigo-600">{student.studentId}</p>
              </div>
            )}
            {student.studentCode && (
              <div>
                <p className="text-sm text-muted-foreground">학생 코드</p>
                <p className="font-medium font-mono text-blue-600">{student.studentCode}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">학교</p>
              <p className="font-medium">{student.school || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">학년</p>
              <p className="font-medium">{student.grade || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">포인트</p>
              <p className="font-medium">{student.points} P</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">가입일</p>
              <p className="font-medium">{formatDate(student.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">마지막 로그인</p>
              <p className="font-medium">
                {student.lastLoginAt ? formatDateTime(student.lastLoginAt) : '기록 없음'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">학부모 연락처</p>
              <p className="font-medium">{student.parentPhone || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 학습 특성 분석 */}
      {learningCharacteristics && (
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              AI 학습 특성 분석
            </CardTitle>
            <CardDescription>
              학습 데이터 기반 자동 분석 결과
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    공부 속도
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{learningCharacteristics.studySpeed}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    학습 태도
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{learningCharacteristics.attitude}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-600" />
                    성향
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{learningCharacteristics.personality}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningCharacteristics.strengths.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-green-800">주요 강점</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {learningCharacteristics.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {learningCharacteristics.weaknesses.length > 0 && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-orange-800">개선점</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {learningCharacteristics.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-orange-700">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {learningCharacteristics.recommendations.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-blue-800">학습 추천 사항</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {learningCharacteristics.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-blue-700">
                        <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* 탭 메뉴 */}
      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="conversations">
            <MessageSquare className="h-4 w-4 mr-2" />
            대화 기록
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Calendar className="h-4 w-4 mr-2" />
            출결
          </TabsTrigger>
          <TabsTrigger value="homework">
            <FileText className="h-4 w-4 mr-2" />
            숙제
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <TrendingUp className="h-4 w-4 mr-2" />
            통계
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <Brain className="h-4 w-4 mr-2" />
            AI 분석
          </TabsTrigger>
        </TabsList>

        {/* 대화 기록 탭 */}
        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI 봇 대화 기록</CardTitle>
              <CardDescription>
                총 {conversations.length}개의 대화 세션
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>아직 대화 기록이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <Card key={conv.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{conv.botId}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {conv.messageCount}개 메시지
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(conv.lastMessageAt)}
                              </div>
                              {conv.sessionDuration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(conv.sessionDuration)}
                                </div>
                              )}
                            </div>
                          </div>
                          <Link href={conv.chatLink} target="_blank">
                            <Button size="sm" variant="outline" className="gap-2">
                              대화 보기
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 출결 탭 */}
        <TabsContent value="attendance" className="space-y-4">
          {/* 출결 통계 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">총 출석일</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{attendanceStats.total}일</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-700 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  출석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700">{attendanceStats.present}일</p>
                {attendanceStats.total > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {Math.round((attendanceStats.present / attendanceStats.total) * 100)}%
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-700 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  결석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}일</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-yellow-700 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  지각
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-700">{attendanceStats.late}일</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-700 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  인정 결석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-700">{attendanceStats.excused}일</p>
              </CardContent>
            </Card>
          </div>

          {/* 출결 기록 */}
          <Card>
            <CardHeader>
              <CardTitle>출결 기록</CardTitle>
              <CardDescription>최근 30일 출결 내역</CardDescription>
            </CardHeader>
            <CardContent>
              {attendances.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>아직 출결 기록이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendances.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {att.status === 'PRESENT' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {att.status === 'ABSENT' && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        {att.status === 'LATE' && (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        {att.status === 'EXCUSED' && (
                          <AlertCircle className="h-5 w-5 text-blue-600" />
                        )}
                        <div>
                          <p className="font-medium">{formatDate(att.date)}</p>
                          {att.notes && (
                            <p className="text-sm text-muted-foreground">{att.notes}</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          att.status === 'PRESENT'
                            ? 'default'
                            : att.status === 'LATE'
                            ? 'secondary'
                            : 'outline'
                        }
                        className={
                          att.status === 'ABSENT'
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : att.status === 'EXCUSED'
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : ''
                        }
                      >
                        {att.status === 'PRESENT' && '출석'}
                        {att.status === 'ABSENT' && '결석'}
                        {att.status === 'LATE' && '지각'}
                        {att.status === 'EXCUSED' && '인정 결석'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 숙제 탭 */}
        <TabsContent value="homework" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>숙제 제출 내역</CardTitle>
              <CardDescription>
                총 {homeworkSubmissions.length}개 제출 (승인: {homeworkSubmissions.filter(h => h.approved).length}개)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {homeworkSubmissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>아직 숙제 제출 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {homeworkSubmissions.map((hw) => (
                    <Card key={hw.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {hw.imageUrl && (
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={hw.imageUrl}
                                alt="숙제"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(hw.submittedAt)}
                            </span>
                            <Badge variant={hw.approved ? 'default' : 'secondary'}>
                              {hw.approved ? '승인됨' : '대기 중'}
                            </Badge>
                          </div>
                          {hw.aiAnalysis && hw.aiAnalysis.summary && (
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <p className="text-xs text-purple-800 font-medium mb-1">
                                AI 분석 요약
                              </p>
                              <p className="text-sm text-purple-700">
                                {hw.aiAnalysis.summary}
                              </p>
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

          {/* 성적 정보 */}
          {testScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  시험 성적
                </CardTitle>
                <CardDescription>최근 시험 성적 내역</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testScores.map((score) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{score.subject || '과목 미정'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(score.testDate)}
                        </p>
                        {score.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{score.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {score.score}
                          <span className="text-base text-muted-foreground">
                            /{score.maxScore}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((score.score / score.maxScore) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 통계 탭 */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">총 대화 수</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{conversations.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">총 메시지 수</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {conversations.reduce((sum, c) => sum + c.messageCount, 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">평균 대화 시간</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {conversations.length > 0
                    ? Math.round(
                        conversations.reduce(
                          (sum, c) => sum + (c.sessionDuration || 0),
                          0
                        ) /
                          conversations.length /
                          60
                      )
                    : 0}
                  분
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 봇별 통계 */}
          <Card>
            <CardHeader>
              <CardTitle>봇별 사용 통계</CardTitle>
            </CardHeader>
            <CardContent>
              {aiUsageStats.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  통계 데이터가 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {aiUsageStats.map((stat) => (
                    <div
                      key={stat.botId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{stat.botId}</p>
                        <p className="text-sm text-muted-foreground">
                          {stat._count.id}회 대화
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          총 {stat._sum.messageCount || 0}개 메시지
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDuration(stat._sum.sessionDuration || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI 분석 탭 */}
        <TabsContent value="analysis" className="space-y-4">
          {/* 종합 분석 결과 */}
          {comprehensiveAnalysis && (
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI 종합 분석 결과
                </CardTitle>
                <CardDescription>
                  Google AI 기반 학습 분석
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {comprehensiveAnalysis.overall_summary && (
                  <div>
                    <h3 className="font-semibold mb-2">전체 요약</h3>
                    <p className="text-sm leading-relaxed">
                      {comprehensiveAnalysis.overall_summary}
                    </p>
                  </div>
                )}

                {comprehensiveAnalysis.subject_analysis && (
                  <div>
                    <h3 className="font-semibold mb-3">과목별 분석</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(comprehensiveAnalysis.subject_analysis).map(
                        ([subject, data]: [string, any]) => (
                          <Card key={subject}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">{subject}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    data.level === '상'
                                      ? 'default'
                                      : data.level === '중'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                >
                                  {data.level}
                                </Badge>
                                {data.score && (
                                  <span className="text-sm font-bold">
                                    {data.score}점
                                  </span>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              {data.strengths && data.strengths.length > 0 && (
                                <div>
                                  <p className="font-medium text-green-700 mb-1">
                                    강점:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1 text-green-600">
                                    {data.strengths.map(
                                      (strength: string, idx: number) => (
                                        <li key={idx}>{strength}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                              {data.weaknesses && data.weaknesses.length > 0 && (
                                <div>
                                  <p className="font-medium text-orange-700 mb-1">
                                    약점:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1 text-orange-600">
                                    {data.weaknesses.map(
                                      (weakness: string, idx: number) => (
                                        <li key={idx}>{weakness}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  </div>
                )}

                {comprehensiveAnalysis.recommendations && (
                  <div>
                    <h3 className="font-semibold mb-3">추천 사항</h3>
                    <div className="space-y-3">
                      {comprehensiveAnalysis.recommendations.immediate_actions && (
                        <div className="p-3 bg-red-50 rounded-lg">
                          <p className="font-medium text-red-800 mb-2">
                            즉시 조치 사항
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                            {comprehensiveAnalysis.recommendations.immediate_actions.map(
                              (action: string, idx: number) => (
                                <li key={idx}>{action}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                      {comprehensiveAnalysis.recommendations.short_term_goals && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="font-medium text-blue-800 mb-2">
                            단기 목표
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                            {comprehensiveAnalysis.recommendations.short_term_goals.map(
                              (goal: string, idx: number) => (
                                <li key={idx}>{goal}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {comprehensiveAnalysis.raw_response && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      원본 분석 결과 보기
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                      {comprehensiveAnalysis.raw_response}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {/* 기존 개별 분석 결과 */}
          <Card>
            <CardHeader>
              <CardTitle>개별 대화 분석 기록</CardTitle>
              <CardDescription>
                총 {analyses.length}개의 분석 결과
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>아직 분석 결과가 없습니다.</p>
                  <p className="text-sm mt-2">
                    대화를 진행하면 자동으로 분석됩니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <Card key={analysis.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {analysis.botId}
                          </CardTitle>
                          <Badge variant="outline">
                            {formatDate(analysis.analyzedAt)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <p className="text-xs text-muted-foreground">참여도</p>
                            <p className="font-bold text-blue-700">
                              {analysis.engagementScore}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <p className="text-xs text-muted-foreground">
                              응답품질
                            </p>
                            <p className="font-bold text-green-700">
                              {analysis.responseQuality}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <p className="text-xs text-muted-foreground">
                              질문깊이
                            </p>
                            <p className="font-bold text-purple-700">
                              {analysis.questionDepth}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-orange-50 rounded">
                            <p className="text-xs text-muted-foreground">일관성</p>
                            <p className="font-bold text-orange-700">
                              {analysis.consistency}
                            </p>
                          </div>
                        </div>

                        {analysis.summary && (
                          <div className="p-3 bg-gray-50 rounded">
                            <p className="text-sm">{analysis.summary}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {analysis.strengths.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-700 mb-1">
                                강점
                              </p>
                              <ul className="text-sm space-y-1">
                                {analysis.strengths.map((strength, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.weaknesses.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-orange-700 mb-1">
                                개선점
                              </p>
                              <ul className="text-sm space-y-1">
                                {analysis.weaknesses.map((weakness, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
