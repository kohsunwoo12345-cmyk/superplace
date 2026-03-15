const BASE_URL = 'https://superplacestudy.pages.dev';

async function test() {
  console.log('배포 대기 중... (2분)\n');
  await new Promise(resolve => setTimeout(resolve, 120000));
  
  console.log('=== 마이그레이션 실행 ===\n');
  
  try {
    const res = await fetch(`${BASE_URL}/api/admin/fix-point-charge-table`);
    
    console.log('응답 상태:', res.status);
    
    const text = await res.text();
    
    try {
      const data = JSON.parse(text);
      console.log('\n결과:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('\n✅ 마이그레이션 성공!');
        console.log('   - 컬럼:', data.columns?.join(', '));
        console.log('   - 업데이트된 레코드:', data.recordsUpdated || 0);
        
        if (data.sampleData && data.sampleData.length > 0) {
          console.log('\n   샘플 데이터:');
          data.sampleData.forEach(row => {
            console.log(`     - ${row.id}: Academy ${row.academyId}, ${row.requestedPoints}포인트, ${row.status}`);
          });
        }
        
        console.log('\n🎉 포인트 승인 준비 완료!');
        console.log('\n다음 단계:');
        console.log('1. https://superplacestudy.pages.dev 에 로그인하세요');
        console.log('2. 포인트 충전 관리 메뉴로 이동하세요');
        console.log('3. PENDING 상태 요청을 찾아 "승인" 버튼을 클릭하세요');
        console.log('4. 승인 후 학원의 SMS 포인트가 증가했는지 확인하세요');
      } else {
        console.log('\n⚠️  마이그레이션 결과:', data.message);
      }
    } catch (e) {
      console.log('\n응답 (텍스트):', text.substring(0, 500));
    }
    
  } catch (error) {
    console.error('\n❌ 오류:', error.message);
  }
}

test();
