"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Target, Calendar, BookOpen, TrendingUp, ArrowLeft } from "lucide-react";

export default function StudentPersonalizedPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/student-login");
      return;
    }
    try {
      setUser(JSON.parse(userStr));
    } catch (e) {
      router.push("/student-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />홈으로</Button>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">개별학습 관리</h1>
          <p className="text-gray-600">나만의 맞춤형 학습 계획을 관리하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: Target, title: "학습 목표", value: "수능 1등급", color: "blue" },
            { icon: Calendar, title: "D-Day", value: "285일", color: "red" },
            { icon: TrendingUp, title: "목표 달성률", value: "68%", color: "green" },
          ].map((item, index) => (
            <Card key={index} className="border-2 border-gray-100">
              <CardContent className="pt-6">
                <item.icon className={`h-8 w-8 text-${item.color}-600 mb-2`} />
                <div className="text-sm text-gray-600">{item.title}</div>
                <div className="text-2xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>이번 주 학습 계획</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["월요일: 수학 - 이차함수 복습 (2시간)", "화요일: 영어 - 독해 연습 (1.5시간)", "수요일: 과학 - 화학 실험 (2시간)", "목요일: 수학 - 문제 풀이 (2시간)", "금요일: 영어 - 문법 정리 (1시간)"].map((plan, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg"><input type="checkbox" className="w-5 h-5" /><span>{plan}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>추천 학습 자료</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ title: "이차함수 심화 문제집", subject: "수학" }, { title: "영어 독해 실전 모의고사", subject: "영어" }].map((item, index) => (
                <div key={index} className="p-4 border-2 rounded-lg hover:border-blue-300 transition-colors">
                  <BookOpen className="h-6 w-6 text-blue-600 mb-2" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.subject}</p>
                  <Button size="sm" variant="outline" className="w-full">자료 보기</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
