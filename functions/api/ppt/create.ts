import PptxGenJS from 'pptxgenjs';

interface Slide {
  title: string;
  content: string;
}

interface Env {
  // Cloudflare Pages Functions용
}

/**
 * POST /api/ppt/create
 * PPT 생성 API
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: any = await context.request.json();
    const { title, slides } = body;

    console.log('📊 PPT 생성 요청:', { title, slideCount: slides?.length });

    if (!title || !slides || slides.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request',
          message: '제목과 슬라이드가 필요합니다'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // PPT 생성
    const pptx = new PptxGenJS();
    
    // PPT 기본 설정
    pptx.author = 'Superplace Study';
    pptx.company = 'Superplace';
    pptx.title = title;

    // 각 슬라이드 생성
    slides.forEach((slideData: Slide, index: number) => {
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

    // PPT를 Base64로 변환
    const pptxData = await pptx.write({ outputType: 'base64' });
    
    console.log('✅ PPT Base64 변환 완료');

    // 파일명 생성
    const filename = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}.pptx`;

    // Base64를 ArrayBuffer로 변환
    const binaryString = atob(pptxData as string);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('✅ PPT 파일 생성 완료:', filename);

    // 파일 다운로드 응답 반환
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('❌ PPT 생성 오류:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'PPT 생성 실패',
        stack: error.stack
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
