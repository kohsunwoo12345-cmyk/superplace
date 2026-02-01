"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, UserCircle } from "lucide-react";

interface PendingUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  createdAt: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  academy?: {
    id: string;
    name: string;
  } | null;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      router.push("/dashboard");
      return;
    }

    if (status === "authenticated") {
      fetchStats();
      fetchPendingUsers();
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setRecentUsers(data.recentUsers || []);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch("/api/admin/users/pending");
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
    }
  };

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      const response = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast({
          title: "승인 완료",
          description: "사용자가 승인되었습니다. 이제 로그인할 수 있습니다.",
        });
        fetchPendingUsers();
        fetchStats();
      } else {
        const data = await response.json();
        toast({
          title: "승인 실패",
          description: data.error || "승인 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to approve user:", error);
      toast({
        title: "승인 실패",
        description: "승인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setApprovingId(null);
    }
  };

  // Helper function to get role text in Korean
  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "관리자",
      DIRECTOR: "학원장",
      TEACHER: "선생님",
      STUDENT: "학생",
    };
    return roleMap[role] || role;
  };

  // Helper function to get user initials
  const getUserInitials = (name: string) => {
    return name?.[0] || "U";
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <p className="text-gray-600 mt-1">
          시스템 전체 현황을 모니터링합니다
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 사용자
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              +{stats?.newUsersThisMonth || 0} 이번 달
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              활성 구독
            </CardTitle>
            <CreditCard className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              전체 사용자의 {stats?.subscriptionRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              이번 달 매출
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{(stats?.monthlyRevenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              +{stats?.revenueGrowth || 0}% 전월 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              플랫폼 연동
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.connectedPlatforms || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              총 {stats?.totalConnections || 0}개 연결
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Users Approval */}
      {pendingUsers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">승인 대기 중인 회원</CardTitle>
            </div>
            <CardDescription className="text-orange-700">
              {pendingUsers.length}명의 회원이 승인을 기다리고 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-white border border-orange-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                        승인 대기
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{user.email}</div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      {user.company && (
                        <span>회사: {user.company}</span>
                      )}
                      {user.phone && (
                        <span>전화: {user.phone}</span>
                      )}
                      <span>
                        가입일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleApprove(user.id)}
                    disabled={approvingId === user.id}
                    className="ml-4 bg-green-600 hover:bg-green-700"
                  >
                    {approvingId === user.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        승인 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        승인하기
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Users (Last 7 Days) */}
      {recentUsers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>최근 가입 사용자</CardTitle>
                <CardDescription>최근 7일 내 가입한 사용자 목록</CardDescription>
              </div>
              <Link href="/dashboard/admin/users">
                <Button variant="outline" size="sm">
                  <UserCircle className="h-4 w-4 mr-2" />
                  전체 보기
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/dashboard/admin/users/${user.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {getUserInitials(user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        {user.academy ? (
                          <div className="text-xs text-blue-600 mt-1">
                            {user.academy.name}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 mt-1">미소속</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "SUPERADMIN"
                            ? "bg-red-100 text-red-700"
                            : user.role === "DIRECTOR"
                            ? "bg-purple-100 text-purple-700"
                            : user.role === "TEACHER"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {getRoleText(user.role)}
                      </span>
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("ko-KR", {
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle>구독 현황</CardTitle>
          <CardDescription>플랜별 구독 분포</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-gray-400">
                {stats?.subscriptionsByPlan?.FREE || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">무료</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.subscriptionsByPlan?.BASIC || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">베이직</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.subscriptionsByPlan?.PREMIUM || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">프리미엄</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {stats?.subscriptionsByPlan?.ENTERPRISE || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">엔터프라이즈</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
