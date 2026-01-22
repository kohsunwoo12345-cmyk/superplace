'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { gems } from '@/lib/gems/data';
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string | null;
  studentId: string | null;
  assignedBots: string[];
}

export default function DirectorBotAssignmentPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [myBots, setMyBots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 내가 할당받은 봇 목록 가져오기
      const myBotsResponse = await fetch('/api/director/my-bots');
      if (myBotsResponse.ok) {
        const myBotsData = await myBotsResponse.json();
        setMyBots(myBotsData.botIds || []);
      }
      
      // 학생 목록 가져오기
      const studentsResponse = await fetch('/api/director/students');
      if (!studentsResponse.ok) throw new Error('Failed to fetch students');
      const studentsData = await studentsResponse.json();
      setStudents(studentsData.students || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: '데이터를 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBot = async (studentId: string, botId: string) => {
    try {
      setAssigning(`${studentId}-${botId}`);
      const response = await fetch('/api/director/assign-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, botId }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to assign bot');

      setMessage({ type: 'success', text: 'AI 봇이 성공적으로 할당되었습니다!' });
      fetchData(); // 목록 새로고침
    } catch (error: any) {
      console.error('Error assigning bot:', error);
      setMessage({ type: 'error', text: error.message || 'AI 봇 할당에 실패했습니다.' });
    } finally {
      setAssigning(null);
    }
  };

  const handleRevokeBot = async (studentId: string, botId: string) => {
    try {
      setAssigning(`${studentId}-${botId}`);
      const response = await fetch('/api/director/revoke-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, botId }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to revoke bot');

      setMessage({ type: 'success', text: 'AI 봇 할당이 취소되었습니다.' });
      fetchData(); // 목록 새로고침
    } catch (error: any) {
      console.error('Error revoking bot:', error);
      setMessage({ type: 'error', text: error.message || 'AI 봇 취소에 실패했습니다.' });
    } finally {
      setAssigning(null);
    }
  };

  // 내가 할당받은 봇만 필터링
  const availableGems = gems.filter(gem => myBots.includes(gem.id));

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
            AI 봇 할당 (학원장)
          </h1>
          <p className="text-muted-foreground mt-1">
            학생들에게 AI 봇을 할당하세요
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          총 {students.length}명의 학생
        </Badge>
      </div>

      {myBots.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            아직 할당받은 AI 봇이 없습니다. 시스템 관리자에게 AI 봇 할당을 요청하세요.
          </AlertDescription>
        </Alert>
      )}

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

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">내가 할당받은 AI 봇</CardTitle>
        </CardHeader>
        <CardContent>
          {availableGems.length === 0 ? (
            <p className="text-sm text-muted-foreground">할당받은 AI 봇이 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableGems.map((gem) => (
                <Badge key={gem.id} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  <span className="text-lg">{gem.icon}</span>
                  <span>{gem.name}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {students.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">등록된 학생이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          students.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{student.name}</span>
                  <div className="flex items-center gap-2">
                    {student.grade && <Badge variant="outline">{student.grade}</Badge>}
                    <Badge variant="secondary">{student.email}</Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  할당된 AI 봇: {student.assignedBots.length}개 / 할당 가능: {availableGems.length}개
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableGems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    학생에게 할당할 수 있는 AI 봇이 없습니다.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {availableGems.map((gem) => {
                      const isAssigned = student.assignedBots.includes(gem.id);
                      const isProcessing = assigning === `${student.id}-${gem.id}`;

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
                              onClick={() => handleRevokeBot(student.id, gem.id)}
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
                              onClick={() => handleAssignBot(student.id, gem.id)}
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
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
