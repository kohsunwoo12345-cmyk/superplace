"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link as LinkIcon, Copy, BarChart3, ExternalLink } from "lucide-react";

interface ShortUrl {
  id: string;
  shortCode: string;
  originalUrl: string;
  title?: string;
  clickCount: number;
  createdAt: string;
}

export default function UrlShortenerPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [originalUrl, setOriginalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  useEffect(() => {
    loadUrls();
  }, []);

  const loadUrls = async () => {
    try {
      const response = await fetch("/api/tools/url-shortener");
      if (response.ok) {
        const data = await response.json();
        setUrls(data.urls || []);
      }
    } catch (error) {
      console.error("Failed to load URLs:", error);
    }
  };

  const handleShorten = async () => {
    if (!originalUrl.trim()) {
      toast({
        title: "입력 오류",
        description: "URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tools/url-shortener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl, title }),
      });

      if (response.ok) {
        const data = await response.json();
        const fullUrl = `${window.location.origin}/s/${data.shortCode}`;
        setShortUrl(fullUrl);
        
        toast({
          title: "생성 완료",
          description: "단축 URL이 생성되었습니다.",
        });
        
        setOriginalUrl("");
        setTitle("");
        loadUrls();
      } else {
        throw new Error("단축 실패");
      }
    } catch (error) {
      console.error("Shorten error:", error);
      toast({
        title: "오류",
        description: "URL 단축 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold">URL 단축기</h1>
        <p className="text-muted-foreground mt-2">
          긴 URL을 짧게 만들고 클릭수를 추적하세요
        </p>
      </div>

      {/* Shorten Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            URL 단축하기
          </CardTitle>
          <CardDescription>
            긴 URL을 입력하면 짧고 추적 가능한 링크를 생성합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="original-url">원본 URL *</Label>
            <Input
              id="original-url"
              type="url"
              placeholder="https://example.com/very/long/url..."
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">제목 (선택)</Label>
            <Input
              id="title"
              placeholder="링크 설명"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <Button onClick={handleShorten} disabled={loading} className="w-full">
            <LinkIcon className="mr-2 h-4 w-4" />
            단축 URL 생성
          </Button>

          {shortUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-green-700 mb-2">생성된 단축 URL:</Label>
              <div className="flex gap-2 mt-2">
                <Input value={shortUrl} readOnly className="bg-white" />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(shortUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* URL List */}
      <Card>
        <CardHeader>
          <CardTitle>생성된 URL 목록</CardTitle>
          <CardDescription>
            단축 URL과 클릭 통계를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {urls.length > 0 ? (
            <div className="space-y-4">
              {urls.map((url) => {
                const fullShortUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${url.shortCode}`;
                return (
                  <div
                    key={url.id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {url.title && (
                          <h4 className="font-semibold mb-1">{url.title}</h4>
                        )}
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <span className="font-mono bg-primary/10 px-2 py-1 rounded">
                            /s/{url.shortCode}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(fullShortUrl)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          → {url.originalUrl}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {url.clickCount} 클릭
                          </span>
                          <span>
                            {new Date(url.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(url.originalUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 생성된 단축 URL이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
