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
  BookOpen,
  AlertTriangle,
  Upload,
} from "lucide-react";

interface SyncReport {
  academyId: string;
  academyName?: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  students: {
    created: number;
    updated: number;
    deleted: number;
    failed: number;
  };
  classes: {
    created: number;
    updated: number;
    deleted: number;
    failed: number;
  };
  errors: string[];
}

interface SyncHistory {
  id: string;
  action: string;
  description: string;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SyncManagementPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [currentReport, setCurrentReport] = useState<SyncReport | null>(null);
  const [academyStats, setAcademyStats] = useState<any>(null);

  useEffect(() => {
    if (session) {
      loadSyncHistory();
    }
  }, [session]);

  const loadSyncHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (session?.user?.role === 'DIRECTOR' && session?.user?.academyId) {
        params.set('academyId', session.user.academyId);
      }

      const response = await fetch(`/api/sync/academy?${params.toString()}`);
      
      if (!response.ok) {
        console.error("Failed to fetch sync history:", response.status);
        return;
      }

      const data = await response.json();
      setSyncHistory(data.syncHistory || []);
      setAcademyStats(data.academyStats);
    } catch (error) {
      console.error("❌ 동기화 히스토리 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (syncAll: boolean = false) => {
    if (!confirm(syncAll 
      ? "모든 학원의 데이터를 Cloudflare와 동기화하시겠습니까?" 
      : "학원 데이터를 Cloudflare와 동기화하시겠습니까?")) {
      return;
    }

    try {
      setSyncing(true);
      setCurrentReport(null);

      const body: any = {};
      
      if (syncAll) {
        body.syncAll = true;
      } else if (session?.user?.academyId) {
        body.academyId = session.user.academyId;
      } else {
        alert("학원 정보가 없습니다.");
        return;
      }

      const response = await fetch("/api/sync/academy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "동기화 실패" }));
        throw new Error(errorData.error || "동기화 실패");
      }

      const data = await response.json();
      
      if (syncAll && data.reports) {
        alert(`전체 동기화 완료!\n학원: ${data.reports.length}개`);
      } else if (data.report) {
        setCurrentReport(data.report);
        const totalStudents = data.report.students.created + data.report.students.updated;
        const totalClasses = data.report.classes.created + data.report.classes.updated;
        alert(`동기화 완료!\n학생: ${totalStudents}명\n반: ${totalClasses}개`);
      }

      await loadSyncHistory();
    } catch (error) {
      console.error("❌ 동기화 오류:", error);
      alert("동기화 중 오류가 발생했습니다: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setSyncing(false);
    }
  };

  const getSyncActionBadge = (action: string) => {
    if (action === 'SYNC_ALL_ACADEMIES') {
      return <Badge className="bg-purple-500">전체 동기화</Badge>;
    }
    return <Badge className="bg-blue-500">학원 동기화</Badge>;
  };

  const formatDuration = (report: SyncReport) => {
    if (!report.endTime) return "진행 중...";
    const start = new Date(report.startTime).getTime();
    const end = new Date(report.endTime).getTime();
    const duration = ((end - start) / 1000).toFixed(2);
    return `${duration}초`;
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cloudflare 동기화 관리</h1>
        <p className="text-gray-600">학생과 반 데이터를 Cloudflare와 동기화합니다</p>
      </div>

      {/* 동기화 액션 카드 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            동기화 실행
          </CardTitle>
          <CardDescription>
            로컬 데이터베이스와 Cloudflare 간 데이터를 양방향으로 동기화합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {session?.user?.role === 'DIRECTOR' && (
              <Button
                onClick={() => handleSync(false)}
                disabled={syncing || !session?.user?.academyId}
                className="flex items-center gap-2"
                size="lg"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    동기화 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    내 학원 동기화
                  </>
                )}
              </Button>
            )}

            {session?.user?.role === 'SUPER_ADMIN' && (
              <>
                <Button
                  onClick={() => handleSync(false)}
                  disabled={syncing}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Database className="h-5 w-5" />
                  특정 학원 동기화
                </Button>
                
                <Button
                  onClick={() => handleSync(true)}
                  disabled={syncing}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      전체 동기화 중...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-5 w-5" />
                      전체 학원 동기화
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 현재 동기화 보고서 */}
      {currentReport && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              최근 동기화 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  학생 동기화
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">생성</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      <Upload className="h-3 w-3 mr-1" />
                      {currentReport.students.created}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">업데이트</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {currentReport.students.updated}
                    </Badge>
                  </div>
                  {currentReport.students.failed > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">실패</span>
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        {currentReport.students.failed}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  반 동기화
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">생성</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      <Upload className="h-3 w-3 mr-1" />
                      {currentReport.classes.created}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">업데이트</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {currentReport.classes.updated}
                    </Badge>
                  </div>
                  {currentReport.classes.failed > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">실패</span>
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        {currentReport.classes.failed}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  소요 시간: {formatDuration(currentReport)}
                </div>
                <div>
                  실행자: {currentReport.userName}
                </div>
              </div>
            </div>

            {currentReport.errors && currentReport.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  오류 발생 ({currentReport.errors.length}건)
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {currentReport.errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 학원 통계 */}
      {academyStats && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>학원 통계</CardTitle>
            <CardDescription>
              {academyStats.academy.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {academyStats.counts.students}
                </div>
                <div className="text-sm text-gray-600">학생</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {academyStats.counts.teachers}
                </div>
                <div className="text-sm text-gray-600">선생님</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {academyStats.counts.classes}
                </div>
                <div className="text-sm text-gray-600">반</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 동기화 히스토리 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>동기화 히스토리</CardTitle>
              <CardDescription>최근 20개의 동기화 기록</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSyncHistory}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              로딩 중...
            </div>
          ) : syncHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              동기화 히스토리가 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {syncHistory.map((history) => (
                <div
                  key={history.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSyncActionBadge(history.action)}
                      <span className="font-medium">{history.description}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(history.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    실행자: {history.user.name} ({history.user.email})
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
