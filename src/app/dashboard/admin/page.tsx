"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  Bot,
  MessageSquare,
  TrendingUp,
  UserCheck,
  GraduationCap,
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    // 관리자 권한 체크
    if (userData.role !== "ADMIN" && userData.role !== "SUPER_ADMIN") {
      alert("관리자 권한이 필요합니다.");
      router.push("/dashboard");
      return;
    }

    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dashboard-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("통계 로드 실패:", error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            시스템 관리자 대시보드
          </h1>
          <p className="text-gray-600 mt-1">
            전체 시스템 현황을 모니터링하고 관리합니다
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">관리자</p>
          <p className="font-semibold">{user.name}</p>
        </div>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/admin/users")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 사용자
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.totalUsers || 0}명
            </div>
            <div className="flex items-center text-sm mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+{stats?.newUsersThisMonth || 0}</span>
              <span className="text-gray-500 ml-1">이번 달</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              학생 {stats?.usersByRole?.STUDENT || 0} | 선생님 {stats?.usersByRole?.TEACHER || 0} | 학원장 {stats?.usersByRole?.DIRECTOR || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/admin/academies")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              등록된 학원
            </CardTitle>
            <Building2 className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats?.totalAcademies || 0}개
            </div>
            <div className="flex items-center text-sm mt-2">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-gray-500">활성 {stats?.activeAcademies || 0}개</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              평균 학생 수: {stats?.averageStudentsPerAcademy || 0}명
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/admin/ai-bots")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              AI 봇
            </CardTitle>
            <Bot className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.totalBots || 0}개
            </div>
            <div className="flex items-center text-sm mt-2">
              <Activity className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-gray-500">활성 {stats?.activeBots || 0}개</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              이번 달 대화: {stats?.conversationsThisMonth || 0}건
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/admin/inquiries")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              문의 사항
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats?.totalInquiries || 0}건
            </div>
            <div className="flex items-center text-sm mt-2">
              <Clock className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-yellow-600">대기 {stats?.pendingInquiries || 0}건</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              완료 {stats?.resolvedInquiries || 0}건
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액세스 메뉴 */}
      <div>
        <h2 className="text-xl font-bold mb-4">빠른 액세스</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/users")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                사용자 관리
              </CardTitle>
              <CardDescription>
                전체 사용자를 관리하고 역할을 수정합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/academies")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                학원 관리
              </CardTitle>
              <CardDescription>
                등록된 학원 정보를 조회하고 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/ai-bots")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-green-600" />
                AI 봇 관리
              </CardTitle>
              <CardDescription>
                AI 챗봇을 생성하고 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/ai-bots/create")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                AI 봇 제작
              </CardTitle>
              <CardDescription>
                새로운 AI 챗봇을 만듭니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">새로 만들기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/inquiries")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-600" />
                문의 관리
              </CardTitle>
              <CardDescription>
                사용자 문의를 확인하고 답변합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/system")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-600" />
                시스템 설정
              </CardTitle>
              <CardDescription>
                시스템 전역 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">설정</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              최근 가입 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.recentUsers || []).slice(0, 5).map((recentUser: any) => (
                <div key={recentUser.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{recentUser.name}</p>
                    <p className="text-sm text-gray-600">{recentUser.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {recentUser.role === "STUDENT" ? "학생" : 
                       recentUser.role === "TEACHER" ? "선생님" : 
                       recentUser.role === "DIRECTOR" ? "학원장" : "관리자"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(recentUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
              <p className="text-center text-gray-500 py-8">최근 가입 사용자가 없습니다</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              대기 중인 문의
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.recentInquiries || []).slice(0, 5).map((inquiry: any) => (
                <div key={inquiry.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{inquiry.subject}</p>
                    <p className="text-xs text-gray-600 mt-1">{inquiry.userName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                      {inquiry.status === "PENDING" ? "대기" : "처리중"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {(!stats?.recentInquiries || stats.recentInquiries.length === 0) && (
              <p className="text-center text-gray-500 py-8">대기 중인 문의가 없습니다</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
