"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, AlertCircle, Star, TrendingUp, Award, Home, 
  BookOpen, Lightbulb, AlertTriangle, Target, Brain, MapPin
} from "lucide-react";

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const userId = searchParams.get("userId");

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!submissionId || !userId) {
      setError("필수 정보가 없습니다");
      setLoading(false);
      return;
    }

    fetchFeedback();
  }, [submissionId, userId]);

  const fetchFeedback = async () => {
    try {
      const response = await fetch(`/api/homework/feedback?submissionId=${submissionId}&userId=${userId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setFeedback(data.feedback);
      } else {
        setError(data.error || "피드백을 불러올 수 없습니다");
      }
    } catch (err) {
      console.error("Feedback fetch error:", err);
      setError("데이터를 불러오는 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">AI가 열심히 채점하고 있어요...</p>
        </div>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg text-red-600 mb-4">{error || "피드백을 찾을 수 없습니다"}</p>
              <Button onClick={() => router.push("/dashboard")}>
                <Home className="w-4 h-4 mr-2" />
                대시보드로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100 border-green-300";
    if (score >= 70) return "text-blue-600 bg-blue-100 border-blue-300";
    if (score >= 50) return "text-yellow-600 bg-yellow-100 border-yellow-300";
    return "text-red-600 bg-red-100 border-red-300";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return "🎉";
    if (score >= 70) return "👍";
    if (score >= 50) return "💪";
    return "🔥";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4 py-6">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">🎓 숙제 채점 결과</h1>
          <p className="text-gray-600">AI 선생님이 꼼꼼하게 채점하고 분석했어요!</p>
        </div>

        {/* 점수 카드 */}
        <Card className={`border-4 ${getScoreColor(feedback.score)}`}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-2">{getScoreEmoji(feedback.score)}</div>
              <div className="text-6xl font-bold mb-2">
                {feedback.score}<span className="text-4xl">점</span>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge variant="outline" className="text-lg py-2 px-4">
                  {feedback.subject || "일반"}
                </Badge>
                <Badge variant="outline" className="text-lg py-2 px-4">
                  완성도: {feedback.completion || "중"}
                </Badge>
                <Badge variant="outline" className="text-lg py-2 px-4">
                  노력도: {feedback.effort || "중"}
                </Badge>
              </div>
              <p className="text-gray-600 mt-4">
                📝 {feedback.totalImages || 1}장의 숙제를 제출했어요
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI 종합 피드백 */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Award className="w-6 h-6" />
              AI 선생님의 종합 평가
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
              {feedback.feedback}
            </p>
          </CardContent>
        </Card>

        {/* 상세 분석 (새로 추가) */}
        {feedback.detailedAnalysis && (
          <Card className="border-2 border-indigo-200">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Brain className="w-6 h-6" />
                📊 상세 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {feedback.detailedAnalysis}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* 잘한 점 */}
          {feedback.strengths && feedback.strengths.length > 0 && (
            <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Star className="w-5 h-5" />
                  👍 잘한 점
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feedback.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 p-2 bg-white rounded-lg">
                      <span className="text-green-600 font-bold text-xl mt-0.5">✓</span>
                      <span className="text-green-900 font-medium">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 부족한 점 (새로 추가) */}
          {feedback.weaknesses && feedback.weaknesses.length > 0 && (
            <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                  ⚠️ 부족한 점
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feedback.weaknesses.map((weakness: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 p-2 bg-white rounded-lg">
                      <span className="text-orange-600 font-bold text-xl mt-0.5">!</span>
                      <span className="text-orange-900 font-medium">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 필요한 개념 (새로 추가) */}
        {feedback.conceptsNeeded && feedback.conceptsNeeded.length > 0 && (
          <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <BookOpen className="w-6 h-6" />
                📚 꼭 알아야 할 개념
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {feedback.conceptsNeeded.map((concept: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="text-blue-900 font-medium flex-1">{concept}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 발견된 실수 (새로 추가) */}
        {feedback.mistakes && feedback.mistakes.length > 0 && (
          <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-6 h-6" />
                ❌ 발견된 실수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedback.mistakes.map((mistake: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg border border-red-200">
                    <span className="text-red-600 font-bold text-xl mt-0.5">✗</span>
                    <span className="text-red-900 font-medium">{mistake}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 개선 방법 */}
        {feedback.suggestions && feedback.suggestions.length > 0 && (
          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Lightbulb className="w-6 h-6" />
                💡 이렇게 개선하세요
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedback.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg">
                    <span className="text-purple-600 font-bold text-xl mt-0.5">➜</span>
                    <span className="text-purple-900 font-medium">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 학습 방향 (새로 추가) */}
        {feedback.studyDirection && (
          <Card className="border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700">
                <MapPin className="w-6 h-6" />
                🎯 앞으로 학습 방향
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-teal-900 text-lg leading-relaxed whitespace-pre-wrap p-4 bg-white rounded-lg">
                {feedback.studyDirection}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 제출 정보 */}
        <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center text-sm space-y-2">
              <p className="text-gray-700">
                📅 제출 시간: {new Date(feedback.submittedAt).toLocaleString("ko-KR")}
              </p>
              <p className="text-purple-700 font-semibold">
                ✅ 선생님과 학원장님께 결과가 전송되었습니다
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            대시보드로
          </Button>
          <Button
            onClick={() => router.push(`/dashboard/homework/student`)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            <Award className="w-4 h-4 mr-2" />
            오늘의 숙제 보기
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <FeedbackContent />
    </Suspense>
  );
}
