"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  TrendingUp,
  UserCheck,
  BookOpen,
  Calendar,
  BarChart3,
  ArrowLeft,
  Download,
  RefreshCw,
  TrendingDown
} from "lucide-react";

interface AcademyStatistics {
  academy: {
    id: string;
    name: string;
    directorName: string;
    directorEmail: string;
    contact: string;
    email: string;
    address: string;
    createdAt: string;
  };
  students: {
    total: number;
    thisMonthNew: number;
    monthlyGrowth: Array<{ month: string; count: number }>;
  };
  attendance: {
    rate: number;
    studentsChecked: number;
    totalCheckins: number;
    activeDays: number;
    period: string;
  };
  homework: {
    submissionRate: number;
    studentsSubmitted: number;
    totalSubmissions: number;
    completionRate: string;
    period: string;
  };
}

export default function AcademyStatisticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [statistics, setStatistics] = useState<AcademyStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    if (!["ADMIN", "SUPER_ADMIN"].includes(userData.role)) {
      alert("관리자만 접근 가능합니다.");
      router.push("/dashboard");
      return;
    }

    setUser(userData);
    fetchStatistics();
  }, [router]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/academy-statistics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics || []);
        console.log("✅ 통계 데이터 로드 완료:", data.count);
      } else {
        console.error("❌ 통계 조회 실패:", response.status);
        alert("통계 데이터를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("통계 로드 오류:", error);
      alert("통계 데이터 로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "학원명",
      "학원장",
      "연락처",
      "이메일",
      "전체학생수",
      "이번달신규",
      "출석률(%)",
      "출석학생수",
      "총출석횟수",
      "숙제제출률(%)",
      "숙제제출학생수",
      "총숙제제출수",
      "숙제완료율(%)",
    ];

    const rows = filteredStatistics.map((stat) => [
      stat.academy.name,
      stat.academy.directorName || "-",
      stat.academy.contact || "-",
      stat.academy.directorEmail || "-",
      stat.students.total,
      stat.students.thisMonthNew,
      stat.attendance.rate,
      stat.attendance.studentsChecked,
      stat.attendance.totalCheckins,
      stat.homework.submissionRate,
      stat.homework.studentsSubmitted,
      stat.homework.totalSubmissions,
      stat.homework.completionRate,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `academy_statistics_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStatistics = statistics.filter((stat) =>
    stat.academy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (stat.academy.directorName &&
      stat.academy.directorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">통계 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            학원별 통계
          </h1>
          <p className="text-gray-600 mt-1">
            각 학원의 학생 수, 출석 현황, 숙제 데이터를 확인합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchStatistics}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            CSV 내보내기
          </Button>
          <Button
            onClick={() => router.push("/dashboard/admin")}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            대시보드
          </Button>
        </div>
      </div>

      {/* 전체 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 학원 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.length}</div>
            <p className="text-xs text-gray-500 mt-1">활성 학원</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 학생 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statistics.reduce((sum, s) => sum + s.students.total, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">전체 학생</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              이번 달 신규
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              +{statistics.reduce((sum, s) => sum + s.students.thisMonthNew, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">신규 학생</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              평균 출석률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {statistics.length > 0
                ? (
                    statistics.reduce((sum, s) => sum + s.attendance.rate, 0) /
                    statistics.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500 mt-1">최근 30일</p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="학원명 또는 학원장 이름으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 통계 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>학원별 상세 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    학원명
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    학원장
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-4 h-4" />
                      전체 학생
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      이번 달 신규
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-1">
                      <UserCheck className="w-4 h-4" />
                      출석률
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-4 h-4" />
                      출석 현황
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      숙제 제출률
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    숙제 현황
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStatistics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery
                        ? "검색 결과가 없습니다."
                        : "등록된 학원이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  filteredStatistics.map((stat) => (
                    <tr
                      key={stat.academy.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {stat.academy.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {stat.academy.contact || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm text-gray-900">
                            {stat.academy.directorName || "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {stat.academy.directorEmail || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {stat.students.total}
                        </div>
                        <div className="text-xs text-gray-500">명</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {stat.students.thisMonthNew > 0 ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-lg font-bold text-green-600">
                                +{stat.students.thisMonthNew}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-400">
                              0
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">명</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`text-lg font-bold ${
                              stat.attendance.rate >= 80
                                ? "text-green-600"
                                : stat.attendance.rate >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {stat.attendance.rate}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {stat.attendance.studentsChecked}/{stat.students.total}명
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm text-gray-700">
                          <div>총 {stat.attendance.totalCheckins}회</div>
                          <div className="text-xs text-gray-500">
                            {stat.attendance.activeDays}일 활동
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`text-lg font-bold ${
                              stat.homework.submissionRate >= 80
                                ? "text-green-600"
                                : stat.homework.submissionRate >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {stat.homework.submissionRate}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {stat.homework.studentsSubmitted}/{stat.students.total}명
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm text-gray-700">
                          <div>총 {stat.homework.totalSubmissions}건</div>
                          <div className="text-xs text-gray-500">
                            완료율 {stat.homework.completionRate}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 푸터 정보 */}
      <div className="text-center text-sm text-gray-500">
        <p>출석 및 숙제 통계는 최근 30일 기준입니다.</p>
        <p className="mt-1">
          마지막 업데이트: {new Date().toLocaleString("ko-KR")}
        </p>
      </div>
    </div>
  );
}
