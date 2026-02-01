'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, MessageSquare, TrendingUp, Clock, Award } from 'lucide-react';

interface AIBot {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
}

interface ConversationStat {
  botId: string;
  botName: string;
  botIcon: string;
  totalConversations: number;
  totalMessages: number;
  lastUsed: string;
  avgEngagement: number;
}

export default function StudentDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignedBots, setAssignedBots] = useState<AIBot[]>([]);
  const [stats, setStats] = useState<ConversationStat[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session.user.role !== 'STUDENT') {
        router.push('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 할당받은 봇 조회
      const botsRes = await fetch('/api/student/assigned-bots');
      if (botsRes.ok) {
        const data = await botsRes.json();
        setAssignedBots(data.bots || []);
      }

      // 사용 통계 조회
      const statsRes = await fetch('/api/student/conversation-stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || []);
      }
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
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
            <Bot className="h-7 w-7" />
            나의 AI 학습 도우미
          </h1>
          <p className="text-muted-foreground mt-1">
            선생님이 부여한 AI 봇으로 학습하세요
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {assignedBots.length}개의 봇 이용 가능
        </Badge>
      </div>

      {/* 할당받은 AI 봇 */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5" />
          이용 가능한 AI 봇
        </h2>
        {assignedBots.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">
                아직 할당받은 AI 봇이 없습니다.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                선생님께 AI 봇 할당을 요청해주세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assignedBots.map((bot) => {
              const botStat = stats.find(s => s.botId === bot.id);
              
              return (
                <Card
                  key={bot.id}
                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-${bot.color}-300 bg-gradient-to-br ${bot.bgGradient}`}
                  onClick={() => router.push(`/ai-chat?botId=${bot.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-5xl mb-2">{bot.icon}</div>
                      {botStat && botStat.totalConversations > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {botStat.totalConversations}회 사용
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {bot.nameEn}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {bot.description}
                    </p>
                    {botStat && (
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{botStat.totalMessages}개 메시지</span>
                        </div>
                        {botStat.avgEngagement > 0 && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>참여도 {botStat.avgEngagement.toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    )}
                    <Button className="w-full mt-3" size="sm">
                      대화 시작하기
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 학습 활동 기록 */}
      {stats.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            학습 활동 기록
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stats.map((stat) => (
              <Card key={stat.botId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{stat.botIcon}</div>
                      <div>
                        <CardTitle className="text-lg">{stat.botName}</CardTitle>
                        <CardDescription className="text-sm">
                          마지막 사용: {new Date(stat.lastUsed).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        대화 횟수
                      </p>
                      <p className="text-2xl font-bold">{stat.totalConversations}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        메시지 수
                      </p>
                      <p className="text-2xl font-bold">{stat.totalMessages}</p>
                    </div>
                    {stat.avgEngagement > 0 && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          평균 참여도
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${stat.avgEngagement}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            {stat.avgEngagement.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 학습 팁 */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            학습 팁
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>매일 조금씩이라도 AI 봇과 대화하면 학습 효과가 높아집니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>궁금한 점을 구체적으로 질문하면 더 좋은 답변을 받을 수 있습니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>선생님께서 학습 활동을 확인하고 피드백을 제공합니다</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
