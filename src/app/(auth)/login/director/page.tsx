"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, GraduationCap } from "lucide-react";

export default function DirectorLoginPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <GraduationCap className="h-10 w-10 text-purple-600" />
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
            <Building2 className="h-5 w-5 text-purple-700" />
            <span className="text-sm font-semibold text-purple-700">학원장 / 선생님 로그인</span>
          </div>
        </div>

        <Card className="border-2 border-purple-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="text-2xl text-center">관리자 로그인</CardTitle>
            <CardDescription className="text-center">
              학원 관리 시스템에 접속하세요
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
                  placeholder="director@example.com"
                  required
                  disabled={isLoading}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">비밀번호</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-purple-600 hover:underline"
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
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>

              <div className="flex items-center gap-2 text-center text-sm justify-center">
                <span className="text-gray-600">학생이신가요?</span>
                <Link href="/login/student" className="text-purple-600 hover:underline font-medium">
                  학생 로그인
                </Link>
              </div>

              <div className="text-center text-sm pt-2 border-t">
                <span className="text-gray-600">학원을 새로 시작하시나요? </span>
                <Link href="/register" className="text-purple-600 hover:underline font-medium">
                  학원 등록하기
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
