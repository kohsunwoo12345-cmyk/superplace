"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Youtube, Copy, CheckCircle, AlertCircle, Loader2, Tag } from "lucide-react";

export default function YouTubePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [optimizing, setOptimizing] = useState(false);
  
  // Form state
  const [originalTitle, setOriginalTitle] = useState("");
  const [videoTopic, setVideoTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  
  // Optimized content
  const [optimizedTitle, setOptimizedTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isRealAI, setIsRealAI] = useState(false);

  const handleOptimize = async () => {
    if (!originalTitle.trim() || !videoTopic.trim() || !keywords.trim()) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setOptimizing(true);
    try {
      const response = await fetch("/api/platforms/youtube/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalTitle,
          videoTopic,
          keywords: keywords.split(",").map((k) => k.trim()),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOptimizedTitle(data.optimizedTitle);
        setDescription(data.description);
        setTags(data.tags);
        setIsRealAI(data.isRealAI);
        
        toast({
          title: "최적화 완료",
          description: data.isRealAI
            ? "AI가 콘텐츠를 성공적으로 최적화했습니다!"
            : "샘플 최적화 결과입니다. OPENAI_API_KEY를 설정하면 실제 AI 최적화를 받을 수 있습니다.",
        });
      } else {
        throw new Error("최적화 실패");
      }
    } catch (error) {
      console.error("Optimize error:", error);
      toast({
        title: "오류",
        description: "콘텐츠 최적화 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setOptimizing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사 완료",
      description: "클립보드에 복사되었습니다.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">YouTube 관리</h1>
        <p className="text-muted-foreground mt-2">
          AI로 제목, 설명, 태그를 SEO 최적화하세요
        </p>
      </div>

      {/* AI Optimizer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI YouTube SEO 최적화
          </CardTitle>
          <CardDescription>
            영상 정보를 입력하면 AI가 SEO에 최적화된 제목, 설명, 태그를 생성합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="original-title">현재 제목 *</Label>
            <Input
              id="original-title"
              placeholder="예: 마케팅 초보자를 위한 가이드"
              value={originalTitle}
              onChange={(e) => setOriginalTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-topic">영상 주제/내용 *</Label>
            <Textarea
              id="video-topic"
              placeholder="예: 디지털 마케팅을 처음 시작하는 사람들을 위한 기초 강의. SEO, SNS 마케팅, 콘텐츠 전략 등을 다룹니다."
              value={videoTopic}
              onChange={(e) => setVideoTopic(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">목표 키워드 (쉼표로 구분) *</Label>
            <Input
              id="keywords"
              placeholder="예: 디지털마케팅, 마케팅입문, SEO, 소셜미디어"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          <Button
            onClick={handleOptimize}
            disabled={optimizing}
            className="w-full"
            size="lg"
          >
            {optimizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI가 최적화하는 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI로 SEO 최적화하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Optimized Content */}
      {optimizedTitle && description && (
        <Card className={isRealAI ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5" />
                최적화된 콘텐츠
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
                {isRealAI ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-medium">실제 AI 최적화</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-700 font-medium">샘플 최적화</span>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title Comparison */}
            <div className="space-y-3">
              <Label>제목 비교</Label>
              <div className="space-y-2">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">원본</p>
                  <p className="text-sm">{originalTitle}</p>
                </div>
                <div className="bg-white border-2 border-green-500 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-green-700 font-medium">AI 최적화</p>
                    <Button
                      onClick={() => copyToClipboard(optimizedTitle)}
                      size="sm"
                      variant="ghost"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium">{optimizedTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {optimizedTitle.length} / 100 자
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>설명</Label>
                <Button
                  onClick={() => copyToClipboard(description)}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={10}
                  className="resize-none border-0 p-0 focus-visible:ring-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {description.length} / 5000 자
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  태그 ({tags.length}개)
                </Label>
                <Button
                  onClick={() => copyToClipboard(tags.join(", "))}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                YouTube는 최대 500자까지 태그를 허용합니다
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">YouTube SEO 팁</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 제목은 60자 이내로 유지하면 검색 결과에서 잘리지 않습니다</p>
          <p>• 설명의 첫 2-3줄이 가장 중요합니다. 핵심 키워드를 포함하세요</p>
          <p>• 태그는 구체적인 것부터 일반적인 것 순서로 배치하세요</p>
          <p>• 자막(CC)을 추가하면 검색 최적화에 도움이 됩니다</p>
        </CardContent>
      </Card>
    </div>
  );
}
