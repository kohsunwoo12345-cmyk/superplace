"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Star, TrendingUp, Award, Home } from "lucide-react";

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
          <p className="mt-4 text-gray-600">피드백을 불러오는 중...</p>
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
      <div className="max-w-3xl mx-auto space-y-4 py-6">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">숙제 채점 결과</h1>
          <p className="text-gray-600">AI 선생님이 꼼꼼하게 채점했어요!</p>
        </div>

        {/* 점수 카드 */}
        <Card className={`border-4 ${getScoreColor(feedback.score)}`}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-2">{getScoreEmoji(feedback.score)}</div>
              <div className="text-5xl font-bold mb-2" style={{ color: getScoreColor(feedback.score).split(" ")[0].replace("text-", "") }}>
                {feedback.score}점
              </div>
              <p className="text-lg text-gray-600">
                {feedback.totalImages}장의 숙제를 제출했어요
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI 종합 피드백 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              AI 선생님의 종합 평가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {feedback.feedback}
            </p>
          </CardContent>
        </Card>

        {/* 잘한 점 */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Star className="w-5 h-5" />
                👍 잘한 점
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feedback.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-green-800">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 개선할 점 */}
        {feedback.suggestions && feedback.suggestions.length > 0 && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <TrendingUp className="w-5 h-5" />
                💡 더 발전하려면
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feedback.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">➜</span>
                    <span className="text-blue-800">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 과목별 점수 (있을 경우) */}
        {feedback.subjectScores && Object.keys(feedback.subjectScores).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>과목별 점수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(feedback.subjectScores).map(([subject, score]: [string, any]) => (
                  <div key={subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{subject}</span>
                    <span className="text-xl font-bold text-blue-600">{score}점</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 제출 정보 */}
        <Card className="bg-gradient-to-r from-purple-100 to-pink-100">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-600 space-y-1">
              <p>📅 제출 시간: {new Date(feedback.submittedAt).toLocaleString("ko-KR")}</p>
              <p>✅ 선생님과 학원장님께 결과가 전송되었습니다</p>
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
            onClick={() => router.push(`/homework-check?userId=${userId}`)}
            className="flex-1"
            size="lg"
          >
            다시 제출하기
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
