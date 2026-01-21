"use client";

import { useState } from "react";
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
} from "lucide-react";

// 학원 타입 정의
type Academy = {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  director: string;
  studentCount: number;
  teacherCount: number;
  plan: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
};

// 샘플 학원 데이터
const sampleAcademies: Academy[] = [
  {
    id: "1",
    name: "서울수학학원",
    description: "중고등 수학 전문 학원",
    address: "서울특별시 강남구 테헤란로 123",
    phone: "02-1234-5678",
    email: "contact@seoulmath.com",
    director: "김학원",
    studentCount: 145,
    teacherCount: 12,
    plan: "엔터프라이즈",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "강남영어타운",
    description: "초중고 영어 전문 학원",
    address: "서울특별시 강남구 논현로 456",
    phone: "02-2345-6789",
    email: "info@gangnameng.com",
    director: "이영어",
    studentCount: 132,
    teacherCount: 10,
    plan: "프로",
    status: "active",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "부산과학학원",
    description: "중고등 과학 전문 학원",
    address: "부산광역시 해운대구 센텀로 789",
    phone: "051-3456-7890",
    email: "contact@busanscience.com",
    director: "박과학",
    studentCount: 128,
    teacherCount: 11,
    plan: "프로",
    status: "active",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    name: "대구종합학원",
    description: "전과목 종합 학원",
    address: "대구광역시 수성구 동대구로 321",
    phone: "053-4567-8901",
    email: "admin@daegutotal.com",
    director: "최종합",
    studentCount: 115,
    teacherCount: 9,
    plan: "베이직",
    status: "pending",
    createdAt: "2024-06-01",
  },
  {
    id: "5",
    name: "인천글로벌학원",
    description: "외국어 전문 학원",
    address: "인천광역시 연수구 송도대로 654",
    phone: "032-5678-9012",
    email: "hello@incheonglobal.com",
    director: "정글로벌",
    studentCount: 108,
    teacherCount: 8,
    plan: "베이직",
    status: "active",
    createdAt: "2024-05-15",
  },
];

export default function AcademiesPage() {
  const [academies, setAcademies] = useState<Academy[]>(sampleAcademies);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAcademies = academies.filter(
    (academy) =>
      academy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      academy.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
      academy.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAcademy = () => {
    alert("학원 등록 기능은 추후 구현 예정입니다.");
  };

  const handleViewDetails = (academyId: string) => {
    alert(`학원 상세보기: ${academyId} - 추후 구현 예정`);
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
          <Badge className="bg-green-500">
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
      case "pending":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            <Calendar className="mr-1 h-3 w-3" />
            승인 대기
          </Badge>
        );
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      베이직: "bg-blue-500",
      프로: "bg-purple-500",
      엔터프라이즈: "bg-indigo-500",
    };
    return <Badge className={colors[plan] || "bg-gray-500"}>{plan}</Badge>;
  };

  const activeCount = academies.filter((a) => a.status === "active").length;
  const pendingCount = academies.filter((a) => a.status === "pending").length;
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 학원 수</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academies.length}</div>
            <p className="text-xs text-muted-foreground">
              활성: {activeCount} · 대기: {pendingCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 학생 수</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">모든 학원 합계</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 선생님 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">모든 학원 합계</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 학생/학원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(totalStudents / academies.length)}
            </div>
            <p className="text-xs text-muted-foreground">학생 평균</p>
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
              <p className="mt-4 text-gray-500">검색 결과가 없습니다.</p>
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
                      {getPlanBadge(academy.plan)}
                    </div>
                    <CardDescription className="text-base">
                      {academy.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{academy.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{academy.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{academy.email}</span>
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
                        학생: {academy.studentCount}명
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">
                        선생님: {academy.teacherCount}명
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>가입일: {academy.createdAt}</span>
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
                      <Trash2 className="h-4 w-4" />
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
