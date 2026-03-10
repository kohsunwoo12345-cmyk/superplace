const https = require('https');

const tests = [
  { name: '단순 덧셈', equation: '3 + 5', expected: '8' },
  { name: '단순 뺄셈', equation: '10 - 7', expected: '3' },
  { name: '단순 곱셈', equation: '4 * 6', expected: '24' },
  { name: '단순 나눗셈', equation: '12 / 3', expected: '4' },
  { name: '복합 연산', equation: '2 * 3 + 5', expected: '11' },
  { name: '괄호 연산', equation: '(10 - 2) * 3', expected: '24' },
  { name: '방정식 x=5', equation: 'x = 5', expected: '5' },
  { name: '방정식 2x=10', equation: '2x = 10', expected: '5' },
  { name: '방정식 x+3=7', equation: 'x+3 = 7', expected: '4' },
  { name: '방정식 2x+3=7', equation: '2x+3 = 7', expected: '2' }
];

async function testMathWorker() {
  console.log('='.repeat(80));
  console.log('🧪 Math Solver Worker 테스트');
  console.log('='.repeat(80));
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🌐 URL: https://physonsuperplacestudy.kohsunwoo12345.workers.dev\n`);
  
  const results = [];
  
  for (const test of tests) {
    process.stdout.write(`${test.name.padEnd(20)} : `);
    
    try {
      const result = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({ equation: test.equation });
        const options = {
          hostname: 'physonsuperplacestudy.kohsunwoo12345.workers.dev',
          port: 443,
          path: '/solve',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        
        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`Parse error: ${body}`));
            }
          });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
      
      if (result.success && result.result === test.expected) {
        console.log(`✅ ${result.result}`);
        results.push({ ...test, pass: true, actual: result.result });
      } else {
        console.log(`❌ 예상: ${test.expected}, 실제: ${result.result || result.error}`);
        results.push({ ...test, pass: false, actual: result.result, error: result.error });
      }
    } catch (error) {
      console.log(`❌ 오류: ${error.message}`);
      results.push({ ...test, pass: false, error: error.message });
    }
  }
  
  const passed = results.filter(r => r.pass).length;
  const failed = results.length - passed;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 테스트 결과');
  console.log('='.repeat(80));
  console.log(`총 테스트: ${results.length}개`);
  console.log(`✅ 성공: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`성공률: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));
  
  if (failed > 0) {
    console.log('\n실패한 테스트:');
    results.filter(r => !r.pass).forEach(r => {
      console.log(`  - ${r.name}: ${r.equation}`);
      console.log(`    예상: ${r.expected}, 실제: ${r.actual || r.error}`);
    });
  }
}

testMathWorker().catch(console.error);
