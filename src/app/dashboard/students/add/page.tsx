"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface Class {
  id: string;
  name: string;
  grade?: string;
  teacherName?: string;
}

export default function AddStudentPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [academyName, setAcademyName] = useState<string>("");
  const [loadingAcademy, setLoadingAcademy] = useState(true);
  
  // 학생 정보
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("");
  const [classField, setClassField] = useState(""); // 소속반 필드 추가
  const [parentPhone, setParentPhone] = useState(""); // 학부모 연락처 추가
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    console.log('👤 Current user:', {
      id: userData.id,
      role: userData.role,
      academyId: userData.academyId,
      academy_id: userData.academy_id
    });

    // 권한 확인
    const upperRole = userData.role?.toUpperCase();
    if (upperRole !== 'ADMIN' && upperRole !== 'SUPER_ADMIN' && upperRole !== 'DIRECTOR' && upperRole !== 'TEACHER') {
      alert("학생을 추가할 권한이 없습니다");
      router.push("/dashboard/students/");
      return;
    }

    // 학원 정보 로드
    loadAcademyInfo(userData);
    
    // 반 목록 로드
    loadClasses();
  }, [router]);

  const loadAcademyInfo = async (userData: any) => {
    try {
      setLoadingAcademy(true);
      const academyId = userData.academyId || userData.academy_id;
      
      if (!academyId) {
        console.log('⚠️ No academy ID found');
        setAcademyName("소속 학원 없음");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/academies/${academyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAcademyName(data.name || "학원명 없음");
      } else {
        setAcademyName("학원 정보 로드 실패");
      }
    } catch (error) {
      console.error("Failed to load academy info:", error);
      setAcademyName("학원 정보 로드 실패");
    } finally {
      setLoadingAcademy(false);
    }
  };

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/classes", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to load classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        // 최대 4개까지만 선택 가능
        if (prev.length >= 4) {
          alert("최대 4개의 반까지만 선택할 수 있습니다");
          return prev;
        }
        return [...prev, classId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 연락처는 필수
    if (!phone.trim()) {
      alert("연락처를 입력해주세요");
      return;
    }

    if (!password.trim()) {
      alert("비밀번호를 입력해주세요");
      return;
    }

    if (password.length < 6) {
      alert("비밀번호는 최소 6자 이상이어야 합니다");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      // Support both academyId and academy_id formats
      const academyId = user.academyId || user.academy_id;
      
      console.log('📤 Creating student with data:', {
        name: name.trim() || null,
        email: email.trim() || null,
        phone: phone.trim(),
        grade: grade || null,
        classIds: selectedClasses,
        academyId: academyId,
        role: user.role
      });
      
      // academyId는 선택사항 - API가 토큰에서 자동으로 가져옴
      if (!academyId) {
        console.log('⚠️ academyId not in user object, API will use token academyId');
      }
      
      const response = await fetch("/api/students/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
          password: password,
          phone: phone.trim(),
          parentPhone: parentPhone.trim() || null,
          grade: grade || null,
          class: classField.trim() || null,
          classIds: selectedClasses,
          academyId: academyId,
          role: user.role
        })
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Error response:', error);
        throw new Error(error.message || error.error || "Failed to create student");
      }

      const result = await response.json();
      console.log('✅ Student created successfully:', result);
      
      // Show password info to admin
      if (result.student && result.student.password) {
        alert(`학생이 추가되었습니다!\n\n` +
              `📱 연락처(로그인 ID): ${result.student.phone}\n` +
              `🔑 비밀번호: ${result.student.password}\n\n` +
              `⚠️ 이 비밀번호를 안전하게 보관하고 학생에게 전달하세요.\n` +
              `이 화면을 닫으면 다시 볼 수 없습니다.`);
      } else {
        alert("학생이 추가되었습니다");
      }
      
      router.push("/dashboard/students/");
    } catch (error: any) {
      console.error("❌ Failed to create student:", error);
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>학생 기본 정보</CardTitle>
            <CardDescription>
              * 표시는 필수 입력 항목입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">연락처 * (로그인 ID)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678 또는 01012345678"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                학생이 로그인 시 사용할 연락처입니다
              </p>
            </div>

            <div>
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 6자 이상"
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="name">이름 (선택)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
              />
            </div>

            <div>
              <Label htmlFor="email">이메일 (선택)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
              />
            </div>

            <div>
              <Label htmlFor="academy">소속 학원</Label>
              <Input
                id="academy"
                value={loadingAcademy ? "로딩 중..." : academyName}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-1">
                학원장의 학원이 자동으로 설정됩니다
              </p>
            </div>

            <div>
              <Label htmlFor="grade">학년</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="학년 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="초1">초등 1학년</SelectItem>
                  <SelectItem value="초2">초등 2학년</SelectItem>
                  <SelectItem value="초3">초등 3학년</SelectItem>
                  <SelectItem value="초4">초등 4학년</SelectItem>
                  <SelectItem value="초5">초등 5학년</SelectItem>
                  <SelectItem value="초6">초등 6학년</SelectItem>
                  <SelectItem value="중1">중학 1학년</SelectItem>
                  <SelectItem value="중2">중학 2학년</SelectItem>
                  <SelectItem value="중3">중학 3학년</SelectItem>
                  <SelectItem value="고1">고등 1학년</SelectItem>
                  <SelectItem value="고2">고등 2학년</SelectItem>
                  <SelectItem value="고3">고등 3학년</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="classField">소속반</Label>
              <Input
                id="classField"
                value={classField}
                onChange={(e) => setClassField(e.target.value)}
                placeholder="예: A반, 수학반"
              />
              <p className="text-sm text-gray-500 mt-1">
                학생의 학교 소속반을 입력하세요
              </p>
            </div>

            <div>
              <Label htmlFor="parentPhone">학부모 연락처</Label>
              <Input
                id="parentPhone"
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="010-1234-5678"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>반 배정 (선택사항)</CardTitle>
            <CardDescription>
              학생이 속할 반을 선택하세요 (최대 4개). 반 배정을 하지 않아도 학생을 추가할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingClasses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : classes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                등록된 반이 없습니다. 먼저 반을 생성해주세요.
              </p>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`class-${cls.id}`}
                      checked={selectedClasses.includes(cls.id)}
                      onCheckedChange={() => handleClassToggle(cls.id)}
                    />
                    <label
                      htmlFor={`class-${cls.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{cls.name}</div>
                      {cls.grade && (
                        <div className="text-sm text-gray-500">{cls.grade}</div>
                      )}
                      {cls.teacherName && (
                        <div className="text-sm text-gray-500">담당: {cls.teacherName}</div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">
              선택된 반: {selectedClasses.length} / 4
            </p>
          </CardContent>
        </Card>

        {user && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">소속 학원:</span>{" "}
                  {user.academyName || user.academy_name || "전체"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">등록자:</span> {user.name} ({user.role})
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
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
