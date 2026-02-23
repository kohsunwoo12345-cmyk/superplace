"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2,
  Users,
  Calendar,
  Palette
} from "lucide-react";

// 학년 옵션
const GRADE_OPTIONS = [
  { value: '초등 1학년', label: '초등 1학년' },
  { value: '초등 2학년', label: '초등 2학년' },
  { value: '초등 3학년', label: '초등 3학년' },
  { value: '초등 4학년', label: '초등 4학년' },
  { value: '초등 5학년', label: '초등 5학년' },
  { value: '초등 6학년', label: '초등 6학년' },
  { value: '중1', label: '중학교 1학년' },
  { value: '중2', label: '중학교 2학년' },
  { value: '중3', label: '중학교 3학년' },
  { value: '고1', label: '고등학교 1학년' },
  { value: '고2', label: '고등학교 2학년' },
  { value: '고3', label: '고등학교 3학년' },
];

// 요일 상수
const DAYS_OF_WEEK = [
  { value: 0, label: '일요일', short: '일' },
  { value: 1, label: '월요일', short: '월' },
  { value: 2, label: '화요일', short: '화' },
  { value: 3, label: '수요일', short: '수' },
  { value: 4, label: '목요일', short: '목' },
  { value: 5, label: '금요일', short: '금' },
  { value: 6, label: '토요일', short: '토' },
];

// 색상 프리셋
const COLOR_PRESETS = [
  { name: '파란색', value: '#3B82F6' },
  { name: '초록색', value: '#10B981' },
  { name: '보라색', value: '#8B5CF6' },
  { name: '빨간색', value: '#EF4444' },
  { name: '주황색', value: '#F59E0B' },
  { name: '분홍색', value: '#EC4899' },
  { name: '청록색', value: '#14B8A6' },
  { name: '남색', value: '#6366F1' },
];

type Schedule = {
  id: string;
  dayOfWeek: number[];  // 여러 요일 선택 가능
  startTime: string;
  endTime: string;
  subject?: string;
  room?: string;
};

type Student = {
  id: string;  // Changed to string
  name: string;
  email: string;
  studentCode: string;
  grade: string | null;
};

export default function AddClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // 사용자 정보
  const [user, setUser] = useState<any>(null);
  
  // 폼 데이터
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // 학생 목록 로드
      loadStudents(userData);
    } catch (error) {
      console.error("사용자 정보 파싱 오류:", error);
      router.push("/login");
    }
  }, [router]);

  // 학생 목록 로드
  const loadStudents = async (userData: any) => {
    try {
      setLoadingStudents(true);
      
      // 🔒 보안 강화: Authorization 헤더로 인증, role/academyId 파라미터 제거
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const token = user?.token || localStorage.getItem("token");
      
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }

      console.log('👥 Loading students with token authentication');
      
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
        console.log('✅ Students loaded:', data.students?.length || 0);
        console.log('📋 First few students:', data.students?.slice(0, 3));
        setStudents(data.students || []);
        
        if (data.students?.length === 0) {
          console.warn('⚠️ No students found. User may need to add students first.');
        }
      } else {
        console.error('❌ Failed to load students:', response.status);
        const errorData = await response.json();
        console.error('❌ Error details:', errorData);
        
        // 더 자세한 에러 정보 표시
        if (errorData.debug) {
          console.error('🔍 Debug info:', errorData.debug);
        }
        
        // 사용자에게 알림
        if (response.status === 403) {
          console.error('🚫 Access denied. Please check user permissions.');
        }
      }
    } catch (error) {
      console.error("학생 목록 로딩 오류:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 스케줄 추가
  const addSchedule = () => {
    const newSchedule: Schedule = {
      id: Date.now().toString(),
      dayOfWeek: [1], // 월요일 기본값
      startTime: "09:00",
      endTime: "10:00",
      subject: "",
      room: "",
    };
    setSchedules([...schedules, newSchedule]);
  };

  // 요일 토글
  const toggleDay = (scheduleId: string, day: number) => {
    setSchedules(schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        const currentDays = schedule.dayOfWeek;
        const newDays = currentDays.includes(day)
          ? currentDays.filter(d => d !== day)
          : [...currentDays, day].sort();
        return { ...schedule, dayOfWeek: newDays };
      }
      return schedule;
    }));
  };

  // 스케줄 삭제
  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  // 스케줄 업데이트
  const updateSchedule = (id: string, field: keyof Schedule, value: any) => {
    setSchedules(schedules.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // 학생 선택 토글
  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudentIds);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudentIds(newSelected);
  };

  // 전체 선택/해제
  const toggleAllStudents = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map(s => s.id)));
    }
  };

  // 반 생성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert("반 이름을 입력해주세요.");
      return;
    }

    // academyId가 없으면 사용자 ID를 academy_id로 사용 (학원장인 경우)
    const effectiveAcademyId = user?.academyId || user?.academy_id || user?.id;
    
    if (!effectiveAcademyId) {
      console.error('❌ No academy ID found. User data:', user);
      alert("학원 정보가 없습니다. 사용자 정보를 확인해주세요.");
      return;
    }
    
    console.log('🏫 Using academy ID:', effectiveAcademyId, 'from user:', user);

    try {
      setLoading(true);

      // 스케줄을 평탄화 (각 요일별로 별도 스케줄 생성)
      const flattenedSchedules = schedules.flatMap(s => 
        s.dayOfWeek.map(day => ({
          dayOfWeek: day,
          startTime: s.startTime,
          endTime: s.endTime,
          subject: s.subject || null,
          room: s.room || null,
        }))
      );

      // 스케줄 배열을 API가 기대하는 형식으로 변환
      const formattedSchedules = flattenedSchedules.map((s, index) => ({
        id: String(index + 1),
        subject: s.subject || '수업',
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }));

      // 선택된 학생들을 API가 기대하는 형식으로 변환
      const formattedStudents = Array.from(selectedStudentIds).map((studentId, index) => {
        const student = students.find(s => s.id === studentId);
        return {
          id: String(index + 1),
          student: {
            id: studentId,
            name: student?.name || '',
            email: student?.email || '',
            studentCode: student?.studentCode || '',
            grade: student?.grade || '',
          }
        };
      });

      const payload = {
        name: name.trim(),
        grade: grade && grade.trim() ? grade.trim() : null,
        description: description.trim() || null,
        color: color,
        capacity: 30, // 기본 정원
        isActive: true,
        students: formattedStudents,
        schedules: formattedSchedules,
      };

      console.log('📝 Creating class:', payload);

      // 토큰 가져오기
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const token = user?.token || localStorage.getItem("token");
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("/api/classes", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Class created:', data);
        alert("반이 생성되었습니다!");
        router.push("/dashboard/classes");
      } else {
        const error = await response.json();
        console.error('❌ Failed to create class:', error);
        alert(`반 생성 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error("반 생성 오류:", error);
      alert("반 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/classes")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">클래스 추가</h1>
          <p className="text-gray-600">새로운 반을 생성합니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* 기본 정보 카드 */}
          <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>반의 기본 정보를 입력합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">반 이름 *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 중1-A반"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grade">학년 (선택사항)</Label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger>
                        <SelectValue placeholder="학년을 선택하세요 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">과목</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="예: 수학"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="반에 대한 간단한 설명을 입력하세요"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 반 색상 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  반 색상
                </CardTitle>
                <CardDescription>반을 구분할 색상을 선택합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColor(preset.value)}
                      className={`
                        w-12 h-12 rounded-lg transition-all
                        ${color === preset.value 
                          ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' 
                          : 'hover:scale-105'
                        }
                      `}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Label htmlFor="customColor">또는 직접 선택:</Label>
                  <input
                    id="customColor"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{color}</span>
                </div>
              </CardContent>
            </Card>

            {/* 수업 스케줄 카드 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      수업 스케줄
                    </CardTitle>
                    <CardDescription>수업 요일 및 시간을 설정합니다</CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={addSchedule}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>수업 스케줄을 추가해주세요</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div>
                          <Label>요일 선택 (여러 요일 가능)</Label>
                          <div className="grid grid-cols-7 gap-2 mt-2">
                            {DAYS_OF_WEEK.map((day) => (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDay(schedule.id, day.value)}
                                className={`
                                  px-2 py-2 text-sm rounded-md border transition-colors
                                  ${schedule.dayOfWeek.includes(day.value)
                                    ? 'bg-blue-500 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }
                                `}
                              >
                                {day.short}
                              </button>
                            ))}
                          </div>
                          {schedule.dayOfWeek.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">최소 1개 요일을 선택해주세요</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>시작 시간</Label>
                            <Input
                              type="time"
                              value={schedule.startTime}
                              onChange={(e) => updateSchedule(schedule.id, 'startTime', e.target.value)}
                            />
                          </div>

                          <div>
                            <Label>종료 시간</Label>
                            <Input
                              type="time"
                              value={schedule.endTime}
                              onChange={(e) => updateSchedule(schedule.id, 'endTime', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <Label>과목 (선택)</Label>
                            <Input
                              value={schedule.subject || ''}
                              onChange={(e) => updateSchedule(schedule.id, 'subject', e.target.value)}
                              placeholder="예: 수학"
                            />
                          </div>

                          <div className="flex-1">
                            <Label>교실 (선택)</Label>
                            <Input
                              value={schedule.room || ''}
                              onChange={(e) => updateSchedule(schedule.id, 'room', e.target.value)}
                              placeholder="예: 201호"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 학생 배정 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  학생 배정
                </CardTitle>
                <CardDescription>
                  반에 배정할 학생을 선택합니다
                  <br />
                  선택: {selectedStudentIds.size}명 / 전체: {students.length}명
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>배정 가능한 학생이 없습니다</p>
                  </div>
                ) : (
                  <>
                    {/* 전체 선택 */}
                    <div className="mb-4 pb-4 border-b">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedStudentIds.size === students.length}
                          onCheckedChange={toggleAllStudents}
                        />
                        <span className="font-medium">전체 선택</span>
                      </label>
                    </div>

                    {/* 학생 목록 */}
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {students.map((student) => (
                        <label
                          key={student.id}
                          className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedStudentIds.has(student.id)}
                            onCheckedChange={() => toggleStudent(student.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{student.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.studentCode} {student.grade && `· ${student.grade}`}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/classes")}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              "반 생성"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
