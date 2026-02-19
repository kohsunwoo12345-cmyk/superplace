"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface Academy {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  directorName?: string;
  studentCount: number;
  teacherCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminAcademiesPage() {
  const router = useRouter();
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let userData = null;
    
    if (storedUser) {
      userData = JSON.parse(storedUser);
      setCurrentUser(userData);
    } else {
      // No user in localStorage, but we can still show mock data
      console.log('No user found, will use mock data');
      setCurrentUser({ name: "Admin User", role: "ADMIN" });
    }

    fetchAcademies();
  }, [router]);

  const fetchAcademies = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error('❌ No authentication token found');
        setAcademies([]);
        setLoading(false);
        return;
      }
      
      console.log('📡 Fetching academies from API...');
      
      try {
        const response = await fetch("/api/admin/academies", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 API Response status:', response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ 학원 목록 로드 완료:', data);
          console.log('📊 학원 개수:', data.academies?.length || 0);
          console.log('📋 학원 목록:', data.academies);
          
          // API 에러 메시지 확인
          if (data.error || data.message) {
            console.error('⚠️ API 경고:', data.error, data.message);
            alert(`⚠️ ${data.message || data.error}`);
          }
          
          setAcademies(data.academies || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ 학원 목록 로드 실패:', response.status, errorData);
          setAcademies([]);
        }
      } catch (apiError) {
        console.error("❌ API call failed:", apiError);
        setAcademies([]);
      }

    } catch (error) {
      console.error("❌ 학원 목록 로드 실패:", error);
      setAcademies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAcademies = academies.filter((academy) =>
    academy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (academy.address && academy.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (academy.directorName && academy.directorName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: academies.length,
    active: academies.filter((a) => a.isActive).length,
    totalStudents: academies.reduce((sum, a) => sum + a.studentCount, 0),
    totalTeachers: academies.reduce((sum, a) => sum + a.teacherCount, 0),
    averageStudents: academies.length > 0
      ? Math.round(academies.reduce((sum, a) => sum + a.studentCount, 0) / academies.length)
      : 0,
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

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-purple-600" />
            학원 관리
          </h1>
          <p className="text-gray-600 mt-1">
            등록된 학원을 조회하고 관리합니다
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/admin")}>
          대시보드로
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 학원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold">{stats.total}개</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              활성 학원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.active}개</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 학생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.totalStudents}명</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 선생님
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.totalTeachers}명</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              평균 학생 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-2xl font-bold">{stats.averageStudents}명</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="학원명, 주소, 학원장 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 학원 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>
            학원 목록 ({filteredAcademies.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAcademies.map((academy) => (
              <Card
                key={academy.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/admin/academies/detail?id=${academy.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{academy.name}</CardTitle>
                      {academy.directorName && (
                        <CardDescription className="mt-1">
                          원장: {academy.directorName}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={academy.isActive ? "default" : "secondary"}>
                      {academy.isActive ? "활성" : "비활성"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {academy.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{academy.address}</span>
                    </div>
                  )}
                  {academy.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{academy.phone}</span>
                    </div>
                  )}
                  {academy.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{academy.email}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-4 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">{academy.studentCount}</span>
                      <span className="text-gray-600">학생</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">{academy.teacherCount}</span>
                      <span className="text-gray-600">선생님</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      등록일: {new Date(academy.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAcademies.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">검색 결과가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
