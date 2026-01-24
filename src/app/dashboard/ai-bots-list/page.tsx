'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Bot, 
  Sparkles, 
  Search, 
  MessageSquare,
  Mic,
  Image as ImageIcon,
  Volume2,
  FileText,
  Lock,
  CheckCircle2
} from 'lucide-react';

interface AIBot {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  source: 'database' | 'default';
  starterMessages?: string[];
  referenceFiles?: string[];
  enableImageInput?: boolean;
  enableVoiceOutput?: boolean;
  enableVoiceInput?: boolean;
  isAssigned?: boolean;
}

export default function AIBotsListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allBots, setAllBots] = useState<AIBot[]>([]);
  const [assignedBotIds, setAssignedBotIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBots, setFilteredBots] = useState<AIBot[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // 관리자 전용 페이지
      if (session?.user?.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
        return;
      }
      fetchBots();
    }
  }, [status, session, router]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = allBots.filter(
        bot =>
          bot.name.toLowerCase().includes(query) ||
          bot.nameEn.toLowerCase().includes(query) ||
          bot.description.toLowerCase().includes(query)
      );
      setFilteredBots(filtered);
    } else {
      setFilteredBots(allBots);
    }
  }, [searchQuery, allBots]);

  const fetchBots = async () => {
    try {
      setLoading(true);

      // 모든 봇 조회
      const allBotsRes = await fetch('/api/ai-bots', {
        credentials: 'include',
      });
      if (allBotsRes.ok) {
        const data = await allBotsRes.json();
        setAllBots(data.bots || []);
      }

      // 할당받은 봇 조회
      const assignedRes = await fetch('/api/user/assigned-bots', {
        credentials: 'include',
      });
      if (assignedRes.ok) {
        const data = await assignedRes.json();
        const ids = new Set((data.bots || []).map((b: AIBot) => b.id));
        setAssignedBotIds(ids);
      }
    } catch (error) {
      console.error('봇 목록 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBotClick = (botId: string) => {
    const isAssigned = assignedBotIds.has(botId);
    
    if (session?.user?.role === 'SUPER_ADMIN' || isAssigned) {
      router.push(`/ai-chat?botId=${botId}`);
    } else {
      alert('이 봇은 할당받지 않았습니다. 관리자에게 문의하세요.');
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
            AI 봇 전체 목록
          </h1>
          <p className="text-muted-foreground mt-1">
            {session?.user?.role === 'SUPER_ADMIN'
              ? '모든 AI 봇을 확인하고 관리하세요'
              : '사용 가능한 AI 봇을 확인하세요'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            총 {allBots.length}개 봇
          </Badge>
          {session?.user?.role !== 'SUPER_ADMIN' && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {assignedBotIds.size}개 할당됨
            </Badge>
          )}
        </div>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="봇 이름, 영문명, 설명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              {filteredBots.length}개의 검색 결과
            </p>
          )}
        </CardContent>
      </Card>

      {/* 봇 목록 */}
      {filteredBots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 AI 봇이 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBots.map((bot) => {
            const isAssigned = assignedBotIds.has(bot.id);
            const canAccess = session?.user?.role === 'SUPER_ADMIN' || isAssigned;

            return (
              <Card
                key={bot.id}
                className={`relative cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${
                  canAccess
                    ? `hover:border-${bot.color}-300 bg-gradient-to-br ${bot.bgGradient}`
                    : 'opacity-60 bg-gray-50'
                }`}
                onClick={() => handleBotClick(bot.id)}
              >
                {/* 할당 상태 배지 */}
                <div className="absolute top-3 right-3">
                  {bot.source === 'database' && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      커스텀
                    </Badge>
                  )}
                  {!canAccess && (
                    <Badge variant="outline" className="bg-white text-xs ml-1">
                      <Lock className="h-3 w-3 mr-1" />
                      미할당
                    </Badge>
                  )}
                  {isAssigned && session?.user?.role !== 'SUPER_ADMIN' && (
                    <Badge variant="default" className="bg-green-600 text-xs ml-1">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      할당됨
                    </Badge>
                  )}
                </div>

                <CardHeader className="pt-12">
                  <div className="text-5xl mb-2">{bot.icon}</div>
                  <CardTitle className="text-lg">{bot.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {bot.nameEn}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                    {bot.description}
                  </p>

                  {/* 기능 아이콘 */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {bot.enableImageInput && (
                      <Badge variant="outline" className="text-xs">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        이미지
                      </Badge>
                    )}
                    {bot.enableVoiceOutput && (
                      <Badge variant="outline" className="text-xs">
                        <Volume2 className="h-3 w-3 mr-1" />
                        음성출력
                      </Badge>
                    )}
                    {bot.enableVoiceInput && (
                      <Badge variant="outline" className="text-xs">
                        <Mic className="h-3 w-3 mr-1" />
                        음성입력
                      </Badge>
                    )}
                    {bot.referenceFiles && bot.referenceFiles.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        참고자료
                      </Badge>
                    )}
                  </div>

                  {/* 스타터 메시지 */}
                  {bot.starterMessages && bot.starterMessages.length > 0 && (
                    <div className="text-xs text-gray-500 mb-3">
                      <MessageSquare className="h-3 w-3 inline mr-1" />
                      {bot.starterMessages.length}개 추천 질문
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="sm"
                    disabled={!canAccess}
                    variant={canAccess ? 'default' : 'outline'}
                  >
                    {canAccess ? (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        대화 시작하기
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        할당 필요
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
