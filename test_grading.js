// 테스트: 백그라운드 채점 API 호출

const submissionId = process.argv[2];

if (!submissionId) {
  console.error('❌ Usage: node test_grading.js <submissionId>');
  process.exit(1);
}

console.log(`🔍 채점 요청: ${submissionId}`);

fetch('https://superplacestudy.pages.dev/api/homework/process-grading', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ submissionId })
})
.then(res => {
  console.log(`📡 응답 상태: ${res.status}`);
  return res.json();
})
.then(data => {
  console.log('📊 응답 데이터:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error('❌ 오류:', err.message);
});
