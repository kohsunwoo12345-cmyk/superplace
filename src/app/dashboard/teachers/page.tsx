"use client";

import { useState, useEffect } from "react";
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
  UserCheck,
  Search,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Teacher {
  id: string;
  email: string;
  name: string;
  phone?: string;
  approved: boolean;
  createdAt: string;
  lastLoginAt?: string;
  _count: {
    createdMaterials: number;
    createdAssignments: number;
  };
}

export default function TeachersManagementPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [user, setUser] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    // localStorage에서 사용자 정보 확인
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    if (userData.role !== "DIRECTOR" && userData.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchTeachers();
  }, [router]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/teachers/list", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      } else {
        console.error("교사 목록 조회 실패:", response.status);
      }
    } catch (error) {
      console.error("선생님 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.phone || !newTeacher.password) {
      alert("이름, 전화번호, 비밀번호는 필수입니다.");
      return;
    }

    if (!confirm("교사를 추가하시겠습니까?")) {
      return;
    }

    try {
      setAddingTeacher(true);
      const token = localStorage.getItem("token");
      
      // 토큰 디버깅
      console.log("🔍 Token check:", token ? `${token.substring(0, 50)}...` : "NULL");
      
      if (!token) {
        alert("로그인 토큰이 없습니다. 다시 로그인해주세요.");
        router.push("/login");
        return;
      }
      
      console.log("📤 Sending request to /api/teachers/add");
      console.log("📦 Request data:", { name: newTeacher.name, phone: newTeacher.phone });
      
      const response = await fetch("/api/teachers/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(newTeacher),
      });
      
      console.log("📥 Response status:", response.status);
      console.log("📥 Response ok:", response.ok);

      const data = await response.json();
      
      console.log("📦 Response data:", JSON.stringify(data, null, 2));
      console.log("🔍 data.success:", data.success);
      console.log("🔍 data.tempPassword:", data.tempPassword);

      if (response.ok && data.success) {
        console.log("✅ 교사 추가 성공!");
        alert(`교사 추가가 성공하였습니다!\n\n임시 비밀번호: ${data.tempPassword}\n\n교사에게 전달해주세요.`);
        setShowAddDialog(false);
        setNewTeacher({ name: "", email: "", phone: "", password: "" });
        fetchTeachers();
      } else {
        console.error("❌ 교사 추가 실패");
        console.error("❌ response.ok:", response.ok);
        console.error("❌ data.success:", data.success);
        console.error("❌ Full response:", data);
        alert(`교사 추가 실패: ${data.error || data.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("교사 추가 오류:", error);
      alert("교사 추가 중 오류가 발생했습니다.");
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleApprove = async (teacherId: string, approve: boolean) => {
    if (!confirm(`해당 선생님을 ${approve ? "승인" : "거부"}하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/academy/teachers/${teacherId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: approve }),
      });

      if (response.ok) {
        alert(approve ? "선생님이 승인되었습니다." : "선생님 승인이 거부되었습니다.");
        fetchTeachers();
      } else {
        alert("처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 처리 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "APPROVED" && teacher.approved) ||
      (filterStatus === "PENDING" && !teacher.approved);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: teachers.length,
    approved: teachers.filter((t) => t.approved).length,
    pending: teachers.filter((t) => !t.approved).length,
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
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">선생님 관리</h1>
          <p className="text-gray-600">학원 소속 선생님을 관리합니다</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          선생님 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 선생님
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xl sm:text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              승인됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xl sm:text-2xl font-bold">{stats.approved}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              승인 대기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xl sm:text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="이름, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {["ALL", "APPROVED", "PENDING"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  size="sm"
                >
                  {status === "ALL"
                    ? "전체"
                    : status === "APPROVED"
                    ? "승인됨"
                    : "승인 대기"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 선생님 목록 */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTeachers.map((teacher) => (
          <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{teacher.name}</h3>
                    {teacher.approved ? (
                      <Badge className="bg-green-500">승인됨</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        승인 대기
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{teacher.email}</span>
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        가입일: {new Date(teacher.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-gray-600">
                      학습 자료: {teacher._count.createdMaterials}개
                    </span>
                    <span className="text-gray-600">
                      과제: {teacher._count.createdAssignments}개
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!teacher.approved && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(teacher.id, true)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        승인
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(teacher.id, false)}
                        className="text-red-600"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        거부
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* 교사 추가 다이얼로그 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>교사 추가</DialogTitle>
            <DialogDescription>
              새로운 교사를 추가합니다. 이름, 전화번호, 비밀번호는 필수입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                value={newTeacher.phone}
                onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                placeholder="010-1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일 (선택)</Label>
              <Input
                id="email"
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                placeholder="teacher@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                value={newTeacher.password}
                onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                placeholder="비밀번호를 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewTeacher({ name: "", email: "", phone: "", password: "" });
              }}
              disabled={addingTeacher}
            >
              취소
            </Button>
            <Button onClick={handleAddTeacher} disabled={addingTeacher}>
              {addingTeacher ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
