"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Search,
  Plus,
  Users,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

// 학원 타입 정의
type Academy = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  director: string;
  directorEmail: string;
  studentCount: number;
  teacherCount: number;
  subscriptionPlan: string;
  status: "active" | "inactive";
  createdAt: string;
  maxStudents: number;
  maxTeachers: number;
};

export default function AcademiesPage() {
  const router = useRouter();
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAcademies();
  }, []);

  const loadAcademies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academies');
      
      if (!res.ok) {
        throw new Error('학원 목록을 불러올 수 없습니다.');
      }

      const data = await res.json();
      setAcademies(data.academies);
    } catch (error) {
      console.error('학원 목록 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAcademies = academies.filter((academy) =>
    Object.values(academy).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCreateAcademy = () => {
    alert("학원 등록 기능은 추후 구현 예정입니다.");
  };

  const handleViewDetails = (academyId: string) => {
    router.push(`/dashboard/academies/${academyId}`);
  };

  const handleEditAcademy = (academyId: string) => {
    alert(`학원 수정: ${academyId} - 추후 구현 예정`);
  };

  const handleDeleteAcademy = (academyId: string) => {
    if (confirm("정말 이 학원을 삭제하시겠습니까?")) {
      setAcademies(academies.filter((a) => a.id !== academyId));
    }
  };

  const getStatusBadge = (status: Academy["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            활성
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            비활성
          </Badge>
        );
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: "bg-gray-500",
      BASIC: "bg-blue-500",
      PRO: "bg-purple-500",
      ENTERPRISE: "bg-amber-500",
    };
    return <Badge className={colors[plan] || "bg-gray-500"}>{plan}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-500">학원 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const activeCount = academies.filter((a) => a.status === "active").length;
  const inactiveCount = academies.filter((a) => a.status === "inactive").length;
  const totalStudents = academies.reduce((sum, a) => sum + a.studentCount, 0);
  const totalTeachers = academies.reduce((sum, a) => sum + a.teacherCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학원 관리</h1>
          <p className="mt-2 text-gray-600">
            등록된 학원을 관리하고 현황을 확인하세요
          </p>
        </div>
        <Button onClick={handleCreateAcademy}>
          <Plus className="mr-2 h-4 w-4" />
          새 학원 등록
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 학원</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academies.length}</div>
            <p className="text-xs text-muted-foreground">
              활성 {activeCount} / 비활성 {inactiveCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 학생</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              모든 학원의 학생 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 선생님</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              모든 학원의 선생님 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 학생 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {academies.length > 0
                ? Math.round(totalStudents / academies.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">학원당 평균</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>학원 검색</CardTitle>
          <CardDescription>학원명, 원장명, 주소로 검색하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="검색어를 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Academies List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredAcademies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">
                {academies.length === 0
                  ? "등록된 학원이 없습니다."
                  : "검색 결과가 없습니다."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAcademies.map((academy) => (
            <Card key={academy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{academy.name}</CardTitle>
                      {getStatusBadge(academy.status)}
                      {getPlanBadge(academy.subscriptionPlan)}
                    </div>
                    <CardDescription className="text-base">
                      {academy.description || '설명 없음'}
                    </CardDescription>
                    <p className="text-sm text-gray-500 mt-1">
                      학원 코드: {academy.code}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{academy.address || '주소 없음'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{academy.phone || '전화번호 없음'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{academy.email || '이메일 없음'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">원장: {academy.director}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">
                        학생: {academy.studentCount}명 / 최대 {academy.maxStudents}명
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">
                        선생님: {academy.teacherCount}명 / 최대 {academy.maxTeachers}명
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>가입일: {new Date(academy.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(academy.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      상세보기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAcademy(academy.id)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAcademy(academy.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
