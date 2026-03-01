"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface KakaoChannel {
  id: string;
  userId: string;
  userName: string;
  phoneNumber: string;
  channelName: string;
  searchId: string;
  categoryCode: string;
  mainCategory: string;
  middleCategory: string;
  subCategory: string;
  businessNumber: string;
  solapiChannelId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function KakaoChannelListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useKakaoAuth();
  const [channels, setChannels] = useState<KakaoChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.id) {
      router.push('/login');
      return;
    }

    fetchChannels();
  }, [user, authLoading]);

  const fetchChannels = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/kakao/channels?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setChannels(data.channels || []);
      } else {
        setError(data.error || '채널 목록을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to fetch channels:', err);
      setError('채널 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!user?.id) return;

    if (!confirm('정말 이 채널을 삭제하시겠습니까? 연결된 템플릿도 사용할 수 없게 됩니다.')) {
      return;
    }

    try {
      setDeletingId(channelId);

      const response = await fetch(
        `/api/kakao/channels?channelId=${channelId}&userId=${user.id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.success) {
        // 목록에서 제거
        setChannels(channels.filter(ch => ch.id !== channelId));
      } else {
        alert(data.error || '채널 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to delete channel:', err);
      alert('채널 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSyncChannels = async () => {
    if (!user?.id) return;

    try {
      setSyncing(true);
      setError(null);

      const response = await fetch('/api/kakao/sync-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.syncedCount}개의 채널이 동기화되었습니다!`);
        // 목록 새로고침
        await fetchChannels();
      } else {
        setError(data.error || '채널 동기화에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to sync channels:', err);
      setError('채널 동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            활성
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            비활성
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-3 text-gray-600">채널 목록을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">카카오톡 채널 관리</h1>
          <p className="text-gray-600">
            등록된 카카오 비즈니스 채널을 관리하고 알림톡 템플릿을 생성할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncChannels}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Solapi 채널 동기화
          </Button>
          <Link href="/dashboard/kakao-channel/register">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 채널 등록
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {channels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <div className="mb-4 text-gray-400">
                <svg
                  className="mx-auto h-16 w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 채널이 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                카카오 비즈니스 채널을 등록하여 알림톡을 발송하세요.
              </p>
              <Link href="/dashboard/kakao-channel/register">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  첫 번째 채널 등록하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Card key={channel.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{channel.channelName}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <span className="font-mono text-sm">@{channel.searchId}</span>
                      <a
                        href={`https://pf.kakao.com/${channel.searchId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </CardDescription>
                  </div>
                  {getStatusBadge(channel.status)}
                </div>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">카테고리</dt>
                    <dd className="font-medium">
                      {channel.mainCategory} &gt; {channel.middleCategory} &gt; {channel.subCategory}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">담당자 번호</dt>
                    <dd className="font-medium font-mono">{channel.phoneNumber}</dd>
                  </div>
                  {channel.solapiChannelId && (
                    <div>
                      <dt className="text-gray-500">Solapi 채널 ID</dt>
                      <dd className="font-medium font-mono text-xs">{channel.solapiChannelId}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500">등록일</dt>
                    <dd className="font-medium">
                      {new Date(channel.createdAt).toLocaleDateString('ko-KR')}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex gap-2">
                  <Link href={`/dashboard/kakao-alimtalk/templates?channelId=${channel.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      템플릿 관리
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteChannel(channel.id)}
                    disabled={deletingId === channel.id}
                  >
                    {deletingId === channel.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 안내 정보 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">💡 채널 관리 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. 채널 등록:</strong> 카카오 비즈니스 센터에서 생성한 채널을 시스템에 연동합니다.
          </div>
          <div>
            <strong>2. 템플릿 관리:</strong> 등록된 채널로 발송할 알림톡 템플릿을 생성하고 관리합니다.
          </div>
          <div>
            <strong>3. 알림톡 발송:</strong> 승인된 템플릿으로 고객에게 알림톡을 발송합니다.
          </div>
          <div className="pt-2 border-t">
            <p className="text-gray-600">
              📚 자세한 가이드는{' '}
              <Link href="/dashboard/kakao-business-guide" className="text-blue-600 hover:underline">
                카카오 비즈니스 가이드
              </Link>
              를 참고하세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
