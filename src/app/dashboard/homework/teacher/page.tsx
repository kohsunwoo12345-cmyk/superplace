"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  Users,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
}

interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  createdAt: string;
  targetType: string;
  targetStudentCount: number;
  submittedCount: number;
  targets?: any[];
}

export default function TeacherHomeworkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  
  // 새 숙제 생성 폼
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "수학",
    dueDate: "",
    targetType: "all",
    targetStudents: [] as number[],
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      // 즉시 학생 조회
      fetchStudents();
      fetchAssignments(user.id, user.academyId);
    } else {
      router.push("/login");
    }
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      
      console.log('========== 학생 조회 시작 ==========');
      console.log('🔑 토큰 존재:', !!token);
      console.log('🔗 API 경로: /api/students');

      const response = await fetch(`/api/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📡 HTTP 상태:', response.status);
      const data = await response.json();
      console.log('📦 전체 응답 데이터:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log('✅ API 성공');
        console.log('👥 학생 배열:', data.students);
        console.log('📊 학생 수:', data.students?.length || 0);
        
        if (data.students && data.students.length > 0) {
          console.log('👤 첫 번째 학생:', data.students[0]);
          setStudents(data.students);
          alert(`✅ 학생 ${data.students.length}명 로드 완료!`);
        } else {
          console.warn('⚠️ 학생 배열이 비어있음');
          setStudents([]);
          alert('⚠️ 학생 데이터가 없습니다. 학생을 먼저 등록하세요.');
        }
      } else {
        console.error('❌ API 실패:', data);
        setStudents([]);
        alert(`❌ API 오류: ${data.error || data.message}`);
      }
      console.log('========== 학생 조회 완료 ==========');
    } catch (error) {
      console.error("❌ fetch 에러:", error);
      setStudents([]);
      alert(`❌ 네트워크 오류: ${error}`);
    }
  };

  const fetchAssignments = async (teacherId: number, academyId?: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        teacherId: teacherId.toString(),
      });
      if (academyId) {
        params.append("academyId", academyId.toString());
      }

      const response = await fetch(
        `/api/homework/assignments/teacher?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHomework = async () => {
    if (!formData.title || !formData.description || !formData.dueDate) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    if (formData.targetType === "specific" && formData.targetStudents.length === 0) {
      alert("대상 학생을 선택해주세요.");
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/homework/assignments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teacherId: currentUser.id,
          academyId: currentUser.academyId,  // ✅ 추가: academyId 전달
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("숙제가 성공적으로 생성되었습니다!");
        setShowCreateForm(false);
        setFormData({
          title: "",
          description: "",
          subject: "수학",
          dueDate: "",
          targetType: "all",
          targetStudents: [],
        });
        fetchAssignments(currentUser.id, currentUser.academyId);
      } else {
        alert(`숙제 생성 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to create homework:", error);
      alert("숙제 생성 중 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setFormData((prev) => ({
      ...prev,
      targetStudents: prev.targetStudents.includes(studentId)
        ? prev.targetStudents.filter((id) => id !== studentId)
        : [...prev.targetStudents, studentId],
    }));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← 돌아가기
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">📚 숙제 관리</h1>
            <p className="text-gray-600">
              학생들에게 숙제를 내주고 제출 현황을 확인하세요
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            새 숙제 만들기
          </Button>
        </div>
      </div>

      {/* 숙제 생성 폼 */}
      {showCreateForm && (
        <Card className="mb-6 border-2 border-blue-500">
          <CardHeader>
            <CardTitle>새 숙제 만들기</CardTitle>
            <CardDescription>
              학생들에게 내줄 숙제의 정보를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 제목 */}
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="예: 수학 문제집 2단원 풀기"
                />
              </div>

              {/* 설명 */}
              <div>
                <Label htmlFor="description">설명 *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="숙제에 대한 자세한 설명을 입력하세요"
                  rows={4}
                />
              </div>

              {/* 과목 */}
              <div>
                <Label htmlFor="subject">과목</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="수학">수학</SelectItem>
                    <SelectItem value="영어">영어</SelectItem>
                    <SelectItem value="국어">국어</SelectItem>
                    <SelectItem value="과학">과학</SelectItem>
                    <SelectItem value="사회">사회</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 마감일 */}
              <div>
                <Label htmlFor="dueDate">마감일 *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>

              {/* 대상 선택 */}
              <div>
                <Label>대상 학생</Label>
                <Select
                  value={formData.targetType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      targetType: value,
                      targetStudents: value === "all" ? [] : formData.targetStudents,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 학생</SelectItem>
                    <SelectItem value="specific">특정 학생</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 특정 학생 선택 */}
              {formData.targetType === "specific" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">
                      학생 선택 ({students.length}명)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fetchStudents}
                      className="text-xs"
                    >
                      🔄 새로고침
                    </Button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-xs">
                    <strong>디버그:</strong> students.length = {students.length}
                  </div>
                  
                  <div className="border-2 border-indigo-200 rounded-lg p-4 max-h-60 overflow-y-auto bg-white mt-2">
                    {students.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm font-medium">학생이 없습니다</p>
                        <p className="text-gray-400 text-xs mt-1">
                          학생을 먼저 등록해주세요
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {students.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-indigo-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              id={`student-${student.id}`}
                              checked={formData.targetStudents.includes(
                                student.id
                              )}
                              onChange={() =>
                                toggleStudentSelection(student.id)
                              }
                              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label
                              htmlFor={`student-${student.id}`}
                              className="flex-1 cursor-pointer text-sm font-medium"
                            >
                              {student.name} 
                              <span className="text-gray-500 ml-2">({student.email})</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.targetStudents.length > 0 && (
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded">
                      <p className="text-sm text-indigo-700 font-semibold">
                        ✅ {formData.targetStudents.length}명 선택됨
                      </p>
                      <p className="text-xs text-indigo-600 mt-1">
                        {students
                          .filter(s => formData.targetStudents.includes(s.id))
                          .map(s => s.name)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateHomework}
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? "생성 중..." : "숙제 내기"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      title: "",
                      description: "",
                      subject: "수학",
                      dueDate: "",
                      targetType: "all",
                      targetStudents: [],
                    });
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 숙제 목록 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          내가 낸 숙제 ({assignments.length})
        </h2>

        {assignments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                아직 낸 숙제가 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                "새 숙제 만들기" 버튼을 눌러 학생들에게 숙제를 내주세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {assignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {assignment.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>마감: {formatDate(assignment.dueDate)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                      {assignment.subject}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {assignment.description}
                  </p>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span>
                          대상:{" "}
                          {assignment.targetType === "all"
                            ? "전체 학생"
                            : `${assignment.targetStudentCount}명`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-semibold">
                          제출: {assignment.submittedCount}명
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          assignment.submittedCount ===
                          assignment.targetStudentCount
                            ? "bg-green-50 text-green-700"
                            : "bg-orange-50 text-orange-700"
                        }
                      >
                        {assignment.submittedCount ===
                        assignment.targetStudentCount
                          ? "전체 제출 완료"
                          : "제출 대기 중"}
                      </Badge>
                    </div>
                  </div>

                  {/* 제출 현황 상세 (대상이 있는 경우) */}
                  {assignment.targets && assignment.targets.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-semibold mb-2 text-sm">제출 현황</h4>
                      <div className="space-y-1">
                        {assignment.targets.map((target: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm py-1"
                          >
                            <span>{target.studentName}</span>
                            {target.status === "submitted" ? (
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-semibold">
                                  {target.score}점
                                </span>
                                <Badge className="bg-green-600">제출 완료</Badge>
                              </div>
                            ) : (
                              <Badge variant="outline">미제출</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
