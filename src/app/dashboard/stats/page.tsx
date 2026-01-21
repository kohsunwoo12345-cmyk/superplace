"use client";

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
} from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

// 샘플 통계 데이터
const overallStats = {
  totalAcademies: 196,
  totalStudents: 8543,
  totalTeachers: 1287,
  totalRevenue: 39200000,
  activeSubscriptions: 196,
  totalMaterials: 4523,
  totalAssignments: 12876,
  avgAttendanceRate: 94.5,
};

const revenueData = [
  { month: "1월", revenue: 3200000, subscriptions: 180 },
  { month: "2월", revenue: 3350000, subscriptions: 182 },
  { month: "3월", revenue: 3480000, subscriptions: 185 },
  { month: "4월", revenue: 3620000, subscriptions: 188 },
  { month: "5월", revenue: 3750000, subscriptions: 190 },
  { month: "6월", revenue: 3900000, subscriptions: 196 },
];

const userGrowthData = [
  { month: "1월", students: 7800, teachers: 1180, academies: 180 },
  { month: "2월", students: 7950, teachers: 1210, academies: 182 },
  { month: "3월", students: 8100, teachers: 1235, academies: 185 },
  { month: "4월", students: 8280, teachers: 1255, academies: 188 },
  { month: "5월", students: 8420, teachers: 1270, academies: 190 },
  { month: "6월", students: 8543, teachers: 1287, academies: 196 },
];

const topAcademies = [
  { name: "서울수학학원", students: 145, teachers: 12, revenue: 850000 },
  { name: "강남영어타운", students: 132, teachers: 10, revenue: 720000 },
  { name: "부산과학학원", students: 128, teachers: 11, revenue: 680000 },
  { name: "대구종합학원", students: 115, teachers: 9, revenue: 620000 },
  { name: "인천글로벌학원", students: 108, teachers: 8, revenue: 580000 },
];

export default function StatsPage() {
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
            <div className="text-2xl font-bold">{formatNumber(overallStats.totalAcademies)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+16개</span> 지난달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 학생 수</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overallStats.totalStudents)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+123명</span> 지난달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 선생님 수</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overallStats.totalTeachers)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+17명</span> 지난달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overallStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+4.1%</span> 지난달 대비
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
            <div className="text-2xl font-bold">{formatNumber(overallStats.activeSubscriptions)}</div>
            <p className="text-xs text-muted-foreground mt-1">요금제 구독 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">학습 자료</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overallStats.totalMaterials)}</div>
            <p className="text-xs text-muted-foreground mt-1">등록된 자료</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 과제</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overallStats.totalAssignments)}</div>
            <p className="text-xs text-muted-foreground mt-1">제출된 과제</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 출석률</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgAttendanceRate}%</div>
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
              <BarChart data={revenueData}>
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
              <LineChart data={userGrowthData}>
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
            {topAcademies.map((academy, index) => (
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
                <span className="font-semibold">5,432명</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">주간 활성 사용자</span>
                <span className="font-semibold">7,234명</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">월간 활성 사용자</span>
                <span className="font-semibold">8,543명</span>
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
                <span className="font-semibold">127개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">오늘 제출된 과제</span>
                <span className="font-semibold">543개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI 사용 횟수</span>
                <span className="font-semibold">1,234회</span>
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
                <span className="font-semibold text-green-600">+156명</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">구독 갱신율</span>
                <span className="font-semibold text-green-600">97.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">평균 사용 시간</span>
                <span className="font-semibold">2.4시간/일</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
