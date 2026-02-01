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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Bot,
  BookOpen,
  GraduationCap,
  Filter,
  Eye,
  UserPlus,
  ExternalLink,
  Copy,
  QrCode,
} from "lucide-react";
import CreateStudentDialog from "@/components/dashboard/CreateStudentDialog";

interface Student {
  id: string;
  email: string;
  name: string;
  phone?: string;
  grade?: string;
  studentId?: string;
  studentCode?: string; // 학생 코드 추가
  parentPhone?: string;
  approved: boolean;
  aiChatEnabled: boolean;
  aiHomeworkEnabled: boolean;
  aiStudyEnabled: boolean;
  points: number;
  createdAt: string;
  enrolledClasses: {
    id: string;
    class: {
      id: string;
      name: string;
      grade?: string;
    };
  }[];
  _count: {
    assignments: number;
    testScores: number;
  };
}

interface Class {
  id: string;
  name: string;
  grade?: string;
}

export default function StudentsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterClass, setFilterClass] = useState<string>("ALL");
  const [filterGrade, setFilterGrade] = useState<string>("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const studentLoginUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/homework-check`
    : '/homework-check';

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (
      session?.user?.role !== "DIRECTOR" &&
      session?.user?.role !== "TEACHER" &&
      session?.user?.role !== "SUPER_ADMIN"
    ) {
      router.push("/dashboard");
      return;
    }

    fetchStudents();
    fetchClasses();
  }, [session, status, router]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/academy/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error("학생 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/academy/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("수업 목록 로드 실패:", error);
    }
  };

  const handleApprove = async (studentId: string, approve: boolean) => {
    if (!confirm(`해당 학생을 ${approve ? "승인" : "거부"}하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/academy/students/${studentId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: approve }),
      });

      if (response.ok) {
        alert(approve ? "학생이 승인되었습니다." : "학생 승인이 거부되었습니다.");
        fetchStudents();
      } else {
        alert("처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 처리 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleToggleAI = async (studentId: string, field: string, value: boolean) => {
    try {
      const response = await fetch(`/api/academy/students/${studentId}/ai`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        alert("AI 권한이 업데이트되었습니다.");
        fetchStudents();
      } else {
        alert("처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("AI 권한 변경 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "APPROVED" && student.approved) ||
      (filterStatus === "PENDING" && !student.approved);

    const matchesClass =
      filterClass === "ALL" ||
      student.enrolledClasses.some((ec) => ec.class.id === filterClass);

    const matchesGrade =
      filterGrade === "ALL" ||
      student.grade === filterGrade ||
      student.enrolledClasses.some((ec) => ec.class.grade === filterGrade);

    return matchesSearch && matchesStatus && matchesClass && matchesGrade;
  });

  const stats = {
    total: students.length,
    approved: students.filter((s) => s.approved).length,
    pending: students.filter((s) => !s.approved).length,
    aiEnabled: students.filter(
      (s) => s.aiChatEnabled || s.aiHomeworkEnabled || s.aiStudyEnabled
    ).length,
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  const grades = Array.from(
    new Set([
      ...students.map((s) => s.grade).filter(Boolean),
      ...students.flatMap((s) => s.enrolledClasses.map((ec) => ec.class.grade)).filter(Boolean),
    ])
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
          <h1 className="text-3xl font-bold mb-2">학생 관리</h1>
          <p className="text-gray-600">학원 소속 학생을 관리하고 AI 봇 권한을 부여합니다</p>
        </div>
        {session?.user?.role === "DIRECTOR" && (
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            학생 추가
          </Button>
        )}
      </div>

      {/* 학생 추가 다이얼로그 */}
      <CreateStudentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchStudents}
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">전체 학생</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">승인됨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.approved}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">승인 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">AI 활성화</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span className="text-2xl font-bold">{stats.aiEnabled}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 학생 코드 로그인 페이지 섹션 */}
      <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <QrCode className="w-5 h-5" />
            학생 코드 로그인 페이지
          </CardTitle>
          <CardDescription className="text-blue-700">
            학생들이 5자리 코드로 로그인하고 숙제를 제출할 수 있는 전용 페이지입니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL 복사 카드 */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">로그인 페이지 URL</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded-md flex-1 font-mono break-all">
                    {studentLoginUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(studentLoginUrl)}
                    className="shrink-0"
                  >
                    {copiedUrl ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        복사됨!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        복사
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.open(studentLoginUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                새 탭에서 열기
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(studentLoginUrl)}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                링크 공유
              </Button>
            </div>
          </div>

          {/* 안내 사항 */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-sm mb-2 text-blue-900">📌 사용 방법</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>위의 URL을 학생들에게 공유하세요 (카카오톡, 문자 등)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>학생은 각자의 5자리 코드로 로그인합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>숙제 사진을 업로드하면 AI가 자동으로 분석하고 출석을 인정합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>제출 완료 후 자동으로 로그아웃됩니다 (보안 강화)</span>
              </li>
            </ul>
          </div>

          {/* 학생 코드 보기 안내 */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-sm mb-2 text-green-900 flex items-center gap-2">
              <span className="text-lg">🔢</span>
              학생 코드 확인 방법
            </h4>
            <p className="text-sm text-gray-700">
              각 학생의 5자리 코드는 아래 <strong>학생 목록</strong>에서 
              <span className="inline-block mx-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-mono text-xs">
                🔢 코드: XXXXX
              </span>
              형태로 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="이름, 이메일, 학번으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">승인 상태</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="APPROVED">승인됨</SelectItem>
                    <SelectItem value="PENDING">승인 대기</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">수업</label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">학년</label>
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade as string}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("ALL");
                    setFilterClass("ALL");
                    setFilterGrade("ALL");
                  }}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  필터 초기화
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 학생 목록 */}
      <div className="grid grid-cols-1 gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{student.name}</h3>
                    {student.school && (
                      <Badge variant="outline" className="font-mono">
                        {student.school}
                      </Badge>
                    )}
                    {student.approved ? (
                      <Badge className="bg-green-500">승인됨</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        승인 대기
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{student.email}</span>
                      </div>
                      {student.studentId && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-600 font-semibold">
                            🆔 학번: {student.studentId}
                          </span>
                        </div>
                      )}
                      {student.studentCode && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-blue-600 font-bold">
                            🔢 코드: {student.studentCode}
                          </span>
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                      {student.grade && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          <span>{student.grade}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      {student.parentPhone && (
                        <div>
                          <span className="text-gray-500">학부모:</span>{" "}
                          <span>{student.parentPhone}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">포인트:</span>{" "}
                        <span className="font-semibold text-yellow-600">
                          {student.points}P
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">가입일:</span>{" "}
                        <span>{new Date(student.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* 수강 중인 수업 */}
                  {student.enrolledClasses.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">수강 중인 수업:</p>
                      <div className="flex flex-wrap gap-2">
                        {student.enrolledClasses.map((ec) => (
                          <Badge key={ec.id} variant="outline">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {ec.class.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI 봇 권한 */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">AI 봇 권한:</p>
                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={student.aiChatEnabled}
                          onChange={(e) =>
                            handleToggleAI(student.id, "aiChatEnabled", e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">AI 채팅</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={student.aiHomeworkEnabled}
                          onChange={(e) =>
                            handleToggleAI(student.id, "aiHomeworkEnabled", e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">AI 숙제</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={student.aiStudyEnabled}
                          onChange={(e) =>
                            handleToggleAI(student.id, "aiStudyEnabled", e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">AI 학습</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:min-w-[120px]">
                  {!student.approved && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(student.id, true)}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        승인
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(student.id, false)}
                        className="text-red-600 w-full"
                      >
                        거부
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/students/${student.id}`)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    상세
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
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
