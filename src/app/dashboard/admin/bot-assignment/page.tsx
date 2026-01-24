'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { UserPlus, Loader2, CheckCircle2, AlertCircle, Sparkles, Edit, Trash2, Search, Building2 } from 'lucide-react';
import { EditBotDialog } from '@/components/admin/EditBotDialog';

interface AIBot {
  id: string;
  botId: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  systemPrompt: string;
  isActive: boolean;
  source?: 'database' | 'default';
}

interface Director {
  id: string;
  name: string;
  email: string;
  academyId: string;
  academyName?: string;
  assignedBots: string[];
}

export default function AdminBotAssignmentPage() {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [filteredDirectors, setFilteredDirectors] = useState<Director[]>([]);
  const [bots, setBots] = useState<AIBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingBot, setEditingBot] = useState<AIBot | null>(null);
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDirectors();
    fetchBots();
  }, []);

  // 검색어가 변경될 때마다 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDirectors(directors);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = directors.filter(
        (director) =>
          director.name.toLowerCase().includes(query) ||
          director.email.toLowerCase().includes(query) ||
          director.academyName?.toLowerCase().includes(query)
      );
      setFilteredDirectors(filtered);
    }
  }, [searchQuery, directors]);

  const fetchBots = async () => {
    try {
      const response = await fetch('/api/ai-bots');
      if (!response.ok) throw new Error('Failed to fetch bots');
      const data = await response.json();
      setBots(data.bots || []);
    } catch (error) {
      console.error('Error fetching bots:', error);
    }
  };

  const fetchDirectors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/directors');
      if (!response.ok) throw new Error('Failed to fetch directors');
      const data = await response.json();
      setDirectors(data.directors || []);
    } catch (error) {
      console.error('Error fetching directors:', error);
      setMessage({ type: 'error', text: '학원장 목록을 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBot = async (directorId: string, botId: string) => {
    try {
      setAssigning(`${directorId}-${botId}`);
      const response = await fetch('/api/admin/assign-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: directorId, botId }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to assign bot');

      setMessage({ type: 'success', text: 'AI 봇이 성공적으로 할당되었습니다!' });
      fetchDirectors(); // 목록 새로고침
    } catch (error: any) {
      console.error('Error assigning bot:', error);
      setMessage({ type: 'error', text: error.message || 'AI 봇 할당에 실패했습니다.' });
    } finally {
      setAssigning(null);
    }
  };

  const handleRevokeBot = async (directorId: string, botId: string) => {
    try {
      setAssigning(`${directorId}-${botId}`);
      const response = await fetch('/api/admin/revoke-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: directorId, botId }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to revoke bot');

      setMessage({ type: 'success', text: 'AI 봇 할당이 취소되었습니다.' });
      fetchDirectors(); // 목록 새로고침
    } catch (error: any) {
      console.error('Error revoking bot:', error);
      setMessage({ type: 'error', text: error.message || 'AI 봇 취소에 실패했습니다.' });
    } finally {
      setAssigning(null);
    }
  };

  // 봇 삭제
  const handleDeleteBot = async (botId: string) => {
    if (!confirm('정말 이 봇을 삭제하시겠습니까? 모든 할당도 함께 취소됩니다.')) return;

    try {
      setDeletingBotId(botId);
      const response = await fetch(`/api/admin/ai-bots/${botId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '봇이 삭제되었습니다' });
        fetchBots();
        fetchDirectors();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || '봇 삭제에 실패했습니다' });
      }
    } catch (error) {
      console.error('봇 삭제 오류:', error);
      setMessage({ type: 'error', text: '봇 삭제 중 오류가 발생했습니다' });
    } finally {
      setDeletingBotId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserPlus className="h-8 w-8 text-purple-600" />
            AI 봇 할당 (관리자)
          </h1>
          <p className="text-muted-foreground mt-1">
            학원장에게 AI 봇을 할당하세요
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          총 {directors.length}명의 학원장
        </Badge>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* 학원 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            학원 검색
          </CardTitle>
          <CardDescription>
            학원명, 학원장 이름 또는 이메일로 검색하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="학원명, 학원장 이름, 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              {filteredDirectors.length}개의 검색 결과
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {filteredDirectors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? '검색 결과가 없습니다.' : '등록된 학원장이 없습니다.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDirectors.map((director) => (
            <Card key={director.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{director.name}</span>
                    {director.academyName && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {director.academyName}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary">{director.email}</Badge>
                </CardTitle>
                <CardDescription>
                  할당된 AI 봇: {director.assignedBots.length}개 / 총 {bots.length}개
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {bots.map((bot) => {
                    const isAssigned = director.assignedBots.includes(bot.id);
                    const isProcessing = assigning === `${director.id}-${bot.id}`;
                    const isDeleting = deletingBotId === bot.id;
                    const isDBBot = bot.source === 'database';

                    return (
                      <div
                        key={bot.id}
                        className={`p-3 border-2 rounded-lg ${
                          isAssigned
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-2xl">{bot.icon}</span>
                            {isDBBot && (
                              <Sparkles className="h-3 w-3 text-purple-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isAssigned && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                            {/* DB 봇만 수정/삭제 가능 */}
                            {isDBBot && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => setEditingBot(bot)}
                                  disabled={isDeleting}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteBot(bot.id)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{bot.name}</h4>
                        <p className="text-xs text-gray-500 mb-2">{bot.nameEn}</p>
                        {isAssigned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleRevokeBot(director.id, bot.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              '취소'
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleAssignBot(director.id, bot.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              '할당'
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 봇 수정 다이얼로그 */}
      {editingBot && (
        <EditBotDialog
          open={!!editingBot}
          onOpenChange={(open) => {
            if (!open) setEditingBot(null);
          }}
          bot={editingBot}
          onSuccess={() => {
            fetchBots();
            setEditingBot(null);
            setMessage({ type: 'success', text: '봇이 수정되었습니다' });
          }}
        />
      )}
    </div>
  );
}
