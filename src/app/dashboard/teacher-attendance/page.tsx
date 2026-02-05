"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  QrCode, 
  Users, 
  ClipboardCheck, 
  FileText,
  Calendar,
  Clock,
  Award,
  TrendingUp
} from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
}

export default function TeacherAttendancePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    // 학생 목록 로드
    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        const studentList = data.users?.filter((u: any) => 
          u.role?.toUpperCase() === 'STUDENT'
        ) || [];
        setStudents(studentList);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const generateCode = async () => {
    if (!selectedStudent) {
      alert("학생을 선택하세요");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/attendance/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudent,
          academyId: currentUser?.academyId,
          expiresInHours: 24,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setGeneratedCode(data.code);
      } else {
        alert(data.error || "코드 생성 실패");
      }
    } catch (error) {
      console.error("Code generation error:", error);
      alert("코드 생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <ClipboardCheck className="h-8 w-8 text-blue-600" />
                출석 및 숙제 관리
              </h1>
              <p className="text-gray-600 mt-1">
                학생 출석 코드 생성 및 숙제 리포트 확인
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard")}>
              대시보드로
            </Button>
          </div>

          {/* 빠른 링크 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-2 border-green-200 hover:border-green-400 transition-colors cursor-pointer" onClick={() => router.push('/attendance-verify')}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-700">출석 인증</h3>
                  <p className="text-sm text-gray-600">학생 출석 코드 확인</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors cursor-pointer" onClick={() => router.push('/homework-check')}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-700">숙제 검사</h3>
                  <p className="text-sm text-gray-600">카메라로 숙제 확인</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="generate" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">
              <QrCode className="w-4 h-4 mr-2" />
              코드 생성
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <Users className="w-4 h-4 mr-2" />
              출석 현황
            </TabsTrigger>
            <TabsTrigger value="homework">
              <FileText className="w-4 h-4 mr-2" />
              숙제 리포트
            </TabsTrigger>
          </TabsList>

          {/* 코드 생성 탭 */}
          <TabsContent value="generate">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>학생 선택</CardTitle>
                  <CardDescription>
                    출석 코드를 생성할 학생을 선택하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Label>학생 목록</Label>
                    <select
                      className="w-full border rounded-lg p-2"
                      value={selectedStudent || ""}
                      onChange={(e) => setSelectedStudent(parseInt(e.target.value))}
                    >
                      <option value="">학생 선택...</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </option>
                      ))}
                    </select>

                    <Button
                      onClick={generateCode}
                      className="w-full"
                      disabled={!selectedStudent || loading}
                    >
                      {loading ? "생성 중..." : "출석 코드 생성"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {generatedCode && (
                <Card className="border-2 border-blue-500">
                  <CardHeader>
                    <CardTitle className="text-green-600">생성 완료!</CardTitle>
                    <CardDescription>
                      학생에게 이 코드를 알려주세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                      <p className="text-5xl font-bold tracking-widest text-blue-600 mb-2">
                        {generatedCode.code}
                      </p>
                      <p className="text-sm text-gray-600">
                        6자리 출석 코드
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">학생 ID</span>
                        <span className="font-medium">{generatedCode.userId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">생성 시간</span>
                        <span className="font-medium">
                          {new Date(generatedCode.createdAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      {generatedCode.expiresAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">만료 시간</span>
                          <span className="font-medium text-red-600">
                            {new Date(generatedCode.expiresAt).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        💡 학생이 이 코드를 입력하면 자동으로 출석 체크되고 숙제 검사 페이지로 이동합니다
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* 출석 현황 탭 */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>오늘의 출석 현황</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">출석 현황 기능 준비 중...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    곧 출석률, 지각 현황 등을 확인할 수 있습니다
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 숙제 리포트 탭 */}
          <TabsContent value="homework">
            <Card>
              <CardHeader>
                <CardTitle>숙제 제출 현황</CardTitle>
                <CardDescription>
                  학생들의 숙제 제출 및 AI 채점 결과
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">숙제 리포트 기능 준비 중...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    곧 AI 채점 결과와 학생별 성취도를 확인할 수 있습니다
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
