"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Search, Filter, Download, AlertCircle, CheckCircle, Info, XCircle, RefreshCw } from "lucide-react";

interface Log {
  id: string;
  timestamp: string;
  level: string;
  category: string;
  user: string;
  action: string;
  ip: string;
  details: string;
}

interface Stats {
  total: number;
  success: number;
  info: number;
  warning: number;
  error: number;
}

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, success: 0, info: 0, warning: 0, error: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    loadLogs();
  }, [router]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/activity-logs?limit=100", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setStats(data.stats || { total: 0, success: 0, info: 0, warning: 0, error: 0 });
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter !== "all" && log.level !== filter) return false;
    if (search && !JSON.stringify(log).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
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
        return "bg-green-100 text-green-700";
      case "warning":
        return "bg-yellow-100 text-yellow-700";
      case "error":
        return "bg-red-100 text-red-700";
      default:
        return "bg-blue-100 text-blue-700";
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 로그</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-sm text-gray-500 mt-2">전체</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">성공</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.success}</div>
            <p className="text-sm text-gray-500 mt-2">정상 처리</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">경고</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.warning}</div>
            <p className="text-sm text-gray-500 mt-2">주의 필요</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">오류</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.error}</div>
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
                    variant={filter === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(level)}
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
                    <span>사용자: {log.user}</span>
                    <span>IP: {log.ip}</span>
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
        </CardContent>
      </Card>
    </div>
  );
}
