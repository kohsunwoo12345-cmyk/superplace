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
} from 'lucide-react';

interface StudentData {
  id: string;
  name: string | null;
  email: string | null;
  grade: string | null;
  studentId: string | null;
  parentPhone: string | null;
  points: number;
  createdAt: string;
  lastLoginAt: string | null;
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
            <div>
              <p className="text-sm text-muted-foreground">학년</p>
              <p className="font-medium">{student.grade || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">학번</p>
              <p className="font-medium">{student.studentId || '-'}</p>
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

      {/* 탭 메뉴 */}
      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations">
            <MessageSquare className="h-4 w-4 mr-2" />
            대화 기록
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
