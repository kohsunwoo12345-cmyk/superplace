"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Search,
  Download,
  Loader2,
} from "lucide-react";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

type StudentAttendance = {
  student: {
    id: string;
    name: string;
    email: string;
    studentCode: string;
    grade: string | null;
    academy: {
      id: string;
      name: string;
    } | null;
  };
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  };
  lastAttendance: {
    date: string;
    status: AttendanceStatus;
    notes: string | null;
  } | null;
  recentAttendances: Array<{
    id: string;
    date: string;
    status: AttendanceStatus;
    notes: string | null;
  }>;
};

export default function AttendancePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<{
    totalStats: any;
    students: StudentAttendance[];
  } | null>(null);

  useEffect(() => {
    // 기본 날짜 설정 (최근 30일)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);

    loadAttendanceData(start.toISOString().split("T")[0], end.toISOString().split("T")[0]);
  }, []);

  const loadAttendanceData = async (start: string, end: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/attendance/stats?startDate=${start}&endDate=${end}`
      );

      if (!response.ok) {
        throw new Error("출석 데이터를 불러올 수 없습니다.");
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("출석 데이터 로딩 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = () => {
    if (startDate && endDate) {
      loadAttendanceData(startDate, endDate);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            출석
          </Badge>
        );
      case "ABSENT":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            결석
          </Badge>
        );
      case "LATE":
        return (
          <Badge variant="secondary" className="bg-yellow-500">
            <Clock className="mr-1 h-3 w-3" />
            지각
          </Badge>
        );
      case "EXCUSED":
        return (
          <Badge variant="outline">
            <AlertCircle className="mr-1 h-3 w-3" />
            조퇴
          </Badge>
        );
    }
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredStudents = data?.students.filter((item) =>
    Object.values(item.student).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-500">출석 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">출석 현황</h1>
          <p className="mt-2 text-gray-600">
            학생들의 출석 기록을 확인하고 관리하세요
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>조회 기간</CardTitle>
          <CardDescription>출석 통계를 확인할 기간을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작일
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료일
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button onClick={handleDateChange}>
            <Calendar className="mr-2 h-4 w-4" />
            조회
          </Button>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 학생</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              전체 등록 학생 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 출석률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.totalStats.averageAttendanceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              기간 내 평균
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">출석</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalStats.totalPresent}</div>
            <p className="text-xs text-muted-foreground">
              전체 출석 {data?.totalStats.totalAttendances}회 중
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">결석</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data?.totalStats.totalAbsent}
            </div>
            <p className="text-xs text-muted-foreground">
              지각 {data?.totalStats.totalLate} / 조퇴 {data?.totalStats.totalExcused}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>학생 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="학생 이름, 이메일, 학생 코드로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredStudents && filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">검색 결과가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          filteredStudents?.map((item) => (
            <Card key={item.student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{item.student.name}</CardTitle>
                      <Badge variant="outline">{item.student.studentCode}</Badge>
                      {item.student.grade && (
                        <Badge variant="secondary">{item.student.grade}</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {item.student.email}
                      {item.student.academy && ` • ${item.student.academy.name}`}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-3xl font-bold ${getAttendanceRateColor(
                        item.stats.attendanceRate
                      )}`}
                    >
                      {item.stats.attendanceRate}%
                    </div>
                    <p className="text-xs text-gray-500">출석률</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 통계 */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {item.stats.present}
                    </div>
                    <p className="text-xs text-gray-500">출석</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {item.stats.absent}
                    </div>
                    <p className="text-xs text-gray-500">결석</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {item.stats.late}
                    </div>
                    <p className="text-xs text-gray-500">지각</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {item.stats.excused}
                    </div>
                    <p className="text-xs text-gray-500">조퇴</p>
                  </div>
                </div>

                {/* 최근 출석 내역 */}
                {item.recentAttendances.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">최근 7일 출석 내역</h4>
                    <div className="flex gap-2 flex-wrap">
                      {item.recentAttendances.map((attendance) => (
                        <div
                          key={attendance.id}
                          className="flex flex-col items-center p-2 bg-gray-50 rounded"
                        >
                          <span className="text-xs text-gray-600 mb-1">
                            {new Date(attendance.date).toLocaleDateString("ko-KR", {
                              month: "numeric",
                              day: "numeric",
                            })}
                          </span>
                          {getStatusBadge(attendance.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 마지막 출석일 */}
                {item.lastAttendance && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      마지막 출석:{" "}
                      <span className="font-medium">
                        {new Date(item.lastAttendance.date).toLocaleDateString(
                          "ko-KR"
                        )}
                      </span>
                      {item.lastAttendance.notes && (
                        <span className="ml-2 text-gray-500">
                          ({item.lastAttendance.notes})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
