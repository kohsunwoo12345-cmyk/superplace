#!/usr/bin/env node

const https = require('https');

console.log('\n========== 포인트 상태 디버그 테스트 ==========\n');

const BASE_URL = 'https://superplacestudy.pages.dev';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  console.log('⏳ 배포 대기 중 (2분)...\n');
  
  await new Promise(resolve => setTimeout(resolve, 120000));
  
  console.log('🔍 디버그 API 호출 중...\n');
  
  try {
    const res = await httpsGet(`${BASE_URL}/api/debug/point-status`);
    
    console.log(`✅ 응답 상태: ${res.status}\n`);
    
    if (res.status === 200) {
      const data = res.data;
      
      console.log('========== 📊 데이터 요약 ==========\n');
      console.log(`총 학원: ${data.summary.totalAcademies}개`);
      console.log(`총 관리자: ${data.summary.totalAdmins}개`);
      console.log(`총 요청: ${data.summary.totalRequests}개`);
      console.log(`PENDING 요청: ${data.summary.pendingRequests}개`);
      console.log(`총 SMS 포인트: ${data.summary.totalSmsPoints?.toLocaleString() || 0}P\n`);
      
      console.log('========== 🏫 학원 목록 ==========\n');
      data.academies.forEach(a => {
        console.log(`${a.name}:`);
        console.log(`  ID: ${a.id}`);
        console.log(`  포인트: ${a.smsPoints?.toLocaleString() || 0}P`);
        console.log('');
      });
      
      console.log('========== 👤 관리자 목록 ==========\n');
      data.admins.forEach(u => {
        console.log(`${u.email} (${u.role}):`);
        console.log(`  ID: ${u.id}`);
        console.log(`  이름: ${u.name || 'N/A'}`);
        console.log(`  Academy ID: ${u.academyId || '❌ NULL'}`);
        console.log('');
      });
      
      console.log('========== 📝 포인트 충전 요청 ==========\n');
      data.requests.forEach(r => {
        console.log(`요청 ID: ${r.id}`);
        console.log(`  사용자: ${r.userId}`);
        console.log(`  학원: ${r.academyId || '❌ NULL'}`);
        console.log(`  포인트: ${r.requestedPoints?.toLocaleString() || 0}P`);
        console.log(`  상태: ${r.status}`);
        console.log('');
      });
      
      if (data.pendingDetails.length > 0) {
        console.log('========== 🔍 PENDING 요청 상세 분석 ==========\n');
        data.pendingDetails.forEach(p => {
          console.log(`요청 ID: ${p.requestId}`);
          console.log(`  사용자: ${p.userName} (${p.userId})`);
          console.log(`  사용자의 Academy ID: ${p.userAcademyId || '❌ NULL'}`);
          console.log(`  요청의 Academy ID: ${p.requestAcademyId || '❌ NULL'}`);
          console.log(`  학원 이름: ${p.academyName}`);
          console.log(`  학원 현재 포인트: ${p.academyPoints?.toLocaleString() || 0}P`);
          console.log(`  요청 포인트: ${p.requestedPoints?.toLocaleString() || 0}P`);
          console.log(`  Academy ID 일치: ${p.match ? '✅' : '❌'}`);
          console.log(`  User-Request 일치: ${p.userMatch ? '✅' : '❌'}`);
          console.log('');
        });
      }
      
      console.log('========== 🔧 진단 결과 ==========\n');
      console.log(`학원 존재: ${data.diagnostics.hasAcademies ? '✅' : '❌'}`);
      console.log(`관리자 존재: ${data.diagnostics.hasAdmins ? '✅' : '❌'}`);
      console.log(`충전 요청 존재: ${data.diagnostics.hasRequests ? '✅' : '❌'}`);
      console.log(`PENDING 요청 존재: ${data.diagnostics.hasPendingRequests ? '✅' : '❌'}`);
      console.log(`Academy ID 있는 관리자: ${data.diagnostics.adminsWithAcademyId}명`);
      console.log(`Academy ID 없는 관리자: ${data.diagnostics.adminsWithoutAcademyId}명 ${data.diagnostics.adminsWithoutAcademyId > 0 ? '⚠️' : ''}`);
      console.log(`포인트 있는 학원: ${data.diagnostics.academiesWithPoints}개`);
      console.log(`포인트 0원 학원: ${data.diagnostics.academiesWithZeroPoints}개\n`);
      
      console.log('========== 💡 문제 분석 ==========\n');
      
      if (data.diagnostics.adminsWithoutAcademyId > 0) {
        console.log('⚠️  경고: Academy ID가 없는 관리자가 있습니다!');
        console.log('   → 이 관리자들은 SMS 포인트를 조회할 수 없습니다.');
        console.log('   → User 테이블의 academyId를 업데이트해야 합니다.\n');
      }
      
      if (data.diagnostics.academiesWithZeroPoints > 0) {
        console.log('⚠️  경고: 포인트가 0원인 학원이 있습니다!');
        console.log('   → 승인을 해도 0원에서 증가하지 않는 것처럼 보일 수 있습니다.');
        console.log('   → 실제로는 증가했지만 표시가 안 되는 것일 수 있습니다.\n');
      }
      
      if (data.pendingDetails.some(p => !p.match)) {
        console.log('❌ 오류: 요청의 Academy ID와 실제 Academy ID가 일치하지 않습니다!');
        console.log('   → 데이터 무결성 문제입니다.\n');
      }
      
      if (data.pendingDetails.some(p => !p.userMatch)) {
        console.log('❌ 오류: 사용자의 Academy ID와 요청의 Academy ID가 다릅니다!');
        console.log('   → 승인해도 올바른 학원에 포인트가 추가되지 않을 수 있습니다.\n');
      }
      
      console.log('========== ✅ 테스트 완료 ==========\n');
      
    } else {
      console.log('❌ 디버그 API 호출 실패:', res.status);
      console.log('응답:', res.data);
    }
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error.message);
  }
}

test();
