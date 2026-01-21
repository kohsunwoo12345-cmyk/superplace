"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Users,
  GraduationCap,
  UserCheck,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

type UserFormData = {
  email: string;
  name: string;
  password: string;
  phone: string;
  role: "TEACHER" | "STUDENT";
  grade?: string;
  studentId?: string;
  parentPhone?: string;
};

export default function ManageUsersPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 선생님 폼
  const [teacherForm, setTeacherForm] = useState<UserFormData>({
    email: "",
    name: "",
    password: "",
    phone: "",
    role: "TEACHER",
  });

  // 학생 폼
  const [studentForm, setStudentForm] = useState<UserFormData>({
    email: "",
    name: "",
    password: "",
    phone: "",
    role: "STUDENT",
    grade: "",
    studentId: "",
    parentPhone: "",
  });

  const handleCreateUser = async (formData: UserFormData) => {
    // 유효성 검사
    if (!formData.email || !formData.name || !formData.password) {
      toast({
        title: "입력 오류",
        description: "이메일, 이름, 비밀번호는 필수 입력 항목입니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          academyId: (session?.user as any)?.academyId, // 학원장의 academyId
          approved: true, // 학원장이 직접 생성하므로 자동 승인
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "사용자 생성 실패");
      }

      const data = await response.json();

      toast({
        title: "생성 완료!",
        description: `${formData.role === "TEACHER" ? "선생님" : "학생"} 계정이 성공적으로 생성되었습니다.`,
      });

      // 폼 초기화
      if (formData.role === "TEACHER") {
        setTeacherForm({
          email: "",
          name: "",
          password: "",
          phone: "",
          role: "TEACHER",
        });
      } else {
        setStudentForm({
          email: "",
          name: "",
          password: "",
          phone: "",
          role: "STUDENT",
          grade: "",
          studentId: "",
          parentPhone: "",
        });
      }
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message || "사용자 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePassword = (role: "TEACHER" | "STUDENT") => {
    const newPassword = generatePassword();
    if (role === "TEACHER") {
      setTeacherForm({ ...teacherForm, password: newPassword });
    } else {
      setStudentForm({ ...studentForm, password: newPassword });
    }
    toast({
      title: "비밀번호 생성",
      description: `생성된 비밀번호: ${newPassword}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-primary" />
          사용자 관리
        </h1>
        <p className="text-gray-600 mt-2">
          선생님과 학생을 추가하고 계정을 관리하세요
        </p>
      </div>

      {/* Role Check */}
      {session?.user?.role !== "DIRECTOR" && session?.user?.role !== "SUPER_ADMIN" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 font-semibold">
              ⚠️ 이 페이지는 학원장만 접근할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}

      {(session?.user?.role === "DIRECTOR" || session?.user?.role === "SUPER_ADMIN") && (
        <Tabs defaultValue="teacher" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="teacher" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              선생님 추가
            </TabsTrigger>
            <TabsTrigger value="student" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              학생 추가
            </TabsTrigger>
          </TabsList>

          {/* 선생님 추가 탭 */}
          <TabsContent value="teacher">
            <Card>
              <CardHeader>
                <CardTitle>선생님 계정 생성</CardTitle>
                <CardDescription>
                  새로운 선생님 계정을 생성합니다. 생성된 계정 정보를 선생님에게 전달하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacher-name">이름 *</Label>
                    <Input
                      id="teacher-name"
                      placeholder="홍길동"
                      value={teacherForm.name}
                      onChange={(e) =>
                        setTeacherForm({ ...teacherForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacher-email">이메일 (ID) *</Label>
                    <Input
                      id="teacher-email"
                      type="email"
                      placeholder="teacher@example.com"
                      value={teacherForm.email}
                      onChange={(e) =>
                        setTeacherForm({ ...teacherForm, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacher-password">비밀번호 *</Label>
                    <div className="relative">
                      <Input
                        id="teacher-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="8자 이상"
                        value={teacherForm.password}
                        onChange={(e) =>
                          setTeacherForm({ ...teacherForm, password: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGeneratePassword("TEACHER")}
                    >
                      자동 생성
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacher-phone">전화번호</Label>
                    <Input
                      id="teacher-phone"
                      placeholder="010-1234-5678"
                      value={teacherForm.phone}
                      onChange={(e) =>
                        setTeacherForm({ ...teacherForm, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleCreateUser(teacherForm)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      선생님 계정 생성
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 학생 추가 탭 */}
          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>학생 계정 생성</CardTitle>
                <CardDescription>
                  새로운 학생 계정을 생성합니다. 생성된 계정 정보를 학생/학부모에게 전달하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-name">이름 *</Label>
                    <Input
                      id="student-name"
                      placeholder="김학생"
                      value={studentForm.name}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-email">이메일 (ID) *</Label>
                    <Input
                      id="student-email"
                      type="email"
                      placeholder="student@example.com"
                      value={studentForm.email}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-password">비밀번호 *</Label>
                    <div className="relative">
                      <Input
                        id="student-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="8자 이상"
                        value={studentForm.password}
                        onChange={(e) =>
                          setStudentForm({ ...studentForm, password: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGeneratePassword("STUDENT")}
                    >
                      자동 생성
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-phone">학생 전화번호</Label>
                    <Input
                      id="student-phone"
                      placeholder="010-1234-5678"
                      value={studentForm.phone}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-grade">학년</Label>
                    <Select
                      value={studentForm.grade}
                      onValueChange={(value) =>
                        setStudentForm({ ...studentForm, grade: value })
                      }
                    >
                      <SelectTrigger id="student-grade">
                        <SelectValue placeholder="학년 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="초1">초등 1학년</SelectItem>
                        <SelectItem value="초2">초등 2학년</SelectItem>
                        <SelectItem value="초3">초등 3학년</SelectItem>
                        <SelectItem value="초4">초등 4학년</SelectItem>
                        <SelectItem value="초5">초등 5학년</SelectItem>
                        <SelectItem value="초6">초등 6학년</SelectItem>
                        <SelectItem value="중1">중등 1학년</SelectItem>
                        <SelectItem value="중2">중등 2학년</SelectItem>
                        <SelectItem value="중3">중등 3학년</SelectItem>
                        <SelectItem value="고1">고등 1학년</SelectItem>
                        <SelectItem value="고2">고등 2학년</SelectItem>
                        <SelectItem value="고3">고등 3학년</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-id">학번</Label>
                    <Input
                      id="student-id"
                      placeholder="20240001"
                      value={studentForm.studentId}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, studentId: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="parent-phone">학부모 연락처</Label>
                    <Input
                      id="parent-phone"
                      placeholder="010-9876-5432"
                      value={studentForm.parentPhone}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, parentPhone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleCreateUser(studentForm)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      학생 계정 생성
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Quick Access Links */}
      {(session?.user?.role === "DIRECTOR" || session?.user?.role === "SUPER_ADMIN") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">선생님 관리</p>
                  <p className="text-sm text-gray-600">
                    등록된 선생님 목록 확인 및 관리
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">학생 관리</p>
                  <p className="text-sm text-gray-600">
                    등록된 학생 목록 확인 및 관리
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
