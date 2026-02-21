"use client";
// Force refresh: 2026-02-21 10:00:00 - Readonly fix applied

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Plus } from "lucide-react";

// PptxGenJS 타입 선언
declare global {
  interface Window {
    PptxGenJS: any;
  }
}

export default function PPTCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pptTitle, setPptTitle] = useState("나의 프레젠테이션");
  const [content, setContent] = useState("");
  const [pageCount, setPageCount] = useState(5);
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

  // 내용을 페이지 수에 맞게 자동 분할
  const splitContentIntoPages = (text: string, pages: number) => {
    if (!text.trim()) return [];
    
    // 줄바꿈으로 분리
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return [];
    
    // 페이지당 줄 수 계산
    const linesPerPage = Math.ceil(lines.length / pages);
    
    const slides = [];
    for (let i = 0; i < pages; i++) {
      const startIdx = i * linesPerPage;
      const endIdx = Math.min(startIdx + linesPerPage, lines.length);
      const pageLines = lines.slice(startIdx, endIdx);
      
      if (pageLines.length > 0) {
        slides.push({
          title: `${pptTitle} - ${i + 1}`,
          content: pageLines.join('\n')
        });
      }
    }
    
    return slides;
  };

  const createPPT = async () => {
    if (!pptTitle.trim()) {
      alert("PPT 제목을 입력하세요");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력하세요");
      return;
    }

    if (!pptxReady || !window.PptxGenJS) {
      alert("PPT 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Creating PPT:', { pptTitle, pageCount });

      // 내용을 페이지 수에 맞게 분할
      const slides = splitContentIntoPages(content, pageCount);
      
      if (slides.length === 0) {
        throw new Error("생성할 슬라이드가 없습니다");
      }

      console.log('📄 Generated slides:', slides.length);

      // PPT 생성 (CDN에서 로드한 PptxGenJS 사용)
      const pptx = new window.PptxGenJS();
      
      // 메타데이터는 설정하지 않음 (readonly 오류 방지)
      console.log('✅ PPT 객체 생성됨');

      // 첫 슬라이드 (제목 슬라이드)
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: 'FFFFFF' };
      titleSlide.addText(pptTitle, {
        x: 1,
        y: 2.5,
        w: 8,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: '363636',
        align: 'center'
      });
      titleSlide.addText(`총 ${slides.length}개 슬라이드`, {
        x: 1,
        y: 4,
        w: 8,
        h: 0.5,
        fontSize: 20,
        color: '666666',
        align: 'center'
      });

      // 각 내용 슬라이드 생성
      slides.forEach((slideData, index) => {
        const slide = pptx.addSlide();
        
        // 배경색 설정
        slide.background = { color: 'FFFFFF' };
        
        // 제목 추가 (상단)
        slide.addText(slideData.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.8,
          fontSize: 28,
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
            h: 4.5,
            fontSize: 16,
            color: '555555',
            align: 'left',
            valign: 'top',
            bullet: true
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
      alert(`PPT가 생성되었습니다!\n파일명: ${filename}\n슬라이드 수: ${slides.length + 1}개 (제목 포함)`);

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
          <p className="text-gray-600 mt-2">내용을 입력하고 페이지 수를 선택하면 자동으로 PPT가 생성됩니다</p>
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

      {/* 페이지 수 선택 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>페이지 수</CardTitle>
          <CardDescription>생성할 슬라이드 개수를 선택하세요 (제목 제외)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="1"
              max="20"
              value={pageCount}
              onChange={(e) => setPageCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-32"
            />
            <span className="text-gray-600">페이지 (1-20)</span>
          </div>
        </CardContent>
      </Card>

      {/* 내용 입력 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>내용</CardTitle>
          <CardDescription>
            PPT에 들어갈 내용을 입력하세요. 각 줄은 자동으로 불릿 포인트로 표시되며, 
            입력한 내용이 선택한 페이지 수에 맞게 자동으로 분배됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`예시:\nAI 기술의 발전\n자동화된 업무 처리\n효율성 증대\n비용 절감\n고객 만족도 향상\n미래 전망`}
            rows={15}
            className="font-mono"
          />
          <div className="mt-2 text-sm text-gray-500">
            💡 팁: 한 줄에 하나의 포인트를 입력하세요. 총 {content.split('\n').filter(l => l.trim()).length}개 항목
          </div>
        </CardContent>
      </Card>

      {/* 생성 버튼 */}
      <div className="flex gap-4">
        <Button
          onClick={createPPT}
          disabled={loading || !pptxReady}
          className="flex-1"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              PPT 생성 중...
            </>
          ) : !pptxReady ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              라이브러리 로딩 중...
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
              <span className="font-semibold">{pageCount + 1}장 (제목 포함)</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>입력한 항목:</span>
              <span className="font-semibold">{content.split('\n').filter(l => l.trim()).length}개</span>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-gray-500 text-xs">
                💡 팁: 내용이 자동으로 {pageCount}개 페이지에 균등하게 분배됩니다
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
