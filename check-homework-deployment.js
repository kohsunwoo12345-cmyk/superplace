const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function checkDeployment() {
  console.log('⏳ 배포 대기 중 (2분)...\n');
  await new Promise(resolve => setTimeout(resolve, 120000));
  
  console.log('🔍 숙제 데이터 확인 시작\n');
  
  const response = await httpsGet('https://superplacestudy.pages.dev/api/debug/homework-data');
  
  console.log('응답 상태:', response.status);
  console.log('');
  
  if (response.status === 200 && response.data.success) {
    const data = response.data.data;
    
    console.log('📊 테이블 상태:\n');
    
    // homework_submissions_v2
    if (data.tables.homework_submissions_v2?.exists) {
      const table = data.tables.homework_submissions_v2;
      console.log('✅ homework_submissions_v2');
      console.log(`   총 ${table.totalCount}건의 제출`);
      console.log(`   최근 레코드: ${table.recentRecords.length}개`);
      if (table.recentRecords.length > 0) {
        console.log('   최근 제출:');
        table.recentRecords.forEach((r, i) => {
          console.log(`      ${i+1}. ID: ${r.id}, 제출: ${r.submittedAt}, 상태: ${r.status}`);
        });
      }
    } else {
      console.log('❌ homework_submissions_v2 테이블 없음');
      console.log('   오류:', data.tables.homework_submissions_v2?.error);
    }
    console.log('');
    
    // homework_gradings_v2
    if (data.tables.homework_gradings_v2?.exists) {
      const table = data.tables.homework_gradings_v2;
      console.log('✅ homework_gradings_v2');
      console.log(`   총 ${table.totalCount}건의 채점`);
      console.log(`   최근 레코드: ${table.recentRecords.length}개`);
    } else {
      console.log('❌ homework_gradings_v2 테이블 없음');
      console.log('   오류:', data.tables.homework_gradings_v2?.error);
    }
    console.log('');
    
    // 오늘 제출
    if (data.todaySubmissions) {
      console.log('📅 오늘 제출된 숙제');
      console.log(`   날짜: ${data.todaySubmissions.date}`);
      console.log(`   건수: ${data.todaySubmissions.count}건`);
    }
    console.log('');
    
    // 진단
    console.log('🔍 진단:\n');
    const submissionsCount = data.tables.homework_submissions_v2?.totalCount || 0;
    const gradingsCount = data.tables.homework_gradings_v2?.totalCount || 0;
    const todayCount = data.todaySubmissions?.count || 0;
    
    if (submissionsCount === 0) {
      console.log('⚠️ 숙제 제출 데이터가 없습니다.');
      console.log('   → 학생이 숙제를 제출해야 합니다.');
    } else {
      console.log(`✅ ${submissionsCount}건의 숙제 제출이 있습니다.`);
      
      if (gradingsCount === 0) {
        console.log('⚠️ 채점 데이터가 없습니다.');
        console.log('   → AI 채점을 실행해야 합니다.');
      } else {
        console.log(`✅ ${gradingsCount}건의 채점이 완료되었습니다.`);
      }
      
      if (todayCount === 0) {
        console.log('ℹ️ 오늘 제출된 숙제가 없습니다.');
        console.log('   → 날짜 범위를 확장해서 조회해보세요.');
      } else {
        console.log(`✅ 오늘 ${todayCount}건의 숙제가 제출되었습니다.`);
      }
    }
    
  } else {
    console.log('❌ API 호출 실패');
    console.log('응답:', JSON.stringify(response.data, null, 2));
  }
}

checkDeployment().catch(console.error);
