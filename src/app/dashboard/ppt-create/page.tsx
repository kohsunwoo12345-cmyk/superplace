"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Download, Plus, X } from "lucide-react";

// PptxGenJS 타입 선언
declare global {
  interface Window {
    PptxGenJS: any;
  }
}

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
  const [pptxReady, setPptxReady] = useState(false);

  // CDN에서 PptxGenJS 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.PptxGenJS) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
      script.onload = () => {
        console.log('✅ PptxGenJS loaded from CDN');
        setPptxReady(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load PptxGenJS from CDN');
      };
      document.head.appendChild(script);
    } else if (window.PptxGenJS) {
      setPptxReady(true);
    }
  }, []);

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

    if (!pptxReady || !window.PptxGenJS) {
      alert("PPT 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Creating PPT:', { pptTitle, slideCount: slides.length });

      // PPT 생성 (CDN에서 로드한 PptxGenJS 사용)
      const pptx = new window.PptxGenJS();
      
      // PPT 기본 설정
      pptx.author = 'Superplace Study';
      pptx.company = 'Superplace';
      pptx.title = pptTitle;

      // 각 슬라이드 생성
      slides.forEach((slideData, index) => {
        const slide = pptx.addSlide();
        
        // 배경색 설정
        slide.background = { color: 'FFFFFF' };
        
        // 제목 추가 (상단)
        slide.addText(slideData.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 1,
          fontSize: 32,
          bold: true,
          color: '363636',
          align: 'center'
        });
        
        // 내용 추가 (중앙)
        if (slideData.content && slideData.content.trim()) {
          const contentLines = slideData.content.split('\n').filter(line => line.trim());
          
          slide.addText(contentLines, {
            x: 1,
            y: 2,
            w: 8,
            h: 4,
            fontSize: 18,
            color: '555555',
            align: 'left',
            valign: 'top',
            bullet: contentLines.length > 1 ? true : false
          });
        }
        
        // 슬라이드 번호 (우측 하단)
        slide.addText(`${index + 1} / ${slides.length}`, {
          x: 8.5,
          y: 7,
          w: 1,
          h: 0.3,
          fontSize: 12,
          color: '999999',
          align: 'right'
        });
      });

      console.log('✅ PPT 객체 생성 완료');

      // 파일명 생성
      const filename = `${pptTitle.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}.pptx`;

      // PPT 다운로드
      await pptx.writeFile({ fileName: filename });
      
      console.log('✅ PPT 파일 다운로드 완료:', filename);
      alert(`PPT가 생성되었습니다!\n파일명: ${filename}`);

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
