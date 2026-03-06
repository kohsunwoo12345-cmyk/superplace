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
  TrendingUp, Users, Calendar, CheckCircle, XCircle, AlertCircle, ArrowLeft, ClipboardCheck
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
      const academyId = userData.academyId || userData.academy_id || userData.AcademyId;
      
      console.log("📊 Fetching statistics with user data:", userData);
      console.log("📊 Extracted academyId:", academyId);
      
      const params = new URLSearchParams({
        userId: userData.id.toString(),
        role: userData.role || "",
        academyId: academyId ? academyId.toString() : "",
      });

      console.log("📊 Fetching statistics URL:", `/api/attendance/statistics?${params}`);

      const response = await fetch(`/api/attendance/statistics?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Statistics data received:", data);
        setStatistics(data);
      } else {
        console.error("❌ Failed to fetch statistics:", response.status, await response.text());
      }
    } catch (error) {
      console.error("❌ Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 학생용 달력 뷰
  if (user.role === "STUDENT") {
    // 현재 날짜 기본값 설정
    const now = new Date();
    const defaultYear = now.getFullYear();
    const defaultMonth = now.getMonth() + 1;
    
    // 달력 데이터 준비 (API는 이미 객체 형태로 반환)
    const calendarData: any = statistics?.calendar || {};

    // 현재 월의 모든 날짜 생성
    const thisMonth = statistics?.thisMonth || `${defaultYear}-${String(defaultMonth).padStart(2, '0')}`;
    const [year, month] = thisMonth.split('-');
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
              이번 달 출석일: {statistics?.attendanceDays || 0}일
            </p>
          </div>
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
                const today = new Date().toISOString().split('T')[0];
                const isToday = dateStr === today;

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
                {statistics?.attendanceDays || 0}일
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
                {Math.round(((statistics?.attendanceDays || 0) / daysInMonth) * 100)}%
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
  // 데이터가 없을 때 기본값 설정
  const stats = statistics?.statistics || {
    totalStudents: 0,
    todayAttendance: 0,
    monthAttendance: 0,
    attendanceRate: 0
  };
  const weeklyData = statistics?.weeklyData || [];
  const monthlyData = statistics?.monthlyData || [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            출석 통계
          </h1>
          <p className="text-gray-600 mt-1">
            {user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "전체" : user.academyName || "학원"} 학생 출석 현황 (퇴원생 제외)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => router.push('/attendance-verify')}
            className="bg-green-600 hover:bg-green-700"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            출석하기
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              전체 학생 (퇴원생 제외)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalStudents}명
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
              {stats.todayAttendance}명
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
              {stats.monthAttendance}명
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
              {stats.attendanceRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주간 그래프 */}
      {weeklyData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>주간 출석 추이</CardTitle>
            <CardDescription>최근 7일간 출석 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  domain={[0, (dataMax: number) => {
                    if (dataMax <= 10) return 10;
                    if (dataMax <= 50) return 50;
                    return Math.ceil(dataMax / 50) * 50;
                  }]}
                  ticks={(() => {
                    const maxValue = Math.max(...weeklyData.map((d: any) => d.count), 1);
                    if (maxValue <= 10) return [0, 2, 4, 6, 8, 10];
                    if (maxValue <= 50) return [0, 10, 20, 30, 40, 50];
                    const step = Math.ceil(maxValue / 50) * 10;
                    return Array.from({length: 6}, (_, i) => i * step);
                  })()}
                />
                <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" name="출석 인원" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>아직 출석 데이터가 없습니다</p>
          </CardContent>
        </Card>
      )}

      {/* 최근 출석 기록 */}
      {statistics?.records && statistics.records.length > 0 ? (
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
                        {record.userName?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{record.userName || '알 수 없음'}</p>
                      <p className="text-sm text-gray-600">
                        {record.academyName || "미배정"} · {record.email || ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={record.status === "PRESENT" || record.status === "VERIFIED" ? "default" : record.status === "LATE" ? "secondary" : "outline"}>
                      {record.status === "PRESENT" ? "출석" : record.status === "LATE" ? "지각" : record.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {record.verifiedAt ? format(new Date(record.verifiedAt), "MM/dd HH:mm", { locale: ko }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>아직 출석 기록이 없습니다</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
