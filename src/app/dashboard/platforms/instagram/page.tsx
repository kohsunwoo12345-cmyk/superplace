"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Instagram, Copy, CheckCircle, AlertCircle, Loader2, Hash } from "lucide-react";

export default function InstagramPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  
  // Form state
  const [description, setDescription] = useState("");
  const [mood, setMood] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  
  // Generated content
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isRealAI, setIsRealAI] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: "입력 오류",
        description: "게시물 설명을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/platforms/instagram/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          mood: mood || undefined,
          targetAudience: targetAudience || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCaption(data.caption);
        setHashtags(data.hashtags);
        setIsRealAI(data.isRealAI);
        
        toast({
          title: "콘텐츠 생성 완료",
          description: data.isRealAI
            ? "AI가 Instagram 콘텐츠를 성공적으로 생성했습니다!"
            : "샘플 콘텐츠가 생성되었습니다. OPENAI_API_KEY를 설정하면 실제 AI 콘텐츠를 받을 수 있습니다.",
        });
      } else {
        throw new Error("생성 실패");
      }
    } catch (error) {
      console.error("Generate error:", error);
      toast({
        title: "오류",
        description: "콘텐츠 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사 완료",
      description: "클립보드에 복사되었습니다.",
    });
  };

  const copyAll = () => {
    const fullText = `${caption}\n\n${hashtags.map(tag => `#${tag}`).join(" ")}`;
    copyToClipboard(fullText);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instagram 관리</h1>
        <p className="text-muted-foreground mt-2">
          AI로 매력적인 캡션과 해시태그를 자동 생성하세요
        </p>
      </div>

      {/* AI Caption Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI 캡션 & 해시태그 생성기
          </CardTitle>
          <CardDescription>
            게시물 내용을 설명하면 AI가 최적화된 캡션과 해시태그를 생성합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">게시물 설명 *</Label>
            <Textarea
              id="description"
              placeholder="예: 신제품 출시 소식을 알리는 게시물. 트렌디한 디자인과 합리적인 가격이 특징입니다."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mood">분위기/톤 (선택)</Label>
              <Input
                id="mood"
                placeholder="예: 친근하고 재미있는, 전문적인, 감성적인"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">타겟 오디언스 (선택)</Label>
              <Input
                id="target"
                placeholder="예: 2030 여성, 마케팅 담당자, 스타트업 창업자"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI가 콘텐츠를 생성하는 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI로 캡션 & 해시태그 생성하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {caption && hashtags.length > 0 && (
        <Card className={isRealAI ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                생성된 콘텐츠
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm mr-4">
                  {isRealAI ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium">실제 AI 생성</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-700 font-medium">샘플 콘텐츠</span>
                    </>
                  )}
                </div>
                <Button onClick={copyAll} size="sm" variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  전체 복사
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>캡션</Label>
                <Button
                  onClick={() => copyToClipboard(caption)}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={6}
                  className="resize-none border-0 p-0 focus-visible:ring-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {caption.length} 자
              </p>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  해시태그 ({hashtags.length}개)
                </Label>
                <Button
                  onClick={() => copyToClipboard(hashtags.map(tag => `#${tag}`).join(" "))}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Instagram 미리보기</Label>
              <div className="bg-white border rounded-lg p-6 max-w-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <div>
                    <p className="font-semibold text-sm">yourprofile</p>
                    <p className="text-xs text-muted-foreground">방금</p>
                  </div>
                </div>
                <div className="aspect-square bg-gray-100 rounded mb-4 flex items-center justify-center">
                  <Instagram className="h-12 w-12 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{caption}</p>
                  <p className="text-sm text-blue-600">
                    {hashtags.slice(0, 5).map(tag => `#${tag}`).join(" ")}
                    {hashtags.length > 5 && " ..."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instagram 마케팅 팁</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 캡션은 첫 줄이 가장 중요합니다. 후킹할 수 있는 문구를 배치하세요</p>
          <p>• 해시태그는 10-15개가 적당하며, 너무 많으면 스팸으로 보일 수 있습니다</p>
          <p>• CTA(Call-to-Action)를 포함하여 사용자 참여를 유도하세요</p>
          <p>• 이모지를 적절히 활용하면 가독성과 참여도가 높아집니다</p>
        </CardContent>
      </Card>
    </div>
  );
}
