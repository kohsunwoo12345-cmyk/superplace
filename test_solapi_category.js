// Solapi 카테고리 API 테스트
const https = require('https');
const crypto = require('crypto');

async function testCategoryAPI() {
  // HMAC-SHA256 서명 생성
  function generateSignature(secret, timestamp, salt) {
    const message = timestamp + salt;
    return crypto.createHmac('sha256', secret || '')
      .update(message)
      .digest('hex');
  }

  const timestamp = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2);
  const signature = generateSignature('', timestamp, salt);

  const options = {
    hostname: 'api.solapi.com',
    path: '/kakao/v2/channels/categories',
    method: 'GET',
    headers: {
      'Authorization': `HMAC-SHA256 apiKey=DUMMY, date=${timestamp}, salt=${salt}, signature=${signature}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        resolve(data);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

testCategoryAPI().catch(console.error);
