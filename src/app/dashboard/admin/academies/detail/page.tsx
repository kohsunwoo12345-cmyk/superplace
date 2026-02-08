"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  ArrowLeft,
  Users,
  GraduationCap,
  MessageSquare,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Edit,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AcademyDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  subscriptionPlan: string;
  maxStudents: number;
  maxTeachers: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  director?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  students: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
  }>;
  teachers: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
  }>;
  studentCount: number;
  teacherCount: number;
  totalChats: number;
  attendanceCount: number;
  homeworkCount: number;
  monthlyActivity: Array<{
    month: string;
    count: number;
  }>;
  revenue?: {
    totalRevenue: number;
    transactionCount: number;
  };
}

export default function AcademyDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const academyId = searchParams.get("id");

  const [academy, setAcademy] = useState<AcademyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    if (!academyId) {
      alert("학원 ID가 필요합니다.");
      router.push("/dashboard/admin/academies");
      return;
    }

    fetchAcademyDetail();
  }, [academyId, router]);

  const fetchAcademyDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/academies?id=${academyId}`);
      if (response.ok) {
        const data = await response.json();
        setAcademy(data.academy);
      } else {
        alert("학원 정보를 불러올 수 없습니다.");
        router.push("/dashboard/admin/academies");
      }
    } catch (error) {
      console.error("학원 정보 로드 실패:", error);
      alert("학원 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  if (!academy) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">학원 정보를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push("/dashboard/admin/academies")} className="mt-4">
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 월별 활동 차트 데이터 준비
  const chartData = academy.monthlyActivity.map((item) => ({
    month: item.month,
    활동수: item.count,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/admin/academies")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-purple-600" />
              {academy.name}
            </h1>
            <p className="text-gray-600 mt-1">학원 상세 정보</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={academy.isActive ? "default" : "secondary"}>
            {academy.isActive ? "활성" : "비활성"}
          </Badge>
          <Badge variant="outline">{academy.subscriptionPlan}</Badge>
        </div>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 학생 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-3xl font-bold">{academy.studentCount}명</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              최대 {academy.maxStudents}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 선생님 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              <span className="text-3xl font-bold">{academy.teacherCount}명</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              최대 {academy.maxTeachers}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              통합 대화 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span className="text-3xl font-bold">{academy.totalChats}회</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              출석 {academy.attendanceCount} + 숙제 {academy.homeworkCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <span className="text-3xl font-bold">
                {academy.revenue
                  ? formatCurrency(academy.revenue.totalRevenue)
                  : "₩0"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {academy.revenue ? `${academy.revenue.transactionCount}건 거래` : "거래 없음"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="students">학생 ({academy.studentCount})</TabsTrigger>
          <TabsTrigger value="teachers">선생님 ({academy.teacherCount})</TabsTrigger>
          <TabsTrigger value="statistics">통계</TabsTrigger>
          <TabsTrigger value="revenue">매출</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">학원 코드</p>
                    <p className="font-semibold">{academy.code}</p>
                  </div>
                </div>

                {academy.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">주소</p>
                      <p className="font-semibold">{academy.address}</p>
                    </div>
                  </div>
                )}

                {academy.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">전화번호</p>
                      <p className="font-semibold">{academy.phone}</p>
                    </div>
                  </div>
                )}

                {academy.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">이메일</p>
                      <p className="font-semibold">{academy.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">등록일</p>
                    <p className="font-semibold">{formatDate(academy.createdAt)}</p>
                  </div>
                </div>

                {academy.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">설명</p>
                    <p className="text-sm">{academy.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 학원장 정보 */}
            {academy.director && (
              <Card>
                <CardHeader>
                  <CardTitle>학원장 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">이름</p>
                    <p className="font-semibold text-lg">{academy.director.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">이메일</p>
                    <p className="font-semibold">{academy.director.email}</p>
                  </div>

                  {academy.director.phone && (
                    <div>
                      <p className="text-sm text-gray-600">전화번호</p>
                      <p className="font-semibold">{academy.director.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 월별 활동 차트 */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>월별 활동 추이 (최근 6개월)</CardTitle>
                <CardDescription>
                  출석 기록을 기반으로 한 월별 활동 통계
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="활동수"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 학생 목록 탭 */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>학생 목록 ({academy.studentCount}명)</CardTitle>
              <CardDescription>
                이 학원에 등록된 모든 학생 목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {academy.students.length > 0 ? (
                <div className="space-y-4">
                  {academy.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        {student.phone && (
                          <p className="text-sm text-gray-500">{student.phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          등록일: {formatDate(student.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">등록된 학생이 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 선생님 목록 탭 */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>선생님 목록 ({academy.teacherCount}명)</CardTitle>
              <CardDescription>
                이 학원에 등록된 모든 선생님 목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {academy.teachers.length > 0 ? (
                <div className="space-y-4">
                  {academy.teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-semibold">{teacher.name}</p>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                        {teacher.phone && (
                          <p className="text-sm text-gray-500">{teacher.phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">ID: {teacher.id}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">등록된 선생님이 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 통계 탭 */}
        <TabsContent value="statistics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI 채팅 통계</CardTitle>
                <CardDescription>
                  출석 및 숙제 관련 활동 통계
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">출석 기록</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {academy.attendanceCount}회
                      </p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">숙제 제출</p>
                      <p className="text-2xl font-bold text-green-600">
                        {academy.homeworkCount}회
                      </p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-green-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">총 활동</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {academy.totalChats}회
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>구독 정보</CardTitle>
                <CardDescription>
                  현재 구독 플랜 및 제한사항
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">구독 플랜</p>
                    <Badge variant="outline" className="mt-1 text-lg px-3 py-1">
                      {academy.subscriptionPlan}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">학생 제한</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                (academy.studentCount / academy.maxStudents) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {academy.studentCount} / {academy.maxStudents}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">선생님 제한</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                (academy.teacherCount / academy.maxTeachers) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {academy.teacherCount} / {academy.maxTeachers}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 매출 탭 */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>매출 현황</CardTitle>
              <CardDescription>
                이 학원의 매출 및 거래 내역
              </CardDescription>
            </CardHeader>
            <CardContent>
              {academy.revenue && academy.revenue.totalRevenue > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                        <p className="text-sm text-gray-600">총 매출</p>
                      </div>
                      <p className="text-3xl font-bold text-orange-600">
                        {formatCurrency(academy.revenue.totalRevenue)}
                      </p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <p className="text-sm text-gray-600">총 거래</p>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">
                        {academy.revenue.transactionCount}건
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      💡 매출 관리 시스템은{" "}
                      <a
                        href="https://superplace-academy.pages.dev/tools/revenue-management"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        여기
                      </a>
                      에서 확인하실 수 있습니다.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">아직 매출 데이터가 없습니다.</p>
                  <p className="text-sm text-gray-500">
                    매출 정보는{" "}
                    <a
                      href="https://superplace-academy.pages.dev/tools/revenue-management"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      매출 관리 시스템
                    </a>
                    에서 관리됩니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
