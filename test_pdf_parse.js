const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');

console.log('📄 PDF 파싱 테스트 시작...');
console.log('pdfjs-dist version:', require('pdfjs-dist/package.json').version);

async function testPDFParse() {
  try {
    // PDF 파일 읽기
    const data = new Uint8Array(fs.readFileSync('./test_upload.pdf'));
    console.log('✅ PDF 파일 읽기 완료:', data.length, 'bytes');
    
    // PDF 로드 (브라우저와 동일한 방식)
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    
    console.log('⏳ PDF 로딩 중...');
    const pdf = await loadingTask.promise;
    console.log('✅ PDF 로드 완료:', pdf.numPages, '페이지');
    
    // 각 페이지 파싱
    let totalText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map(item => item.str || '')
        .filter(str => str.length > 0)
        .join(' ');
      
      totalText += pageText + '\n';
      console.log(`  └─ 페이지 ${i}/${pdf.numPages}: ${pageText.length}자`);
    }
    
    console.log('✅ 전체 파싱 완료:', totalText.length, '자');
    console.log('📝 추출된 텍스트 미리보기:');
    console.log(totalText.substring(0, 200));
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testPDFParse();
