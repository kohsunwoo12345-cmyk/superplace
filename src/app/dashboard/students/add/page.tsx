"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus, Eye, EyeOff } from "lucide-react";

export default function AddStudentPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    academyName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    // 학원장/선생님인 경우 학원명 자동 설정
    if (userData.academy_name) {
      setFormData(prev => ({ ...prev, academyName: userData.academy_name }));
    }
  }, [router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력하세요";
    }

    // 학생은 전화번호 필수, 이메일 선택
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = "전화번호를 입력하세요";
    } else if (!/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = "올바른 전화번호 형식이 아닙니다 (숫자와 - 만 입력)";
    }

    // 이메일은 선택 사항, 입력 시에만 검증
    if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력하세요";
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 최소 6자 이상이어야 합니다";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    console.log('📝 [학생 추가] 시작');
    console.log('👤 [학생 추가] 현재 user:', user);
    
    // 학원장/선생님의 academyId 추출
    const userAcademyId = user?.academyId || user?.academy_id || user?.AcademyId;
    console.log('🏫 [학생 추가] userAcademyId:', userAcademyId);
    
    try {
      const requestBody = {
        name: formData.name,
        email: formData.email || undefined, // 이메일 선택 사항
        password: formData.password,
        phone: formData.phone, // 전화번호 필수
        role: "STUDENT",
        academyName: formData.academyName || user?.academy_name,
        academyId: userAcademyId, // 학원장의 academyId 직접 전달
      };
      
      console.log('📤 [학생 추가] 요청 데이터:', requestBody);
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('📥 [학생 추가] 응답:', data);

      if (response.ok && data.success) {
        const studentAcademyId = data.user?.academyId;
        console.log('✅ [학생 추가] 성공 - 학생 academyId:', studentAcademyId);
        
        if (studentAcademyId && String(studentAcademyId) !== String(userAcademyId)) {
          console.warn('⚠️  [학생 추가] academyId 불일치!', {
            user: userAcademyId,
            student: studentAcademyId
          });
        }
        
        alert("✅ 학생이 추가되었습니다!");
        router.push("/dashboard/students");
      } else {
        console.error('❌ [학생 추가] 실패:', data);
        alert(data.message || "학생 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("Add student error:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-blue-600" />
              학생 추가
            </h1>
            <p className="text-gray-600 mt-1">새로운 학생을 등록합니다</p>
          </div>
        </div>

        {/* 입력 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>학생 정보 입력</CardTitle>
            <CardDescription>
              학생의 기본 정보와 로그인 정보를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="홍길동"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* 전화번호 - 필수 */}
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호 (로그인 아이디) *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
                <p className="text-xs text-gray-500">
                  학생은 전화번호로 로그인합니다
                </p>
              </div>

              {/* 이메일 - 선택 */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일 (선택사항)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com (선택사항)"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
                <p className="text-xs text-gray-500">
                  이메일은 선택사항입니다
                </p>
              </div>

              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="최소 6자 이상"
                    className={errors.password ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="비밀번호를 다시 입력하세요"
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* 학원명 */}
              <div className="space-y-2">\n                <Label htmlFor="academyName">학원명</Label>
                <Input
                  id="academyName"
                  value={formData.academyName}
                  onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
                  placeholder="학원명을 입력하세요"
                  disabled={!!user?.academy_name}
                />
                {user?.academy_name && (
                  <p className="text-xs text-gray-500">
                    현재 학원으로 자동 설정됩니다
                  </p>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      추가 중...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      학생 추가
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 안내 사항 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📝 안내 사항</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>전화번호</strong>가 학생의 로그인 아이디로 사용됩니다</li>
              <li>• 이메일은 선택사항입니다</li>
              <li>• 비밀번호는 최소 6자 이상 입력해야 합니다</li>
              <li>• 학생 추가 후 정보 수정이 가능합니다</li>
              <li>• 학생은 <strong>전화번호</strong>와 비밀번호로 로그인할 수 있습니다</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
