"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isDirector = session?.user?.role === "DIRECTOR";
  const isTeacher = session?.user?.role === "TEACHER";
  const isStudent = session?.user?.role === "STUDENT";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        let endpoint = '';
        
        if (isSuperAdmin) {
          endpoint = '/api/admin/dashboard-stats';
        } else if (isDirector || isTeacher) {
          endpoint = '/api/dashboard/director-stats';
        } else if (isStudent) {
          endpoint = '/api/dashboard/student-stats';
        }

        if (endpoint) {
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            setStats(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session, isSuperAdmin, isDirector, isTeacher, isStudent]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Super Admin Dashboard
  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              시스템 관리자 대시보드
            </h1>
            <p className="text-gray-600 mt-1">
              전체 시스템 현황을 모니터링하고 관리합니다
            </p>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                전체 사용자
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}명</div>
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
              <div className="text-3xl font-bold text-purple-600">{stats?.activeAcademies || 0}개</div>
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
              <div className="text-3xl font-bold text-green-600">{stats?.usersByRole?.STUDENT || 0}명</div>
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
              <div className="text-3xl font-bold text-orange-600">{stats?.aiUsageThisMonth || 0}</div>
              <div className="flex items-center text-sm mt-2">
                <span className="text-gray-500">이번 달 사용</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {(stats?.recentUsers || []).slice(0, 4).map((user: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {user.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">
                          {user.role === "DIRECTOR" ? "학원장" : user.role === "TEACHER" ? "선생님" : "학생"} · {user.academy}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                전체 사용자 보기
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                시스템 상태
              </CardTitle>
              <CardDescription>현재 시스템 운영 상태</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "데이터베이스", status: "정상", color: "green" },
                  { name: "API 서버", status: "정상", color: "green" },
                  { name: "AI 서비스", status: "정상", color: "green" },
                  { name: "파일 저장소", status: "정상", color: "green" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{item.name}</span>
                    <span className={`text-sm px-3 py-1 rounded-full bg-${item.color}-100 text-${item.color}-700`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Academy Overview */}
        <Card className="border-2 border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              학원 현황
            </CardTitle>
            <CardDescription>요금제별 학원 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { plan: "FREE", count: stats?.academiesByPlan?.FREE || 0, color: "gray" },
                { plan: "BASIC", count: stats?.academiesByPlan?.BASIC || 0, color: "blue" },
                { plan: "PRO", count: stats?.academiesByPlan?.PRO || 0, color: "purple" },
                { plan: "ENTERPRISE", count: stats?.academiesByPlan?.ENTERPRISE || 0, color: "orange" },
              ].map((item) => (
                <div key={item.plan}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{item.plan}</span>
                    <span className="text-sm text-gray-600">{item.count}개 학원</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`bg-${item.color}-600 h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${stats?.totalAcademies > 0 ? (item.count / stats.totalAcademies) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 실행</CardTitle>
            <CardDescription>관리자 전용 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
                <span>사용자 관리</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-purple-50">
                <GraduationCap className="h-6 w-6 text-purple-600" />
                <span>학원 관리</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-green-50">
                <BarChart3 className="h-6 w-6 text-green-600" />
                <span>전체 통계</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-orange-50">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <span>시스템 설정</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Director Dashboard
  if (isDirector || isTeacher) {
    const studentCount = stats?.counts?.students?.total || 0;
    const pendingStudents = stats?.counts?.students?.pending || 0;
    const assignmentsPending = stats?.assignments?.pending || 0;
    const attendanceRate = Math.round(stats?.attendance?.rate || 0);

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              학원장 대시보드
            </h1>
            <p className="text-gray-600 mt-1">
              {stats?.academy?.name || '학원'} 운영 현황을 한눈에 확인하세요
            </p>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-purple-600"
            onClick={() => window.location.href = '/dashboard/students?create=true'}
          >
            <Users className="h-4 w-4 mr-2" />
            학생 추가
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                전체 학생
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{studentCount}명</div>
              <div className="flex items-center text-sm mt-2">
                {pendingStudents > 0 ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-orange-500">{pendingStudents}명 승인 대기</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500">전체 승인 완료</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                선생님
              </CardTitle>
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats?.counts?.teachers || 0}명</div>
              <div className="flex items-center text-sm mt-2">
                <span className="text-gray-500">
                  최대 {stats?.academy?.limits?.maxTeachers || 0}명
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                과제 현황
              </CardTitle>
              <FileText className="h-5 w-5 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">{stats?.assignments?.total || 0}건</div>
              <div className="flex items-center text-sm mt-2">
                <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-orange-500">검토 대기 {assignmentsPending}건</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                평균 출석률
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{attendanceRate}%</div>
              <div className="flex items-center text-sm mt-2">
                <span className="text-gray-500">
                  최근 30일 기준
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                우수 학생
              </CardTitle>
              <CardDescription>출석률 기준 상위 학생 (최근 30일)</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.topStudents && stats.topStudents.length > 0 ? (
                <div className="space-y-3">
                  {stats.topStudents.map((student: any, index: number) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/students/${student.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-semibold text-blue-600">
                            {student.name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-600">
                            {student.grade || '학년 미등록'} · 출석률 {student.attendanceRate}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">
                          평균 {student.averageScore}점
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  등록된 학생이 없습니다
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => window.location.href = '/dashboard/students'}
              >
                전체 학생 보기
              </Button>
            </CardContent>
          </Card>

          {/* Statistics Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                학습 통계 요약
              </CardTitle>
              <CardDescription>최근 30일 데이터 기반</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">출석 현황</span>
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">출석</span>
                      <span className="font-semibold">{stats?.attendance?.present || 0}회</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">결석</span>
                      <span className="font-semibold text-red-600">{stats?.attendance?.absent || 0}회</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">지각</span>
                      <span className="font-semibold text-orange-600">{stats?.attendance?.late || 0}회</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">과제 현황</span>
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">채점 완료</span>
                      <span className="font-semibold">{stats?.assignments?.graded || 0}건</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">제출됨</span>
                      <span className="font-semibold text-blue-600">{stats?.assignments?.submitted || 0}건</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">대기중</span>
                      <span className="font-semibold text-orange-600">{stats?.assignments?.pending || 0}건</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                      <span className="text-gray-700 font-medium">평균 점수</span>
                      <span className="font-bold text-purple-600">
                        {Math.round(stats?.assignments?.averageScore || 0)}점
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">수업</span>
                    <span className="font-bold text-green-600 text-xl">
                      {stats?.counts?.classes || 0}개
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Progress by Subject */}
        {stats?.allStudents && stats.allStudents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                전체 학생 현황
              </CardTitle>
              <CardDescription>학생별 학습 진도 및 성적</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.allStudents.slice(0, 6).map((student: any, index: number) => (
                  <div
                    key={student.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.location.href = `/dashboard/students/${student.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.grade || '학년 미등록'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">출석률</span>
                        <span className={`font-semibold ${student.attendanceRate >= 90 ? 'text-green-600' : student.attendanceRate >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                          {student.attendanceRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">평균 점수</span>
                        <span className="font-semibold text-blue-600">
                          {student.averageScore}점
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">진도율</span>
                        <span className="font-semibold text-purple-600">
                          {student.averageProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Student Dashboard
  if (isStudent) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            내 학습 현황
          </h1>
          <p className="text-gray-600 mt-1">
            안녕하세요, {session?.user?.name}님! 오늘도 열심히 학습해봐요 🎯
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    수강 중인 수업
                  </CardTitle>
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.enrolledClasses?.length || 0}개
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    과제 현황
                  </CardTitle>
                  <FileText className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {stats.assignments?.total || 0}건
                  </div>
                  <div className="flex items-center text-sm mt-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-orange-500">
                      미제출 {stats.assignments?.pending || 0}건
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-pink-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    평균 성적
                  </CardTitle>
                  <Award className="h-5 w-5 text-pink-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-pink-600">
                    {Math.round(stats.testScores?.averageScore || 0)}점
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    최근 5회 평균
                  </div>
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
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(stats.attendance?.rate || 0)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    최근 30일 기준
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Classes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    수강 중인 수업
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.enrolledClasses && stats.enrolledClasses.length > 0 ? (
                    <div className="space-y-3">
                      {stats.enrolledClasses.map((cls: any) => (
                        <div
                          key={cls.id}
                          className="p-3 border rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <p className="font-medium">{cls.class.name}</p>
                          <p className="text-sm text-gray-600">
                            {cls.class.teacher?.name || '담당 선생님 미배정'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      수강 중인 수업이 없습니다
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Learning Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    학습 진도
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.learningProgress && stats.learningProgress.length > 0 ? (
                    <div className="space-y-4">
                      {stats.learningProgress.map((progress: any) => (
                        <div key={progress.id}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">
                              {progress.material.title}
                            </span>
                            <span className="text-sm font-semibold text-purple-600">
                              {progress.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      학습 진도가 없습니다
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">대시보드</h2>
        <p className="text-gray-600">로그인이 필요합니다</p>
      </div>
    </div>
  );
}
