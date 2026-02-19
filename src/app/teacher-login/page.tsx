"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, User } from "lucide-react";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      console.log('📡 Teacher login API response:', result);

      if (result.success && result.token && result.user) {
        // 선생님/학원장 역할 확인
        if (result.user.role !== 'TEACHER' && result.user.role !== 'DIRECTOR' && result.user.role !== 'ADMIN' && result.user.role !== 'SUPER_ADMIN') {
          setError("선생님 또는 학원장 계정이 아닙니다. 학생은 학생 로그인 페이지를 이용해주세요.");
          setIsLoading(false);
          return;
        }

        console.log('✅ Role verified:', result.user.role);

        // 토큰과 사용자 정보 저장
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        
        console.log('✅ Redirecting to dashboard...');
        
        // 대시보드로 이동
        router.push("/dashboard");
      } else {
        console.error('❌ Login failed:', result);
        setError(result.message || "로그인에 실패했습니다");
      }
    } catch (err) {
      setError("로그인 처리 중 오류가 발생했습니다");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="p-4 sm:p-6 space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            선생님 / 학원장 로그인
          </CardTitle>
          <CardDescription className="text-base">
            슈퍼플레이스 학습 관리 시스템
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                이메일
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/forgot-password"
                className="text-purple-600 hover:text-purple-700 hover:underline font-medium"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  로그인 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  관리 시작하기
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                학생이신가요?
              </p>
              <Link
                href="/student-login"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                학생 로그인 페이지로 이동
              </Link>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                아직 계정이 없으신가요?{" "}
                <Link
                  href="/register"
                  className="font-medium text-purple-600 hover:text-purple-700 hover:underline"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">문의사항이 있으신가요?</p>
              <Link
                href="/"
                className="text-xs text-purple-600 hover:text-purple-700 hover:underline font-medium"
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 데코레이션 요소 */}
      <div className="fixed top-10 right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
