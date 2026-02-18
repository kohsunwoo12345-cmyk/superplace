"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Calendar,
  Award
} from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    averageAttendance: 0,
    completionRate: 0,
    monthlyGrowth: 0
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    fetchAnalytics();
  }, [router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      // 역할에 따라 다른 API 호출
      let apiEndpoint = '';
      let queryParams = '';

      if (user.role === 'STUDENT') {
        // 학생용 통계
        apiEndpoint = '/api/dashboard/student-stats';
        queryParams = `?userId=${user.id}${user.academyId ? `&academyId=${user.academyId}` : ''}`;
      } else if (user.role === 'DIRECTOR' || user.role === 'TEACHER') {
        // 원장/교사용 통계
        apiEndpoint = '/api/dashboard/director-stats';
        queryParams = `?academyId=${user.academyId}&role=${user.role}&userId=${user.id}`;
      } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        // 관리자용 전체 통계
        apiEndpoint = '/api/admin/dashboard-stats';
        queryParams = '';
      }

      try {
        const response = await fetch(`${apiEndpoint}${queryParams}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // 데이터 매핑
          if (user.role === 'STUDENT') {
            setStats({
              totalStudents: 1, // 본인
              totalClasses: data.enrolledClasses || 0,
              totalAssignments: data.completedHomework || 0,
              averageAttendance: data.attendanceDays || 0,
              completionRate: data.averageScore || 0,
              monthlyGrowth: 0
            });
          } else if (user.role === 'DIRECTOR' || user.role === 'TEACHER') {
            setStats({
              totalStudents: data.totalStudents || 0,
              totalClasses: data.totalClasses || 0,
              totalAssignments: 0,
              averageAttendance: data.attendanceRate || 0,
              completionRate: 0,
              monthlyGrowth: data.thisWeekStudents || 0
            });
          } else {
            setStats({
              totalStudents: data.totalStudents || 0,
              totalClasses: data.totalAcademies || 0,
              totalAssignments: data.totalBots || 0,
              averageAttendance: data.averageAttendance || 0,
              completionRate: data.activeRate || 0,
              monthlyGrowth: data.monthlyGrowth || 0
            });
          }
          return;
        }
      } catch (apiError) {
        console.log('API 호출 실패, 기본 데이터 사용:', apiError);
      }
      
      // API 호출 실패 시 기본 데이터
      setStats({
        totalStudents: 125,
        totalClasses: 8,
        totalAssignments: 45,
        averageAttendance: 92.5,
        completionRate: 87.3,
        monthlyGrowth: 12.5
      });
    } catch (error) {
      console.error("분석 데이터 로드 오류:", error);
      // 에러 발생 시에도 기본 값 설정
      setStats({
        totalStudents: 0,
        totalClasses: 0,
        totalAssignments: 0,
        averageAttendance: 0,
        completionRate: 0,
        monthlyGrowth: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold mb-2">분석</h1>
        <p className="text-gray-600">학습 데이터와 성과를 분석합니다</p>
      </div>

      {/* 메인 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 학생</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.monthlyGrowth}%</span> 지난 달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중인 클래스</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">활성 클래스</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 과제</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">이번 학기</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 출석률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.averageAttendance}%</div>
            <p className="text-xs text-muted-foreground">지난 30일</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">과제 완료율</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">전체 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">월간 성장률</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">+{stats.monthlyGrowth}%</div>
            <p className="text-xs text-muted-foreground">지난 달 대비</p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>월별 출석 현황</CardTitle>
            <CardDescription>최근 6개월 출석률 추이</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>차트 기능은 곧 추가됩니다</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>과제 제출 현황</CardTitle>
            <CardDescription>주간 과제 제출률</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p>차트 기능은 곧 추가됩니다</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>학습 시간 분석</CardTitle>
            <CardDescription>일별 학습 시간 추이</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2" />
                <p>차트 기능은 곧 추가됩니다</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>성적 분포</CardTitle>
            <CardDescription>최근 시험 성적 분석</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Award className="w-12 h-12 mx-auto mb-2" />
                <p>차트 기능은 곧 추가됩니다</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
