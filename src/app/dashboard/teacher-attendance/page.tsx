"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  TrendingUp
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  code: string;
  verifiedAt: string;
  status: string;
  statusText: string;
  homeworkSubmitted: boolean;
  homeworkSubmittedAt: string | null;
  homework: {
    score: number;
    subject: string;
    feedback: string;
  } | null;
}

interface AttendanceStats {
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
  homeworkSubmittedCount: number;
  homeworkCompletionRate: number;
  avgScore: number;
}

export default function TeacherAttendancePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    // 오늘 날짜 설정
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);

    // 출석 현황 로드
    fetchAttendance(userData, today);
  }, [router]);

  const fetchAttendance = async (userData: any, date: string) => {
    try {
      setLoading(true);
      
      // academyId를 다양한 형식으로 추출
      const academyId = userData.academyId || userData.academy_id || userData.AcademyId;
      
      const params = new URLSearchParams({
        date: date,
        role: userData.role || "ADMIN",
        email: userData.email || "admin@superplace.co.kr"
      });

      // academyId가 있으면 추가
      if (academyId) {
        params.append("academyId", academyId.toString());
      }
      
      console.log("📊 Fetching attendance with:", { 
        date, 
        role: userData.role, 
        email: userData.email,
        academyId 
      });
      console.log("📊 Full URL:", `/api/attendance/today?${params}`);
      
      const response = await fetch(`/api/attendance/today?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Attendance data:", data);
        
        if (data.success) {
          setAttendanceRecords(data.records || []);
          setAttendanceStats(data.stats || null);
        } else {
          console.error("❌ API returned success: false");
        }
      } else {
        console.error("❌ Failed to fetch attendance:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (currentUser) {
      fetchAttendance(currentUser, date);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
              출석 현황
            </h1>
            <p className="text-gray-600 mt-1">
              오늘의 출석 및 숙제 제출 현황을 확인하세요
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            대시보드로
          </Button>
        </div>

        {/* 날짜 선택 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button 
                onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                variant="outline"
                size="sm"
              >
                오늘
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 통계 카드 */}
        {attendanceStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">총 학생</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {attendanceStats.totalStudents}명
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">출석률</p>
                    <p className="text-2xl font-bold text-green-600">
                      {attendanceStats.attendanceRate}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">숙제 제출</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {attendanceStats.homeworkSubmittedCount}명
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">평균 점수</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {attendanceStats.avgScore}점
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 출석 기록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              출석 기록
            </CardTitle>
            <CardDescription>
              오늘 출석한 학생 목록과 숙제 제출 현황
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">불러오는 중...</p>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">아직 출석한 학생이 없습니다</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        학생명
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 hidden md:table-cell">
                        이메일
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        출석 시간
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        상태
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        숙제
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        점수
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendanceRecords.map((record, index) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {record.userName || "이름 없음"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                          {record.userEmail || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDateTime(record.verifiedAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge 
                            variant={record.status === 'LATE' ? 'destructive' : 'default'}
                            className={
                              record.status === 'LATE' 
                                ? 'bg-yellow-500 text-white' 
                                : 'bg-green-500 text-white'
                            }
                          >
                            {record.statusText || record.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.homeworkSubmitted ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.homework?.score ? (
                            <span className="font-semibold text-blue-600">
                              {record.homework.score}점
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 빠른 링크 */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 이동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={() => router.push('/attendance-verify')}
                variant="outline"
                className="w-full justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                출석 인증 페이지
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="w-full justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                대시보드
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
