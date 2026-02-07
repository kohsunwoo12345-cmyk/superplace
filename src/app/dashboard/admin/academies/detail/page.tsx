"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  GraduationCap,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ArrowLeft,
  Award,
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
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AcademyDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  subscriptionPlan: string;
  maxStudents: number;
  maxTeachers: number;
  isActive: number;
  createdAt: string;
  director?: any;
  students: any[];
  teachers: any[];
  studentCount: number;
  teacherCount: number;
  totalChats: number;
  attendanceCount: number;
  homeworkCount: number;
  monthlyActivity: any[];
  revenue?: any;
}

export default function AcademyDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const academyId = searchParams.get("id");
  
  const [academy, setAcademy] = useState<AcademyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    // 관리자만 접근 가능
    const userRole = String(userData.role || "").toUpperCase();
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      alert("접근 권한이 없습니다.");
      router.push("/dashboard");
      return;
    }

    if (academyId) {
      fetchAcademyDetail();
    }
  }, [academyId, router]);

  const fetchAcademyDetail = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching academy detail for:", academyId);
      
      const response = await fetch(`/api/admin/academies?id=${academyId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Academy detail received:", data);
        setAcademy(data.academy);
      } else {
        console.error("❌ Failed to fetch academy detail");
        alert("학원 정보를 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("❌ Error fetching academy detail:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !academy) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const getPlanBadge = (plan: string) => {
    switch (plan?.toUpperCase()) {
      case "FREE":
        return <Badge variant="outline">무료</Badge>;
      case "BASIC":
        return <Badge className="bg-blue-500">베이직</Badge>;
      case "PREMIUM":
        return <Badge className="bg-purple-500">프리미엄</Badge>;
      case "ENTERPRISE":
        return <Badge className="bg-gold-500">엔터프라이즈</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Building2 className="h-10 w-10 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold">{academy.name}</h1>
              <p className="text-gray-600 mt-1">{academy.code}</p>
            </div>
            {getPlanBadge(academy.subscriptionPlan)}
            {academy.isActive ? (
              <Badge className="bg-green-500">활성</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">비활성</Badge>
            )}
          </div>
        </div>
        <Button onClick={() => router.push("/dashboard/admin/academies")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              학생 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {academy.studentCount}명
            </div>
            <p className="text-xs text-gray-500 mt-1">
              최대 {academy.maxStudents}명
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              선생님 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {academy.teacherCount}명
            </div>
            <p className="text-xs text-gray-500 mt-1">
              최대 {academy.maxTeachers}명
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              총 대화 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {academy.totalChats}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              출석 {academy.attendanceCount} + 숙제 {academy.homeworkCount}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              총 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {academy.revenue?.totalRevenue 
                ? `${academy.revenue.totalRevenue.toLocaleString()}원`
                : "0원"
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {academy.revenue?.transactionCount || 0}건
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="members">구성원</TabsTrigger>
          <TabsTrigger value="activity">활동 통계</TabsTrigger>
          <TabsTrigger value="revenue">매출 관리</TabsTrigger>
        </TabsList>

        {/* 기본 정보 */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>학원 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {academy.description && (
                  <div>
                    <p className="text-sm text-gray-600">설명</p>
                    <p className="font-medium">{academy.description}</p>
                  </div>
                )}
                {academy.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">주소</p>
                      <p className="font-medium">{academy.address}</p>
                    </div>
                  </div>
                )}
                {academy.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">전화번호</p>
                      <p className="font-medium">{academy.phone}</p>
                    </div>
                  </div>
                )}
                {academy.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">이메일</p>
                      <p className="font-medium">{academy.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">등록일</p>
                    <p className="font-medium">
                      {new Date(academy.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>학원장 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {academy.director ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">이름</p>
                      <p className="font-medium">{academy.director.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">이메일</p>
                        <p className="font-medium">{academy.director.email}</p>
                      </div>
                    </div>
                    {academy.director.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">전화번호</p>
                          <p className="font-medium">{academy.director.phone}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">가입일</p>
                        <p className="font-medium">
                          {new Date(academy.director.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">학원장 정보가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 구성원 */}
        <TabsContent value="members" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  학생 목록 ({academy.studentCount}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {academy.students.length > 0 ? (
                    academy.students.map((student: any) => (
                      <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                        <Badge variant="outline">학생</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">등록된 학생이 없습니다.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  선생님 목록 ({academy.teacherCount}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {academy.teachers.length > 0 ? (
                    academy.teachers.map((teacher: any) => (
                      <div key={teacher.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-sm text-gray-600">{teacher.email}</p>
                        </div>
                        <Badge className="bg-green-500">선생님</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">등록된 선생님이 없습니다.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 활동 통계 */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                월별 활동 추이 (최근 6개월)
              </CardTitle>
              <CardDescription>출석 기록 기준</CardDescription>
            </CardHeader>
            <CardContent>
              {academy.monthlyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={academy.monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8b5cf6" name="활동 수" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-12">
                  활동 데이터가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  총 출석 횟수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {academy.attendanceCount}회
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  총 숙제 제출
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {academy.homeworkCount}건
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  학생당 평균 활동
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {academy.studentCount > 0 
                    ? Math.round(academy.totalChats / academy.studentCount)
                    : 0
                  }회
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 매출 관리 */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                매출 정보
              </CardTitle>
              <CardDescription>
                학원의 매출 및 결제 정보
              </CardDescription>
            </CardHeader>
            <CardContent>
              {academy.revenue ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-600">총 매출</p>
                      <p className="text-3xl font-bold text-green-600">
                        {academy.revenue.totalRevenue?.toLocaleString()}원
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-600">거래 건수</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {academy.revenue.transactionCount}건
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 상세한 매출 내역은 별도의 매출 관리 시스템에서 확인할 수 있습니다.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">매출 데이터가 없습니다.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    매출 기록이 생성되면 여기에 표시됩니다.
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
