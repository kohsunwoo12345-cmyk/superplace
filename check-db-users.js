// 데이터베이스에서 실제 사용자 확인

async function checkUsers() {
  console.log('=== 데이터베이스 사용자 확인 ===\n');
  
  // 디버그 API로 사용자 목록 확인
  const response = await fetch('https://superplacestudy.pages.dev/api/debug-users?table=users&limit=10');
  const data = await response.json();
  
  console.log('응답 상태:', response.status);
  console.log('데이터 구조:', Object.keys(data));
  
  if (data.data && Array.isArray(data.data)) {
    console.log('\n총', data.data.length, '명의 사용자:');
    data.data.forEach((user, index) => {
      console.log(`\n사용자 ${index + 1}:`);
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      console.log('  Name:', user.name);
      console.log('  AcademyId:', user.academyId || user.academy_id);
    });
  } else {
    console.log('사용자 데이터:', JSON.stringify(data, null, 2));
  }
}

checkUsers();
