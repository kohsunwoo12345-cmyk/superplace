"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function AddStudentPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // 학생 정보
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [diagnosticMemo, setDiagnosticMemo] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    // 권한 확인
    const upperRole = userData.role?.toUpperCase();
    if (upperRole !== 'ADMIN' && upperRole !== 'SUPER_ADMIN' && upperRole !== 'DIRECTOR') {
      alert("학생을 추가할 권한이 없습니다");
      router.push("/dashboard/students/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert("이름을 입력해주세요");
      return;
    }

    if (!phone.trim()) {
      alert("연락처를 입력해주세요");
      return;
    }

    if (!password.trim()) {
      alert("비밀번호를 입력해주세요");
      return;
    }

    if (password.trim().length < 4) {
      alert("비밀번호는 최소 4자 이상이어야 합니다");
      return;
    }

    // 이메일이 없으면 전화번호 + 타임스탬프로 자동 생성 (중복 방지)
    const timestamp = Date.now();
    const phoneNumber = phone.replace(/[^0-9]/g, '');
    const finalEmail = email.trim() || `student_${phoneNumber}_${timestamp}@temp.student.local`;

    setLoading(true);

    try {
      const requestBody = {
        name: name.trim(),
        email: finalEmail,
        password: password.trim(),
        phone: phone.trim(),
        school: school.trim() || null,
        grade: grade.trim() || null,
        diagnosticMemo: diagnosticMemo.trim() || null,
        academyId: user.academyId,
        role: user.role
      };
      
      console.log("📤 학생 추가 요청:", requestBody);
      
      const response = await fetch("/api/students/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      console.log("📥 응답 상태:", response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error("❌ 학생 추가 실패:", error);
        throw new Error(error.error || error.message || "Failed to create student");
      }

      const result = await response.json();
      console.log("✅ 학생 추가 성공:", result);
      
      alert("학생이 추가되었습니다");
      // 학생 목록 페이지로 이동 + 강제 새로고침
      router.push("/dashboard/students/?refresh=" + Date.now());
    } catch (error: any) {
      console.error("💥 Failed to create student:", error);
      alert(`학생 추가 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">학생 추가</h1>
          <p className="text-sm text-gray-500">새로운 학생을 등록합니다</p>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>학생 정보</CardTitle>
            <CardDescription>
              학생의 기본 정보를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                필수 입력 항목입니다
              </p>
            </div>

            <div>
              <Label htmlFor="school">학교</Label>
              <Input
                id="school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="예: 서울고등학교"
              />
            </div>

            <div>
              <Label htmlFor="grade">학년</Label>
              <select
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">학년 선택</option>
                <optgroup label="초등학교">
                  <option value="초1">초등학교 1학년</option>
                  <option value="초2">초등학교 2학년</option>
                  <option value="초3">초등학교 3학년</option>
                  <option value="초4">초등학교 4학년</option>
                  <option value="초5">초등학교 5학년</option>
                  <option value="초6">초등학교 6학년</option>
                </optgroup>
                <optgroup label="중학교">
                  <option value="중1">중학교 1학년</option>
                  <option value="중2">중학교 2학년</option>
                  <option value="중3">중학교 3학년</option>
                </optgroup>
                <optgroup label="고등학교">
                  <option value="고1">고등학교 1학년</option>
                  <option value="고2">고등학교 2학년</option>
                  <option value="고3">고등학교 3학년</option>
                </optgroup>
              </select>
            </div>

            <div>
              <Label htmlFor="diagnosticMemo">진단 메모</Label>
              <textarea
                id="diagnosticMemo"
                value={diagnosticMemo}
                onChange={(e) => setDiagnosticMemo(e.target.value)}
                placeholder="학생의 현재 학습 상태, 특이사항 등을 기록하세요"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                초기 진단 내용이나 특이사항을 자유롭게 기록하세요
              </p>
            </div>

            {/* 선택 입력 영역 */}
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                로그인 정보
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">비밀번호 *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="최소 4자 이상"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    학생이 로그인 시 사용할 비밀번호입니다
                  </p>
                </div>

                <div>
                  <Label htmlFor="email">이메일 (선택)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="비워두면 자동 생성"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    미입력 시 자동 생성됩니다 (상세 페이지에서 확인 가능)
                  </p>
                </div>
              </div>
            </div>

            {user && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">소속 학원:</span>{" "}
                  {user.academy_name || "전체"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">등록자:</span> {user.name} ({user.role})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            취소
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                추가 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                학생 추가
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
