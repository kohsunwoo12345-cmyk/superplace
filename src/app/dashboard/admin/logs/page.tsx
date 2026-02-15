"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  ClipboardList, Search, Filter, Download, AlertCircle, CheckCircle, 
  Info, XCircle, RefreshCw, Bot, LogIn, UserPlus, ShoppingCart, Eye 
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userStr);

    // 페이지 진입 로그 기록
    logPageView(user);

    loadLogs();
  }, [router]);

  const logPageView = async (user: any) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/admin/page-view-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_email: user.email,
          user_id: user.id?.toString(),
          page_path: "/dashboard/admin/logs",
          page_title: "관리자 활동 로그",
          action: "페이지 조회",
          details: `관리자 ${user.name || user.email}이(가) 활동 로그 페이지에 접속했습니다`,
        }),
      });
      console.log("📝 페이지 조회 로그 기록됨");
    } catch (error) {
      console.error("페이지 조회 로그 기록 실패:", error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/activity-logs?limit=200", {
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

  const filterLogsByCategory = (category: string) => {
    if (category === "all") return logs;
    return logs.filter(log => log.category === category);
  };

  const filteredLogs = filterLogsByCategory(activeTab).filter((log) => {
    if (search && !JSON.stringify(log).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getCategoryStats = (category: string) => {
    const categoryLogs = category === "all" ? logs : logs.filter(log => log.category === category);
    return {
      total: categoryLogs.length,
      success: categoryLogs.filter(l => l.level === "success").length,
      error: categoryLogs.filter(l => l.level === "error").length,
    };
  };

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
        return "bg-green-100 text-green-700 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bot_assignment":
        return <Bot className="w-4 h-4" />;
      case "login":
        return <LogIn className="w-4 h-4" />;
      case "signup":
        return <UserPlus className="w-4 h-4" />;
      case "purchase":
        return <ShoppingCart className="w-4 h-4" />;
      case "page_view":
        return <Eye className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ["시간", "레벨", "카테고리", "사용자", "작업", "IP", "상세"],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.category,
        log.user,
        log.action,
        log.ip,
        log.details
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const allStats = getCategoryStats("all");
  const botStats = getCategoryStats("bot_assignment");
  const loginStats = getCategoryStats("login");
  const signupStats = getCategoryStats("signup");
  const purchaseStats = getCategoryStats("purchase");
  const pageViewStats = getCategoryStats("page_view");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-indigo-600" />
            활동 로그
          </h1>
          <p className="text-gray-600 mt-2">시스템 활동 및 사용자 행동을 추적합니다</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadLogs} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            CSV 다운로드
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">전체 로그</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              성공 {allStats.success} / 오류 {allStats.error}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI봇 할당
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              성공 {botStats.success} / 오류 {botStats.error}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              로그인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loginStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              성공 {loginStats.success} / 실패 {loginStats.error}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              회원가입
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signupStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              성공 {signupStats.success} / 실패 {signupStats.error}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              구매
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              성공 {purchaseStats.success} / 실패 {purchaseStats.error}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="로그 검색 (사용자, 작업, IP, 상세 정보...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 탭 기반 로그 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            전체 ({allStats.total})
          </TabsTrigger>
          <TabsTrigger value="bot_assignment">
            <Bot className="w-4 h-4 mr-1" />
            AI봇 할당
          </TabsTrigger>
          <TabsTrigger value="login">
            <LogIn className="w-4 h-4 mr-1" />
            로그인
          </TabsTrigger>
          <TabsTrigger value="signup">
            <UserPlus className="w-4 h-4 mr-1" />
            회원가입
          </TabsTrigger>
          <TabsTrigger value="purchase">
            <ShoppingCart className="w-4 h-4 mr-1" />
            구매
          </TabsTrigger>
          <TabsTrigger value="page_view">
            <Eye className="w-4 h-4 mr-1" />
            페이지 뷰
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" && "전체 로그"}
                {activeTab === "bot_assignment" && "AI봇 할당 로그"}
                {activeTab === "login" && "로그인 로그"}
                {activeTab === "signup" && "회원가입 로그"}
                {activeTab === "purchase" && "구매 로그"}
                {activeTab === "page_view" && "페이지 조회 로그"}
              </CardTitle>
              <CardDescription>
                {filteredLogs.length}개의 로그 항목
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>로그 데이터가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border-2 ${getLevelColor(log.level)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getLevelIcon(log.level)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getCategoryIcon(log.category)}
                              <span className="font-semibold">{log.action}</span>
                              <span className="text-sm text-gray-600">by {log.user}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{log.details}</p>
                            <div className="flex gap-4 text-xs text-gray-600">
                              <span>🕐 {new Date(log.timestamp).toLocaleString('ko-KR')}</span>
                              <span>📍 IP: {log.ip}</span>
                              <span className="px-2 py-1 rounded bg-white/50">
                                {log.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
