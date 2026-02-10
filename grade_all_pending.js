const https = require('https');

async function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data))
          });
        } catch (e) {
          resolve({
            ok: false,
            status: res.statusCode,
            json: () => Promise.reject(e)
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function main() {
  console.log('🔍 대기 중인 숙제 채점 시작...\n');
  
  // 1. 모든 제출 조회
  const res = await fetch('https://superplacestudy.pages.dev/api/homework/results?role=ADMIN&email=admin@superplace.co.kr');
  const data = await res.json();
  
  if (!data.success) {
    console.error('❌ 데이터 조회 실패:', data.error);
    return;
  }
  
  const submissions = data.submissions || [];
  const pending = submissions.filter(s => s.completion === 'pending' || s.score === 0);
  
  console.log(`📊 총 제출: ${submissions.length}개`);
  console.log(`⏳ 채점 대기: ${pending.length}개\n`);
  
  if (pending.length === 0) {
    console.log('✅ 모든 숙제가 채점되었습니다!');
    return;
  }
  
  // 2. 각 대기 중인 제출 채점
  for (const sub of pending) {
    console.log(`🚀 채점 시작: ${sub.id} (${sub.userName})`);
    
    try {
      const gradingRes = await fetch('https://superplacestudy.pages.dev/api/homework/process-grading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: sub.id })
      });
      
      const gradingData = await gradingRes.json();
      
      if (gradingData.success) {
        console.log(`✅ 채점 완료: ${gradingData.grading.score}점 (${gradingData.grading.subject})`);
      } else {
        console.log(`❌ 채점 실패: ${gradingData.error || gradingData.message}`);
      }
    } catch (err) {
      console.error(`❌ 오류: ${err.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎉 모든 대기 중인 숙제 채점 완료!');
}

main().catch(console.error);
