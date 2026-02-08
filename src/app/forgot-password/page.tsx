"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Mail, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    // 임시: 비밀번호 찾기 기능은 추후 구현
    setTimeout(() => {
      setSuccess(true);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-200 rounded-full opacity-20 blur-xl"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4 sm:mb-6">
            <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">비밀번호 찾기</h1>
          <p className="text-gray-600">등록된 이메일로 비밀번호 재설정 링크를 보내드립니다</p>
        </div>

        <Card className="border-2 border-blue-100 shadow-2xl">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-full shadow-md">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">이메일 확인</CardTitle>
            <CardDescription className="text-center">
              가입하신 이메일 주소를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>{error}</div>
                  </div>
                )}

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

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "전송 중..." : "재설정 링크 전송"}
                </Button>

                <div className="text-center text-sm pt-4 border-t">
                  <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    ← 로그인으로 돌아가기
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-md flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">이메일이 전송되었습니다!</p>
                    <p className="text-sm mt-1">
                      {email}로 비밀번호 재설정 링크를 전송했습니다.
                      이메일을 확인해주세요.
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    이메일을 받지 못하셨나요?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSuccess(false);
                      setEmail("");
                    }}
                    className="w-full"
                  >
                    다시 시도하기
                  </Button>
                </div>

                <div className="text-center text-sm pt-4 border-t">
                  <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    ← 로그인으로 돌아가기
                  </Link>
                </div>
              </div>
            )}

            {/* 임시 안내 */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-xs text-center text-yellow-800">
                <strong>임시 안내</strong><br />
                비밀번호를 잊으셨다면 관리자에게 문의해주세요.<br />
                📞 010-8739-9697
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
