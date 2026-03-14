// 상세한 삭제 테스트
const botId = 'bot-1770706486347-6y8dezj8w';

console.log('=== 1단계: 봇 존재 확인 ===');
fetch('https://superplacestudy.pages.dev/api/admin/ai-bots')
  .then(res => res.json())
  .then(data => {
    const bot = data.bots?.find(b => b.id === botId);
    if (bot) {
      console.log('✅ Bot exists:', bot.name);
      console.log('   ID:', bot.id);
      console.log('   Created:', bot.createdAt);
    } else {
      console.log('❌ Bot not found');
    }
    
    console.log('\n=== 2단계: 인증 없이 삭제 시도 ===');
    return fetch(`https://superplacestudy.pages.dev/api/admin/ai-bots/${botId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
  })
  .then(res => {
    console.log('Status:', res.status);
    console.log('OK:', res.ok);
    return res.json();
  })
  .then(data => {
    console.log('Response:', JSON.stringify(data, null, 2));
    
    console.log('\n=== 3단계: 삭제 후 봇 존재 확인 ===');
    return fetch('https://superplacestudy.pages.dev/api/admin/ai-bots');
  })
  .then(res => res.json())
  .then(data => {
    const bot = data.bots?.find(b => b.id === botId);
    if (bot) {
      console.log('❌ BOT STILL EXISTS!');
      console.log('   Name:', bot.name);
    } else {
      console.log('✅ Bot successfully deleted');
    }
  })
  .catch(err => console.error('Error:', err));
