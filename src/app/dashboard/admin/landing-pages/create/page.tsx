"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  GraduationCap,
  User,
  CheckCircle,
  Eye,
  Save,
} from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
  academy_id?: number;
  academyName?: string;
}

interface DataOptions {
  showBasicInfo: boolean;
  showAttendance: boolean;
  showAIChats: boolean;
  showConcepts: boolean;
  showHomework: boolean;
}

export default function CreateLandingPagePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [dataOptions, setDataOptions] = useState<DataOptions>({
    showBasicInfo: true,
    showAttendance: true,
    showAIChats: true,
    showConcepts: true,
    showHomework: true,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/users?role=STUDENT", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.users || []);
      }
    } catch (error) {
      console.error("학생 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLandingPage = async () => {
    if (!selectedStudent) {
      alert("학생을 선택해주세요.");
      return;
    }

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/landing-pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          title,
          dataOptions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("랜딩페이지가 생성되었습니다!");
        router.push("/dashboard/admin/landing-pages");
      } else {
        throw new Error("생성 실패");
      }
    } catch (error) {
      console.error("랜딩페이지 생성 실패:", error);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const handlePreview = () => {
    if (!selectedStudent) {
      alert("학생을 선택해주세요.");
      return;
    }
    // 미리보기 모달이나 새 탭에서 프리뷰 표시
    alert("미리보기 기능은 곧 추가됩니다.");
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin/landing-pages")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              새 학습 리포트 랜딩페이지 만들기
            </h1>
            <p className="text-gray-600 mt-1">
              학생을 선택하고 표시할 데이터를 설정하세요
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 학생 선택 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. 학생 선택</CardTitle>
                <CardDescription>
                  랜딩페이지를 생성할 학생을 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>학생 검색</Label>
                  <Input
                    placeholder="학생 이름 또는 이메일 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredStudents.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      검색 결과가 없습니다.
                    </p>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student.id);
                          setTitle(`${student.name} 학생의 학습 리포트`);
                        }}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedStudent === student.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {student.name}
                            </p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            {student.academyName && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {student.academyName}
                              </Badge>
                            )}
                          </div>
                          {selectedStudent === student.id && (
                            <CheckCircle className="w-6 h-6 text-indigo-600" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 설정 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>2. 랜딩페이지 제목</CardTitle>
                <CardDescription>
                  학부모에게 표시될 제목을 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="예: 김철수 학생의 학습 리포트"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. 표시할 데이터 선택</CardTitle>
                <CardDescription>
                  랜딩페이지에 표시할 학습 데이터를 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="basicInfo"
                    checked={dataOptions.showBasicInfo}
                    onCheckedChange={(checked) =>
                      setDataOptions({ ...dataOptions, showBasicInfo: !!checked })
                    }
                  />
                  <label htmlFor="basicInfo" className="cursor-pointer">
                    <div className="font-medium">기본 정보</div>
                    <div className="text-sm text-gray-500">
                      학생 이름, 이메일, 소속 학원
                    </div>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attendance"
                    checked={dataOptions.showAttendance}
                    onCheckedChange={(checked) =>
                      setDataOptions({ ...dataOptions, showAttendance: !!checked })
                    }
                  />
                  <label htmlFor="attendance" className="cursor-pointer">
                    <div className="font-medium">출결 현황</div>
                    <div className="text-sm text-gray-500">
                      출석률, 출석/결석/지각 통계
                    </div>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="aiChats"
                    checked={dataOptions.showAIChats}
                    onCheckedChange={(checked) =>
                      setDataOptions({ ...dataOptions, showAIChats: !!checked })
                    }
                  />
                  <label htmlFor="aiChats" className="cursor-pointer">
                    <div className="font-medium">AI 대화 활동</div>
                    <div className="text-sm text-gray-500">
                      AI 챗봇 이용 현황 및 역량 분석
                    </div>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="concepts"
                    checked={dataOptions.showConcepts}
                    onCheckedChange={(checked) =>
                      setDataOptions({ ...dataOptions, showConcepts: !!checked })
                    }
                  />
                  <label htmlFor="concepts" className="cursor-pointer">
                    <div className="font-medium">부족한 개념 분석</div>
                    <div className="text-sm text-gray-500">
                      AI가 분석한 개선 필요 영역
                    </div>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homework"
                    checked={dataOptions.showHomework}
                    onCheckedChange={(checked) =>
                      setDataOptions({ ...dataOptions, showHomework: !!checked })
                    }
                  />
                  <label htmlFor="homework" className="cursor-pointer">
                    <div className="font-medium">숙제 제출 현황</div>
                    <div className="text-sm text-gray-500">
                      숙제 완료율 및 성적
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* 선택된 학생 정보 */}
            {selectedStudentData && (
              <Card className="border-2 border-indigo-200 bg-indigo-50">
                <CardHeader>
                  <CardTitle className="text-indigo-900">선택된 학생</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">이름:</span>{" "}
                      {selectedStudentData.name}
                    </div>
                    <div>
                      <span className="font-semibold">이메일:</span>{" "}
                      {selectedStudentData.email}
                    </div>
                    {selectedStudentData.academyName && (
                      <div>
                        <span className="font-semibold">학원:</span>{" "}
                        {selectedStudentData.academyName}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              <Button
                onClick={handlePreview}
                variant="outline"
                className="flex-1"
                disabled={!selectedStudent}
              >
                <Eye className="w-4 h-4 mr-2" />
                미리보기
              </Button>
              <Button
                onClick={handleCreateLandingPage}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                disabled={!selectedStudent || !title.trim() || creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    랜딩페이지 생성
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
