"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, Search, Download, AlertCircle, CheckCircle, Info, XCircle,
  UserPlus, LogIn, Bot, Users, CreditCard, Key, UserCog, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";

export default function LogsPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(500);

  useEffect(() => {
    loadLogs();
  }, [categoryFilter, levelFilter, search, dateFrom, dateTo, limit]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        category: categoryFilter,
        level: levelFilter,
        search: search,
        limit: limit.toString(),
      });
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setStats(data.stats || null);
      } else {
        console.error('로그 로드 실패:', response.status);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories = [
    { id: "all", label: "전체", icon: ClipboardList },
    { id: "login", label: "로그인", icon: LogIn },
    { id: "signup", label: "회원가입", icon: UserPlus },
    { id: "bot_assign", label: "봇 할당", icon: Bot },
    { id: "student_add", label: "학생 추가", icon: Users },
    { id: "payment", label: "결제", icon: CreditCard },
    { id: "password", label: "비밀번호", icon: Key },
    { id: "impersonate", label: "대행로그인", icon: UserCog },
  ];

  const getCategoryStats = (category: string) => {
    if (!stats) return 0;
    if (category === "all") return stats.total || 0;
    return stats[category] || 0;
  };

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      login: '로그인', signup: '회원가입', bot_assign: '봇 할당',
      student_add: '학생 추가', payment: '결제', password: '비밀번호',
      impersonate: '대행로그인', other: '기타'
    };
    return map[category] || category;
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "info": return <Info className="w-5 h-5 text-blue-600" />;
      case "warning": return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "error": return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success": return "bg-green-100 text-green-700";
      case "info": return "bg-blue-100 text-blue-700";
      case "warning": return "bg-yellow-100 text-yellow-700";
      case "error": return "bg-red-100 text-red-700";
      default: return "bg-blue-100 text-blue-700";
    }
  };

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: '최고관리자', ADMIN: '관리자', DIRECTOR: '학원장',
      TEACHER: '선생님', STUDENT: '학생'
    };
    return map[role] || role || '-';
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const exportCSV = () => {
    const headers = ['시간', '카테고리', '레벨', '액션', '사용자명', '이메일', '역할', '학원', 'IP', '국가', '디바이스', '상세내용', 'UserAgent'];
    const rows = logs.map(log => [
      formatTimestamp(log.timestamp),
      getCategoryLabel(log.category),
      log.level?.toUpperCase() || '',
      log.action || '',
      log.userName || '',
      log.userEmail || '',
      getRoleLabel(log.userRole),
      log.academyName || '',
      log.ip || '',
      log.country || '',
      log.deviceType || '',
      log.details || '',
      log.userAgent || '',
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-gray-600" />
            상세 기록
          </h1>
          <p className="text-gray-600 mt-1">시스템 활동 로그 및 이벤트 기록 (총 {stats?.total || 0}건)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV 내보내기
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리 필터</CardTitle>
          <CardDescription>활동 유형별로 로그 필터링</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const count = getCategoryStats(cat.id);
              const isActive = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all hover:scale-105 ${
                    isActive ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-600"}`} />
                  <div className="text-center">
                    <div className={`text-xs font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}>{cat.label}</div>
                    <div className={`text-lg font-bold mt-0.5 ${isActive ? "text-blue-600" : "text-gray-900"}`}>{count}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">전체 로그</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.total || 0}</div>
            <p className="text-sm text-gray-500 mt-1">조회된 기록</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">정보/성공</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{(stats?.info || 0) + (stats?.success || 0)}</div>
            <p className="text-sm text-gray-500 mt-1">정상 처리</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">경고</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats?.warning || 0}</div>
            <p className="text-sm text-gray-500 mt-1">주의 필요</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">오류</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats?.error || 0}</div>
            <p className="text-sm text-gray-500 mt-1">즉시 확인</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>로그 목록</CardTitle>
            <div className="flex flex-wrap gap-2">
              {/* 날짜 필터 */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">시작:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1.5 border rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">종료:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1.5 border rounded-lg text-sm"
                />
              </div>
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름/이메일/IP/학원 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm w-56"
                />
              </div>
              {/* 레벨 필터 */}
              <div className="flex gap-1">
                {["all", "info", "success", "warning", "error"].map((level) => (
                  <Button
                    key={level}
                    variant={levelFilter === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLevelFilter(level)}
                  >
                    {level === "all" && "전체"}
                    {level === "info" && "정보"}
                    {level === "success" && "성공"}
                    {level === "warning" && "경고"}
                    {level === "error" && "오류"}
                  </Button>
                ))}
              </div>
              {/* 조회 건수 */}
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-2 py-1.5 border rounded-lg text-sm"
              >
                <option value={100}>100건</option>
                <option value={300}>300건</option>
                <option value={500}>500건</option>
                <option value={1000}>1000건</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
              로딩 중...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">로그가 없습니다</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const isExpanded = expandedLogs.has(log.id);
                return (
                  <div
                    key={log.id}
                    className="border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* 기본 정보 행 */}
                    <div
                      className="flex items-start gap-3 p-4 cursor-pointer"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <div className="mt-0.5 flex-shrink-0">{getLevelIcon(log.level)}</div>
                      <div className="flex-1 min-w-0">
                        {/* 상단: 레벨, 카테고리, 시간 */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                            {log.level?.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {getCategoryLabel(log.category)}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        {/* 액션 */}
                        <p className="font-semibold text-sm text-gray-900">{log.action}</p>
                        {/* 사용자 정보 */}
                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-700 font-medium">
                            👤 {log.userName || '-'}
                          </span>
                          {log.userEmail && (
                            <span className="text-xs text-gray-500">{log.userEmail}</span>
                          )}
                          {log.userRole && (
                            <Badge variant="secondary" className="text-xs">
                              {getRoleLabel(log.userRole)}
                            </Badge>
                          )}
                          {log.academyName && (
                            <span className="text-xs text-indigo-600 font-medium">🏫 {log.academyName}</span>
                          )}
                          {log.ip && log.ip !== 'Unknown' && (
                            <Badge variant="outline" className="text-xs font-mono">
                              🌐 {log.ip}
                            </Badge>
                          )}
                          {log.country && (
                            <span className="text-xs text-gray-500">📍 {log.country}</span>
                          )}
                          {log.deviceType && log.deviceType !== 'Unknown' && (
                            <span className="text-xs text-gray-500">
                              {log.deviceType === 'Mobile' ? '📱' : log.deviceType === 'Desktop' ? '🖥️' : '📟'} {log.deviceType}
                            </span>
                          )}
                        </div>
                        {/* 상세 내용 */}
                        {log.details && (
                          <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 px-2 py-1 rounded">{log.details}</p>
                        )}
                      </div>
                      {/* 펼치기 버튼 */}
                      <div className="flex-shrink-0 text-gray-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* 펼쳐진 상세 정보 */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 px-4 py-3 rounded-b-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-semibold text-gray-600">로그 ID:</span>
                            <span className="ml-2 font-mono text-gray-500">{log.id}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">사용자 ID:</span>
                            <span className="ml-2 font-mono text-gray-500">{log.userId || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">이름:</span>
                            <span className="ml-2 text-gray-700">{log.userName || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">이메일:</span>
                            <span className="ml-2 text-gray-700">{log.userEmail || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">역할:</span>
                            <span className="ml-2 text-gray-700">{getRoleLabel(log.userRole)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">학원명:</span>
                            <span className="ml-2 text-gray-700">{log.academyName || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">학원 ID:</span>
                            <span className="ml-2 font-mono text-gray-500">{log.academyId || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">IP 주소:</span>
                            <span className="ml-2 font-mono text-blue-600 font-bold">{log.ip || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">국가:</span>
                            <span className="ml-2 text-gray-700">{log.country || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">디바이스:</span>
                            <span className="ml-2 text-gray-700">{log.deviceType || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">카테고리:</span>
                            <span className="ml-2 text-gray-700">{getCategoryLabel(log.category)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">레벨:</span>
                            <span className="ml-2 text-gray-700">{log.level?.toUpperCase()}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-semibold text-gray-600">상세 내용:</span>
                            <span className="ml-2 text-gray-700">{log.details || '-'}</span>
                          </div>
                          {log.userAgent && (
                            <div className="md:col-span-2">
                              <span className="font-semibold text-gray-600">User-Agent:</span>
                              <p className="mt-1 font-mono text-gray-500 break-all bg-white border rounded p-2">{log.userAgent}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-600">기록 시간:</span>
                            <span className="ml-2 font-mono text-gray-700">{formatTimestamp(log.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
