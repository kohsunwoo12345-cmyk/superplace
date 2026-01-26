"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Plus,
  UserPlus,
  UserMinus,
  Calendar,
  BookOpen,
  Loader2,
  Search,
} from "lucide-react";

type ClassData = {
  id: string;
  name: string;
  grade: string | null;
  description: string | null;
  capacity: number;
  isActive: boolean;
  students: Array<{
    id: string;
    student: {
      id: string;
      name: string;
      email: string;
      studentCode: string;
      grade: string | null;
    };
  }>;
  schedules: Array<{
    id: string;
    subject: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  _count: {
    students: number;
  };
};

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("");
  const [newClassCapacity, setNewClassCapacity] = useState("20");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  useEffect(() => {
    loadClasses();
    loadAvailableStudents();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/classes/manage");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("반 목록 로딩 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const response = await fetch("/api/academy/students");
      if (response.ok) {
        const data = await response.json();
        setAvailableStudents(data.students);
      }
    } catch (error) {
      console.error("학생 목록 로딩 오류:", error);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName) return;

    try {
      const response = await fetch("/api/classes/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassName,
          grade: newClassGrade || null,
          capacity: parseInt(newClassCapacity),
        }),
      });

      if (response.ok) {
        setNewClassName("");
        setNewClassGrade("");
        setNewClassCapacity("20");
        setCreateDialogOpen(false);
        loadClasses();
      }
    } catch (error) {
      console.error("반 생성 오류:", error);
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedClass || !selectedStudent) return;

    try {
      const response = await fetch(`/api/classes/${selectedClass}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent }),
      });

      if (response.ok) {
        setSelectedStudent("");
        setAssignDialogOpen(false);
        loadClasses();
      }
    } catch (error) {
      console.error("학생 배정 오류:", error);
    }
  };

  const handleRemoveStudent = async (classId: string, studentId: string) => {
    if (!confirm("이 학생을 반에서 제외하시겠습니까?")) return;

    try {
      const response = await fetch(
        `/api/classes/${classId}/assign?studentId=${studentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        loadClasses();
      }
    } catch (error) {
      console.error("학생 제외 오류:", error);
    }
  };

  const getDayName = (day: number) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[day];
  };

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">반 관리</h1>
          <p className="mt-2 text-gray-600">반을 생성하고 학생을 배정하세요</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 반 만들기
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 반 만들기</DialogTitle>
              <DialogDescription>
                새로운 반을 생성하고 학생들을 배정하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">반 이름</label>
                <Input
                  placeholder="예: 중등 1학년 A반"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">학년 (선택)</label>
                <Input
                  placeholder="예: 중1, 고2"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">정원</label>
                <Input
                  type="number"
                  value={newClassCapacity}
                  onChange={(e) => setNewClassCapacity(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateClass} className="w-full">
                반 만들기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 반</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 학생</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.reduce((sum, cls) => sum + cls._count.students, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 학생 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.length > 0
                ? Math.round(
                    classes.reduce((sum, cls) => sum + cls._count.students, 0) /
                      classes.length
                  )
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>반 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="반 이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classes List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredClasses.map((cls) => (
          <Card key={cls.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{cls.name}</CardTitle>
                    {cls.grade && (
                      <Badge variant="secondary">{cls.grade}</Badge>
                    )}
                    <Badge variant={cls.isActive ? "default" : "secondary"}>
                      {cls.isActive ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  {cls.description && (
                    <CardDescription>{cls.description}</CardDescription>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {cls._count.students}/{cls.capacity}
                  </div>
                  <p className="text-xs text-gray-500">학생 수</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 시간표 */}
              {cls.schedules.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">📅 시간표</h4>
                  <div className="flex gap-2 flex-wrap">
                    {cls.schedules.map((schedule) => (
                      <Badge key={schedule.id} variant="outline">
                        {getDayName(schedule.dayOfWeek)} {schedule.startTime}-
                        {schedule.endTime} {schedule.subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 학생 목록 */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">👥 학생 목록</h4>
                  <Dialog
                    open={assignDialogOpen && selectedClass === cls.id}
                    onOpenChange={(open) => {
                      setAssignDialogOpen(open);
                      if (open) setSelectedClass(cls.id);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <UserPlus className="mr-2 h-3 w-3" />
                        학생 배정
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>학생 배정</DialogTitle>
                        <DialogDescription>
                          {cls.name}에 학생을 배정하세요
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select
                          value={selectedStudent}
                          onValueChange={setSelectedStudent}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="학생 선택..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStudents.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} ({student.studentId || student.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAssignStudent}
                          className="w-full"
                          disabled={!selectedStudent}
                        >
                          배정하기
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {cls.students.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    배정된 학생이 없습니다
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cls.students.map((sc) => (
                      <div
                        key={sc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{sc.student.name}</p>
                          <p className="text-sm text-gray-500">
                            {sc.student.studentCode} • {sc.student.email}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleRemoveStudent(cls.id, sc.student.id)
                          }
                        >
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
