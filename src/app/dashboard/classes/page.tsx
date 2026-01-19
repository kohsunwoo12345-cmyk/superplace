"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  GraduationCap,
  Clock,
} from "lucide-react";

interface Class {
  id: string;
  name: string;
  grade?: string;
  description?: string;
  teacherId?: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    students: number;
    schedules: number;
  };
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

export default function ClassesManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    description: "",
    teacherId: "",
    capacity: 20,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.role !== "DIRECTOR" && session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchClasses();
    fetchTeachers();
  }, [session, status, router]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/academy/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("수업 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/academy/teachers");
      if (response.ok) {
        const data = await response.json();
        // 승인된 선생님만 필터링
        const approvedTeachers = data.teachers.filter((t: any) => t.approved);
        setTeachers(approvedTeachers);
      }
    } catch (error) {
      console.error("선생님 목록 로드 실패:", error);
    }
  };

  const handleOpenDialog = (classToEdit?: Class) => {
    if (classToEdit) {
      setEditingClass(classToEdit);
      setFormData({
        name: classToEdit.name,
        grade: classToEdit.grade || "",
        description: classToEdit.description || "",
        teacherId: classToEdit.teacherId || "",
        capacity: classToEdit.capacity,
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: "",
        grade: "",
        description: "",
        teacherId: "",
        capacity: 20,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClass(null);
    setFormData({
      name: "",
      grade: "",
      description: "",
      teacherId: "",
      capacity: 20,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert("수업 이름을 입력해주세요.");
      return;
    }

    try {
      const url = editingClass
        ? `/api/academy/classes/${editingClass.id}`
        : "/api/academy/classes";
      const method = editingClass ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingClass ? "수업이 수정되었습니다." : "수업이 생성되었습니다.");
        handleCloseDialog();
        fetchClasses();
      } else {
        const data = await response.json();
        alert(data.error || "처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("수업 처리 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleDelete = async (classId: string) => {
    if (!confirm("정말 이 수업을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/academy/classes/${classId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("수업이 삭제되었습니다.");
        fetchClasses();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("수업 삭제 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return "미배정";
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? teacher.name : "알 수 없음";
  };

  const stats = {
    total: classes.length,
    active: classes.filter((c) => c.isActive).length,
    totalStudents: classes.reduce((sum, c) => sum + c._count.students, 0),
    totalSchedules: classes.reduce((sum, c) => sum + c._count.schedules, 0),
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">수업 관리</h1>
          <p className="text-gray-600">학원의 수업/반을 생성하고 관리합니다</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              수업 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClass ? "수업 수정" : "새 수업 생성"}
              </DialogTitle>
              <DialogDescription>
                수업 정보를 입력하고 저장하세요
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">수업 이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="예: 중등 1학년 A반"
                  required
                />
              </div>

              <div>
                <Label htmlFor="grade">학년</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) =>
                    setFormData({ ...formData, grade: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="학년 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">선택 안함</SelectItem>
                    <SelectItem value="초1">초등 1학년</SelectItem>
                    <SelectItem value="초2">초등 2학년</SelectItem>
                    <SelectItem value="초3">초등 3학년</SelectItem>
                    <SelectItem value="초4">초등 4학년</SelectItem>
                    <SelectItem value="초5">초등 5학년</SelectItem>
                    <SelectItem value="초6">초등 6학년</SelectItem>
                    <SelectItem value="중1">중등 1학년</SelectItem>
                    <SelectItem value="중2">중등 2학년</SelectItem>
                    <SelectItem value="중3">중등 3학년</SelectItem>
                    <SelectItem value="고1">고등 1학년</SelectItem>
                    <SelectItem value="고2">고등 2학년</SelectItem>
                    <SelectItem value="고3">고등 3학년</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="teacherId">담당 선생님</Label>
                <Select
                  value={formData.teacherId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teacherId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선생님 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">미배정</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="capacity">정원</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: parseInt(e.target.value) || 20,
                    })
                  }
                  min={1}
                  max={100}
                />
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="수업에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingClass ? "수정" : "생성"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 수업
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              활성 수업
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.active}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 수강생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold">{stats.totalStudents}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 시간표
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-2xl font-bold">{stats.totalSchedules}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 수업 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <Card key={cls.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{cls.name}</CardTitle>
                  {cls.grade && (
                    <Badge variant="outline" className="mb-2">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {cls.grade}
                    </Badge>
                  )}
                  {cls.description && (
                    <CardDescription className="text-sm mt-2">
                      {cls.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={cls.isActive ? "default" : "outline"}>
                  {cls.isActive ? "활성" : "비활성"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">담당 선생님:</span>{" "}
                  {getTeacherName(cls.teacherId)}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {cls._count.students} / {cls.capacity}명
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{cls._count.schedules}개 시간표</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/classes/${cls.id}`)
                    }
                    className="flex-1"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    관리
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(cls)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(cls.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              아직 생성된 수업이 없습니다.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              첫 수업 생성하기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
