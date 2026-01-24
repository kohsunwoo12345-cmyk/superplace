'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  MessageSquare, 
  Bot,
  BookOpen,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Award
} from 'lucide-react';

interface BotConversation {
  id: string;
  botId: string;
  botName: string;
  botIcon: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  userMessageCount: number;
  botMessageCount: number;
}

interface LearningProgress {
  botId: string;
  botName: string;
  totalConversations: number;
  totalMessages: number;
  lastActive: string;
  studyStreak: number; // 연속 학습 일수
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  botId: string;
  botName: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'completed';
  progress: number;
}

export default function StudentLearningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<BotConversation[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'STUDENT') {
        router.push('/dashboard');
        return;
      }
      loadData();
    }
  }, [status, session, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 대화 목록 조회
      const convResponse = await fetch('/api/user/conversations', {
        credentials: 'include',
      });

      if (convResponse.ok) {
        const convData = await convResponse.json();
        
        // 대화 목록 평탄화
        const allConversations: BotConversation[] = [];
        convData.conversations.forEach((group: any) => {
          group.conversations.forEach((conv: any) => {
            allConversations.push(conv);
          });
        });
        
        setConversations(allConversations);

        // 학습 진도 계산
        const progressMap = new Map<string, LearningProgress>();
        convData.conversations.forEach((group: any) => {
          const totalConv = group.conversations.length;
          const totalMsg = group.conversations.reduce((sum: number, c: any) => sum + c.messageCount, 0);
          const lastActive = group.conversations[0]?.lastMessageAt || new Date().toISOString();
          
          progressMap.set(group.botId, {
            botId: group.botId,
            botName: group.botName,
            totalConversations: totalConv,
            totalMessages: totalMsg,
            lastActive,
            studyStreak: calculateStreak(group.conversations),
          });
        });

        setProgress(Array.from(progressMap.values()));
      }

      // TODO: 실제 API 구현 필요
      // 임시 과제 데이터
      setAssignments([
        {
          id: '1',
          title: '영어 회화 연습',
          description: 'AI 봇과 20회 이상 대화하기',
          botId: 'english-tutor',
          botName: '영어 튜터',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          progress: 65,
        },
      ]);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (conversations: any[]) => {
    // 간단한 연속 학습 일수 계산 (실제로는 더 복잡한 로직 필요)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const hasToday = conversations.some((c) => 
      new Date(c.lastMessageAt).toDateString() === today.toDateString()
    );
    const hasYesterday = conversations.some((c) => 
      new Date(c.lastMessageAt).toDateString() === yesterday.toDateString()
    );

    return hasToday && hasYesterday ? 2 : hasToday ? 1 : 0;
  };

  const getRoleBadge = () => {
    return (
      <Badge className="bg-purple-100 text-purple-800">
        학생
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      pending: { text: '진행 중', color: 'bg-yellow-100 text-yellow-800' },
      submitted: { text: '제출 완료', color: 'bg-blue-100 text-blue-800' },
      completed: { text: '완료', color: 'bg-green-100 text-green-800' },
    };
    const badge = badges[status] || badges.pending;
    return <Badge className={badge.color}>{badge.text}</Badge>;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7" />
            나의 학습 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            {session?.user?.name}님의 학습 현황을 확인하세요
          </p>
        </div>
        {getRoleBadge()}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 대화 수</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}개</div>
            <p className="text-xs text-muted-foreground">AI 봇과의 대화</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">학습 중인 봇</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.length}개</div>
            <p className="text-xs text-muted-foreground">활동 중인 AI 봇</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">연속 학습</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...progress.map((p) => p.studyStreak), 0)}일
            </div>
            <p className="text-xs text-muted-foreground">꾸준히 학습 중!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중인 과제</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments.filter((a) => a.status === 'pending').length}개
            </div>
            <p className="text-xs text-muted-foreground">완료해야 할 과제</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="conversations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations">대화 목록</TabsTrigger>
          <TabsTrigger value="progress">학습 진도</TabsTrigger>
          <TabsTrigger value="assignments">과제</TabsTrigger>
        </TabsList>

        {/* 대화 목록 탭 */}
        <TabsContent value="conversations" className="space-y-4">
          {conversations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">아직 대화가 없습니다.</p>
                <Button
                  onClick={() => router.push('/ai-chat')}
                  className="mt-4"
                >
                  AI 봇과 대화 시작하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/ai-chat?botId=${conv.botId}&conversationId=${conv.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{conv.botIcon}</span>
                        <div>
                          <CardTitle className="text-lg">{conv.botName}</CardTitle>
                          <CardDescription className="text-sm">
                            {conv.messageCount}개 메시지
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {conv.lastMessage}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(conv.lastMessageAt).toLocaleDateString('ko-KR')}
                      </span>
                      <span>{conv.userMessageCount}개 질문</span>
                      <span>{conv.botMessageCount}개 답변</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 학습 진도 탭 */}
        <TabsContent value="progress" className="space-y-4">
          {progress.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">학습 기록이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progress.map((prog) => (
                <Card key={prog.botId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{prog.botName}</CardTitle>
                    <CardDescription>학습 진도</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">총 대화</span>
                      <Badge variant="secondary">{prog.totalConversations}회</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">총 메시지</span>
                      <Badge variant="secondary">{prog.totalMessages}개</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">연속 학습</span>
                      <Badge className="bg-green-100 text-green-800">
                        {prog.studyStreak}일
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">최근 활동</span>
                      <span className="text-xs text-gray-500">
                        {new Date(prog.lastActive).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <Button
                      onClick={() => router.push(`/ai-chat?botId=${prog.botId}`)}
                      className="w-full mt-2"
                      variant="outline"
                    >
                      계속 학습하기
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 과제 탭 */}
        <TabsContent value="assignments" className="space-y-4">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">진행 중인 과제가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description}</CardDescription>
                      </div>
                      {getStatusBadge(assignment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Bot className="h-4 w-4" />
                      <span>{assignment.botName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>마감: {new Date(assignment.dueDate).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>진행률</span>
                        <span className="font-semibold">{assignment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${assignment.progress}%` }}
                        />
                      </div>
                    </div>
                    {assignment.status === 'pending' && (
                      <Button
                        onClick={() => router.push(`/ai-chat?botId=${assignment.botId}`)}
                        className="w-full"
                      >
                        과제 진행하기
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
