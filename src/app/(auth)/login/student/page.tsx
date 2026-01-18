"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Sparkles } from "lucide-react";

export default function StudentLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("로그인 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-200 rounded-full opacity-20 blur-xl"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <GraduationCap className="h-10 w-10 text-green-600" />
            <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full shadow-sm">
            <Sparkles className="h-5 w-5 text-green-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-green-700 to-blue-700 bg-clip-text text-transparent">
              학생 로그인
            </span>
          </div>
        </div>

        <Card className="border-2 border-green-100 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-full shadow-md">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">학습을 시작하세요</CardTitle>
            <CardDescription className="text-center">
              나만의 학습 공간에 접속하세요 ✨
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="student@example.com"
                  required
                  disabled={isLoading}
                  className="border-green-200 focus:border-green-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">비밀번호</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-green-600 hover:underline"
                  >
                    비밀번호 찾기
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="border-green-200 focus:border-green-400"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인하고 학습 시작하기 🚀"}
              </Button>

              <div className="flex items-center gap-2 text-center text-sm justify-center">
                <span className="text-gray-600">선생님이신가요?</span>
                <Link href="/login/director" className="text-green-600 hover:underline font-medium">
                  관리자 로그인
                </Link>
              </div>

              <div className="text-center text-sm pt-2 border-t">
                <span className="text-gray-600">아직 계정이 없으신가요? </span>
                <Link href="/register" className="text-green-600 hover:underline font-medium">
                  회원가입
                </Link>
              </div>
            </form>

            {/* Welcome message */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
              <p className="text-sm text-center text-gray-700">
                💡 <strong>새로운 학습 경험!</strong><br />
                AI 학습 도우미와 함께 공부하세요
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
