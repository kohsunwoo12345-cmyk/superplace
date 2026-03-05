"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Search, Download, AlertCircle, CheckCircle, Info, XCircle, UserPlus, LogIn, Bot, Users, CreditCard } from "lucide-react";

export default function LogsPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load logs
  useEffect(() => {
    loadLogs();
  }, [categoryFilter, levelFilter, search]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        category: categoryFilter,
        level: levelFilter,
        search: search,
        limit: '100'
      });
      
      const response = await fetch(`/api/admin/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 로그 데이터:', data);
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



  const categories = [
    { id: "all", label: "전체", icon: ClipboardList },
    { id: "login", label: "로그인", icon: LogIn },
    { id: "signup", label: "회원가입", icon: UserPlus },
    { id: "bot_assign", label: "봇 할당", icon: Bot },
    { id: "student_add", label: "학생 추가", icon: Users },
    { id: "payment", label: "결제", icon: CreditCard },
  ];

  const getCategoryStats = (category: string) => {
    if (!stats) return 0;
    if (category === "all") return stats.total || 0;
    return stats[category] || 0;
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
      case "info":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success":
      case "info":
        return "bg-green-100 text-green-700";
      case "warning":
        return "bg-yellow-100 text-yellow-700";
      case "error":
        return "bg-red-100 text-red-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('ko-KR', { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
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
          <p className="text-gray-600 mt-1">시스템 활동 로그 및 이벤트 기록</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          내보내기
        </Button>
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리 필터</CardTitle>
          <CardDescription>활동 유형별로 로그 필터링</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const count = getCategoryStats(cat.id);
              const isActive = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:scale-105 ${
                    isActive
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-600"}`} />
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                      {cat.label}
                    </div>
                    <div className={`text-xl font-bold mt-1 ${isActive ? "text-blue-600" : "text-gray-900"}`}>
                      {count}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 로그</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.total || 0}</div>
            <p className="text-sm text-gray-500 mt-2">오늘</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">성공</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.info || 0}
            </div>
            <p className="text-sm text-gray-500 mt-2">정상 처리</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">경고</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats?.warning || 0}
            </div>
            <p className="text-sm text-gray-500 mt-2">주의 필요</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">오류</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats?.error || 0}
            </div>
            <p className="text-sm text-gray-500 mt-2">즉시 확인</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>로그 목록</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm"
                />
              </div>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">로딩 중...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">로그가 없습니다</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="mt-1">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {log.category === 'login' ? '로그인' :
                         log.category === 'signup' ? '회원가입' :
                         log.category === 'bot_assign' ? '봇 할당' :
                         log.category === 'student_add' ? '학생 추가' :
                         log.category === 'payment' ? '결제' : log.category}
                      </span>
                      <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <p className="font-medium text-sm">{log.action}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                      <span className="font-medium">사용자: {log.userName || log.userEmail || '-'}</span>
                      {log.userEmail && <span className="text-gray-400">({log.userEmail})</span>}
                      {log.ip && (
                        <Badge variant="outline" className="text-xs">
                          IP: {log.ip}
                        </Badge>
                      )}
                    </div>
                    {log.details && <p className="text-sm text-gray-600 mt-1">{log.details}</p>}
                    {log.userAgent && (
                      <p className="text-xs text-gray-400 mt-1">
                        {log.deviceType && <span className="mr-2">[{log.deviceType}]</span>}
                        {log.country && <span className="mr-2">📍 {log.country}</span>}
                        {log.userAgent.substring(0, 80)}...
                      </p>
                    )}
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
              
              {/* View Stats */}
              {viewStats && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">총 조회수</div>
                    <div className="text-2xl font-bold text-blue-600">{viewStats.totalViews}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">고유 사용자</div>
                    <div className="text-2xl font-bold text-green-600">{viewStats.uniqueUsers}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">조회된 상품</div>
                    <div className="text-2xl font-bold text-purple-600">{viewStats.uniqueProducts}</div>
                  </div>
                </div>
              )}

              {/* Top Products */}
              {viewStats?.topProducts && viewStats.topProducts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">인기 상품</h4>
                  <div className="space-y-2">
                    {viewStats.topProducts.slice(0, 5).map((product: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{product.productName}</span>
                        <Badge>{product.viewCount}회</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
              ) : (
                <div className="space-y-2">
                  {productViewLogs
                    .filter(log => {
                      if (search) {
                        return JSON.stringify(log).toLowerCase().includes(search.toLowerCase());
                      }
                      return true;
                    })
                    .slice(0, 20)
                    .map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="mt-1">
                          <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              상품조회
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.createdAt).toLocaleString('ko-KR')}
                            </span>
                          </div>
                          <p className="font-medium text-sm">{log.productName} 조회</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <span className="font-medium">
                              사용자: {log.userName || log.userEmail || '익명'}
                            </span>
                            {log.userEmail && (
                              <span className="text-gray-400">({log.userEmail})</span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              IP: {log.ipAddress}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {!loading && productViewLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  아직 상품 조회 로그가 없습니다
                </div>
              )}
            </div>
          )}

          {/* System Logs Section */}
          {categoryFilter !== "상품조회" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">시스템 로그</h3>
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="mt-1">{getLevelIcon(log.level)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          {log.category}
                        </span>
                        <span className="text-xs text-gray-500">{log.timestamp}</span>
                      </div>
                      <p className="font-medium text-sm">{log.action}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                        <span className="font-medium">사용자: {log.userName || log.user}</span>
                        <span className="text-gray-400">({log.user})</span>
                        <Badge variant="outline" className="text-xs">
                          IP: {log.ip}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
              {filteredLogs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
