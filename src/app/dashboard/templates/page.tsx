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
import { FileStack, Plus, Copy, Edit, Trash2, Search } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  platform?: string;
  content: string;
  timesUsed: number;
  createdAt: string;
}

export default function TemplatesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("social");
  const [platform, setPlatform] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      toast({
        title: "입력 오류",
        description: "템플릿 이름과 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, platform: platform || undefined, content }),
      });

      if (response.ok) {
        toast({
          title: "저장 완료",
          description: "템플릿이 저장되었습니다.",
        });
        
        setName("");
        setContent("");
        setShowForm(false);
        loadTemplates();
      } else {
        throw new Error("저장 실패");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "오류",
        description: "템플릿 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUse = async (template: Template) => {
    await navigator.clipboard.writeText(template.content);
    
    // Update usage count
    await fetch(`/api/templates/${template.id}/use`, { method: "POST" });
    
    toast({
      title: "복사 완료",
      description: "템플릿이 클립보드에 복사되었습니다.",
    });
    
    loadTemplates();
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/templates/${id}`, { method: "DELETE" });
      toast({
        title: "삭제 완료",
        description: "템플릿이 삭제되었습니다.",
      });
      loadTemplates();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">템플릿 라이브러리</h1>
          <p className="text-muted-foreground mt-2">
            자주 사용하는 콘텐츠를 템플릿으로 저장하고 재사용하세요
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          새 템플릿
        </Button>
      </div>

      {/* New Template Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 템플릿 만들기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">템플릿 이름 *</Label>
              <Input
                id="name"
                placeholder="예: Instagram 제품 소개 템플릿"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social">소셜 미디어</SelectItem>
                    <SelectItem value="blog">블로그</SelectItem>
                    <SelectItem value="email">이메일</SelectItem>
                    <SelectItem value="ad">광고</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">플랫폼 (선택)</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="naver_blog">네이버 블로그</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">템플릿 내용 *</Label>
              <Textarea
                id="content"
                placeholder="템플릿 내용을 입력하세요. 변수를 사용할 수 있습니다: {제품명}, {가격}, {링크} 등"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>
                저장
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="템플릿 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            <SelectItem value="social">소셜 미디어</SelectItem>
            <SelectItem value="blog">블로그</SelectItem>
            <SelectItem value="email">이메일</SelectItem>
            <SelectItem value="ad">광고</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription>
                  {template.category} {template.platform && `• ${template.platform}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.content}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{template.timesUsed}회 사용됨</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUse(template)}
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    사용하기
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileStack className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery || filterCategory !== "all"
                ? "검색 결과가 없습니다."
                : "아직 저장된 템플릿이 없습니다."}
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              첫 번째 템플릿 만들기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
