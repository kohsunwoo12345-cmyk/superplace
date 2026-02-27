"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, TrendingDown, BookOpen, CheckCircle, AlertCircle, ArrowLeft, Target } from "lucide-react";

export default function StudentAIAnalysisPage() {
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
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  }

  const weakConcepts = [
    { subject: "수학", concept: "이차방정식 근의 공식", score: 45, color: "red" },
    { subject: "수학", concept: "함수의 그래프 해석", score: 62, color: "orange" },
    { subject: "영어", concept: "현재완료 시제", score: 58, color: "orange" },
    { subject: "과학", concept: "화학 반응식", score: 70, color: "yellow" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />홈으로</Button>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI 부족한 개념 분석</h1>
          <p className="text-gray-600">인공지능이 분석한 나의 취약 개념을 확인하세요</p>
        </div>

        <Card className="mb-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="h-6 w-6 text-purple-600" />AI 분석 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">최근 3개월간의 학습 데이터를 분석한 결과, 다음 개념들에 대한 보충 학습이 필요합니다.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-red-600 mb-1">4개</div>
                <div className="text-sm text-gray-600">취약 개념</div>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-orange-600 mb-1">58%</div>
                <div className="text-sm text-gray-600">평균 이해도</div>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600 mb-1">12시간</div>
                <div className="text-sm text-gray-600">권장 보충 시간</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-600" />취약 개념 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weakConcepts.map((item, index) => (
                <div key={index} className="p-4 border-2 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500">{item.subject}</span>
                      <h3 className="font-bold text-lg">{item.concept}</h3>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold text-${item.color}-600`}>{item.score}점</div>
                      <div className="text-xs text-gray-500">이해도</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className={`bg-${item.color}-500 h-2 rounded-full`} style={{ width: `${item.score}%` }}></div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full"><BookOpen className="h-4 w-4 mr-2" />보충 학습 자료 보기</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
