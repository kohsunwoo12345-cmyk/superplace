"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Mail, Phone, MessageSquare, Send, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "문의 제출 중 오류가 발생했습니다");
      } else {
        setSuccess(true);
        // 3초 후 홈으로 이동
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    } catch (error) {
      setError("문의 제출 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <Card className="w-full max-w-md border-2 border-green-200">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">문의가 접수되었습니다!</h2>
            <p className="text-gray-600 mb-2">
              빠른 시일 내에 답변 드리겠습니다.
            </p>
            <p className="text-sm text-gray-500">
              3초 후 홈페이지로 이동합니다...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost">홈으로</Button>
          </Link>
        </div>
      </header>

      {/* Contact Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
              <span className="text-sm font-semibold text-blue-700">📧 Contact Us</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                문의하기
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              궁금하신 점이 있으시면 언제든 연락주세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">이메일</h3>
                      <p className="text-sm text-gray-600">support@superplace.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Phone className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">전화</h3>
                      <p className="text-sm text-gray-600">02-1234-5678</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-pink-100 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-pink-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">운영 시간</h3>
                      <p className="text-sm text-gray-600">평일 09:00 - 18:00</p>
                      <p className="text-sm text-gray-600">(주말 및 공휴일 휴무)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              <Card className="border-2 border-blue-100 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="text-2xl">문의 양식</CardTitle>
                  <CardDescription>
                    아래 양식을 작성해주시면 빠르게 답변 드리겠습니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                        {error}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">이름 *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="홍길동"
                          required
                          disabled={isLoading}
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">이메일 *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          required
                          disabled={isLoading}
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">연락처</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="010-1234-5678"
                          disabled={isLoading}
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">문의 유형 *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          placeholder="예: 학원 등록 문의"
                          required
                          disabled={isLoading}
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">문의 내용 *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="문의하실 내용을 자세히 작성해주세요..."
                        required
                        disabled={isLoading}
                        rows={8}
                        className="border-blue-200 focus:border-blue-400 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        "전송 중..."
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          문의하기
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      * 필수 입력 항목입니다
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
