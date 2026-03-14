// 실제 프로덕션 환경에서 봇 삭제 테스트
const botId = 'bot-1770706486347-6y8dezj8w';
const apiUrl = `https://superplacestudy.pages.dev/api/admin/ai-bots/${botId}`;

console.log('🔍 Testing bot deletion...');
console.log('Bot ID:', botId);
console.log('API URL:', apiUrl);

// 인증 토큰 없이 먼저 시도 (실제 프로덕션 환경 테스트)
fetch(apiUrl, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('📡 Response status:', res.status);
  return res.json();
})
.then(data => {
  console.log('📦 Response data:', JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error('❌ Error:', err.message);
});

// 잠시 후 봇이 여전히 존재하는지 확인
setTimeout(() => {
  fetch(`https://superplacestudy.pages.dev/api/admin/ai-bots`, {
    method: 'GET'
  })
  .then(res => res.json())
  .then(data => {
    const stillExists = data.bots?.find(b => b.id === botId);
    if (stillExists) {
      console.log('❌ BOT STILL EXISTS after deletion!');
      console.log('Bot info:', JSON.stringify(stillExists, null, 2));
    } else {
      console.log('✅ Bot successfully deleted!');
    }
  });
}, 2000);
