"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  TrendingUp, Users, Calendar, Award, Clock, 
  CheckCircle, XCircle, AlertCircle 
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ko } from "date-fns/locale";

interface AttendanceRecord {
  id: string;
  userId: string;
  userName?: string;
  code: string;
  verifiedAt: string;
  status: string;
}

interface Statistics {
  totalStudents: number;
  todayAttendance: number;
  weekAttendance: number;
  monthAttendance: number;
  attendanceRate: number;
}

export default function AttendanceStatisticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({
    totalStudents: 0,
    todayAttendance: 0,
    weekAttendance: 0,
    monthAttendance: 0,
    attendanceRate: 0,
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    fetchStatistics();
  }, [router]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출 (여기서는 목업 데이터 사용)
      // const response = await fetch("/api/attendance/statistics");
      // const data = await response.json();
      
      // 목업 데이터
      setStatistics({
        totalStudents: 45,
        todayAttendance: 38,
        weekAttendance: 42,
        monthAttendance: 43,
        attendanceRate: 84.4,
      });

      // 주간 데이터
      const weekly = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, "MM/dd", { locale: ko }),
          attendance: Math.floor(Math.random() * 10) + 30,
          absent: Math.floor(Math.random() * 5) + 5,
        };
      });
      setWeeklyData(weekly);

      // 월간 데이터 (주별)
      const monthly = Array.from({ length: 4 }, (_, i) => ({
        week: `${i + 1}주차`,
        attendance: Math.floor(Math.random() * 20) + 150,
        rate: Math.floor(Math.random() * 15) + 80,
      }));
      setMonthlyData(monthly);

      // 최근 출석 기록
      const recent = Array.from({ length: 10 }, (_, i) => ({
        id: `record-${i}`,
        userId: `user-${i}`,
        userName: `학생 ${i + 1}`,
        code: `${Math.floor(100000 + Math.random() * 900000)}`,
        verifiedAt: new Date(Date.now() - i * 3600000).toISOString(),
        status: "VERIFIED",
      }));
      setRecentRecords(recent);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981"];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              출석 통계 대시보드
            </h1>
            <p className="text-gray-600 mt-1">학생들의 출석 현황을 한눈에 확인하세요</p>
          </div>
          <Button onClick={() => router.back()} variant="outline">
            뒤로가기
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                전체 학생
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{statistics.totalStudents}명</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                오늘 출석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{statistics.todayAttendance}명</div>
              <p className="text-xs text-gray-500 mt-1">
                {((statistics.todayAttendance / statistics.totalStudents) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                이번 주
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{statistics.weekAttendance}명</div>
              <p className="text-xs text-gray-500 mt-1">평균 출석</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="w-4 h-4" />
                출석률
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{statistics.attendanceRate}%</div>
              <p className="text-xs text-gray-500 mt-1">이번 달 평균</p>
            </CardContent>
          </Card>
        </div>

        {/* 차트 */}
        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">주간 통계</TabsTrigger>
            <TabsTrigger value="monthly">월간 통계</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>주간 출석 현황</CardTitle>
                <CardDescription>최근 7일간의 출석 및 결석 통계</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attendance" fill="#3b82f6" name="출석" />
                    <Bar dataKey="absent" fill="#ef4444" name="결석" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>월간 출석 추이</CardTitle>
                <CardDescription>주차별 출석 인원 및 출석률</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="attendance" 
                      stroke="#3b82f6" 
                      name="출석 인원"
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#10b981" 
                      name="출석률 (%)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 최근 출석 기록 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 출석 기록</CardTitle>
            <CardDescription>실시간 출석 인증 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRecords.slice(0, 5).map((record) => (
                <div 
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{record.userName}</p>
                      <p className="text-xs text-gray-500">코드: {record.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      인증 완료
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(record.verifiedAt), "HH:mm", { locale: ko })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
