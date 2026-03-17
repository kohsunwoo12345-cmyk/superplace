"use client";
// Force redeploy: 2026-02-13 16:48:18 - Add Payment Approval to Main Dashboard
// Force redeploy: 2026-02-13 16:54:36 - Add Payment Menu to Director Dashboard
// Force redeploy: 2026-03-13 17:30:00 - Improve dashboard with quick action blocks

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
  MessageCircle,
  BarChart2,
  Layout,
} from "lucide-react";
import SeminarWidget from "@/components/dashboard/SeminarWidget";

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

        {/* 세미나 섹션 - 관리자 전용 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  공지사항
                </CardTitle>
                <CardDescription>학원 운영 관련 공지사항 및 안내</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/dashboard/admin/seminars")}
              >
                관리하기
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

        {/* 세미나 섹션 - 학원장 전용 (상단) */}
        {isDirector && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    공지사항
                  </CardTitle>
                  <CardDescription>학원 운영 관련 공지사항 및 안내</CardDescription>
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
        )}

        {/* Quick Actions - 바로가기 블록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* 학생 관리 */}
          <Card 
            className="border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/students")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">학생 관리</h3>
                <p className="text-sm text-gray-600">학생 정보 및 성적 관리</p>
              </div>
            </CardContent>
          </Card>

          {/* 출석 현황 */}
          <Card 
            className="border-2 border-green-100 hover:border-green-300 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/attendance-statistics")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">출석 현황</h3>
                <p className="text-sm text-gray-600">오늘의 출석 체크</p>
              </div>
            </CardContent>
          </Card>

          {/* 숙제 관리 */}
          <Card 
            className="border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/homework/teacher")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">숙제 관리</h3>
                <p className="text-sm text-gray-600">숙제 등록 및 채점</p>
              </div>
            </CardContent>
          </Card>

          {/* 알림톡 발송 */}
          {isDirector && (
            <Card 
              className="border-2 border-orange-100 hover:border-orange-300 hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => router.push("/dashboard/message-dashboard")}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                    <MessageCircle className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">알림톡 발송</h3>
                  <p className="text-sm text-gray-600">문자 및 알림 보내기</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 수업 관리 (선생님용) */}
          {isTeacher && (
            <Card 
              className="border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => router.push("/dashboard/classes")}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                    <BookOpen className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">수업 관리</h3>
                  <p className="text-sm text-gray-600">내 수업 일정 확인</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                       onClick={() => router.push("/dashboard/students")}>
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

          {/* 숙제 현황 상세 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                숙제 현황 상세
              </CardTitle>
              <CardDescription>숙제 제출 및 채점 상태</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/homework/teacher")}>
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

                <div className="p-3 border rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/dashboard/homework/results")}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">진행 중인 숙제</p>
                    <span className="text-lg font-bold text-green-600">{stats?.activeHomework || 0}개</span>
                  </div>
                  <p className="text-xs text-gray-600">마감 전 숙제</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Quick Links - 학원장 전용 */}
        {isDirector && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card 
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => router.push("/dashboard/teacher-management")}
            >
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col items-center text-center">
                  <GraduationCap className="h-8 w-8 text-purple-600 mb-2" />
                  <p className="font-medium text-sm">교사 관리</p>
                  <p className="text-xs text-gray-500 mt-1">{stats?.totalTeachers || 0}명</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => router.push("/dashboard/kakao-channel")}
            >
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col items-center text-center">
                  <MessageCircle className="h-8 w-8 text-yellow-600 mb-2" />
                  <p className="font-medium text-sm">카카오 채널</p>
                  <p className="text-xs text-gray-500 mt-1">연동 관리</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => router.push("/dashboard/analytics")}
            >
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col items-center text-center">
                  <BarChart2 className="h-8 w-8 text-blue-600 mb-2" />
                  <p className="font-medium text-sm">통계 분석</p>
                  <p className="text-xs text-gray-500 mt-1">상세 보기</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => router.push("/dashboard/admin/landing-pages")}
            >
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col items-center text-center">
                  <Layout className="h-8 w-8 text-indigo-600 mb-2" />
                  <p className="font-medium text-sm">랜딩페이지</p>
                  <p className="text-xs text-gray-500 mt-1">제작하기</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Student Dashboard  
  if (isStudent) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section - 더 화려하게 */}
        <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-3xl p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-white drop-shadow-lg">
                안녕하세요, {user.name}님! 🎓
              </h1>
              <p className="text-lg text-white/90 font-medium">
                {stats?.academyName ? `${stats.academyName} | ` : ''}오늘도 열심히 공부해봐요!
              </p>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => router.push("/ai-chat")}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  AI 챗봇 💬
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => router.push("/dashboard/homework/student")}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  과제 확인 📚
                </Button>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl"></div>
                <Award className="relative h-20 w-20 lg:h-24 lg:w-24 text-white drop-shadow-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - 더 시각적으로 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-all hover:scale-105 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-1">
                {stats?.attendanceDays || 0}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">출석일</p>
              <p className="text-xs text-gray-500 mt-1">이번 달</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white hover:shadow-xl transition-all hover:scale-105 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-1">
                {stats?.completedHomework || 0}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">완료 과제</p>
              <p className="text-xs text-gray-500 mt-1">이번 달</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white hover:shadow-xl transition-all hover:scale-105 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-1">
                {stats?.averageScore || 0}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">평균 점수</p>
              <p className="text-xs text-gray-500 mt-1">전체 평균</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white hover:shadow-xl transition-all hover:scale-105 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-1">
                {stats?.studyHours || 0}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">학습 시간</p>
              <p className="text-xs text-gray-500 mt-1">이번 주</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Cards - 새로 추가 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-pink-50 to-white border-2 border-pink-100"
            onClick={() => router.push("/ai-chat")}
          >
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-pink-100 rounded-2xl mb-3">
                  <MessageCircle className="h-8 w-8 text-pink-600" />
                </div>
                <p className="font-semibold text-sm">AI 챗봇</p>
                <p className="text-xs text-gray-500 mt-1">24시간 학습 도우미</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100"
            onClick={() => router.push("/dashboard/homework/student")}
          >
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-indigo-100 rounded-2xl mb-3">
                  <FileText className="h-8 w-8 text-indigo-600" />
                </div>
                <p className="font-semibold text-sm">과제 제출</p>
                <p className="text-xs text-gray-500 mt-1">숙제 확인하기</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-teal-50 to-white border-2 border-teal-100"
            onClick={() => router.push("/dashboard/my-attendance")}
          >
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-teal-100 rounded-2xl mb-3">
                  <CheckCircle className="h-8 w-8 text-teal-600" />
                </div>
                <p className="font-semibold text-sm">출석 체크</p>
                <p className="text-xs text-gray-500 mt-1">내 출석 현황</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-amber-50 to-white border-2 border-amber-100"
            onClick={() => router.push("/dashboard/reports/student")}
          >
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-amber-100 rounded-2xl mb-3">
                  <BarChart3 className="h-8 w-8 text-amber-600" />
                </div>
                <p className="font-semibold text-sm">학습 리포트</p>
                <p className="text-xs text-gray-500 mt-1">성적 확인</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Pending Homework */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                제출할 과제
              </CardTitle>
              <CardDescription>마감일이 임박한 과제를 확인하세요</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {(stats?.pendingHomework || []).map((hw: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border-2 border-orange-100 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-all cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{hw.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{hw.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-600 mb-2">
                        D-{hw.daysLeft}
                      </p>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">제출하기</Button>
                    </div>
                  </div>
                ))}
                {(!stats?.pendingHomework || stats.pendingHomework.length === 0) && (
                  <div className="text-center py-12">
                    <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700">제출할 과제가 없습니다</p>
                    <p className="text-sm text-gray-500 mt-2">모든 과제를 완료했어요! 🎉</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                오늘의 일정
              </CardTitle>
              <CardDescription>오늘 진행될 수업 일정</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {(stats?.todaySchedule || []).map((schedule: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border-2 border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all"
                  >
                    <div className="text-center min-w-[80px]">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{schedule.time}</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{schedule.subject}</p>
                      <p className="text-sm text-gray-600 mt-1">👨‍🏫 {schedule.teacher}</p>
                    </div>
                  </div>
                ))}
                {(!stats?.todaySchedule || stats.todaySchedule.length === 0) && (
                  <div className="text-center py-12">
                    <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                      <Calendar className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700">오늘 수업 일정이 없습니다</p>
                    <p className="text-sm text-gray-500 mt-2">편안한 하루 보내세요! 😊</p>
                  </div>
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
