// 환경 변수 체크용 간단한 API 호출

console.log('🔍 환경 변수 확인 중...\n');

fetch('https://superplacestudy.pages.dev/api/homework/debug')
.then(res => res.json())
.then(data => {
  console.log('환경 변수 상태:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error('❌ 오류:', err.message);
});
