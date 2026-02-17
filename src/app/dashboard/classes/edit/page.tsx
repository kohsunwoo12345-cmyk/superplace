"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Trash2, Loader2, UserPlus, X } from "lucide-react";

// 요일 상수
const DAYS_OF_WEEK = [
  { value: 1, label: "월요일", short: "월" },
  { value: 2, label: "화요일", short: "화" },
  { value: 3, label: "수요일", short: "수" },
  { value: 4, label: "목요일", short: "목" },
  { value: 5, label: "금요일", short: "금" },
  { value: 6, label: "토요일", short: "토" },
  { value: 0, label: "일요일", short: "일" },
];

// 색상 프리셋
const COLOR_PRESETS = [
  { name: "파란색", value: "#3B82F6" },
  { name: "보라색", value: "#8B5CF6" },
  { name: "분홍색", value: "#EC4899" },
  { name: "빨간색", value: "#EF4444" },
  { name: "주황색", value: "#F97316" },
  { name: "초록색", value: "#10B981" },
  { name: "청록색", value: "#14B8A6" },
  { name: "남색", value: "#6366F1" },
];

interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
  academyId?: number;
}

interface Schedule {
  id: string;
  dayOfWeek: number[];
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
}

export default function ClassEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams?.get("id");

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 클래스 기본 정보
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  
  // 스케줄
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  // 학생 관리
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    console.log('🔍 Edit page loaded');
    console.log('📝 Class ID from URL:', classId);
    console.log('🌐 Full URL:', window.location.href);
    console.log('❓ Search params:', window.location.search);
    
    if (!classId) {
      console.error('❌ No class ID found!');
      alert("클래스 ID가 없습니다");
      router.push("/dashboard/classes");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      console.log('❌ No user found, redirecting to login');
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    console.log('✅ User found:', userData.name);
    setUser(userData);
    
    loadClassData(classId, userData);
    loadAvailableStudents(userData);
  }, [classId, router]);

  // 클래스 데이터 로드
  const loadClassData = async (id: string, userData: any) => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `/api/classes/manage?userId=${userData.id}&role=${userData.role}&academyId=${userData.academyId}`
      );
      
      if (!response.ok) throw new Error("Failed to load class");
      
      const data = await response.json();
      const classData = data.classes?.find((c: any) => c.id === id);
      
      if (!classData) {
        alert("클래스를 찾을 수 없습니다");
        router.push("/dashboard/classes");
        return;
      }
      
      setName(classData.name || "");
      setGrade(classData.grade || "");
      setDescription(classData.description || "");
      setColor(classData.color || "#3B82F6");
      
      // 스케줄 파싱
      if (classData.daySchedule) {
        try {
          const parsed = JSON.parse(classData.daySchedule);
          setSchedules(parsed.map((s: any, idx: number) => ({
            id: `schedule-${idx}`,
            dayOfWeek: Array.isArray(s.dayOfWeek) ? s.dayOfWeek : [s.dayOfWeek],
            startTime: s.startTime || "",
            endTime: s.endTime || "",
            subject: s.subject || "",
            room: s.room || ""
          })));
        } catch (e) {
          console.error("Failed to parse schedule:", e);
        }
      } else if (classData.scheduleDays) {
        try {
          const days = JSON.parse(classData.scheduleDays);
          setSchedules([{
            id: "schedule-0",
            dayOfWeek: days,
            startTime: classData.startTime || "",
            endTime: classData.endTime || "",
            subject: "",
            room: ""
          }]);
        } catch (e) {
          console.error("Failed to parse legacy schedule:", e);
        }
      }
      
      loadAssignedStudents(id);
      
    } catch (error) {
      console.error("Failed to load class:", error);
      alert("클래스 정보를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 배정된 학생 목록 로드
  const loadAssignedStudents = async (classId: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/students`);
      if (response.ok) {
        const data = await response.json();
        setAssignedStudents(data.students || []);
      }
    } catch (error) {
      console.error("Failed to load assigned students:", error);
    }
  };

  // 배정 가능한 학생 목록 로드
  const loadAvailableStudents = async (userData: any) => {
    try {
      // 🔒 보안 강화: Authorization 헤더로 인증, role/academyId 파라미터 제거
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const token = user?.token || localStorage.getItem("token");
      
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }

      console.log('👥 Loading available students with token authentication');
      
      const response = await fetch(`/api/students/by-academy`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        console.error('❌ Unauthorized - redirecting to login');
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.push('/login');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Available students loaded:', data.students?.length || 0);
        setAvailableStudents(data.students || []);
      } else {
        console.error('❌ Failed to load students:', response.status);
      }
    } catch (error) {
      console.error("Failed to load available students:", error);
    }
  };

  // 스케줄 추가
  const addSchedule = () => {
    const newSchedule: Schedule = {
      id: `schedule-${Date.now()}`,
      dayOfWeek: [1],
      startTime: "09:00",
      endTime: "10:00",
      subject: "",
      room: ""
    };
    setSchedules([...schedules, newSchedule]);
  };

  // 스케줄 삭제
  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  // 스케줄 업데이트
  const updateSchedule = (id: string, field: string, value: any) => {
    setSchedules(schedules.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // 요일 토글
  const toggleDay = (scheduleId: string, day: number) => {
    setSchedules(schedules.map(s => {
      if (s.id === scheduleId) {
        const days = [...s.dayOfWeek];
        const index = days.indexOf(day);
        if (index > -1) {
          days.splice(index, 1);
        } else {
          days.push(day);
          days.sort((a, b) => a - b);
        }
        return { ...s, dayOfWeek: days.length > 0 ? days : [day] };
      }
      return s;
    }));
  };

  // 학생 추가
  const addStudents = async () => {
    if (selectedStudentIds.size === 0) {
      alert("추가할 학생을 선택해주세요");
      return;
    }

    try {
      const response = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudentIds)
        })
      });

      if (!response.ok) throw new Error("Failed to add students");

      alert("학생이 추가되었습니다");
      setSelectedStudentIds(new Set());
      setShowAddStudent(false);
      if (classId) loadAssignedStudents(classId);
    } catch (error) {
      console.error("Failed to add students:", error);
      alert("학생 추가에 실패했습니다");
    }
  };

  // 학생 제거
  const removeStudent = async (studentId: number) => {
    if (!confirm("이 학생을 반에서 제외하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/classes/${classId}/students/${studentId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to remove student");

      alert("학생이 제외되었습니다");
      if (classId) loadAssignedStudents(classId);
    } catch (error) {
      console.error("Failed to remove student:", error);
      alert("학생 제외에 실패했습니다");
    }
  };

  // 클래스 정보 저장
  const handleSave = async () => {
    if (!name.trim()) {
      alert("반 이름을 입력해주세요");
      return;
    }

    if (schedules.length === 0) {
      alert("최소 하나의 스케줄을 추가해주세요");
      return;
    }

    for (const schedule of schedules) {
      if (schedule.dayOfWeek.length === 0) {
        alert("최소 하나의 요일을 선택해주세요");
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade: grade.trim() || null,
          description: description.trim() || null,
          color: color,
          schedules: schedules.map(s => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            subject: s.subject || null,
            room: s.room || null
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update class");
      }

      alert("저장되었습니다");
      router.push("/dashboard/classes");
    } catch (error: any) {
      console.error("Failed to save:", error);
      alert(`저장 실패: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 클래스 삭제
  const handleDelete = async () => {
    if (!confirm("정말로 이 반을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete class");

      alert("삭제되었습니다");
      router.push("/dashboard/classes");
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("삭제에 실패했습니다");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">클래스 편집</h1>
            <p className="text-sm text-gray-500">클래스 정보를 수정하고 학생을 관리하세요</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">반 이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 중1-A반"
            />
          </div>

          <div>
            <Label htmlFor="grade">학년</Label>
            <Input
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="예: 중학교 1학년"
            />
          </div>

          <div>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="반에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div>
            <Label>반 색상</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`h-12 rounded-lg border-2 transition-all ${
                    color === preset.value
                      ? "border-blue-500 scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  onClick={() => setColor(preset.value)}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 스케줄 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>수업 스케줄</CardTitle>
            <Button variant="outline" size="sm" onClick={addSchedule}>
              스케줄 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <Label>요일 선택 *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSchedule(schedule.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(schedule.id, day.value)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      schedule.dayOfWeek.includes(day.value)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white border-gray-300 hover:border-blue-300"
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>시작 시간</Label>
                  <Input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => updateSchedule(schedule.id, "startTime", e.target.value)}
                  />
                </div>
                <div>
                  <Label>종료 시간</Label>
                  <Input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => updateSchedule(schedule.id, "endTime", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>과목명</Label>
                  <Input
                    value={schedule.subject}
                    onChange={(e) => updateSchedule(schedule.id, "subject", e.target.value)}
                    placeholder="예: 수학"
                  />
                </div>
                <div>
                  <Label>교실</Label>
                  <Input
                    value={schedule.room}
                    onChange={(e) => updateSchedule(schedule.id, "room", e.target.value)}
                    placeholder="예: A101"
                  />
                </div>
              </div>
            </div>
          ))}

          {schedules.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              스케줄을 추가해주세요
            </div>
          )}
        </CardContent>
      </Card>

      {/* 학생 관리 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>배정된 학생 ({assignedStudents.length}명)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddStudent(!showAddStudent)}>
              <UserPlus className="w-4 h-4 mr-2" />
              학생 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddStudent && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {availableStudents
                  .filter(s => !assignedStudents.find(as => as.id === s.id))
                  .map((student) => (
                  <div key={student.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedStudentIds.has(student.id)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selectedStudentIds);
                        if (checked) {
                          newSet.add(student.id);
                        } else {
                          newSet.delete(student.id);
                        }
                        setSelectedStudentIds(newSet);
                      }}
                    />
                    <label className="text-sm cursor-pointer flex-1">
                      {student.name} ({student.email})
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addStudents}>
                  선택한 학생 추가 ({selectedStudentIds.size})
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setShowAddStudent(false);
                  setSelectedStudentIds(new Set());
                }}>
                  취소
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {assignedStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.email}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStudent(student.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {assignedStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                배정된 학생이 없습니다
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
