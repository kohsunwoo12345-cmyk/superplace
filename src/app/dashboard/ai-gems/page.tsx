'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, Loader2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Bot {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  source?: 'database' | 'default';
}

export default function AIBotsPage() {
  const { data: session, status } = useSession();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBots();
    }
  }, [status]);

  const fetchBots = async () => {
    try {
      setLoading(true);
      
      // 역할에 따라 다른 API 호출
      const endpoint = session?.user?.role === 'DIRECTOR' 
        ? '/api/director/available-bots'  // 학원장: 할당된 봇만
        : '/api/ai-bots';  // 관리자/학생: 모든 봇

      console.log('🔍 AI 봇 페이지 - 사용자 역할:', session?.user?.role);
      console.log('🔍 API 엔드포인트:', endpoint);

      const response = await fetch(endpoint, {
        credentials: 'include', // 세션 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API 오류:', errorData);
        throw new Error(errorData.error || '봇 목록을 불러오는데 실패했습니다');
      }

      const data = await response.json();
      console.log('✅ 봇 목록:', data.bots);
      setBots(data.bots || []);
    } catch (err: any) {
      console.error('❌ 봇 목록 로드 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI 봇
          </h1>
          <p className="text-muted-foreground mt-1">
            {session?.user?.role === 'DIRECTOR' 
              ? '할당받은 전문 AI 어시스턴트를 사용하세요'
              : '목적에 맞는 전문 AI 어시스턴트를 선택하세요'
            }
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          {bots.length}개 {session?.user?.role === 'DIRECTOR' ? '할당된 ' : ''}봇
        </Badge>
      </div>

      {bots.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">사용 가능한 AI 봇이 없습니다</h3>
            <p className="text-muted-foreground">
              {session?.user?.role === 'DIRECTOR' 
                ? '관리자가 AI 봇을 할당해주면 사용할 수 있습니다.'
                : '관리자에게 문의하여 AI 봇을 활성화하세요.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {bots.map((bot) => (
            <Link key={bot.id} href={`/ai-chat?botId=${bot.id}`}>
              <Card className={`hover:shadow-lg transition-shadow cursor-pointer h-full bg-gradient-to-br ${bot.bgGradient} border-2 hover:border-${bot.color}-300 relative`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-5xl mb-2">{bot.icon}</div>
                    <div className="flex flex-col items-end gap-1">
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                      {bot.source === 'database' && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          커스텀
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{bot.name}</CardTitle>
                  <CardDescription className="text-xs text-gray-600">
                    {bot.nameEn}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{bot.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="mt-8 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI 봇이란?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            <strong>AI 봇</strong>은 Google Gemini의 특화된 봇 기능입니다. 각 봇은 특정 역할에 최적화되어 있어
            더 전문적이고 맞춤화된 도움을 받을 수 있습니다.
          </p>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">✨</span>
              <span><strong>전문화된 응답:</strong> 각 분야에 특화된 전문가 수준의 답변</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">🎯</span>
              <span><strong>목적별 최적화:</strong> 학습, 작문, 수학 등 목적에 맞는 도움</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">💬</span>
              <span><strong>독립적인 대화:</strong> 각 봇마다 별도의 대화 히스토리 유지</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
