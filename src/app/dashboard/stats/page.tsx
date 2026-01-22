"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  GraduationCap,
  DollarSign,
  TrendingUp,
  Activity,
  UserCheck,
  CreditCard,
  BookOpen,
  FileText,
  Calendar,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface StatsData {
  overallStats: {
    totalAcademies: number;
    totalStudents: number;
    totalTeachers: number;
    totalRevenue: number;
    activeSubscriptions: number;
    totalMaterials: number;
    totalAssignments: number;
    avgAttendanceRate: number;
    monthlyGrowth: {
      academies: number;
      students: number;
      teachers: number;
      revenue: number;
    };
  };
  revenueData: Array<{ month: string; revenue: number; subscriptions: number }>;
  userGrowthData: Array<{ month: string; students: number; teachers: number; academies: number }>;
  topAcademies: Array<{ name: string; students: number; teachers: number; revenue: number }>;
  activityStats: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    todayMaterials: number;
    todayAssignments: number;
    aiUsageCount: number;
  };
  growthIndicators: {
    newSignups: number;
    renewalRate: number;
    avgUsageHours: number;
  };
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/stats/overview');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">통계 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">통계 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("ko-KR").format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">전체 통계</h1>
        <p className="mt-2 text-gray-600">
          시스템 전체의 통계와 성과를 한눈에 확인하세요
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 학원 수</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overallStats.totalAcademies)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+{stats.overallStats.monthlyGrowth.academies}개</span> 지난달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 학생 수</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overallStats.totalStudents)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+{stats.overallStats.monthlyGrowth.students}명</span> 지난달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 선생님 수</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overallStats.totalTeachers)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+{stats.overallStats.monthlyGrowth.teachers}명</span> 지난달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.overallStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+{((stats.overallStats.monthlyGrowth.revenue / (stats.overallStats.totalRevenue - stats.overallStats.monthlyGrowth.revenue)) * 100).toFixed(1)}%</span> 지난달 대비
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 구독</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overallStats.activeSubscriptions)}</div>
            <p className="text-xs text-muted-foreground mt-1">요금제 구독 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">학습 자료</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overallStats.totalMaterials)}</div>
            <p className="text-xs text-muted-foreground mt-1">등록된 자료</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 과제</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overallStats.totalAssignments)}</div>
            <p className="text-xs text-muted-foreground mt-1">제출된 과제</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 출석률</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overallStats.avgAttendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">전체 평균</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>월별 매출 추이</CardTitle>
            <CardDescription>최근 6개월 매출 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.revenueData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8b5cf6" name="매출" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>사용자 증가 추이</CardTitle>
            <CardDescription>최근 6개월 사용자 증가</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.userGrowthData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip labelStyle={{ color: "#000" }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="학생"
                />
                <Line
                  type="monotone"
                  dataKey="teachers"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="선생님"
                />
                <Line
                  type="monotone"
                  dataKey="academies"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="학원"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Academies */}
      <Card>
        <CardHeader>
          <CardTitle>상위 학원 TOP 5</CardTitle>
          <CardDescription>학생 수 기준 상위 학원</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topAcademies.map((academy, index) => (
              <div
                key={academy.name}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{academy.name}</p>
                    <p className="text-sm text-gray-500">
                      학생 {academy.students}명 · 선생님 {academy.teachers}명
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">
                    {formatCurrency(academy.revenue)}
                  </p>
                  <p className="text-sm text-gray-500">월 매출</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">시스템 활동성</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">일일 활성 사용자</span>
                <span className="font-semibold">{formatNumber(stats.activityStats.dailyActiveUsers)}명</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">주간 활성 사용자</span>
                <span className="font-semibold">{formatNumber(stats.activityStats.weeklyActiveUsers)}명</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">월간 활성 사용자</span>
                <span className="font-semibold">{formatNumber(stats.activityStats.monthlyActiveUsers)}명</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">컨텐츠 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">오늘 업로드된 자료</span>
                <span className="font-semibold">{formatNumber(stats.activityStats.todayMaterials)}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">오늘 제출된 과제</span>
                <span className="font-semibold">{formatNumber(stats.activityStats.todayAssignments)}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI 사용 횟수</span>
                <span className="font-semibold">{formatNumber(stats.activityStats.aiUsageCount)}회</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">성장 지표</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">이번 달 신규 가입</span>
                <span className="font-semibold text-green-600">+{formatNumber(stats.growthIndicators.newSignups)}명</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">구독 갱신율</span>
                <span className="font-semibold text-green-600">{stats.growthIndicators.renewalRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">평균 사용 시간</span>
                <span className="font-semibold">{stats.growthIndicators.avgUsageHours.toFixed(1)}시간/일</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
