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
  RefreshCw,
  BookOpen,
  ClipboardCheck,
  Award,
  Calendar,
  FileText,
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
  cloudflareUserId?: string;
  academy?: {
    id: string;
    name: string;
    code: string;
  };
  // 학생 부가정보
  studentId?: string;
  studentCode?: string;
  grade?: string;
  parentPhone?: string;
  phone?: string;
  _count?: {
    learningProgress: number;
    assignments: number;
    testScores: number;
    attendances: number;
    homeworkSubmissions: number;
  };
  createdAt: string;
  lastLoginAt?: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async (withSync = false) => {
    try {
      setLoading(true);
      if (withSync) {
        setSyncing(true);
      }
      
      const url = withSync ? "/api/admin/users?sync=true" : "/api/admin/users";
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        
        if (withSync && data.syncedFromCloudflare) {
          if (data.syncReport && !data.syncReport.failed) {
            const report = data.syncReport;
            console.log(`✅ Cloudflare D1 자동 동기화 완료: 총 ${report.total}명, 생성 ${report.created}명, 업데이트 ${report.updated}명`);
            // 수동 동기화 시에만 알림 표시
          } else if (data.syncReport?.failed) {
            console.warn('⚠️ Cloudflare D1 동기화 실패:', data.syncReport.error);
          }
        }
      }
    } catch (error) {
      console.error("사용자 목록 로드 실패:", error);
      alert("사용자 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleSyncCloudflare = async () => {
    if (!confirm('Cloudflare D1에서 모든 사용자를 다시 동기화하시겠습니까?\n\n회원가입한 모든 사용자가 자동으로 추가/업데이트됩니다.\n이 작업은 수 분이 소요될 수 있습니다.')) {
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch("/api/admin/users?sync=true");
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        
        if (data.syncReport && !data.syncReport.failed) {
          const report = data.syncReport;
          alert(`✅ Cloudflare D1 동기화 완료!\n\n총 ${report.total}명\n생성: ${report.created}명\n업데이트: ${report.updated}명\n실패: ${report.failed}명`);
        } else if (data.syncReport?.failed) {
          alert(`❌ Cloudflare D1 동기화 실패\n\n${data.syncReport.error}`);
        } else {
          alert('✅ Cloudflare 동기화가 완료되었습니다!');
        }
      }
    } catch (error) {
      console.error("동기화 실패:", error);
      alert("동기화 중 오류가 발생했습니다.");
    } finally {
      setSyncing(false);
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">사용자 관리</h1>
          <p className="text-gray-600">
            전체 사용자 계정을 관리하고 권한을 제어합니다
          </p>
        </div>
        <Button
          onClick={handleSyncCloudflare}
          disabled={syncing}
          size="lg"
          className="gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Cloudflare 동기화 중...' : 'Cloudflare 동기화'}
        </Button>
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
                  {user.cloudflareUserId && (
                    <p className="text-xs text-blue-500 mt-1">
                      ☁️ Cloudflare ID: {user.cloudflareUserId}
                    </p>
                  )}
                  
                  {/* 학생 부가정보 */}
                  {user.role === 'STUDENT' && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {user.studentCode && (
                          <div>
                            <span className="text-gray-500">학생코드:</span>
                            <span className="ml-1 font-medium">{user.studentCode}</span>
                          </div>
                        )}
                        {user.grade && (
                          <div>
                            <span className="text-gray-500">학년:</span>
                            <span className="ml-1 font-medium">{user.grade}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div>
                            <span className="text-gray-500">연락처:</span>
                            <span className="ml-1 font-medium">{user.phone}</span>
                          </div>
                        )}
                        {user.parentPhone && (
                          <div>
                            <span className="text-gray-500">학부모:</span>
                            <span className="ml-1 font-medium">{user.parentPhone}</span>
                          </div>
                        )}
                      </div>
                      
                      {user._count && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            <div className="flex items-center gap-1 text-xs">
                              <BookOpen className="w-3 h-3 text-blue-600" />
                              <span className="text-gray-500">학습:</span>
                              <span className="font-medium">{user._count.learningProgress}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <ClipboardCheck className="w-3 h-3 text-green-600" />
                              <span className="text-gray-500">과제:</span>
                              <span className="font-medium">{user._count.assignments}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Award className="w-3 h-3 text-purple-600" />
                              <span className="text-gray-500">시험:</span>
                              <span className="font-medium">{user._count.testScores}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Calendar className="w-3 h-3 text-orange-600" />
                              <span className="text-gray-500">출석:</span>
                              <span className="font-medium">{user._count.attendances}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <FileText className="w-3 h-3 text-indigo-600" />
                              <span className="text-gray-500">숙제:</span>
                              <span className="font-medium">{user._count.homeworkSubmissions}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
