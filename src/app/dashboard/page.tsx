"use client";

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
          const response = await fetch(endpoint, {
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
  console.log('🎯 Dashboard Render - isSuperAdmin:', isSuperAdmin);
  console.log('🎯 Dashboard Render - isDirector:', isDirector);
  console.log('🎯 Dashboard Render - isTeacher:', isTeacher);
  console.log('🎯 Dashboard Render - isStudent:', isStudent);

  // Super Admin Dashboard
  if (isSuperAdmin) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              시스템 관리자 대시보드
            </h1>
            <p className="text-gray-600 mt-1">
              전체 시스템 현황을 모니터링하고 관리합니다
            </p>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                전체 사용자
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}명</div>
              <div className="flex items-center text-sm mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+{stats?.newUsersThisMonth || 0}명</span>
                <span className="text-gray-500 ml-1">이번 달</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                등록된 학원
              </CardTitle>
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-purple-600">{stats?.activeAcademies || 0}개</div>
              <div className="flex items-center text-sm mt-2">
                <span className="text-gray-500">전체 {stats?.totalAcademies || 0}개</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                활성 학생
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-green-600">{stats?.usersByRole?.STUDENT || 0}명</div>
              <div className="flex items-center text-sm mt-2">
                <span className="text-gray-500">전체 학생 수</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                AI 사용량
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-orange-600">{stats?.aiUsageThisMonth || 0}</div>
              <div className="flex items-center text-sm mt-2">
                <span className="text-gray-500">이번 달 사용</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Management Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500"
            onClick={() => router.push("/dashboard/admin/users")}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">사용자 관리</h3>
                  <p className="text-sm text-gray-600">전체 사용자 조회</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-500"
            onClick={() => router.push("/dashboard/admin/academies")}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">학원 관리</h3>
                  <p className="text-sm text-gray-600">학원 정보 관리</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-500"
            onClick={() => router.push("/dashboard/admin/ai-bots")}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AI 봇 관리</h3>
                  <p className="text-sm text-gray-600">AI 봇 생성/관리</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-orange-500"
            onClick={() => router.push("/dashboard/admin/inquiries")}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">문의 관리</h3>
                  <p className="text-sm text-gray-600">고객 문의 응답</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                최근 가입 사용자
              </CardTitle>
              <CardDescription>최근 7일 내 가입한 사용자 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.recentUsers || []).slice(0, 4).map((recentUser: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {recentUser.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{recentUser.name}</p>
                        <p className="text-sm text-gray-600">
                          {recentUser.role === "DIRECTOR" ? "학원장" : recentUser.role === "TEACHER" ? "선생님" : "학생"} · {recentUser.academy}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(recentUser.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => router.push("/dashboard/admin/users")}
              >
                전체 사용자 보기
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                시스템 상태
              </CardTitle>
              <CardDescription>실시간 시스템 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">서버 상태</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-green-600">정상</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">데이터베이스</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-green-600">연결됨</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI 서비스</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-green-600">활성</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => router.push("/dashboard/admin/system")}
                >
                  시스템 설정
                </Button>
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
              <p className="text-sm text-gray-500 mt-2">활동 중인 학생</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                출석률
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-green-600">
                {stats?.attendanceRate || 0}%
              </div>
              <p className="text-sm text-gray-500 mt-2">이번 달 평균</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                진행 중 과제
              </CardTitle>
              <FileText className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-purple-600">
                {stats?.activeHomework || 0}개
              </div>
              <p className="text-sm text-gray-500 mt-2">제출 대기 중</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                클래스
              </CardTitle>
              <BookOpen className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl sm:text-3xl font-bold text-orange-600">
                {stats?.totalClasses || 0}개
              </div>
              <p className="text-sm text-gray-500 mt-2">운영 중인 클래스</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                빠른 작업
              </CardTitle>
              <CardDescription>자주 사용하는 기능</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push("/dashboard/students")}
              >
                <Users className="h-6 w-6 text-blue-600" />
                <span className="text-sm">학생 관리</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push("/dashboard/classes")}
              >
                <BookOpen className="h-6 w-6 text-purple-600" />
                <span className="text-sm">클래스 관리</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-sm">출석 체크</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <FileText className="h-6 w-6 text-orange-600" />
                <span className="text-sm">과제 관리</span>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                최근 활동
              </CardTitle>
              <CardDescription>최근 학생 활동 내역</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stats?.recentActivities || []).slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-gray-900">{activity.description}</p>
                      <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
                {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                  <p className="text-center text-gray-500 py-4">최근 활동이 없습니다</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
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
                오늘도 열심히 공부해봐요!
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
  return (
    <div className="space-y-4 sm:space-y-6">
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
            <Button onClick={() => router.push("/dashboard/ai-chat")} className="w-full">
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
