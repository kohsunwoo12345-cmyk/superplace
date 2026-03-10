"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  TrendingUp, Users, Calendar, CheckCircle, XCircle, AlertCircle, ArrowLeft, ClipboardCheck, Edit
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function AttendanceStatisticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [attendanceCode, setAttendanceCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    fetchStatistics(userData);
    
    // 선생님/관리자는 학생 목록도 가져오기
    if (userData.role !== "STUDENT") {
      fetchStudents(userData);
    } else {
      // 학생이면 출석 코드도 가져오기
      fetchAttendanceCode(userData.id);
    }
  }, [router]);

  const fetchAttendanceCode = async (userId: string) => {
    try {
      setLoadingCode(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/students/attendance-code?userId=${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.code) {
          setAttendanceCode(data.code);
          console.log("✅ 출석 코드 로드:", data.code);
        }
      } else {
        console.error("❌ 출석 코드 로드 실패:", response.status);
      }
    } catch (error) {
      console.error("❌ 출석 코드 로드 오류:", error);
    } finally {
      setLoadingCode(false);
    }
  };

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

  const fetchStudents = async (userData: any) => {
    try {
      const token = localStorage.getItem("token");
      const academyId = userData.academyId || userData.academy_id || userData.AcademyId;
      
      const params = new URLSearchParams();
      if (academyId && userData.role !== "SUPER_ADMIN" && userData.role !== "ADMIN") {
        params.append("academyId", academyId.toString());
      }

      const response = await fetch(`/api/students?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // ACTIVE 학생만 필터링
        const activeStudents = (data.students || []).filter((s: any) => 
          !s.status || s.status === "ACTIVE"
        );
        setStudents(activeStudents);
        console.log("✅ Students loaded:", activeStudents.length);
      }
    } catch (error) {
      console.error("❌ Error fetching students:", error);
    }
  };

  const handleEditAttendance = (date?: string, currentStatus?: string, student?: any) => {
    if (student) {
      // 선생님/관리자가 학생 선택한 경우
      setSelectedStudent(student);
      setSelectedDate(date || new Date().toISOString().split('T')[0]);
      setSelectedStatus(currentStatus || "VERIFIED");
    } else {
      // 학생 본인이 수정하는 경우
      setSelectedStudent(null);
      setSelectedDate(date || "");
      setSelectedStatus(currentStatus || "ABSENT");
    }
    setEditDialogOpen(true);
  };

  const handleUpdateAttendance = async () => {
    if (!selectedDate) return;
    
    const targetUserId = selectedStudent ? selectedStudent.id : user?.id;
    if (!targetUserId) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/attendance/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: targetUserId,
          date: selectedDate,
          status: selectedStatus,
        }),
      });

      if (response.ok) {
        alert("출석 상태가 수정되었습니다.");
        setEditDialogOpen(false);
        // 통계 다시 불러오기
        if (user) {
          fetchStatistics(user);
        }
      } else {
        const error = await response.json();
        alert(`수정 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("출석 수정 중 오류가 발생했습니다.");
    } finally {
      setUpdating(false);
    }
  };

  const goToPreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    setCurrentMonth(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    setCurrentMonth(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
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
    // 달력 데이터 준비 (API는 이미 객체 형태로 반환)
    const calendarData: any = statistics?.calendar || {};

    // currentMonth 사용
    const [year, month] = currentMonth.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1).getDay();

    // 해당 월의 출석 기록 필터링
    const monthRecords = Object.entries(calendarData)
      .filter(([date]) => date.startsWith(currentMonth))
      .map(([date, status]) => ({ date, status }))
      .sort((a, b) => b.date.localeCompare(a.date)); // 최신순 정렬

    // 해당 월의 출석일 계산
    const monthAttendanceDays = monthRecords.filter(r => r.status === 'VERIFIED' || r.status === 'LATE').length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                나의 출석 현황
              </h1>
              <p className="text-gray-600 mt-1">
                {year}년 {month}월 출석일: {monthAttendanceDays}일
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={goToPreviousMonth}>
                이전 달
              </Button>
              <Button variant="outline" onClick={goToNextMonth}>
                다음 달
              </Button>
            </div>
          </div>

          {/* 출석 코드 카드 */}
          {attendanceCode && (
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">나의 출석 코드</p>
                      <p className="text-3xl font-bold text-green-700 tracking-wider">
                        {attendanceCode}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(attendanceCode);
                      alert("출석 코드가 복사되었습니다!");
                    }}
                    className="border-green-300 hover:bg-green-50"
                  >
                    복사
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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
                    className={`relative p-4 border rounded-lg text-center ${bgColor} ${isToday ? 'ring-2 ring-blue-500' : ''} group`}
                  >
                    <div className="text-lg font-semibold">{day}</div>
                    {emoji && <div className="text-2xl mt-1">{emoji}</div>}
                    {status && (
                      <button
                        onClick={() => handleEditAttendance(dateStr, status)}
                        className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="출석 수정"
                      >
                        <Edit className="w-3 h-3 text-gray-600" />
                      </button>
                    )}
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
                이번 달 출석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {monthAttendanceDays}일
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
                {Math.round((monthAttendanceDays / daysInMonth) * 100)}%
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                전체 출석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {statistics?.attendanceDays || 0}일
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 출석 기록 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>출석 기록</CardTitle>
            <CardDescription>{year}년 {month}월 출석 기록 ({monthRecords.length}건)</CardDescription>
          </CardHeader>
          <CardContent>
            {monthRecords.length > 0 ? (
              <div className="space-y-2">
                {monthRecords.map((record) => {
                  const dateObj = new Date(record.date);
                  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
                  const dateStr = format(dateObj, "MM월 dd일", { locale: ko });
                  
                  let statusBadge = {
                    label: '알 수 없음',
                    color: 'bg-gray-100 text-gray-600',
                    emoji: '⚪'
                  };
                  
                  if (record.status === 'VERIFIED') {
                    statusBadge = { label: '출석', color: 'bg-green-100 text-green-700', emoji: '🟢' };
                  } else if (record.status === 'LATE') {
                    statusBadge = { label: '지각', color: 'bg-yellow-100 text-yellow-700', emoji: '🟡' };
                  } else if (record.status === 'ABSENT') {
                    statusBadge = { label: '결석', color: 'bg-red-100 text-red-700', emoji: '🔴' };
                  }

                  return (
                    <div 
                      key={record.date} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{statusBadge.emoji}</div>
                        <div>
                          <p className="font-medium">{dateStr} ({dayOfWeek})</p>
                          <p className="text-sm text-gray-600">{record.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>이번 달 출석 기록이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 출석 수정 Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>출석 상태 수정</DialogTitle>
              <DialogDescription>
                {selectedDate} 날짜의 출석 상태를 변경합니다.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setSelectedStatus("VERIFIED")}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    selectedStatus === "VERIFIED" 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <div className="text-3xl">🟢</div>
                  <div className="text-left">
                    <div className="font-semibold">출석</div>
                    <div className="text-sm text-gray-600">정상 출석</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedStatus("LATE")}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    selectedStatus === "LATE" 
                      ? "border-yellow-500 bg-yellow-50" 
                      : "border-gray-200 hover:border-yellow-300"
                  }`}
                >
                  <div className="text-3xl">🟡</div>
                  <div className="text-left">
                    <div className="font-semibold">지각</div>
                    <div className="text-sm text-gray-600">늦은 출석</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedStatus("ABSENT")}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    selectedStatus === "ABSENT" 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <div className="text-3xl">🔴</div>
                  <div className="text-left">
                    <div className="font-semibold">결석</div>
                    <div className="text-sm text-gray-600">출석하지 않음</div>
                  </div>
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updating}
              >
                취소
              </Button>
              <Button
                onClick={handleUpdateAttendance}
                disabled={updating}
              >
                {updating ? "수정 중..." : "수정하기"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
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
                <YAxis />
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
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant={record.status === "PRESENT" || record.status === "VERIFIED" ? "default" : record.status === "LATE" ? "secondary" : "outline"}>
                        {record.status === "PRESENT" ? "출석" : record.status === "LATE" ? "지각" : record.status === "ABSENT" ? "결석" : record.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {record.verifiedAt ? format(new Date(record.verifiedAt), "MM/dd HH:mm", { locale: ko }) : ''}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const recordDate = record.verifiedAt?.split('T')[0] || record.date || new Date().toISOString().split('T')[0];
                        const student = students.find(s => s.id === record.userId) || { 
                          id: record.userId, 
                          name: record.userName 
                        };
                        handleEditAttendance(recordDate, record.status, student);
                      }}
                      className="hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                      title="출석 수정"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
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

      {/* 학생별 출석 수정 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>학생별 출석 수정</CardTitle>
          <CardDescription>학생을 선택하여 출석 상태를 수정할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 검색창 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="학생 이름 검색..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 학생 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {students
              .filter(student => 
                student.name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
              )
              .map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleEditAttendance(undefined, "VERIFIED", student)}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-blue-600">
                      {student.name?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{student.name || '이름 없음'}</p>
                    <p className="text-sm text-gray-600 truncate">{student.email || ''}</p>
                  </div>
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
              ))}
          </div>

          {students.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>학생이 없습니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 출석 수정 Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>출석 상태 수정</DialogTitle>
            <DialogDescription>
              {selectedStudent ? (
                <>
                  <span className="font-semibold">{selectedStudent.name}</span> 학생의 출석 상태를 수정합니다.
                </>
              ) : (
                <>날짜의 출석 상태를 변경합니다.</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 날짜 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">날짜</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 상태 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">출석 상태</label>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setSelectedStatus("VERIFIED")}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    selectedStatus === "VERIFIED" 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <div className="text-3xl">🟢</div>
                  <div className="text-left">
                    <div className="font-semibold">출석</div>
                    <div className="text-sm text-gray-600">정상 출석</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedStatus("LATE")}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    selectedStatus === "LATE" 
                      ? "border-yellow-500 bg-yellow-50" 
                      : "border-gray-200 hover:border-yellow-300"
                  }`}
                >
                  <div className="text-3xl">🟡</div>
                  <div className="text-left">
                    <div className="font-semibold">지각</div>
                    <div className="text-sm text-gray-600">늦은 출석</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedStatus("ABSENT")}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    selectedStatus === "ABSENT" 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <div className="text-3xl">🔴</div>
                  <div className="text-left">
                    <div className="font-semibold">결석</div>
                    <div className="text-sm text-gray-600">출석하지 않음</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              취소
            </Button>
            <Button
              onClick={handleUpdateAttendance}
              disabled={updating}
            >
              {updating ? "수정 중..." : "수정하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
