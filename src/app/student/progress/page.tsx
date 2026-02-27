"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, CheckCircle, Clock, Target, ArrowLeft, Calendar } from "lucide-react";

export default function StudentProgressPage() {
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
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (e) {
      router.push("/student-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const subjects = [
    { name: "수학", progress: 75, color: "blue", completed: 15, total: 20 },
    { name: "영어", progress: 60, color: "green", completed: 12, total: 20 },
    { name: "과학", progress: 85, color: "purple", completed: 17, total: 20 },
    { name: "사회", progress: 50, color: "orange", completed: 10, total: 20 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로
          </Button>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            학습 진도 관리
          </h1>
          <p className="text-gray-600">나의 학습 진행 상황을 한눈에 확인하세요</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">전체 진도율</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">67.5%</div>
              <p className="text-xs text-gray-500 mt-2">평균 진행률</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">완료한 과정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">54</div>
              <p className="text-xs text-gray-500 mt-2">전체 80개 중</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">학습 시간</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">42시간</div>
              <p className="text-xs text-gray-500 mt-2">이번 달 누적</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">다음 과제</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">3일</div>
              <p className="text-xs text-gray-500 mt-2">수학 과제 마감</p>
            </CardContent>
          </Card>
        </div>

        {/* Subject Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              과목별 진도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {subjects.map((subject) => (
                <div key={subject.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{subject.name}</span>
                    <span className="text-sm text-gray-600">
                      {subject.completed}/{subject.total} 완료 ({subject.progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`bg-${subject.color}-600 h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${subject.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              최근 학습 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { subject: "수학", activity: "함수의 그래프 학습 완료", date: "2시간 전", status: "completed" },
                { subject: "영어", activity: "영문법 퀴즈 제출", date: "5시간 전", status: "completed" },
                { subject: "과학", activity: "물리 실험 보고서 작성 중", date: "1일 전", status: "in-progress" },
                { subject: "사회", activity: "한국사 강의 시청", date: "2일 전", status: "completed" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {item.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.subject}</span>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.activity}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
