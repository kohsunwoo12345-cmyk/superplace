"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
    };

    // Password confirmation check
    const confirmPassword = formData.get("confirmPassword") as string;
    if (data.password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "회원가입 중 오류가 발생했습니다");
      } else {
        // Redirect to login page after successful registration
        router.push("/login?registered=true");
      }
    } catch (error) {
      setError("회원가입 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <BarChart3 className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold">SUPER PLACE</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">회원가입</CardTitle>
            <CardDescription>
              새로운 계정을 만들고 14일 무료 체험을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">전화번호 (선택)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">회사명 (선택)</Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="회사명"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="최소 8자 이상"
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="비밀번호 확인"
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>

              <div className="text-xs text-gray-600">
                회원가입을 진행하면{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  이용약관
                </Link>
                {" "}및{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  개인정보처리방침
                </Link>
                에 동의하는 것으로 간주됩니다.
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "가입 중..." : "회원가입"}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">이미 계정이 있으신가요? </span>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  로그인
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
