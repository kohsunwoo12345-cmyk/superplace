const BASE_URL = 'https://superplacestudy.pages.dev';

async function checkData() {
  // 마이그레이션 스크립트 다시 실행 (샘플 데이터 포함)
  const res = await fetch(`${BASE_URL}/api/admin/fix-point-charge-table`);
  const data = await res.json();
  
  console.log('샘플 데이터 개수:', data.sampleData?.length || 0);
  
  if (!data.sampleData || data.sampleData.length === 0) {
    console.log('\n⚠️ 포인트 충전 요청이 데이터베이스에 없습니다!');
    console.log('   관리자가 승인할 요청 자체가 없는 상태입니다.');
  } else {
    console.log('\n샘플 데이터:');
    console.log(JSON.stringify(data.sampleData, null, 2));
  }
}

checkData();
