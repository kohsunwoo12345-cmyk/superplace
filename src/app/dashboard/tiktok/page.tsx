"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Zap, TrendingUp, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function TikTokPage() {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [niche, setNiche] = useState("");
  const [currentTrends, setCurrentTrends] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!niche.trim()) {
      toast({
        title: "입력 오류",
        description: "분야를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch("/api/platforms/tiktok/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          currentTrends: currentTrends ? currentTrends.split(",").map(t => t.trim()) : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        toast({
          title: "분석 완료",
          description: data.isRealAI
            ? "AI가 트렌드를 성공적으로 분석했습니다!"
            : "샘플 분석 결과입니다. OPENAI_API_KEY를 설정하면 실제 AI 분석을 받을 수 있습니다.",
        });
      } else {
        throw new Error("분석 실패");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "오류",
        description: "트렌드 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">TikTok 관리</h1>
        <p className="text-muted-foreground mt-2">
          AI로 트렌드를 분석하고 바이럴 콘텐츠 아이디어를 얻으세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI 트렌드 분석 & 콘텐츠 아이디어
          </CardTitle>
          <CardDescription>
            분야를 입력하면 AI가 트렌드와 바이럴 콘텐츠 아이디어를 제안합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="niche">분야/주제 *</Label>
            <Input
              id="niche"
              placeholder="예: 마케팅, 요리, 피트니스, 뷰티"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trends">현재 알고 있는 트렌드 (선택, 쉼표로 구분)</Label>
            <Input
              id="trends"
              placeholder="예: 챌린지, 댄스, 리액션"
              value={currentTrends}
              onChange={(e) => setCurrentTrends(e.target.value)}
            />
          </div>

          <Button onClick={handleAnalyze} disabled={analyzing} className="w-full" size="lg">
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI가 트렌드를 분석하는 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI로 트렌드 분석하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

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
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    트렌딩 해시태그
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {results.trendingHashtags.map((tag: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-white border rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    콘텐츠 아이디어
                  </h3>
                  <div className="space-y-4">
                    {results.contentIdeas.map((idea: any, i: number) => (
                      <Card key={i} className="bg-white">
                        <CardHeader>
                          <CardTitle className="text-base">{idea.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">{idea.description}</p>
                          <div>
                            <p className="text-xs font-medium mb-2">후킹 문구:</p>
                            <div className="space-y-1">
                              {idea.hooks.map((hook: string, j: number) => (
                                <p key={j} className="text-sm bg-gray-50 p-2 rounded">
                                  "{hook}"
                                </p>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">TikTok 마케팅 팁</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 첫 3초가 가장 중요합니다. 강력한 후킹으로 시작하세요</p>
          <p>• 트렌딩 사운드를 활용하면 노출이 크게 증가합니다</p>
          <p>• 해시태그는 3-5개가 적당하며, 니치 태그와 일반 태그를 섞으세요</p>
          <p>• 정기적으로 게시하고 커뮤니티와 소통하세요</p>
        </CardContent>
      </Card>
    </div>
  );
}
