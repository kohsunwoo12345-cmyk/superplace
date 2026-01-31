"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Users,
  GraduationCap,
  UserCheck,
  Bot,
  Coins,
  Eye,
  Key,
  LogIn,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  aiChatEnabled: boolean;
  aiHomeworkEnabled: boolean;
  aiStudyEnabled: boolean;
  approved: boolean;
  academy?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  lastLoginAt?: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // SUPER_ADMIN 또는 DIRECTOR 권한 필요
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "DIRECTOR") {
      router.push("/dashboard");
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
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
      user.academy?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-500";
      case "DIRECTOR":
        return "bg-purple-500";
      case "TEACHER":
        return "bg-blue-500";
      case "STUDENT":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "시스템 관리자";
      case "DIRECTOR":
        return "학원장";
      case "TEACHER":
        return "선생님";
      case "STUDENT":
        return "학생";
      default:
        return role;
    }
  };

  const handleImpersonate = async (userId: string) => {
    if (!confirm("해당 사용자 계정으로 로그인하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        // 세션 토큰을 설정하고 리다이렉트
        window.location.href = "/dashboard";
      } else {
        alert("로그인 실패");
      }
    } catch (error) {
      console.error("Impersonate 실패:", error);
      alert("오류가 발생했습니다.");
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

  // 통계 계산
  const stats = {
    total: users.length,
    directors: users.filter((u) => u.role === "DIRECTOR").length,
    teachers: users.filter((u) => u.role === "TEACHER").length,
    students: users.filter((u) => u.role === "STUDENT").length,
    totalPoints: users.reduce((sum, u) => sum + u.points, 0),
    aiEnabled: users.filter(
      (u) => u.aiChatEnabled || u.aiHomeworkEnabled || u.aiStudyEnabled
    ).length,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">사용자 관리</h1>
        <p className="text-gray-600">
          전체 사용자 계정을 관리하고 권한을 제어합니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              학원장
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold">{stats.directors}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              선생님
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.teachers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              학생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.students}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 포인트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="text-2xl font-bold">
                {stats.totalPoints.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              AI 활성화
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span className="text-2xl font-bold">{stats.aiEnabled}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
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
            <div className="flex gap-2">
              {["ALL", "DIRECTOR", "TEACHER", "STUDENT"].map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "default" : "outline"}
                  onClick={() => setRoleFilter(role)}
                  size="sm"
                >
                  {role === "ALL"
                    ? "전체"
                    : role === "DIRECTOR"
                    ? "학원장"
                    : role === "TEACHER"
                    ? "선생님"
                    : "학생"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 */}
      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    {!user.approved && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        승인 대기
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                  {user.academy && (
                    <p className="text-sm text-gray-500">
                      소속: {user.academy.name} ({user.academy.code})
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <span>{user.points.toLocaleString()} P</span>
                    </div>
                    {user.aiChatEnabled && (
                      <Badge variant="outline" className="text-xs">
                        <Bot className="w-3 h-3 mr-1" />
                        AI 채팅
                      </Badge>
                    )}
                    {user.aiHomeworkEnabled && (
                      <Badge variant="outline" className="text-xs">
                        <Bot className="w-3 h-3 mr-1" />
                        AI 숙제
                      </Badge>
                    )}
                    {user.aiStudyEnabled && (
                      <Badge variant="outline" className="text-xs">
                        <Bot className="w-3 h-3 mr-1" />
                        AI 학습
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    상세
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImpersonate(user.id)}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    로그인
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
