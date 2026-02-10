// 배포 완료 대기 및 환경 변수 확인

console.log('🚀 Cloudflare Pages 배포 대기 중...\n');
console.log('예상 시간: 5-7분');
console.log('Commit: fbe9dd0 - "trigger redeploy for GOOGLE_GEMINI_API_KEY"\n');

let attempts = 0;
const maxAttempts = 14; // 7분 (30초 간격)

async function checkDeployment() {
  attempts++;
  console.log(`\n[${attempts}/${maxAttempts}] 환경 변수 확인 중... (${new Date().toLocaleTimeString()})`);
  
  try {
    const res = await fetch('https://superplacestudy.pages.dev/api/homework/debug');
    const data = await res.json();
    
    if (data.environment.hasGeminiApiKey) {
      console.log('\n' + '='.repeat(80));
      console.log('✅ 배포 완료! Gemini API Key가 인식되었습니다!\n');
      console.log('환경 변수 상태:');
      console.log(`  - hasGeminiApiKey: ${data.environment.hasGeminiApiKey}`);
      console.log(`  - geminiKeyLength: ${data.environment.geminiKeyLength}`);
      console.log(`  - geminiKeyPrefix: ${data.environment.geminiKeyPrefix}`);
      console.log('\n' + '='.repeat(80));
      console.log('\n🎯 이제 AI 채점 테스트를 시작할 수 있습니다:');
      console.log('node test_grading.js homework-1770721533929-jvhu9b8rh\n');
      return true;
    } else {
      console.log(`   ⏳ 아직 대기 중... (hasGeminiApiKey: false)`);
      
      if (attempts >= maxAttempts) {
        console.log('\n❌ 최대 대기 시간 초과. 수동으로 확인해주세요.');
        console.log('Cloudflare Pages Dashboard: https://dash.cloudflare.com\n');
        return true;
      }
      
      console.log(`   다음 확인: 30초 후`);
      setTimeout(checkDeployment, 30000);
    }
  } catch (err) {
    console.error(`   ❌ 오류: ${err.message}`);
    
    if (attempts >= maxAttempts) {
      console.log('\n최대 재시도 횟수 초과.');
      return true;
    }
    
    setTimeout(checkDeployment, 30000);
  }
}

checkDeployment();
