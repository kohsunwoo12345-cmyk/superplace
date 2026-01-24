'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Users,
  Activity,
  Eye,
  UserCheck,
  UserX,
  Monitor,
  Smartphone,
  Tablet,
  Calendar,
  Clock,
  TrendingUp,
  Filter,
  Download,
} from 'lucide-react';

interface AccessLog {
  id: string;
  userId: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  } | null;
  sessionId: string;
  ipAddress: string;
  browser: string | null;
  os: string | null;
  device: string | null;
  path: string;
  method: string;
  activityType: string | null;
  accessedAt: string;
}

interface ActivityLogItem {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
  action: string;
  resource: string | null;
  resourceId: string | null;
  description: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  memberCount: number;
  guestCount: number;
  byActivity: Record<string, number>;
}

export default function AccessAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  // 필터 상태
  const [userType, setUserType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
      } else {
        fetchAccessLogs();
        fetchActivityLogs();
      }
    }
  }, [status, session, userType, startDate, endDate, selectedAction]);

  const fetchAccessLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (userType !== 'all') params.append('userType', userType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedAction) params.append('action', selectedAction);

      const res = await fetch(`/api/admin/access-logs?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('접속 로그를 불러올 수 없습니다.');

      const data = await res.json();
      setAccessLogs(data.data.logs);
      setStats(data.data.stats);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('접속 로그 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedAction) params.append('action', selectedAction);

      const res = await fetch(`/api/admin/activity-logs?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('활동 로그를 불러올 수 없습니다.');

      const data = await res.json();
      setActivityLogs(data.data.logs);
    } catch (error) {
      console.error('활동 로그 조회 오류:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul',
    });
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      SUPER_ADMIN: { text: '관리자', color: 'bg-red-100 text-red-800' },
      DIRECTOR: { text: '학원장', color: 'bg-blue-100 text-blue-800' },
      TEACHER: { text: '선생님', color: 'bg-green-100 text-green-800' },
      STUDENT: { text: '학생', color: 'bg-purple-100 text-purple-800' },
    };
    return badges[role] || { text: role, color: 'bg-gray-100 text-gray-800' };
  };

  const getDeviceIcon = (device: string | null) => {
    if (device === 'mobile') return <Smartphone className="h-4 w-4" />;
    if (device === 'tablet') return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Activity className="h-7 w-7" />
          접속자 분석
        </h1>
        <p className="text-muted-foreground mt-1">
          실시간 접속자 및 활동 내역을 확인하세요
        </p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">총 접속</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">회원 접속</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold">{stats.memberCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">비회원 접속</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-orange-600" />
                <p className="text-2xl font-bold">{stats.guestCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">활동 로그</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <p className="text-2xl font-bold">{activityLogs.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>사용자 유형</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="member">회원</SelectItem>
                  <SelectItem value="guest">비회원</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>시작 날짜</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>종료 날짜</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>활동 유형</Label>
              <Input
                type="text"
                placeholder="예: login, page_view"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={fetchAccessLogs} size="sm">
              적용
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserType('all');
                setStartDate('');
                setEndDate('');
                setSelectedAction('');
              }}
            >
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 탭 메뉴 */}
      <Tabs defaultValue="access" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="access">
            <Eye className="h-4 w-4 mr-2" />
            접속 로그
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            활동 로그
          </TabsTrigger>
        </TabsList>

        {/* 접속 로그 탭 */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>접속 로그</CardTitle>
              <CardDescription>
                총 {pagination.total}개의 접속 기록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>접속 기록이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accessLogs.map((log) => (
                    <Card key={log.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {log.user ? (
                                <>
                                  <Badge variant="default">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    회원
                                  </Badge>
                                  <span className="font-medium">{log.user.name}</span>
                                  <Badge className={getRoleBadge(log.user.role).color}>
                                    {getRoleBadge(log.user.role).text}
                                  </Badge>
                                </>
                              ) : (
                                <Badge variant="outline">
                                  <UserX className="h-3 w-3 mr-1" />
                                  비회원
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(log.accessedAt)}
                              </div>
                              <div className="flex items-center gap-1">
                                {getDeviceIcon(log.device)}
                                {log.device || 'unknown'}
                              </div>
                              <div>
                                {log.browser} / {log.os}
                              </div>
                              <div>IP: {log.ipAddress}</div>
                            </div>

                            <div className="text-sm">
                              <Badge variant="outline" className="font-mono">
                                {log.method}
                              </Badge>
                              <span className="ml-2 text-muted-foreground">
                                {log.path}
                              </span>
                            </div>

                            {log.activityType && (
                              <Badge variant="secondary">{log.activityType}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 활동 로그 탭 */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>활동 로그</CardTitle>
              <CardDescription>
                총 {activityLogs.length}개의 활동 기록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>활동 기록이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <Card key={log.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{log.user.name}</span>
                              <Badge className={getRoleBadge(log.user.role).color}>
                                {getRoleBadge(log.user.role).text}
                              </Badge>
                              <Badge variant="default">{log.action}</Badge>
                            </div>

                            {log.description && (
                              <p className="text-sm text-muted-foreground">
                                {log.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDateTime(log.createdAt)}
                              </div>
                              {log.resource && (
                                <div>
                                  리소스: {log.resource}
                                  {log.resourceId && ` (${log.resourceId})`}
                                </div>
                              )}
                            </div>
                          </div>
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
