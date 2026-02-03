"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  // 자동 로그인 함수
  const fillAdmin = () => {
    setEmail("admin@superplace.co.kr");
    setPassword("admin1234!");
    setError("");
    setDebugInfo("관리자 계정 정보가 입력되었습니다. 로그인 버튼을 클릭하세요.");
  };

  const fillTest = () => {
    setEmail("test3@test.com");
    setPassword("test123");
    setError("");
    setDebugInfo("테스트 계정 정보가 입력되었습니다. 로그인 버튼을 클릭하세요.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setDebugInfo("");

    console.log('🔐 로그인 시도:', { email, passwordLength: password.length });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 응답 상태:', response.status);
      const data = await response.json();
      console.log('📦 응답 데이터:', data);

      if (data.success) {
        console.log('✅ 로그인 성공!');
        // Store token and user info
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        setDebugInfo(`✅ 로그인 성공! ${data.data.user.name}님 환영합니다.`);
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1000);
      } else {
        console.error('❌ 로그인 실패:', data.message);
        setError(data.message || '이메일 또는 비밀번호가 올바르지 않습니다');
        setDebugInfo(`❌ 실패: ${data.message}${data.error ? ` (${data.error})` : ''}`);
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      setError('로그인 중 오류가 발생했습니다');
      setDebugInfo(`💥 오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-200 rounded-full opacity-20 blur-xl"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <GraduationCap className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">로그인</h1>
          <p className="text-gray-600">학습 관리 시스템에 접속하세요</p>
        </div>

        <Card className="border-2 border-blue-100 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-full shadow-md">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">환영합니다</CardTitle>
            <CardDescription className="text-center">
              SUPER PLACE 학습 관리 시스템
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              {debugInfo && (
                <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-md text-sm">
                  {debugInfo}
                </div>
              )}

              {/* 빠른 로그인 버튼 */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fillAdmin}
                  className="flex-1 px-3 py-2 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors"
                >
                  👨‍💼 관리자로 채우기
                </button>
                <button
                  type="button"
                  onClick={fillTest}
                  className="flex-1 px-3 py-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
                >
                  👤 테스트로 채우기
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-blue-200 focus:border-blue-400"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">비밀번호</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    비밀번호 찾기
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-blue-200 focus:border-blue-400"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>

              <div className="text-center text-sm pt-4 border-t">
                <span className="text-gray-600">아직 계정이 없으신가요? </span>
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  회원가입
                </Link>
              </div>
            </form>

            {/* Test Accounts Info */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <p className="text-xs text-center text-gray-700">
                <strong>테스트 계정</strong><br />
                관리자: admin@superplace.co.kr / admin1234!<br />
                일반: test3@test.com / test123
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
