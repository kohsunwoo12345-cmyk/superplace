'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Users,
  Bot,
  Building,
  Loader2,
} from 'lucide-react';

interface DatabaseStatus {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EMPTY';
  message: string;
  database: {
    connected: boolean;
    timestamp: string;
  };
  tables: {
    users: {
      total: number;
      superAdmins: number;
      admins: number;
      students: number;
    };
    academy: { total: number };
    classes: { total: number };
    aiBots: { total: number };
    attendance: {
      columns: number;
      records: number;
    };
    homework: {
      assignments: number;
      submissions: number;
    };
    sms: {
      senders: number;
      logs: number;
      parents: number;
      groups: number;
    };
    notifications: { total: number };
  };
  samples: {
    adminUsers: any[];
    bots: any[];
    academies: any[];
  };
  diagnosis: {
    isEmpty: boolean;
    hasAdmins: boolean;
    hasBots: boolean;
    hasAcademies: boolean;
  };
}

export default function DatabaseStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/database/status');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check database status');
      }

      setStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'CRITICAL':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'EMPTY':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      case 'CRITICAL':
        return <AlertTriangle className="w-8 h-8 text-orange-600" />;
      case 'EMPTY':
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Database className="w-8 h-8 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <XCircle className="w-6 h-6" />
                데이터베이스 연결 실패
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 mb-4">{error}</p>
              <Button onClick={checkStatus}>
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Database className="h-8 w-8 text-teal-600" />
                데이터베이스 상태 진단
              </h1>
              <p className="text-gray-600 mt-1">
                현재 데이터베이스의 연결 및 데이터 상태를 확인합니다
              </p>
            </div>
          </div>
          <Button onClick={checkStatus} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* 전체 상태 */}
        <Card className={`border-2 ${getStatusColor(status.status)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(status.status)}
                <div>
                  <CardTitle className="text-2xl">
                    {status.status === 'HEALTHY' && '✅ 정상'}
                    {status.status === 'WARNING' && '⚠️ 경고'}
                    {status.status === 'CRITICAL' && '🚨 심각'}
                    {status.status === 'EMPTY' && '❌ 데이터 없음'}
                  </CardTitle>
                  <CardDescription className="text-lg mt-1">
                    {status.message}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={status.database.connected ? 'default' : 'destructive'}
                className="text-sm px-3 py-1"
              >
                {status.database.connected ? '연결됨' : '연결 끊김'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* 진단 결과 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={status.diagnosis.isEmpty ? 'border-red-300 border-2' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                데이터베이스 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {status.diagnosis.isEmpty ? (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-lg font-bold text-red-600">비어있음</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">데이터 존재</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={!status.diagnosis.hasAdmins ? 'border-orange-300 border-2' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                관리자 계정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {status.diagnosis.hasAdmins ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">있음</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-lg font-bold text-orange-600">없음</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={!status.diagnosis.hasBots ? 'border-yellow-300 border-2' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                AI 봇
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {status.diagnosis.hasBots ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">있음</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-lg font-bold text-yellow-600">없음</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={!status.diagnosis.hasAcademies ? 'border-yellow-300 border-2' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                학원 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {status.diagnosis.hasAcademies ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">있음</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-lg font-bold text-yellow-600">없음</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 테이블별 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>테이블별 데이터 개수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Users */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">사용자</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {status.tables.users.total}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  관리자: {status.tables.users.superAdmins + status.tables.users.admins} / 
                  학생: {status.tables.users.students}
                </div>
              </div>

              {/* Bots */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">AI 봇</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {status.tables.aiBots.total}
                </div>
              </div>

              {/* Academy */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">학원</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {status.tables.academy.total}
                </div>
              </div>

              {/* Classes */}
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-orange-900">클래스</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {status.tables.classes.total}
                </div>
              </div>

              {/* Attendance */}
              <div className="p-4 bg-teal-50 rounded-lg">
                <div className="text-sm font-medium text-teal-900 mb-2">출석</div>
                <div className="text-2xl font-bold text-teal-600">
                  {status.tables.attendance.records}
                </div>
                <div className="text-xs text-teal-700 mt-1">
                  컬럼: {status.tables.attendance.columns}
                </div>
              </div>

              {/* Homework */}
              <div className="p-4 bg-pink-50 rounded-lg">
                <div className="text-sm font-medium text-pink-900 mb-2">숙제</div>
                <div className="text-2xl font-bold text-pink-600">
                  {status.tables.homework.submissions}
                </div>
                <div className="text-xs text-pink-700 mt-1">
                  과제: {status.tables.homework.assignments}
                </div>
              </div>

              {/* SMS */}
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="text-sm font-medium text-indigo-900 mb-2">SMS</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {status.tables.sms.logs}
                </div>
                <div className="text-xs text-indigo-700 mt-1">
                  학부모: {status.tables.sms.parents} / 그룹: {status.tables.sms.groups}
                </div>
              </div>

              {/* Notifications */}
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm font-medium text-yellow-900 mb-2">알림</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {status.tables.notifications.total}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 샘플 데이터 */}
        {(status.samples.adminUsers.length > 0 ||
          status.samples.bots.length > 0 ||
          status.samples.academies.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>샘플 데이터</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Admin Users */}
              {status.samples.adminUsers.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">관리자 계정</h3>
                  <div className="space-y-1">
                    {status.samples.adminUsers.map((user) => (
                      <div
                        key={user.id}
                        className="text-sm p-2 bg-gray-50 rounded flex justify-between"
                      >
                        <span>
                          {user.name} ({user.email})
                        </span>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bots */}
              {status.samples.bots.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">AI 봇</h3>
                  <div className="space-y-1">
                    {status.samples.bots.map((bot) => (
                      <div
                        key={bot.id}
                        className="text-sm p-2 bg-gray-50 rounded flex justify-between"
                      >
                        <span>{bot.name}</span>
                        <Badge variant={bot.isActive ? 'default' : 'secondary'}>
                          {bot.isActive ? '활성' : '비활성'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Academies */}
              {status.samples.academies.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">학원</h3>
                  <div className="space-y-1">
                    {status.samples.academies.map((academy) => (
                      <div
                        key={academy.id}
                        className="text-sm p-2 bg-gray-50 rounded flex justify-between"
                      >
                        <span>
                          {academy.name} ({academy.code})
                        </span>
                        <Badge variant="outline">{academy.subscriptionPlan}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 복구 안내 */}
        {status.status === 'EMPTY' || status.status === 'CRITICAL' && (
          <Card className="bg-red-50 border-red-300 border-2">
            <CardHeader>
              <CardTitle className="text-red-900">🚨 데이터베이스 복구 필요</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-red-800">
                <p className="font-semibold mb-2">데이터베이스가 비어있거나 손상되었습니다.</p>
                <p className="mb-4">다음 단계를 따라 복구하세요:</p>
                
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>프로젝트의 <code className="bg-red-100 px-2 py-1 rounded">DATABASE_RECOVERY_GUIDE.md</code> 파일 확인</li>
                  <li>Cloudflare Dashboard → D1 데이터베이스 → Console 접속</li>
                  <li><code className="bg-red-100 px-2 py-1 rounded">database_recovery.sql</code> 파일 내용 복사</li>
                  <li>Console에 붙여넣고 Execute 클릭</li>
                  <li>이 페이지를 새로고침하여 복구 확인</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.open('https://dash.cloudflare.com/', '_blank')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Cloudflare Dashboard 열기
                </Button>
                <Button onClick={checkStatus} variant="outline">
                  복구 후 확인
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 타임스탬프 */}
        <div className="text-center text-sm text-gray-500">
          마지막 확인: {new Date(status.database.timestamp).toLocaleString('ko-KR')}
        </div>
      </div>
    </div>
  );
}
