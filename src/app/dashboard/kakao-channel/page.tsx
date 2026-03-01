"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Plus, Trash2, CheckCircle, XCircle, RefreshCw, 
  MessageSquare, ExternalLink, AlertCircle, TrendingUp, FileText
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

interface KakaoChannel {
  id: string;
  channelName: string;
  searchId: string;
  phoneNumber: string;
  categoryCode: string;
  mainCategory: string;
  middleCategory: string;
  subCategory: string;
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
  const [success, setSuccess] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; channelId: string | null }>({
    open: false,
    channelId: null
  });
  const [deleting, setDeleting] = useState(false);

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

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/kakao/channels?channelId=${channelId}&userId=${user.id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.success) {
        setSuccess('채널이 삭제되었습니다.');
        setDeleteDialog({ open: false, channelId: null });
        fetchChannels();
      } else {
        setError(data.error || '채널 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to delete channel:', err);
      setError('채널 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
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
        setSuccess(`✅ ${data.syncedCount}개의 채널이 동기화되었습니다!`);
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
    const config: any = {
      'ACTIVE': {
        icon: CheckCircle,
        label: '활성',
        class: 'bg-green-100 text-green-800 border-green-200'
      },
      'INACTIVE': {
        icon: XCircle,
        label: '비활성',
        class: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      'PENDING': {
        icon: AlertCircle,
        label: '대기 중',
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      }
    };

    const cfg = config[status] || config.ACTIVE;
    const Icon = cfg.icon;

    return (
      <Badge className={`${cfg.class} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
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
              <MessageSquare className="h-8 w-8 text-blue-600" />
              카카오 채널 관리
            </h1>
            <p className="text-gray-600">
              알림톡 발송에 사용할 카카오 비즈니스 채널을 관리하세요
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSyncChannels}
              disabled={syncing}
              className="shadow-sm"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  동기화 중...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Solapi 채널 동기화
                </>
              )}
            </Button>
            <Link href="/dashboard/kakao-channel/register">
              <Button size="lg" className="shadow-lg">
                <Plus className="mr-2 h-5 w-5" />
                채널 등록
              </Button>
            </Link>
          </div>
        </div>
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

      {/* Stats */}
      {channels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                전체 채널
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{channels.length}</div>
              <p className="text-xs text-gray-500 mt-1">개</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                활성 채널
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {channels.filter(c => c.status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">개</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                사용 가능
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {channels.filter(c => c.status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">개 채널로 발송 가능</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Channels List */}
      {channels.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">등록된 채널이 없습니다</h3>
              <p className="text-gray-600 mb-6">
                알림톡을 발송하려면 먼저 카카오 비즈니스 채널을 등록해야 합니다
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard/kakao-channel/register">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    채널 등록하기
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleSyncChannels}
                  disabled={syncing}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Solapi에서 불러오기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <Card key={channel.id} className="hover:shadow-xl transition-shadow border-2">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold shadow-md">
                        {channel.channelName[0]}
                      </div>
                      <span className="line-clamp-1">{channel.channelName}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="font-mono">@{channel.searchId}</span>
                    </div>
                    {getStatusBadge(channel.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">전화번호</span>
                    <span className="font-medium">{channel.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">카테고리</span>
                    <span className="font-medium text-xs">{channel.subCategory || '미설정'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Solapi ID</span>
                    <span className="font-mono text-xs">{channel.solapiChannelId.substring(0, 12)}...</span>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <Link href={`/dashboard/kakao-alimtalk/templates?channelId=${channel.id}`}>
                    <Button variant="outline" className="w-full" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      템플릿 관리
                    </Button>
                  </Link>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`https://center-pf.kakao.com/`, '_blank')}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      카카오 센터
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, channelId: channel.id })}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, channelId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>채널 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 채널을 삭제하시겠습니까? 
              <br />
              <span className="text-red-600 font-semibold">연결된 템플릿도 사용할 수 없게 됩니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, channelId: null })}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog.channelId && handleDeleteChannel(deleteDialog.channelId)}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
