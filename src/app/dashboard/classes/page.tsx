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
  BookOpen,
  Plus,
  Users,
  Calendar,
  User,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ClassData {
  id: string;
  name: string;
  grade?: string;
  description?: string;
  teacherId?: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  students: any[];
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
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    description: "",
    teacherId: "",
    capacity: "20",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (
      session?.user?.role !== "DIRECTOR" &&
      session?.user?.role !== "SUPER_ADMIN"
    ) {
      router.push("/dashboard");
      return;
    }

    fetchClasses();
    fetchTeachers();
  }, [session, status, router]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/classes");
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
        setTeachers(data.teachers.filter((t: any) => t.approved));
      }
    } catch (error) {
      console.error("선생님 목록 로드 실패:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity),
          teacherId: formData.teacherId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "수업 생성에 실패했습니다");
      }

      alert("수업이 생성되었습니다");
      setFormData({
        name: "",
        grade: "",
        description: "",
        teacherId: "",
        capacity: "20",
      });
      setIsCreateDialogOpen(false);
      fetchClasses();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold mb-2">수업 관리</h1>
          <p className="text-gray-600">학원의 수업을 생성하고 관리합니다</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          수업 생성
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 수업
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">{classes.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              등록 학생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">
                {classes.reduce((acc, cls) => acc + cls._count.students, 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              담당 선생님
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold">{teachers.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="수업 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 수업 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => (
          <Card key={cls.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{cls.name}</span>
                {cls.grade && (
                  <Badge variant="outline">{cls.grade}</Badge>
                )}
              </CardTitle>
              {cls.description && (
                <CardDescription>{cls.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">학생</span>
                  <span className="font-semibold">
                    {cls._count.students} / {cls.capacity}명
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">스케줄</span>
                  <span className="font-semibold">
                    {cls._count.schedules}개
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-xs text-gray-500">
                    생성일: {new Date(cls.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? "검색 결과가 없습니다." : "등록된 수업이 없습니다."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 수업 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              수업 생성
            </DialogTitle>
            <DialogDescription>
              새로운 수업을 생성합니다. 생성 후 학생을 배정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  수업 이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="예: 중3 수학 A반"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="grade">학년</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                  placeholder="예: 중3, 고1"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="수업에 대한 간단한 설명"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="teacherId">담당 선생님</Label>
                <select
                  id="teacherId"
                  value={formData.teacherId}
                  onChange={(e) =>
                    setFormData({ ...formData, teacherId: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">선택 안 함</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="capacity">정원</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "생성 중..." : "수업 생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
