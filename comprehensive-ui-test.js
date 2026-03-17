const testPages = [
  { name: '메인 페이지', url: 'https://superplacestudy.pages.dev/' },
  { name: '로그인', url: 'https://superplacestudy.pages.dev/login' },
  { name: '회원가입', url: 'https://superplacestudy.pages.dev/register' },
  { name: '발신번호 등록', url: 'https://superplacestudy.pages.dev/dashboard/sender-number-register/' },
  { name: '대시보드', url: 'https://superplacestudy.pages.dev/dashboard' },
  { name: '결제 승인 관리', url: 'https://superplacestudy.pages.dev/dashboard/admin/payment-approvals/' },
  { name: '문자 발송', url: 'https://superplacestudy.pages.dev/dashboard/message-send/' }
];

async function testPage(page) {
  try {
    const response = await fetch(page.url);
    const text = await response.text();
    
    const hasTitle = text.includes('슈퍼플레이스 스터디');
    const hasCSS = text.includes('.css') || text.includes('style');
    const hasJS = text.includes('.js') || text.includes('script');
    const size = text.length;
    
    return {
      name: page.name,
      url: page.url,
      status: response.status,
      size: (size / 1024).toFixed(1) + 'KB',
      hasTitle,
      hasCSS,
      hasJS,
      ok: response.ok && hasTitle && hasCSS && hasJS && size > 10000
    };
  } catch (error) {
    return {
      name: page.name,
      url: page.url,
      status: 'ERROR',
      error: error.message,
      ok: false
    };
  }
}

async function runTests() {
  console.log('\n=== 슈퍼플레이스 스터디 UI 종합 테스트 ===\n');
  
  const results = [];
  for (const page of testPages) {
    const result = await testPage(page);
    results.push(result);
    
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   상태: ${result.status}`);
    console.log(`   크기: ${result.size || 'N/A'}`);
    if (result.hasTitle !== undefined) {
      console.log(`   타이틀: ${result.hasTitle ? '있음' : '없음'}`);
      console.log(`   CSS: ${result.hasCSS ? '있음' : '없음'}`);
      console.log(`   JS: ${result.hasJS ? '있음' : '없음'}`);
    }
    if (result.error) {
      console.log(`   에러: ${result.error}`);
    }
    console.log('');
  }
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.ok).length;
  const failedTests = totalTests - passedTests;
  
  console.log('\n=== 테스트 결과 요약 ===');
  console.log(`총 테스트: ${totalTests}`);
  console.log(`✅ 성공: ${passedTests}`);
  console.log(`❌ 실패: ${failedTests}`);
  console.log(`성공률: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n✨ 모든 페이지가 정상적으로 작동합니다! ✨');
  } else {
    console.log('\n⚠️ 일부 페이지에 문제가 있습니다.');
    console.log('실패한 페이지:');
    results.filter(r => !r.ok).forEach(r => {
      console.log(`  - ${r.name}: ${r.error || `상태 ${r.status}`}`);
    });
  }
}

runTests();
