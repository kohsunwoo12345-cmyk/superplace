"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, History, TrendingUp, Send, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SendHistory {
  id: string;
  channelName: string;
  templateName: string;
  recipientCount: number;
  successCount: number;
  failCount: number;
  totalCost: number;
  status: string;
  createdAt: string;
}

interface Stats {
  totalSends: number;
  totalSuccess: number;
  totalFail: number;
  totalCost: number;
}

export default function SendHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useKakaoAuth();
  
  const [history, setHistory] = useState<SendHistory[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSends: 0, totalSuccess: 0, totalFail: 0, totalCost: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.id) {
      router.push('/login');
      return;
    }

    fetchHistory();
  }, [user, authLoading, filterStatus, page]);

  const fetchHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId: user.id,
        limit: pageSize.toString(),
        offset: (page * pageSize).toString()
      });

      if (filterStatus) {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/kakao/send-history?${params}`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.history || []);
        setStats(data.stats || { totalSends: 0, totalSuccess: 0, totalFail: 0, totalCost: 0 });
      } else {
        setError(data.error || '이력을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
      setError('이력을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      'COMPLETED': { label: '완료', class: 'bg-green-100 text-green-800' },
      'PARTIAL': { label: '부분완료', class: 'bg-yellow-100 text-yellow-800' },
      'FAILED': { label: '실패', class: 'bg-red-100 text-red-800' },
      'SCHEDULED': { label: '예약됨', class: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (authLoading || loading) {
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <History className="h-8 w-8 text-blue-600" />
              발송 이력
            </h1>
            <p className="text-gray-600">
              알림톡 발송 내역과 통계를 확인하세요
            </p>
          </div>
          <Button onClick={fetchHistory} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Send className="h-4 w-4" />
              총 발송 횟수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalSends}</div>
            <p className="text-xs text-gray-500 mt-1">회</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              성공 건수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalSuccess}</div>
            <p className="text-xs text-gray-500 mt-1">건</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              실패 건수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.totalFail}</div>
            <p className="text-xs text-gray-500 mt-1">건</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              총 사용 포인트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.totalCost?.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">P</p>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>발송 내역</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="전체 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                <SelectItem value="COMPLETED">완료</SelectItem>
                <SelectItem value="PARTIAL">부분완료</SelectItem>
                <SelectItem value="FAILED">실패</SelectItem>
                <SelectItem value="SCHEDULED">예약됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">발송 이력이 없습니다</h3>
              <p className="text-gray-600 mb-4">알림톡을 발송하면 여기에 표시됩니다</p>
              <Button onClick={() => router.push('/dashboard/kakao-alimtalk/send')}>
                <Send className="mr-2 h-4 w-4" />
                알림톡 발송하기
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>발송 일시</TableHead>
                    <TableHead>채널</TableHead>
                    <TableHead>템플릿</TableHead>
                    <TableHead className="text-center">수신자</TableHead>
                    <TableHead className="text-center">성공</TableHead>
                    <TableHead className="text-center">실패</TableHead>
                    <TableHead className="text-right">비용</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{item.channelName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{item.templateName}</TableCell>
                      <TableCell className="text-center font-semibold">{item.recipientCount}</TableCell>
                      <TableCell className="text-center text-green-600 font-semibold">
                        {item.successCount}
                      </TableCell>
                      <TableCell className="text-center text-red-600 font-semibold">
                        {item.failCount}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.totalCost?.toLocaleString()} P
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(item.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  이전
                </Button>
                <span className="text-sm text-gray-600">
                  페이지 {page + 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={history.length < pageSize}
                >
                  다음
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
