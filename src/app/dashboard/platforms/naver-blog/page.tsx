"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, FileText, Save, Eye, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function NaverBlogPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  
  // Form state
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  
  // Generated content
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isRealAI, setIsRealAI] = useState(false);

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/platforms/naver-blog/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const handleGenerateContent = async () => {
    if (!topic.trim() || !keywords.trim()) {
      toast({
        title: "입력 오류",
        description: "주제와 키워드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/platforms/naver-blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          keywords: keywords.split(",").map((k) => k.trim()),
          tone,
          length,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedTitle(data.title);
        setGeneratedContent(data.content);
        setIsRealAI(data.isRealAI);
        
        toast({
          title: "콘텐츠 생성 완료",
          description: data.isRealAI
            ? "AI가 콘텐츠를 성공적으로 생성했습니다!"
            : "샘플 콘텐츠가 생성되었습니다. OPENAI_API_KEY를 설정하면 실제 AI 콘텐츠를 받을 수 있습니다.",
        });
      } else {
        throw new Error("콘텐츠 생성 실패");
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

  const handleSavePost = async (status: string = "DRAFT") => {
    if (!generatedTitle || !generatedContent) {
      toast({
        title: "저장 오류",
        description: "저장할 콘텐츠가 없습니다. 먼저 콘텐츠를 생성해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/platforms/naver-blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedTitle,
          content: generatedContent,
          status,
        }),
      });

      if (response.ok) {
        toast({
          title: "저장 완료",
          description: `블로그 포스트가 ${status === "PUBLISHED" ? "발행" : "임시저장"}되었습니다.`,
        });
        
        // Reset form and refresh posts
        setGeneratedTitle("");
        setGeneratedContent("");
        setTopic("");
        setKeywords("");
        fetchPosts();
      } else {
        throw new Error("저장 실패");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "오류",
        description: "포스트 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">네이버 블로그 관리</h1>
        <p className="text-muted-foreground mt-2">
          AI를 활용하여 고품질 블로그 콘텐츠를 생성하고 관리하세요
        </p>
      </div>

      {/* AI Content Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI 콘텐츠 생성기
          </CardTitle>
          <CardDescription>
            주제와 키워드를 입력하면 AI가 최적화된 블로그 콘텐츠를 생성합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="topic">주제</Label>
              <Input
                id="topic"
                placeholder="예: 디지털 마케팅 트렌드"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">키워드 (쉼표로 구분)</Label>
              <Input
                id="keywords"
                placeholder="예: SEO, 콘텐츠 마케팅, 소셜미디어"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tone">톤 & 스타일</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">전문적</SelectItem>
                  <SelectItem value="casual">캐주얼</SelectItem>
                  <SelectItem value="friendly">친근한</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">콘텐츠 길이</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">짧게 (500자)</SelectItem>
                  <SelectItem value="medium">보통 (1000자)</SelectItem>
                  <SelectItem value="long">길게 (2000자+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerateContent}
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
                AI로 콘텐츠 생성하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content Preview */}
      {generatedTitle && generatedContent && (
        <Card className={isRealAI ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                생성된 콘텐츠
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="generated-title">제목</Label>
              <Input
                id="generated-title"
                value={generatedTitle}
                onChange={(e) => setGeneratedTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="generated-content">본문</Label>
              <Textarea
                id="generated-content"
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSavePost("DRAFT")}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                임시저장
              </Button>
              <Button
                onClick={() => handleSavePost("PUBLISHED")}
                disabled={loading}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                발행하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Posts */}
      <Card>
        <CardHeader>
          <CardTitle>저장된 포스트</CardTitle>
          <CardDescription>
            생성하고 저장한 블로그 포스트 목록
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 저장된 포스트가 없습니다.</p>
              <p className="text-sm mt-2">AI로 콘텐츠를 생성하고 저장해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {post.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          post.status === "PUBLISHED"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {post.status === "PUBLISHED" ? "발행됨" : "임시저장"}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
