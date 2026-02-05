"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  TrendingUp, Users, Calendar, CheckCircle, XCircle, AlertCircle, ArrowLeft 
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function AttendanceStatisticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    fetchStatistics(userData);
  }, [router]);

  const fetchStatistics = async (userData: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        userId: userData.id,
        role: userData.role,
        academyId: userData.academyId || "",
      });

      const response = await fetch(`/api/attendance/statistics?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      } else {
        console.error("Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user || !statistics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 학생용 달력 뷰
  if (user.role === "STUDENT") {
    // 달력 데이터 준비
    const calendarData: any = {};
    statistics.calendar?.forEach((item: any) => {
      calendarData[item.date] = item.status;
    });

    // 현재 월의 모든 날짜 생성
    const [year, month] = statistics.thisMonth.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1).getDay();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              나의 출석 현황
            </h1>
            <p className="text-gray-600 mt-1">
              이번 달 출석일: {statistics.attendanceDays}일
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
        </div>

        {/* 달력 */}
        <Card>
          <CardHeader>
            <CardTitle>{year}년 {month}월</CardTitle>
            <CardDescription>출석: 🟢 | 결석: 🔴 | 지각: 🟡</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* 요일 헤더 */}
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="text-center font-bold text-gray-600 p-2">
                  {day}
                </div>
              ))}

              {/* 빈 셀 (첫 주 시작 전) */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}

              {/* 날짜 셀 */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
                const status = calendarData[dateStr];
                const isToday = dateStr === statistics.today;

                let bgColor = 'bg-gray-50';
                let emoji = '';
                if (status === 'VERIFIED') {
                  bgColor = 'bg-green-100';
                  emoji = '🟢';
                } else if (status === 'ABSENT') {
                  bgColor = 'bg-red-100';
                  emoji = '🔴';
                } else if (status === 'LATE') {
                  bgColor = 'bg-yellow-100';
                  emoji = '🟡';
                }

                return (
                  <div
                    key={day}
                    className={`p-4 border rounded-lg text-center ${bgColor} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="text-lg font-semibold">{day}</div>
                    {emoji && <div className="text-2xl mt-1">{emoji}</div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 출석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {statistics.attendanceDays}일
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                출석률
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {Math.round((statistics.attendanceDays / daysInMonth) * 100)}%
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                이번 달
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {month}월
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 선생님/학원장/관리자용 통계 뷰
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            출석 통계
          </h1>
          <p className="text-gray-600 mt-1">
            {user.role === "ADMIN" ? "전체" : user.academyName || "학원"} 학생 출석 현황
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              전체 학생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {statistics.statistics.totalStudents}명
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              오늘 출석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {statistics.statistics.todayAttendance}명
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              이번 달
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {statistics.statistics.monthAttendance}명
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              출석률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {statistics.statistics.attendanceRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주간 그래프 */}
      <Card>
        <CardHeader>
          <CardTitle>주간 출석 추이</CardTitle>
          <CardDescription>최근 7일간 출석 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={statistics.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" name="출석 인원" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 최근 출석 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 출석 기록</CardTitle>
          <CardDescription>최근 출석한 학생 목록</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistics.records.slice(0, 10).map((record: any) => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-semibold text-blue-600">
                      {record.userName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{record.userName}</p>
                    <p className="text-sm text-gray-600">
                      {record.academyName || "미배정"} · {record.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={record.status === "VERIFIED" ? "default" : "secondary"}>
                    {record.status === "VERIFIED" ? "출석" : record.status}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(record.verifiedAt), "MM/dd HH:mm", { locale: ko })}
                  </p>
                </div>
              </div>
            ))}
            {(!statistics.records || statistics.records.length === 0) && (
              <p className="text-center text-gray-500 py-8">출석 기록이 없습니다</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
