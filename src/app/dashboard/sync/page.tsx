"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Cloud,
  Users,
  Play,
  Square,
  Settings,
  Webhook,
  Download,
  Upload,
  ArrowRightLeft,
} from "lucide-react";

interface SyncStats {
  totalUsers: number;
  students: number;
  directors: number;
  teachers: number;
}

interface SyncHistory {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

interface SyncStatus {
  workerStatus: 'connected' | 'disconnected';
  workerError: string;
  localStats: SyncStats;
  d1Stats: SyncStats | null;
  recentSyncs: SyncHistory[];
}

interface AutoSyncStatus {
  enabled: boolean;
  interval: number;
  lastSync: string | null;
  nextSync: string | null;
  totalSyncs: number;
  errors: number;
}

export default function CloudflareSyncPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [autoSyncStatus, setAutoSyncStatus] = useState<AutoSyncStatus | null>(null);
  const [syncDirection, setSyncDirection] = useState<'from-d1' | 'to-d1' | 'bidirectional'>('bidirectional');

  useEffect(() => {
    if (session) {
      loadSyncStatus();
      loadAutoSyncStatus();
    }
  }, [session]);

  const loadSyncStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cloudflare/d1/sync');
      
      if (!response.ok) {
        console.error("동기화 상태 조회 실패:", response.status);
        return;
      }

      const data = await response.json();
      setSyncStatus(data);
    } catch (error) {
      console.error("❌ 동기화 상태 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAutoSyncStatus = async () => {
    try {
      const response = await fetch('/api/cloudflare/d1/auto-sync');
      
      if (!response.ok) {
        console.error("자동 동기화 상태 조회 실패:", response.status);
        return;
      }

      const data = await response.json();
      setAutoSyncStatus(data.status);
    } catch (error) {
      console.error("❌ 자동 동기화 상태 조회 오류:", error);
    }
  };

  const handleSync = async () => {
    const confirmMessage = 
      syncDirection === 'from-d1' ? "Cloudflare D1 → Local 동기화를 실행하시겠습니까?" :
      syncDirection === 'to-d1' ? "Local → Cloudflare D1 동기화를 실행하시겠습니까?" :
      "양방향 동기화를 실행하시겠습니까?";

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch(`/api/cloudflare/d1/sync?direction=${syncDirection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '동기화 실패');
      }

      const result = await response.json();
      alert(`✅ 동기화 완료!\n\n${result.message}`);
      
      // 상태 새로고침
      await loadSyncStatus();
      await loadAutoSyncStatus();
    } catch (error: any) {
      console.error("❌ 동기화 오류:", error);
      alert(`❌ 동기화 실패: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleAutoSync = async (action: 'start' | 'stop') => {
    try {
      const response = await fetch('/api/cloudflare/d1/auto-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          interval: 300000, // 5분
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '자동 동기화 제어 실패');
      }

      const result = await response.json();
      alert(result.message);
      
      await loadAutoSyncStatus();
    } catch (error: any) {
      console.error("❌ 자동 동기화 제어 오류:", error);
      alert(`❌ ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (session?.user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>⚠️ 권한 없음</CardTitle>
          </CardHeader>
          <CardContent>
            <p>SUPER_ADMIN만 Cloudflare D1 동기화 페이지에 접근할 수 있습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🔄 Cloudflare D1 동기화</h1>
          <p className="text-gray-600 mt-2">
            https://superplace-academy.pages.dev 와 데이터베이스 동기화
          </p>
        </div>
        <Button onClick={loadSyncStatus} variant="outline" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 연결 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            연결 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Local PostgreSQL</p>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  연결됨
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Cloud className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Cloudflare D1</p>
                {syncStatus?.workerStatus === 'connected' ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    연결됨
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    연결 안 됨
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {syncStatus?.workerStatus === 'disconnected' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800">⚠️ Cloudflare Worker 연결 필요</p>
              <p className="text-xs text-yellow-700 mt-1">
                Vercel 환경 변수에 다음을 설정하세요:
              </p>
              <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs">
{`CLOUDFLARE_WORKER_URL=https://your-worker.workers.dev
CLOUDFLARE_WORKER_TOKEN=your-secret-token`}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 데이터베이스 통계 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Local Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5 text-blue-500" />
              Local PostgreSQL
            </CardTitle>
          </CardHeader>
          <CardContent>
            {syncStatus?.localStats && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">총 사용자</span>
                  <span className="font-bold">{syncStatus.localStats.totalUsers}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">학생</span>
                  <span className="font-bold text-blue-600">{syncStatus.localStats.students}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">학원장</span>
                  <span className="font-bold text-green-600">{syncStatus.localStats.directors}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">선생님</span>
                  <span className="font-bold text-purple-600">{syncStatus.localStats.teachers}명</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* D1 Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Cloud className="mr-2 h-5 w-5 text-orange-500" />
              Cloudflare D1
            </CardTitle>
          </CardHeader>
          <CardContent>
            {syncStatus?.d1Stats ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">총 사용자</span>
                  <span className="font-bold">{syncStatus.d1Stats.totalUsers}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">학생</span>
                  <span className="font-bold text-blue-600">{syncStatus.d1Stats.students}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">학원장</span>
                  <span className="font-bold text-green-600">{syncStatus.d1Stats.directors}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">선생님</span>
                  <span className="font-bold text-purple-600">{syncStatus.d1Stats.teachers}명</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">연결 안 됨</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 수동 동기화 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowRightLeft className="mr-2 h-5 w-5" />
            수동 동기화
          </CardTitle>
          <CardDescription>
            원하는 방향으로 데이터를 동기화할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={syncDirection === 'from-d1' ? 'default' : 'outline'}
                onClick={() => setSyncDirection('from-d1')}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                D1 → Local
              </Button>
              <Button
                variant={syncDirection === 'bidirectional' ? 'default' : 'outline'}
                onClick={() => setSyncDirection('bidirectional')}
                className="flex-1"
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                양방향
              </Button>
              <Button
                variant={syncDirection === 'to-d1' ? 'default' : 'outline'}
                onClick={() => setSyncDirection('to-d1')}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Local → D1
              </Button>
            </div>
            
            <Button
              onClick={handleSync}
              disabled={syncing || syncStatus?.workerStatus !== 'connected'}
              className="w-full"
              size="lg"
            >
              {syncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  동기화 중...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  지금 동기화
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 자동 동기화 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            자동 동기화
          </CardTitle>
          <CardDescription>
            주기적으로 자동 동기화를 실행합니다. (기본: 5분마다)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {autoSyncStatus && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">상태</span>
                  {autoSyncStatus.enabled ? (
                    <Badge variant="default" className="bg-green-500">
                      <Play className="mr-1 h-3 w-3" />
                      실행 중
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Square className="mr-1 h-3 w-3" />
                      중지됨
                    </Badge>
                  )}
                </div>
                
                {autoSyncStatus.enabled && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">다음 동기화</span>
                      <span className="font-medium">
                        {autoSyncStatus.nextSync ? formatDate(autoSyncStatus.nextSync) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">마지막 동기화</span>
                      <span className="font-medium">
                        {autoSyncStatus.lastSync ? formatDate(autoSyncStatus.lastSync) : '-'}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">총 동기화 횟수</span>
                  <span className="font-medium">{autoSyncStatus.totalSyncs}회</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">오류 횟수</span>
                  <span className="font-medium text-red-600">{autoSyncStatus.errors}회</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleAutoSync('start')}
                disabled={autoSyncStatus?.enabled}
                variant="default"
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                자동 동기화 시작
              </Button>
              <Button
                onClick={() => handleAutoSync('stop')}
                disabled={!autoSyncStatus?.enabled}
                variant="destructive"
                className="flex-1"
              >
                <Square className="mr-2 h-4 w-4" />
                자동 동기화 중지
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Webhook className="mr-2 h-5 w-5" />
            Webhook 연동
          </CardTitle>
          <CardDescription>
            Cloudflare D1에서 데이터 변경 시 자동 동기화
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Webhook URL:</p>
              <code className="text-sm break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/cloudflare/d1/webhook
              </code>
            </div>
            <p className="text-xs text-gray-600">
              💡 Cloudflare Worker에서 데이터 변경 시 이 URL로 POST 요청을 보내면 자동으로 동기화됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 동기화 히스토리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            동기화 히스토리
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncStatus?.recentSyncs && syncStatus.recentSyncs.length > 0 ? (
            <div className="space-y-3">
              {syncStatus.recentSyncs.map((sync) => (
                <div key={sync.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{sync.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatDate(sync.createdAt)}
                      </span>
                      {sync.user && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600">
                            {sync.user.name} ({sync.user.role})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              동기화 히스토리가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
