const BASE_URL = 'https://superplacestudy.pages.dev';

async function checkSMS() {
  // 로그인
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  
  const { token } = await loginRes.json();
  
  // SMS 발신번호 API 테스트
  console.log('📞 SMS 발신번호 API 테스트\n');
  
  try {
    const res = await fetch(`${BASE_URL}/api/admin/sms/senders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('상태 코드:', res.status);
    const text = await res.text();
    console.log('\n응답 내용:');
    console.log(text.substring(0, 500));
    
    try {
      const data = JSON.parse(text);
      console.log('\n파싱된 JSON:');
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('\nJSON 파싱 실패');
    }
  } catch (error) {
    console.error('오류:', error.message);
  }
  
  // 학원 정보 API 테스트
  console.log('\n\n🏫 학원 정보 API 테스트\n');
  
  try {
    const res = await fetch(`${BASE_URL}/api/admin/academies?id=academy-1771479246368-5viyubmqk`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('상태 코드:', res.status);
    const data = await res.json();
    
    console.log('\n학원 정보:');
    console.log('- name:', data.name);
    console.log('- id:', data.id);
    console.log('- smsPoints:', data.smsPoints);
    console.log('- senderNumber:', data.senderNumber);
    console.log('- subscriptionPlan:', data.subscriptionPlan);
    
    console.log('\n전체 응답:');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000));
  } catch (error) {
    console.error('오류:', error.message);
  }
}

checkSMS().catch(console.error);
