"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, MessageSquare, FileText, Send, History, 
  TrendingUp, AlertCircle, CheckCircle, Clock, Calendar,
  Users, Target, BarChart3, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalChannels: number;
  activeChannels: number;
  totalTemplates: number;
  approvedTemplates: number;
  totalSends: number;
  totalSuccess: number;
  totalFail: number;
  totalCost: number;
  recentSends: any[];
}

export default function KakaoAlimtalkDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useKakaoAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalChannels: 0,
    activeChannels: 0,
    totalTemplates: 0,
    approvedTemplates: 0,
    totalSends: 0,
    totalSuccess: 0,
    totalFail: 0,
    totalCost: 0,
    recentSends: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.id) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [channelsRes, templatesRes, historyRes] = await Promise.all([
        fetch(`/api/kakao/channels?userId=${user.id}`),
        fetch(`/api/kakao/templates?userId=${user.id}`),
        fetch(`/api/kakao/send-history?userId=${user.id}&limit=5`)
      ]);

      const channelsData = await channelsRes.json();
      const templatesData = await templatesRes.json();
      const historyData = await historyRes.json();

      const newStats: DashboardStats = {
        totalChannels: channelsData.channels?.length || 0,
        activeChannels: channelsData.channels?.filter((c: any) => c.status === 'ACTIVE').length || 0,
        totalTemplates: templatesData.templates?.length || 0,
        approvedTemplates: templatesData.templates?.filter((t: any) => t.inspectionStatus === 'APPROVED').length || 0,
        totalSends: historyData.stats?.totalSends || 0,
        totalSuccess: historyData.stats?.totalSuccess || 0,
        totalFail: historyData.stats?.totalFail || 0,
        totalCost: historyData.stats?.totalCost || 0,
        recentSends: historyData.history || []
      };

      setStats(newStats);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: '채널 등록',
      description: '새로운 카카오 채널 등록',
      icon: MessageSquare,
      href: '/dashboard/kakao-channel/register',
      color: 'blue'
    },
    {
      title: '템플릿 등록',
      description: '알림톡 템플릿 생성',
      icon: FileText,
      href: '/dashboard/kakao-alimtalk/templates/create',
      color: 'green'
    },
    {
      title: '대량 발송',
      description: '엑셀로 한번에 발송',
      icon: Send,
      href: '/dashboard/kakao-alimtalk/send',
      color: 'purple'
    },
    {
      title: '발송 이력',
      description: '발송 내역 확인',
      icon: History,
      href: '/dashboard/kakao-alimtalk/history',
      color: 'orange'
    }
  ];

  const getColorClass = (color: string) => {
    const colors: any = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };
    return colors[color] || colors.blue;
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

  const successRate = stats.totalSuccess + stats.totalFail > 0 
    ? ((stats.totalSuccess / (stats.totalSuccess + stats.totalFail)) * 100).toFixed(1)
    : '0';

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
            <MessageSquare className="h-7 w-7 text-white" />
          </div>
          카카오 알림톡 대시보드
        </h1>
        <p className="text-gray-600">
          채널 관리부터 대량 발송까지, 알림톡의 모든 것을 한눈에
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getColorClass(action.color)} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  <ArrowRight className="h-4 w-4 text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              등록 채널
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-blue-600">{stats.activeChannels}</div>
              <div className="text-sm text-gray-500 mb-1">/ {stats.totalChannels}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">활성 채널</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              템플릿
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-green-600">{stats.approvedTemplates}</div>
              <div className="text-sm text-gray-500 mb-1">/ {stats.totalTemplates}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">승인 완료</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Send className="h-4 w-4" />
              발송 건수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.totalSuccess.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">성공 건수</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              성공률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{successRate}%</div>
            <p className="text-xs text-gray-500 mt-1">전체 발송 성공률</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sends */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                최근 발송 내역
              </CardTitle>
              <Link href="/dashboard/kakao-alimtalk/history">
                <Button variant="ghost" size="sm">
                  전체보기
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentSends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">아직 발송 이력이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentSends.map((send: any) => (
                  <div key={send.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{send.templateName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(send.createdAt).toLocaleString('ko-KR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {send.successCount}건
                      </div>
                      <div className="text-xs text-gray-500">
                        {send.totalCost?.toLocaleString()} P
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              빠른 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/kakao-channel">
                <div className="p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                        <MessageSquare className="h-5 w-5 text-blue-600 group-hover:text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">채널 관리</div>
                        <div className="text-xs text-gray-500">{stats.totalChannels}개 채널</div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/kakao-alimtalk/templates">
                <div className="p-4 border-2 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                        <FileText className="h-5 w-5 text-green-600 group-hover:text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">템플릿 관리</div>
                        <div className="text-xs text-gray-500">{stats.totalTemplates}개 템플릿</div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600" />
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/kakao-alimtalk/send">
                <div className="p-4 border-2 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                        <Send className="h-5 w-5 text-purple-600 group-hover:text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">알림톡 발송</div>
                        <div className="text-xs text-gray-500">대량 발송 준비</div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/kakao-alimtalk/history">
                <div className="p-4 border-2 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                        <BarChart3 className="h-5 w-5 text-orange-600 group-hover:text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">발송 통계</div>
                        <div className="text-xs text-gray-500">{stats.totalSends}회 발송</div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600" />
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
