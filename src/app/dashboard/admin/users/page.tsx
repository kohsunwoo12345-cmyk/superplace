"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  UserCheck,
  Building2,
  Filter,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  academyId?: string;
  academyName?: string;
  createdAt: string;
  lastLoginAt?: string;
  attendanceCode?: string; // 출석 코드 추가
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    console.log('👤 Current user:', userData);
    setCurrentUser(userData);
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      // role 추가 (관리자는 모든 사용자 조회)
      if (currentUser?.role) {
        params.append('role', currentUser.role);
      }
      
      console.log('👥 Fetching all users with role:', currentUser?.role);
      
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Users data received:', data);
        setUsers(data.users || []);
      } else {
        console.error('❌ Failed to fetch users:', response.status);
      }
    } catch (error) {
      console.error("사용자 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.academyName && user.academyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const userRole = user.role?.toUpperCase();
    const matchesRole = selectedRole === "ALL" || userRole === selectedRole || 
      (selectedRole === "ADMIN" && (userRole === "ADMIN" || userRole === "SUPER_ADMIN"));

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    students: users.filter((u) => {
      const role = u.role?.toUpperCase();
      return role === "STUDENT";
    }).length,
    teachers: users.filter((u) => {
      const role = u.role?.toUpperCase();
      return role === "TEACHER";
    }).length,
    directors: users.filter((u) => {
      const role = u.role?.toUpperCase();
      return role === "DIRECTOR";
    }).length,
    admins: users.filter((u) => {
      const role = u.role?.toUpperCase();
      return role === "ADMIN" || role === "SUPER_ADMIN";
    }).length,
  };

  const getRoleBadge = (role: string) => {
    const upperRole = role?.toUpperCase();
    switch (upperRole) {
      case "STUDENT":
        return <Badge className="bg-blue-500">학생</Badge>;
      case "TEACHER":
        return <Badge className="bg-green-500">선생님</Badge>;
      case "DIRECTOR":
        return <Badge className="bg-purple-500">학원장</Badge>;
      case "ADMIN":
      case "SUPER_ADMIN":
        return <Badge className="bg-red-500">관리자</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
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
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            사용자 관리
          </h1>
          <p className="text-gray-600 mt-1">
            전체 사용자를 조회하고 관리합니다
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/admin")}>
          대시보드로
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className={selectedRole === "ALL" ? "border-2 border-blue-500" : ""}>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xl sm:text-2xl font-bold">{stats.total}명</span>
            </div>
            <Button
              variant={selectedRole === "ALL" ? "default" : "outline"}
              size="sm"
              className="w-full mt-2"
              onClick={() => setSelectedRole("ALL")}
            >
              전체 보기
            </Button>
          </CardContent>
        </Card>

        <Card className={selectedRole === "STUDENT" ? "border-2 border-blue-500" : ""}>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              학생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span className="text-xl sm:text-2xl font-bold">{stats.students}명</span>
            </div>
            <Button
              variant={selectedRole === "STUDENT" ? "default" : "outline"}
              size="sm"
              className="w-full mt-2"
              onClick={() => setSelectedRole("STUDENT")}
            >
              학생만
            </Button>
          </CardContent>
        </Card>

        <Card className={selectedRole === "TEACHER" ? "border-2 border-green-500" : ""}>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              선생님
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              <span className="text-xl sm:text-2xl font-bold">{stats.teachers}명</span>
            </div>
            <Button
              variant={selectedRole === "TEACHER" ? "default" : "outline"}
              size="sm"
              className="w-full mt-2"
              onClick={() => setSelectedRole("TEACHER")}
            >
              선생님만
            </Button>
          </CardContent>
        </Card>

        <Card className={selectedRole === "DIRECTOR" ? "border-2 border-purple-500" : ""}>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              학원장
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span className="text-xl sm:text-2xl font-bold">{stats.directors}명</span>
            </div>
            <Button
              variant={selectedRole === "DIRECTOR" ? "default" : "outline"}
              size="sm"
              className="w-full mt-2"
              onClick={() => setSelectedRole("DIRECTOR")}
            >
              학원장만
            </Button>
          </CardContent>
        </Card>

        <Card className={selectedRole === "ADMIN" ? "border-2 border-red-500" : ""}>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              관리자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-red-600" />
              <span className="text-xl sm:text-2xl font-bold">{stats.admins}명</span>
            </div>
            <Button
              variant={selectedRole === "ADMIN" ? "default" : "outline"}
              size="sm"
              className="w-full mt-2"
              onClick={() => setSelectedRole("ADMIN")}
            >
              관리자만
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="이름, 이메일, 학원명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>
            사용자 목록 ({filteredUsers.length}명)
          </CardTitle>
          <CardDescription>
            {selectedRole === "ALL" ? "전체 사용자" :
             selectedRole === "STUDENT" ? "학생만" :
             selectedRole === "TEACHER" ? "선생님만" :
             selectedRole === "DIRECTOR" ? "학원장만" : "관리자만"} 표시 중
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.academyName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{user.academyName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        가입일: {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {user.role === 'STUDENT' && user.attendanceCode && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-base font-mono bg-blue-50">
                          출석코드: {user.attendanceCode}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/admin/users/detail?id=${user.id}`)}
                  >
                    상세보기
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">검색 결과가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
