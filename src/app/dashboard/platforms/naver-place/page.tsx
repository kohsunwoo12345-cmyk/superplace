"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ThumbsUp, ThumbsDown, Meh, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function NaverPlacePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [reviews, setReviews] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!reviews.trim()) {
      toast({
        title: "입력 오류",
        description: "분석할 리뷰를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const reviewList = reviews
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      const response = await fetch("/api/platforms/naver-place/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: reviewList }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        
        toast({
          title: "분석 완료",
          description: data.isRealAI
            ? "AI가 리뷰를 성공적으로 분석했습니다!"
            : "샘플 분석 결과입니다. OPENAI_API_KEY를 설정하면 실제 AI 분석을 받을 수 있습니다.",
        });
      } else {
        throw new Error("분석 실패");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "오류",
        description: "리뷰 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-5 w-5 text-green-600" />;
      case "negative":
        return <ThumbsDown className="h-5 w-5 text-red-600" />;
      default:
        return <Meh className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-50 border-green-200";
      case "negative":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">네이버 플레이스 관리</h1>
        <p className="text-muted-foreground mt-2">
          AI로 고객 리뷰를 분석하고 인사이트를 얻으세요
        </p>
      </div>

      {/* AI Review Analyzer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI 리뷰 감정 분석
          </CardTitle>
          <CardDescription>
            고객 리뷰를 입력하면 AI가 감정을 분석하고 긍정/부정/중립으로 분류합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reviews">리뷰 입력 (한 줄에 하나씩)</Label>
            <Textarea
              id="reviews"
              placeholder="예:
음식이 정말 맛있어요! 재방문 의사 100%
직원분들이 친절하시네요
가격 대비 별로인 것 같아요"
              value={reviews}
              onChange={(e) => setReviews(e.target.value)}
              rows={10}
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI가 리뷰를 분석하는 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI로 감정 분석하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {results && (
        <>
          <Card className={results.isRealAI ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>분석 결과</CardTitle>
                <div className="flex items-center gap-2 text-sm">
                  {results.isRealAI ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium">실제 AI 분석</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-700 font-medium">샘플 분석</span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      전체 평가
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(results.overall)}
                      <span className="text-2xl font-bold capitalize">
                        {results.overall === "positive" && "긍정적"}
                        {results.overall === "negative" && "부정적"}
                        {results.overall === "neutral" && "중립적"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      긍정 리뷰
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {results.scores.filter((s: any) => s.sentiment === "positive").length}개
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      부정 리뷰
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {results.scores.filter((s: any) => s.sentiment === "negative").length}개
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>개별 리뷰 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.scores.map((score: any, index: number) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getSentimentColor(score.sentiment)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSentimentIcon(score.sentiment)}
                      <div className="flex-1">
                        <p className="text-sm">{score.text}</p>
                        <div className="mt-2 flex items-center gap-4">
                          <span className="text-xs font-medium capitalize">
                            {score.sentiment === "positive" && "긍정적"}
                            {score.sentiment === "negative" && "부정적"}
                            {score.sentiment === "neutral" && "중립적"}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                            <div
                              className={`h-2 rounded-full ${
                                score.sentiment === "positive"
                                  ? "bg-green-600"
                                  : score.sentiment === "negative"
                                  ? "bg-red-600"
                                  : "bg-gray-600"
                              }`}
                              style={{ width: `${score.score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {(score.score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">플레이스 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">등록 상태</span>
              <span className="font-medium">연동 대기</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">총 리뷰 수</span>
              <span className="font-medium">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">평균 평점</span>
              <span className="font-medium">-</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI 분석 팁</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• 여러 리뷰를 한 번에 분석하여 트렌드를 파악하세요</p>
            <p>• 부정적인 리뷰는 개선점을 찾는 기회로 활용하세요</p>
            <p>• 긍정적인 리뷰는 마케팅 자료로 활용할 수 있습니다</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
