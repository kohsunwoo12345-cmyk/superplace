"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Key,
  Shield,
  Activity,
  Bot,
  CreditCard,
  MapPin,
  Clock,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
} from "lucide-react";

interface UserDetail {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  password: string; // 실제 비밀번호
  academyId?: string;
  academyName?: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
}

interface LoginLog {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  success: boolean;
  loginAt: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  ip: string;
  createdAt: string;
}

interface BotAssignment {
  id: string;
  userId: string;
  botId: string;
  botName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface Payment {
  id: string;
  userId: string;
  productName: string;
  amount: number;
  status: string;
  paidAt: string;
}

export default function UserDetailPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 클라이언트에서 쿼리 파라미터 읽기
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setUserId(params.get("id"));
    }
  }, []);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [botAssignments, setBotAssignments] = useState<BotAssignment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    if (userId) {
      fetchUserDetail();
      fetchLoginLogs();
      fetchActivityLogs();
      fetchBotAssignments();
      fetchPayments();
    }
  }, [router, userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("사용자 정보 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginLogs = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/login-logs`);
      if (response.ok) {
        const data = await response.json();
        setLoginLogs(data.logs || []);
      }
    } catch (error) {
      console.error("로그인 기록 로드 실패:", error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity-logs`);
      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data.logs || []);
      }
    } catch (error) {
      console.error("활동 기록 로드 실패:", error);
    }
  };

  const fetchBotAssignments = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/bot-assignments`);
      if (response.ok) {
        const data = await response.json();
        setBotAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("봇 할당 정보 로드 실패:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/payments`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error("결제 정보 로드 실패:", error);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      alert("새 비밀번호를 입력하세요.");
      return;
    }

    if (!confirm(`${user?.name}의 비밀번호를 재설정하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        alert("비밀번호가 재설정되었습니다.");
        setNewPassword("");
        fetchUserDetail();
      } else {
        alert("비밀번호 재설정에 실패했습니다.");
      }
    } catch (error) {
      console.error("비밀번호 재설정 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleLoginAsUser = async () => {
    if (!confirm(`${user?.name}의 계정으로 로그인하시겠습니까?\n\n현재 관리자 세션은 유지되며, 새 탭에서 사용자 계정으로 로그인됩니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        
        // 새 탭에서 사용자 계정으로 로그인
        const newWindow = window.open("/dashboard", "_blank");
        if (newWindow) {
          // 새 탭에서 사용자 정보 설정
          setTimeout(() => {
            newWindow.localStorage.setItem("user", JSON.stringify(data.user));
            newWindow.localStorage.setItem("token", data.token);
            newWindow.location.reload();
          }, 500);
        }
      } else {
        alert("대행 로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("대행 로그인 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "STUDENT":
        return <Badge className="bg-blue-500">학생</Badge>;
      case "TEACHER":
        return <Badge className="bg-green-500">선생님</Badge>;
      case "DIRECTOR":
        return <Badge className="bg-purple-500">학원장</Badge>;
      case "ADMIN":
      case "SUPER_ADMIN":
        return <Badge className="bg-red-500">관리자</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin/users")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8 text-blue-600" />
              {user.name}
            </h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
          {getRoleBadge(user.role)}
        </div>
        <Button
          onClick={handleLoginAsUser}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <LogIn className="w-4 h-4 mr-2" />
          이 계정으로 로그인
        </Button>
      </div>

      {/* 기본 정보 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              가입일
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              마지막 로그인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "없음"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              마지막 IP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">
                {user.lastLoginIp || "없음"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전화번호
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">
                {user.phone || "없음"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 메뉴 */}
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            보안
          </TabsTrigger>
          <TabsTrigger value="bots">
            <Bot className="w-4 h-4 mr-2" />
            AI 봇
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            활동 기록
          </TabsTrigger>
          <TabsTrigger value="login">
            <Key className="w-4 h-4 mr-2" />
            로그인 기록
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="w-4 h-4 mr-2" />
            결제 내역
          </TabsTrigger>
        </TabsList>

        {/* 보안 탭 */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  비밀번호 관리
                </CardTitle>
                <CardDescription>
                  사용자의 비밀번호를 확인하고 재설정합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>현재 비밀번호</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={user.password}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호 입력"
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handleResetPassword}
                  className="w-full"
                  disabled={!newPassword}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  비밀번호 재설정
                </Button>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">주의사항</p>
                      <p>비밀번호 재설정 시 사용자에게 별도 알림이 전송되지 않습니다.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  계정 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">사용자 ID</span>
                  <span className="text-sm font-mono">{user.id}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">이메일</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">이름</span>
                  <span className="text-sm">{user.name}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">역할</span>
                  {getRoleBadge(user.role)}
                </div>
                {user.academyName && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">학원</span>
                    <span className="text-sm">{user.academyName}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI 봇 탭 */}
        <TabsContent value="bots">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-green-600" />
                    AI 봇 할당 관리
                  </CardTitle>
                  <CardDescription>
                    사용자에게 AI 봇을 할당하고 기간을 설정합니다
                  </CardDescription>
                </div>
                <Button onClick={() => router.push(`/dashboard/admin/users/${userId}/assign-bot`)}>
                  <Bot className="w-4 h-4 mr-2" />
                  봇 할당
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {botAssignments.map((assignment) => (
                  <Card key={assignment.id} className="border-2">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {assignment.botName}
                            {assignment.isActive ? (
                              <Badge className="bg-green-500">활성</Badge>
                            ) : (
                              <Badge variant="outline">만료</Badge>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(assignment.startDate).toLocaleDateString()} ~{" "}
                            {new Date(assignment.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          수정
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {botAssignments.length === 0 && (
                  <div className="text-center py-12">
                    <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">할당된 AI 봇이 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 활동 기록 탭 */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                활동 기록 ({activityLogs.length}건)
              </CardTitle>
              <CardDescription>
                사용자의 모든 활동이 기록됩니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{log.action}</p>
                        <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {log.ip}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {activityLogs.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">활동 기록이 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 로그인 기록 탭 */}
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-600" />
                로그인 기록 ({loginLogs.length}건)
              </CardTitle>
              <CardDescription>
                모든 로그인 시도가 기록됩니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loginLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 border rounded-lg ${
                      log.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            <Badge className="bg-green-500">성공</Badge>
                          ) : (
                            <Badge className="bg-red-500">실패</Badge>
                          )}
                          <span className="text-sm font-medium">{log.ip}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">{log.userAgent}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.loginAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {loginLogs.length === 0 && (
                  <div className="text-center py-12">
                    <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">로그인 기록이 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 결제 내역 탭 */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                    결제 내역 ({payments.length}건)
                  </CardTitle>
                  <CardDescription>
                    사용자의 모든 결제 기록을 확인합니다
                  </CardDescription>
                </div>
                <Button onClick={() => alert("결제 추가 기능은 곧 구현됩니다.")}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  결제 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.id} className="border-2">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{payment.productName}</h3>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {payment.amount.toLocaleString()}원
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(payment.paidAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            payment.status === "COMPLETED"
                              ? "bg-green-500"
                              : payment.status === "PENDING"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }
                        >
                          {payment.status === "COMPLETED"
                            ? "완료"
                            : payment.status === "PENDING"
                            ? "대기"
                            : "취소"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {payments.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">결제 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
