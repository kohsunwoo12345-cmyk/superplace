'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { gems } from '@/lib/gems/data';
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Director {
  id: string;
  name: string;
  email: string;
  academyId: string;
  assignedBots: string[];
}

export default function AdminBotAssignmentPage() {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDirectors();
  }, []);

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

      <div className="space-y-6">
        {directors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">등록된 학원장이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          directors.map((director) => (
            <Card key={director.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{director.name}</span>
                  <Badge variant="secondary">{director.email}</Badge>
                </CardTitle>
                <CardDescription>
                  할당된 AI 봇: {director.assignedBots.length}개 / 총 {gems.length}개
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {gems.map((gem) => {
                    const isAssigned = director.assignedBots.includes(gem.id);
                    const isProcessing = assigning === `${director.id}-${gem.id}`;

                    return (
                      <div
                        key={gem.id}
                        className={`p-3 border-2 rounded-lg ${
                          isAssigned
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{gem.icon}</span>
                          {isAssigned && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{gem.name}</h4>
                        <p className="text-xs text-gray-500 mb-2">{gem.nameEn}</p>
                        {isAssigned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleRevokeBot(director.id, gem.id)}
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
                            onClick={() => handleAssignBot(director.id, gem.id)}
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
    </div>
  );
}
