"use client";
// Force redeploy: 2026-02-13 16:48:18 - Add Payment Approval to Main Dashboard
// Force redeploy: 2026-02-13 16:54:36 - Add Payment Menu to Director Dashboard
// Force redeploy: 2026-03-13 16:15:00 - Add Seminar Widget to Director Dashboard

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  FileText,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
  BarChart3,
  GraduationCap,
} from "lucide-react";
import SeminarWidget from "@/components/dashboard/SeminarWidget";
import DashboardSeminarsWidget from "@/components/dashboard/DashboardSeminarsWidget";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  academyId?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 로드 및 stats 가져오기
  useEffect(() => {
    const loadUserAndStats = async () => {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/login");
        return;
      }
      
      try {
        const userData = JSON.parse(userStr);
        console.log('🔍 Dashboard - User loaded:', userData);
        console.log('🔍 Dashboard - User role:', userData.role);
        setUser(userData);

        // role 체크
        const role = userData.role?.toUpperCase();
        const isSuperAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
        const isDirector = role === "DIRECTOR";
        const isTeacher = role === "TEACHER";
        const isStudent = role === "STUDENT";

        console.log('🔍 Dashboard - isSuperAdmin:', isSuperAdmin);
        console.log('🔍 Dashboard - isDirector:', isDirector);
        console.log('🔍 Dashboard - isTeacher:', isTeacher);
        console.log('🔍 Dashboard - isStudent:', isStudent);

        // stats 가져오기
        let endpoint = '';
        
        if (isSuperAdmin) {
          endpoint = '/api/admin/dashboard-stats';
        } else if (isDirector || isTeacher) {
          endpoint = '/api/dashboard/director-stats';
        } else if (isStudent) {
          endpoint = '/api/dashboard/student-stats';
        }

        console.log('🔍 Dashboard - Stats endpoint:', endpoint);

        if (endpoint) {
          const token = localStorage.getItem("token");
          const params = new URLSearchParams({
            userId: userData.id,
            role: userData.role,
            academyId: userData.academyId || "",
          });
          const response = await fetch(`${endpoint}?${params}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 Dashboard - Stats data:', data);
            setStats(data);
          } else {
            console.error('❌ Dashboard - Stats fetch failed:', response.status);
          }
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUserAndStats();
  }, [router]);

  const role = user?.role?.toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
  const isDirector = role === "DIRECTOR";
  const isTeacher = role === "TEACHER";
  const isStudent = role === "STUDENT";

  // Loading state
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 디버그 정보 표시 (개발 중)
  console.log('🎯 Dashboard Render - user:', user);
  console.log('🎯 Dashboard Render - role:', role);
  console.log('🎯 Dashboard Render - isSuperAdmin:', isSuperAdmin);
  console.log('🎯 Dashboard Render - isDirector:', isDirector);
  console.log('🎯 Dashboard Render - isTeacher:', isTeacher);
  console.log('🎯 Dashboard Render - isStudent:', isStudent);
  console.log('🎯 Dashboard Render - stats:', stats);

  // Super Admin Dashboard - 학원장 UI를 그대로 사용하되 데이터만 관리자용으로 변경
  if (isSuperAdmin) {
    console.log('✅ Rendering Super Admin Dashboard');
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section - 학원장과 동일한 디자인 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold mb-2">
                안녕하세요, {user.name}님! 👋
              </h1>
              <p className="text-blue-100">
                전체 시스템을 관리해주세요
              </p>
            </div>
            <GraduationCap className="h-16 w-16 opacity-80" />
          </div>
        </div>

        {/* Stats Cards - 학원장과 동일한 디자인 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                전체 사용자
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-blue-600">
                {stats?.totalUsers || 0}명
              </div>
              <p className="text-sm text-gray-500 mt-2">
                학원 {stats?.totalAcademies || 0}개
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                오늘 출석
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-green-600">
                {stats?.todayAttendance || 0}명
              </div>
              <p className="text-sm text-gray-500 mt-2">
                전체 출석률 {Math.round((stats?.todayAttendance || 0) / (stats?.totalUsers || 1) * 100)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                숙제 제출
              </CardTitle>
              <FileText className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-purple-600">
                {stats?.todayHomework || 0}개
              </div>
              <p className="text-sm text-gray-500 mt-2">
                오늘 제출됨
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                AI 사용량
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-orange-600">
                {stats?.aiUsageThisMonth || 0}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                이번 달
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity - 학원장과 동일한 3칸 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* 최근 가입 사용자 - 학원장의 "오늘 출석 알림" 스타일 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                최근 가입 사용자
              </CardTitle>
              <CardDescription>실시간 사용자 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.recentUsers || []).slice(0, 5).map((recentUser: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-green-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="font-semibold text-green-600 text-sm">
                          {recentUser.name?.[0] || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{recentUser.name}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(recentUser.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {recentUser.role === "DIRECTOR" ? "학원장" : recentUser.role === "TEACHER" ? "선생님" : recentUser.role === "STUDENT" ? "학생" : recentUser.role}
                    </span>
                  </div>
                ))}
                {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                  <p className="text-center text-gray-500 py-4 text-sm">최근 가입 사용자가 없습니다</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 학원 현황 - 학원장의 "숙제 검사 결과" 스타일 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                학원 현황
              </CardTitle>
              <CardDescription>등록된 학원 정보</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/admin/academies")}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">등록된 학원</p>
                    <span className="text-lg font-bold text-blue-600">{stats?.activeAcademies || 0}개</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded">전체: {stats?.totalAcademies || 0}개</span>
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/admin/ai-bots")}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">AI 봇 관리</p>
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded">AI 봇 생성 및 관리</span>
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/admin/users")}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">사용자 관리</p>
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded">전체 사용자 조회</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 관리 메뉴 - 학원장의 "숙제 미제출" 스타일 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                관리 메뉴
              </CardTitle>
              <CardDescription>시스템 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/admin/users")}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">사용자 관리</p>
                      <p className="text-xs text-gray-600">
                        전체 사용자 조회
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/admin/academies")}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">학원 관리</p>
                      <p className="text-xs text-gray-600">
                        학원 정보 관리
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/admin/ai-bots")}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">AI 봇 관리</p>
                      <p className="text-xs text-gray-600">
                        AI 봇 생성/관리
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/admin/inquiries")}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">문의 관리</p>
                      <p className="text-xs text-gray-600">
                        고객 문의 응답
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/admin/payment-approvals")}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">💳 결제 승인</p>
                      <p className="text-xs text-gray-600">
                        결제 요청 검토
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Director/Teacher Dashboard
  if (isDirector || isTeacher) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold mb-2">
                안녕하세요, {user.name}님! 👋
              </h1>
              <p className="text-blue-100">
                오늘도 학생들의 학습을 관리해주세요
              </p>
            </div>
            <GraduationCap className="h-16 w-16 opacity-80" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                전체 학생
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-blue-600">
                {stats?.totalStudents || 0}명
              </div>
              <p className="text-sm text-gray-500 mt-2">
                선생님 {stats?.totalTeachers || 0}명
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                오늘 출석
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-green-600">
                {stats?.todayStats?.attendance || 0}명
              </div>
              <p className="text-sm text-gray-500 mt-2">
                출석률 {stats?.attendanceRate || 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                오늘 숙제 제출
              </CardTitle>
              <FileText className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-purple-600">
                {stats?.todaySubmittedHomework || 0}개
              </div>
              <p className="text-sm text-gray-500 mt-2">
                오늘 제출됨
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                숙제 미제출
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-red-600">
                {stats?.overdueHomework || 0}개
              </div>
              <p className="text-sm text-gray-500 mt-2">
                기한 경과 (미제출)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* 최근 등록 학생 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                최근 등록 학생
              </CardTitle>
              <CardDescription>신규 학생 현황 (이번 주 {stats?.thisWeekStudents || 0}명)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.recentStudents || []).slice(0, 5).map((student: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-green-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="font-semibold text-green-600 text-sm">
                          {student.name?.[0] || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(student.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      학생
                    </span>
                  </div>
                ))}
                {(!stats?.recentStudents || stats.recentStudents.length === 0) && (
                  <p className="text-center text-gray-500 py-4 text-sm">최근 등록 학생이 없습니다</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 숙제 통계 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                숙제 현황
              </CardTitle>
              <CardDescription>숙제 제출 및 채점 상태</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/homework")}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">전체 숙제</p>
                    <span className="text-lg font-bold text-blue-600">{stats?.totalHomework || 0}개</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">제출: {stats?.submittedHomework || 0}</span>
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded">미제출: {stats?.overdueHomework || 0}</span>
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-purple-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">이번 주 제출률</p>
                    <span className="text-lg font-bold text-purple-600">{stats?.homeworkSubmissionRate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${stats?.homeworkSubmissionRate || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-green-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">진행 중인 숙제</p>
                    <span className="text-lg font-bold text-green-600">{stats?.activeHomework || 0}개</span>
                  </div>
                  <p className="text-xs text-gray-600">마감 전 숙제</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI 봇 활동만 표시 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                AI 봇 활동
              </CardTitle>
              <CardDescription>AI 챗봇 사용 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg hover:bg-orange-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">전체 대화</p>
                    <span className="text-lg font-bold text-orange-600">{stats?.totalAIConversations || 0}회</span>
                  </div>
                  <p className="text-xs text-gray-600">누적 대화 수</p>
                </div>

                <div className="p-3 border rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">활성 봇</p>
                    <span className="text-lg font-bold text-blue-600">{stats?.activeAIBots || 0}개</span>
                  </div>
                  <p className="text-xs text-gray-600">현재 사용 가능</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 세미나 섹션 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  진행 예정 세미나
                </CardTitle>
                <CardDescription>전문가 세미나 및 워크샵</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/dashboard/seminars")}
              >
                전체보기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SeminarWidget />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Student Dashboard  
  if (isStudent) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold mb-2">
                안녕하세요, {user.name}님! 🎓
              </h1>
              <p className="text-green-100">
                {stats?.academyName ? `${stats.academyName} | ` : ''}오늘도 열심히 공부해봐요!
              </p>
            </div>
            <Award className="h-16 w-16 opacity-80" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                출석일
              </CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-blue-600">
                {stats?.attendanceDays || 0}일
              </div>
              <p className="text-sm text-gray-500 mt-2">이번 달</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                완료 과제
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-green-600">
                {stats?.completedHomework || 0}개
              </div>
              <p className="text-sm text-gray-500 mt-2">이번 달</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                평균 점수
              </CardTitle>
              <Award className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-purple-600">
                {stats?.averageScore || 0}점
              </div>
              <p className="text-sm text-gray-500 mt-2">전체 평균</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                학습 시간
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-orange-600">
                {stats?.studyHours || 0}시간
              </div>
              <p className="text-sm text-gray-500 mt-2">이번 주</p>
            </CardContent>
          </Card>
        </div>

        {/* Student Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Pending Homework */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                제출할 과제
              </CardTitle>
              <CardDescription>마감일이 임박한 과제</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.pendingHomework || []).map((hw: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{hw.title}</p>
                      <p className="text-sm text-gray-600">{hw.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        {hw.daysLeft}일 남음
                      </p>
                      <Button size="sm" className="mt-2">제출하기</Button>
                    </div>
                  </div>
                ))}
                {(!stats?.pendingHomework || stats.pendingHomework.length === 0) && (
                  <p className="text-center text-gray-500 py-8">제출할 과제가 없습니다 🎉</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                오늘의 일정
              </CardTitle>
              <CardDescription>오늘 진행될 수업</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.todaySchedule || []).map((schedule: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{schedule.time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{schedule.subject}</p>
                      <p className="text-sm text-gray-600">{schedule.teacher}</p>
                    </div>
                  </div>
                ))}
                {(!stats?.todaySchedule || stats.todaySchedule.length === 0) && (
                  <p className="text-center text-gray-500 py-8">오늘 일정이 없습니다</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default fallback - 모든 사용자에게 기본 대시보드 표시
  console.warn('⚠️ Default fallback dashboard - No role matched!');
  console.warn('⚠️ user.role:', user?.role);
  console.warn('⚠️ role (uppercase):', role);
  console.warn('⚠️ isSuperAdmin:', isSuperAdmin);
  console.warn('⚠️ isDirector:', isDirector);
  console.warn('⚠️ isTeacher:', isTeacher);
  console.warn('⚠️ isStudent:', isStudent);
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Debug Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
        <p className="font-bold text-red-800">⚠️ 경고: 기본 대시보드가 표시되고 있습니다</p>
        <p className="mt-2">디버그 정보:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>사용자: {user?.name} ({user?.email})</li>
          <li>역할 (원본): "{user?.role}"</li>
          <li>역할 (대문자): "{role}"</li>
          <li>관리자 체크: {isSuperAdmin ? '✅' : '❌'} (role === "SUPER_ADMIN" || role === "ADMIN")</li>
          <li>학원장 체크: {isDirector ? '✅' : '❌'} (role === "DIRECTOR")</li>
          <li>선생님 체크: {isTeacher ? '✅' : '❌'} (role === "TEACHER")</li>
          <li>학생 체크: {isStudent ? '✅' : '❌'} (role === "STUDENT")</li>
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            대시보드
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.name || '사용자'}님, 환영합니다! (역할: {user?.role || '알 수 없음'})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              학생 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">학생 정보를 관리합니다</p>
            <Button onClick={() => router.push("/dashboard/students")} className="w-full">
              바로가기
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              선생님 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">선생님 정보를 관리합니다</p>
            <Button onClick={() => router.push("/dashboard/teachers")} className="w-full">
              바로가기
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              클래스 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">클래스를 관리합니다</p>
            <Button onClick={() => router.push("/dashboard/classes")} className="w-full">
              바로가기
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">학습 데이터를 분석합니다</p>
            <Button onClick={() => router.push("/dashboard/analytics")} className="w-full">
              바로가기
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              AI 챗봇
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">AI 학습 도우미와 대화합니다</p>
            <Button onClick={() => router.push("/ai-chat")} className="w-full">
              바로가기
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">계정 설정을 관리합니다</p>
            <Button onClick={() => router.push("/dashboard/settings")} className="w-full" variant="outline">
              바로가기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
