// Cloudflare Pages Function to parse PDF
export const onRequestPost: PagesFunction<{ D1DB: D1Database }> = async (context) => {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`📄 PDF 파싱 시작: ${file.name}, ${file.size} bytes`);
    
    // PDF를 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // PDF.js를 동적으로 import (Worker 없이)
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // PDF 로드 (Worker 완전 비활성화)
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableWorker: true
    });
    
    const pdf = await loadingTask.promise;
    console.log(`✅ PDF 로드 완료: ${pdf.numPages} 페이지`);
    
    // 각 페이지 텍스트 추출
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .filter((str: string) => str.length > 0)
          .join(' ');
        
        fullText += `\n\n=== 페이지 ${i} ===\n${pageText}`;
        console.log(`  └─ 페이지 ${i}/${pdf.numPages} 완료 (${pageText.length}자)`);
      } catch (pageError) {
        console.warn(`  ⚠️ 페이지 ${i} 파싱 실패:`, pageError);
      }
    }
    
    console.log(`✅ 전체 파싱 완료: ${fullText.length}자`);
    
    return new Response(JSON.stringify({
      success: true,
      text: fullText.trim(),
      pages: pdf.numPages,
      size: fullText.trim().length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ PDF 파싱 오류:', error);
    return new Response(JSON.stringify({ 
      error: 'PDF parsing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
