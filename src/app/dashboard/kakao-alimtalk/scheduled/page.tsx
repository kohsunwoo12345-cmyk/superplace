"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Clock, CheckCircle, XCircle, Trash2, Send, Calendar as CalendarIcon, 
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ScheduledSend {
  id: string;
  channelName: string;
  templateName: string;
  recipientCount: number;
  scheduledAt: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  createdAt: string;
}

export default function ScheduledSendsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scheduled, setScheduled] = useState<ScheduledSend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchScheduled(parsedUser.id);
  }, []);

  const fetchScheduled = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kakao/scheduled?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setScheduled(data.scheduled || []);
      } else {
        setError(data.error || '예약 목록을 불러오는 데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to fetch scheduled:', err);
      setError('예약 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async () => {
    if (!selectedSchedule || !user?.id) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/kakao/scheduled?scheduleId=${selectedSchedule}&userId=${user.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('예약이 취소되었습니다.');
        fetchScheduled(user.id);
        setDeleteDialog(false);
        setSelectedSchedule(null);
      } else {
        setError(data.error || '예약 취소에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to cancel schedule:', err);
      setError('예약 취소 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    setDeleteDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="mr-1 h-3 w-3" />대기 중</Badge>;
      case 'SENT':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />발송 완료</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="mr-1 h-3 w-3" />발송 실패</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="mr-1 h-3 w-3" />취소됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-3 text-gray-600">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">예약 발송 관리</h1>
        <p className="text-gray-600">
          예약된 알림톡 발송 목록을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {scheduled.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">예약된 발송이 없습니다</h3>
            <p className="text-gray-500 text-sm mb-6">
              예약 발송을 설정하여 원하는 시간에 알림톡을 보내보세요.
            </p>
            <Button onClick={() => router.push('/dashboard/kakao-alimtalk/send')}>
              <Send className="mr-2 h-4 w-4" />
              알림톡 발송하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {scheduled.map(item => {
            const scheduledDate = new Date(item.scheduledAt);
            const isPast = scheduledDate <= new Date();

            return (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        <span>{item.templateName}</span>
                        {getStatusBadge(item.status)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4" />
                          {format(scheduledDate, 'yyyy년 M월 d일 (E) HH:mm', { locale: ko })}
                          {isPast && item.status === 'PENDING' && (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              처리 대기 중
                            </Badge>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    
                    {item.status === 'PENDING' && !isPast && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">채널:</span>
                      <p className="font-medium mt-1">{item.channelName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">수신자:</span>
                      <p className="font-medium mt-1">{item.recipientCount}명</p>
                    </div>
                    <div>
                      <span className="text-gray-500">예약 일시:</span>
                      <p className="font-medium mt-1">
                        {format(new Date(item.createdAt), 'M/d HH:mm', { locale: ko })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약 취소</DialogTitle>
            <DialogDescription>
              이 예약을 취소하시겠습니까? 취소된 예약은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialog(false);
                setSelectedSchedule(null);
              }}
              disabled={deleting}
            >
              닫기
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSchedule}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  취소 중...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  예약 취소
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
