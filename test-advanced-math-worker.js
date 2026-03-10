/**
 * Advanced Math Worker 통합 테스트
 * 지원 개념: 중1 ~ 고2
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

async function testMathWorker() {
  console.log('\n================================');
  console.log('🧮 Advanced Math Worker 테스트');
  console.log('================================\n');

  // 테스트 케이스 (중1 ~ 고2 개념)
  const tests = [
    // === 중1 수학 ===
    { category: '중1 - 사칙연산', equation: '15 + 27', grade: '중1' },
    { category: '중1 - 사칙연산', equation: '100 - 37', grade: '중1' },
    { category: '중1 - 사칙연산', equation: '12 * 8', grade: '중1' },
    { category: '중1 - 사칙연산', equation: '144 / 12', grade: '중1' },
    { category: '중1 - 혼합계산', equation: '2 * 3 + 5', grade: '중1' },
    { category: '중1 - 괄호', equation: '(10 + 5) * 2', grade: '중1' },
    
    // === 중2 수학 ===
    { category: '중2 - 지수', equation: '2^3', grade: '중2' },
    { category: '중2 - 지수', equation: '5^2', grade: '중2' },
    { category: '중2 - 제곱근', equation: 'sqrt(16)', grade: '중2' },
    { category: '중2 - 제곱근', equation: 'sqrt(25)', grade: '중2' },
    { category: '중2 - 일차방정식', equation: 'x = 10', grade: '중2' },
    { category: '중2 - 일차방정식', equation: '2x = 20', grade: '중2' },
    { category: '중2 - 일차방정식', equation: 'x + 5 = 12', grade: '중2' },
    { category: '중2 - 일차방정식', equation: '3x - 7 = 14', grade: '중2' },
    
    // === 중3 수학 ===
    { category: '중3 - 이차방정식', equation: 'x^2 - 5x + 6 = 0', grade: '중3' },
    { category: '중3 - 이차방정식', equation: 'x^2 - 4x + 4 = 0', grade: '중3' },
    { category: '중3 - 이차방정식', equation: 'x^2 + 2x + 5 = 0', grade: '중3' },
    { category: '중3 - 이차방정식', equation: '2x^2 - 8x + 6 = 0', grade: '중3' },
    
    // === 고1 수학 ===
    { category: '고1 - 삼각함수', equation: 'sin(x) = 0.5', grade: '고1' },
    { category: '고1 - 삼각함수', equation: 'cos(x) = 0.707', grade: '고1' },
    { category: '고1 - 삼각함수', equation: 'tan(x) = 1', grade: '고1' },
    { category: '고1 - 로그', equation: 'log(100)', grade: '고1' },
    { category: '고1 - 로그', equation: 'log(1000)', grade: '고1' },
    { category: '고1 - 자연로그', equation: 'ln(2.718)', grade: '고1' },
    
    // === 고2 수학 ===
    { category: '고2 - 복합함수', equation: 'sin(π/6)', grade: '고2' },
    { category: '고2 - 지수와 로그', equation: '2^10', grade: '고2' },
    { category: '고2 - 제곱근 응용', equation: 'sqrt(144)', grade: '고2' }
  ];

  const results = {
    total: tests.length,
    passed: 0,
    failed: 0,
    byGrade: {}
  };

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const response = await makeRequest('/solve', 'POST', { equation: test.equation });
      const responseTime = Date.now() - startTime;

      if (response.status === 200 && response.data.success) {
        results.passed++;
        
        // 학년별 통계
        if (!results.byGrade[test.grade]) {
          results.byGrade[test.grade] = { passed: 0, failed: 0, total: 0 };
        }
        results.byGrade[test.grade].passed++;
        results.byGrade[test.grade].total++;

        console.log(`✅ [${test.category}]`);
        console.log(`   문제: ${test.equation}`);
        console.log(`   답: ${response.data.result}`);
        console.log(`   방법: ${response.data.method}`);
        console.log(`   응답시간: ${responseTime}ms\n`);
      } else {
        results.failed++;
        
        if (!results.byGrade[test.grade]) {
          results.byGrade[test.grade] = { passed: 0, failed: 0, total: 0 };
        }
        results.byGrade[test.grade].failed++;
        results.byGrade[test.grade].total++;

        console.log(`❌ [${test.category}]`);
        console.log(`   문제: ${test.equation}`);
        console.log(`   에러: ${response.data.error || 'Unknown error'}`);
        console.log(`   응답시간: ${responseTime}ms\n`);
      }
    } catch (error) {
      results.failed++;
      console.log(`❌ [${test.category}]`);
      console.log(`   문제: ${test.equation}`);
      console.log(`   에러: ${error.message}\n`);
    }
  }

  console.log('\n================================');
  console.log('📊 테스트 결과 요약');
  console.log('================================\n');
  
  console.log(`총 테스트: ${results.total}개`);
  console.log(`성공: ${results.passed}개 (${((results.passed / results.total) * 100).toFixed(1)}%)`);
  console.log(`실패: ${results.failed}개 (${((results.failed / results.total) * 100).toFixed(1)}%)`);
  
  console.log('\n학년별 성공률:');
  for (const [grade, stats] of Object.entries(results.byGrade)) {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`  ${grade}: ${stats.passed}/${stats.total} (${rate}%)`);
  }

  console.log('\n================================');
  console.log('🎓 지원 개념 범위');
  console.log('================================\n');
  
  const coverage = {
    '중1': ['사칙연산', '혼합계산', '괄호 연산'],
    '중2': ['지수', '제곱근', '일차방정식'],
    '중3': ['이차방정식', '인수분해', '근의 공식'],
    '고1': ['삼각함수 (sin, cos, tan)', '로그 (상용, 자연)', '삼각방정식'],
    '고2': ['복합 삼각함수', '지수와 로그 응용', '고급 방정식']
  };
  
  for (const [grade, concepts] of Object.entries(coverage)) {
    console.log(`${grade}:`);
    concepts.forEach(c => console.log(`  • ${c}`));
    console.log('');
  }

  console.log('================================');
  console.log('✅ 테스트 완료!');
  console.log('================================\n');

  return results;
}

// 테스트 실행
testMathWorker().catch(console.error);
