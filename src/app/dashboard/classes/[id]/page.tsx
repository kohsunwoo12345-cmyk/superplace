"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  Calendar,
  Plus,
  Trash2,
  Clock,
  BookOpen,
} from "lucide-react";

interface ClassDetail {
  id: string;
  name: string;
  grade?: string;
  description?: string;
  capacity: number;
  students: {
    id: string;
    student: {
      id: string;
      name: string;
      email: string;
      grade?: string;
      studentId?: string;
    };
    enrolledAt: string;
  }[];
  schedules: {
    id: string;
    subject: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
  }[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  grade?: string;
  studentId?: string;
}

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const SUBJECTS = [
  "수학",
  "영어",
  "국어",
  "과학",
  "사회",
  "역사",
  "물리",
  "화학",
  "생물",
  "지구과학",
  "기타",
];

export default function ClassDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [addScheduleDialogOpen, setAddScheduleDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // 시간표 폼 상태
  const [scheduleForm, setScheduleForm] = useState({
    subject: "",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:00",
    room: "",
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

    fetchClassDetail();
    fetchAvailableStudents();
  }, [session, status, router, classId]);

  const fetchClassDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/academy/classes/${classId}`);
      if (response.ok) {
        const data = await response.json();
        setClassData(data.class);
      }
    } catch (error) {
      console.error("수업 정보 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await fetch("/api/academy/students");
      if (response.ok) {
        const data = await response.json();
        // 승인된 학생만 필터링
        const approved = data.students.filter((s: any) => s.approved);
        setAvailableStudents(approved);
      }
    } catch (error) {
      console.error("학생 목록 로드 실패:", error);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      alert("학생을 선택해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/academy/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });

      if (response.ok) {
        alert("학생이 등록되었습니다.");
        setAddStudentDialogOpen(false);
        setSelectedStudentId("");
        fetchClassDetail();
      } else {
        const data = await response.json();
        alert(data.error || "등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("학생 등록 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleRemoveStudent = async (studentClassId: string) => {
    if (!confirm("이 학생을 수업에서 제외하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/academy/classes/${classId}/students/${studentClassId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        alert("학생이 제외되었습니다.");
        fetchClassDetail();
      } else {
        alert("제외에 실패했습니다.");
      }
    } catch (error) {
      console.error("학생 제외 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleAddSchedule = async () => {
    if (!scheduleForm.subject) {
      alert("과목을 선택해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/academy/classes/${classId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      });

      if (response.ok) {
        alert("시간표가 추가되었습니다.");
        setAddScheduleDialogOpen(false);
        setScheduleForm({
          subject: "",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
          room: "",
        });
        fetchClassDetail();
      } else {
        const data = await response.json();
        alert(data.error || "추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("시간표 추가 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("이 시간표를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/academy/classes/${classId}/schedules/${scheduleId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        alert("시간표가 삭제되었습니다.");
        fetchClassDetail();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("시간표 삭제 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  // 수업에 등록되지 않은 학생만 필터링
  const notEnrolledStudents = availableStudents.filter(
    (student) =>
      !classData?.students.some((s) => s.student.id === student.id)
  );

  if (loading || !classData) {
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <p className="text-gray-600">수업 관리 - 학생 등록 및 시간표 설정</p>
          </div>
        </div>
      </div>

      {/* 정보 카드 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>수업 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classData.grade && (
              <div>
                <p className="text-sm text-gray-600">학년</p>
                <p className="font-semibold">{classData.grade}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">정원</p>
              <p className="font-semibold">
                {classData.students.length} / {classData.capacity}명
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">시간표 개수</p>
              <p className="font-semibold">{classData.schedules.length}개</p>
            </div>
          </div>
          {classData.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">설명</p>
              <p className="mt-1">{classData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 탭 */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">
            <Users className="w-4 h-4 mr-2" />
            학생 관리 ({classData.students.length})
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Calendar className="w-4 h-4 mr-2" />
            시간표 ({classData.schedules.length})
          </TabsTrigger>
        </TabsList>

        {/* 학생 관리 탭 */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">수강 중인 학생</h3>
            <Dialog
              open={addStudentDialogOpen}
              onOpenChange={setAddStudentDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  학생 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>학생 추가</DialogTitle>
                  <DialogDescription>
                    수업에 등록할 학생을 선택하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>학생 선택</Label>
                    <Select
                      value={selectedStudentId}
                      onValueChange={setSelectedStudentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="학생을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {notEnrolledStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.email})
                            {student.studentId && ` - ${student.studentId}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddStudent} className="flex-1">
                      추가
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddStudentDialogOpen(false);
                        setSelectedStudentId("");
                      }}
                      className="flex-1"
                    >
                      취소
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classData.students.map((sc) => (
              <Card key={sc.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{sc.student.name}</h4>
                      <p className="text-sm text-gray-600">{sc.student.email}</p>
                      {sc.student.grade && (
                        <Badge variant="outline" className="mt-1">
                          {sc.student.grade}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveStudent(sc.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {sc.student.studentId && (
                    <p className="text-xs text-gray-500 mt-2">
                      학번: {sc.student.studentId}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    등록일: {new Date(sc.enrolledAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {classData.students.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">아직 등록된 학생이 없습니다.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 시간표 탭 */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">수업 시간표</h3>
            <Dialog
              open={addScheduleDialogOpen}
              onOpenChange={setAddScheduleDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  시간표 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>시간표 추가</DialogTitle>
                  <DialogDescription>
                    수업 시간표를 추가하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>과목</Label>
                    <Select
                      value={scheduleForm.subject}
                      onValueChange={(value) =>
                        setScheduleForm({ ...scheduleForm, subject: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="과목 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>요일</Label>
                    <Select
                      value={scheduleForm.dayOfWeek.toString()}
                      onValueChange={(value) =>
                        setScheduleForm({
                          ...scheduleForm,
                          dayOfWeek: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {day}요일
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>시작 시간</Label>
                      <Input
                        type="time"
                        value={scheduleForm.startTime}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            startTime: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>종료 시간</Label>
                      <Input
                        type="time"
                        value={scheduleForm.endTime}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            endTime: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>강의실 (선택)</Label>
                    <Input
                      value={scheduleForm.room}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          room: e.target.value,
                        })
                      }
                      placeholder="예: 101호"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddSchedule} className="flex-1">
                      추가
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAddScheduleDialogOpen(false)}
                      className="flex-1"
                    >
                      취소
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* 요일별 시간표 */}
          <div className="grid grid-cols-1 gap-4">
            {DAYS_OF_WEEK.map((day, dayIndex) => {
              const daySchedules = classData.schedules.filter(
                (s) => s.dayOfWeek === dayIndex
              );

              return (
                <Card key={dayIndex}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {day}요일
                      <Badge variant="outline" className="ml-2">
                        {daySchedules.length}개
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {daySchedules.length > 0 ? (
                      <div className="space-y-2">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold">
                                  {schedule.subject}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                              </div>
                              {schedule.room && (
                                <Badge variant="outline">{schedule.room}</Badge>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        등록된 시간표가 없습니다
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
