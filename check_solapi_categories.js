// Solapi 카테고리 API 호출하여 실제 형식 확인
const apiKey = process.env.SOLAPI_API_KEY || 'your-api-key';
const apiSecret = process.env.SOLAPI_API_SECRET || 'your-secret';

async function generateSignature(secret, timestamp, salt) {
  const crypto = require('crypto');
  const message = timestamp + salt;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  return hmac.digest('hex');
}

async function getCategories() {
  const timestamp = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2);
  const signature = await generateSignature(apiSecret, timestamp, salt);
  
  const response = await fetch('https://api.solapi.com/kakao/v1/plus-friends/categories', {
    headers: {
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`
    }
  });
  
  const data = await response.json();
  console.log('Sample category structure:');
  console.log(JSON.stringify(data[0], null, 2));
  
  // 학원 카테고리 찾기
  const education = data.find(c => c.name === '교육');
  if (education) {
    console.log('\n교육 카테고리:');
    console.log(JSON.stringify(education, null, 2));
  }
}

// API 응답 예시 분석
console.log('Solapi 카테고리 구조 예상:');
console.log({
  code: '002001',
  name: '학원',
  // 또는
  categoryCode: '002001',
  categoryName: '학원'
});
