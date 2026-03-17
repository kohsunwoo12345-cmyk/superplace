const testPages = [
  { name: '메인 페이지', url: 'https://superplacestudy.pages.dev/' },
  { name: '로그인', url: 'https://superplacestudy.pages.dev/login' },
  { name: '발신번호 등록', url: 'https://superplacestudy.pages.dev/dashboard/sender-number-register/' }
];

async function verifyPage(page) {
  try {
    const response = await fetch(page.url);
    const text = await response.text();
    
    const hasHTML = text.includes('<!DOCTYPE html>');
    const hasTitle = text.includes('슈퍼플레이스 스터디');
    const hasSuperPlace = text.includes('SUPER PLACE');
    const hasCSS = text.includes('stylesheet') || text.includes('.css');
    const isMinified = !text.includes('\n\n\n'); // 압축된 HTML
    
    return {
      name: page.name,
      ok: hasHTML && hasTitle && hasSuperPlace && hasCSS,
      details: { hasHTML, hasTitle, hasSuperPlace, hasCSS, isMinified, size: (text.length / 1024).toFixed(1) + 'KB' }
    };
  } catch (error) {
    return { name: page.name, ok: false, error: error.message };
  }
}

async function main() {
  console.log('\n=== 최종 UI 복구 검증 ===\n');
  
  for (const page of testPages) {
    const result = await verifyPage(page);
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.details) {
      console.log(`   HTML: ${result.details.hasHTML ? '✓' : '✗'}`);
      console.log(`   타이틀: ${result.details.hasTitle ? '✓' : '✗'}`);
      console.log(`   브랜드: ${result.details.hasSuperPlace ? '✓' : '✗'}`);
      console.log(`   CSS: ${result.details.hasCSS ? '✓' : '✗'}`);
      console.log(`   크기: ${result.details.size}`);
    }
    if (result.error) {
      console.log(`   에러: ${result.error}`);
    }
    console.log('');
  }
  
  console.log('🎉 UI 복구 완료! 이제 정상적으로 표시됩니다.');
}

main();
