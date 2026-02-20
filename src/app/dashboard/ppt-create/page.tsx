"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Download, Plus, X } from "lucide-react";

interface Slide {
  id: number;
  title: string;
  content: string;
}

export default function PPTCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pptTitle, setPptTitle] = useState("나의 프레젠테이션");
  const [slides, setSlides] = useState<Slide[]>([
    { id: 1, title: "제목 슬라이드", content: "여기에 제목을 입력하세요" },
    { id: 2, title: "내용 슬라이드 1", content: "여기에 내용을 입력하세요" }
  ]);
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  const addSlide = () => {
    const newId = Math.max(...slides.map(s => s.id), 0) + 1;
    setSlides([...slides, { 
      id: newId, 
      title: `슬라이드 ${newId}`, 
      content: "" 
    }]);
  };

  const removeSlide = (id: number) => {
    if (slides.length <= 1) {
      alert("최소 1개의 슬라이드가 필요합니다");
      return;
    }
    setSlides(slides.filter(s => s.id !== id));
  };

  const updateSlide = (id: number, field: 'title' | 'content', value: string) => {
    setSlides(slides.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const createPPT = async () => {
    if (!pptTitle.trim()) {
      alert("PPT 제목을 입력하세요");
      return;
    }

    if (slides.some(s => !s.title.trim())) {
      alert("모든 슬라이드에 제목을 입력하세요");
      return;
    }

    setLoading(true);
    setDownloadUrl("");

    try {
      console.log('📤 Creating PPT:', { pptTitle, slideCount: slides.length });

      const response = await fetch("/api/ppt/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: pptTitle,
          slides: slides.map(s => ({
            title: s.title,
            content: s.content
          }))
        })
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('❌ Error response:', error);
        throw new Error(error.message || error.error || "PPT 생성 실패");
      }

      const result = await response.json();
      console.log('✅ PPT created successfully:', result);

      if (result.downloadUrl) {
        setDownloadUrl(result.downloadUrl);
        alert(`PPT가 생성되었습니다!\n파일명: ${result.filename}`);
      } else {
        alert("PPT가 생성되었습니다!");
      }

    } catch (error: any) {
      console.error("❌ Failed to create PPT:", error);
      alert(`PPT 생성 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">📊 PPT 제작</h1>
          <p className="text-gray-600 mt-2">간단하게 내용을 입력하고 PPT를 만드세요</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>

      {/* PPT 제목 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>PPT 제목</CardTitle>
          <CardDescription>프레젠테이션의 전체 제목을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={pptTitle}
            onChange={(e) => setPptTitle(e.target.value)}
            placeholder="예: 2024년 1분기 실적 보고"
            className="text-lg"
          />
        </CardContent>
      </Card>

      {/* 슬라이드 목록 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>슬라이드 ({slides.length}페이지)</CardTitle>
              <CardDescription>각 슬라이드의 제목과 내용을 입력하세요</CardDescription>
            </div>
            <Button onClick={addSlide} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              슬라이드 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {slides.map((slide, index) => (
            <div key={slide.id} className="border rounded-lg p-4 relative">
              {/* 슬라이드 번호 & 삭제 버튼 */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-500">
                  슬라이드 {index + 1}
                </span>
                {slides.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSlide(slide.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* 제목 */}
              <div className="mb-4">
                <Label htmlFor={`title-${slide.id}`}>제목</Label>
                <Input
                  id={`title-${slide.id}`}
                  value={slide.title}
                  onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                  placeholder="슬라이드 제목"
                />
              </div>

              {/* 내용 */}
              <div>
                <Label htmlFor={`content-${slide.id}`}>내용</Label>
                <Textarea
                  id={`content-${slide.id}`}
                  value={slide.content}
                  onChange={(e) => updateSlide(slide.id, 'content', e.target.value)}
                  placeholder="슬라이드 내용을 입력하세요 (엔터로 줄 구분)"
                  rows={4}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 생성 버튼 */}
      <div className="flex gap-4">
        <Button
          onClick={createPPT}
          disabled={loading}
          className="flex-1"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              PPT 생성 중...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              PPT 생성하기
            </>
          )}
        </Button>

        {downloadUrl && (
          <Button
            onClick={() => window.open(downloadUrl, '_blank')}
            variant="outline"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            다운로드
          </Button>
        )}
      </div>

      {/* 미리보기 */}
      {slides.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>제목:</span>
                <span className="font-semibold">{pptTitle || "(제목 없음)"}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>슬라이드 수:</span>
                <span className="font-semibold">{slides.length}장</span>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-500 text-xs">
                  💡 팁: 내용에 여러 줄을 입력하면 PPT에서 줄바꿈으로 표시됩니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
