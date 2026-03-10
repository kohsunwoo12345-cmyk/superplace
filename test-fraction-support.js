/**
 * 분수 연산 테스트
 */

const https = require('https');

const config = {
  workerUrl: 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev',
  timeout: 30000
};

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.workerUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: config.timeout
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testFractions() {
  console.log('\n================================');
  console.log('🔢 분수 연산 테스트');
  console.log('================================\n');

  const tests = [
    { equation: '1/2 + 1/3', expected: '5/6' },
    { equation: '3/4 - 1/2', expected: '1/4' },
    { equation: '2/3 * 3/4', expected: '1/2' },
    { equation: '1/2 / 1/4', expected: '2' },
    { equation: '1/4 + 1/4', expected: '1/2' },
    { equation: '2/5 + 3/5', expected: '1' },
    { equation: '3/8 * 4/9', expected: '1/6' },
    { equation: '5/6 - 1/3', expected: '1/2' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const response = await makeRequest('/solve', 'POST', { equation: test.equation });
      const responseTime = Date.now() - startTime;

      if (response.status === 200 && response.data.success) {
        passed++;
        console.log(`✅ ${test.equation}`);
        console.log(`   답: ${response.data.result}`);
        console.log(`   소수: ${response.data.decimal || 'N/A'}`);
        console.log(`   기대값: ${test.expected}`);
        console.log(`   응답시간: ${responseTime}ms\n`);
      } else {
        failed++;
        console.log(`❌ ${test.equation}`);
        console.log(`   에러: ${response.data.error || 'Unknown'}`);
        console.log(`   응답시간: ${responseTime}ms\n`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.equation}`);
      console.log(`   에러: ${error.message}\n`);
    }
  }

  console.log('================================');
  console.log(`총 테스트: ${tests.length}개`);
  console.log(`성공: ${passed}개 (${((passed / tests.length) * 100).toFixed(1)}%)`);
  console.log(`실패: ${failed}개 (${((failed / tests.length) * 100).toFixed(1)}%)`);
  console.log('================================\n');
}

testFractions().catch(console.error);
