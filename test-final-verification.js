const BASE_URL = 'https://superplacestudy.pages.dev';

async function testAll() {
  console.log('🔍 최종 검증 테스트 시작\n');
  console.log('=' .repeat(60));
  
  // 로그인
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✅ 관리자 로그인 완료:', loginData.user.role);
  console.log('=' .repeat(60));
  
  // 테스트 1: 구독 및 사용량 확인
  console.log('\n📊 테스트 1: 구독 정보 및 사용량');
  console.log('-' .repeat(60));
  
  const subRes = await fetch(`${BASE_URL}/api/subscription/check?academyId=academy-1771479246368-5viyubmqk`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('API 상태:', subRes.status);
  const subData = await subRes.json();
  
  if (subData.hasSubscription) {
    console.log('✅ 구독 존재:', subData.subscription.planName);
    console.log('   상태:', subData.subscription.status);
    console.log('   만료일:', new Date(subData.subscription.endDate).toLocaleDateString('ko-KR'));
    
    if (subData.subscription.usage) {
      console.log('\n   📈 사용량:');
      console.log('   - 학생 수:', subData.subscription.usage.students || '❌ 없음');
      console.log('   - 숙제 검사:', subData.subscription.usage.homeworkChecks || 0);
      console.log('   - AI 분석:', subData.subscription.usage.aiAnalysis || 0);
      console.log('   - 유사문제:', subData.subscription.usage.similarProblems || 0);
      console.log('   - 랜딩페이지:', subData.subscription.usage.landingPages || '❌ 없음');
      
      if (subData.subscription.usage.students && subData.subscription.usage.landingPages !== undefined) {
        console.log('\n   ✅ 사용량 카운트 정상 작동');
      } else {
        console.log('\n   ❌ 사용량 일부 누락');
      }
    } else {
      console.log('   ❌ 사용량 데이터 없음');
    }
  } else {
    console.log('❌ 구독 없음:', subData.message);
  }
  
  // 테스트 2: SMS 발신번호
  console.log('\n\n📞 테스트 2: SMS 발신번호');
  console.log('-' .repeat(60));
  
  const smsRes = await fetch(`${BASE_URL}/api/admin/sms/senders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('API 상태:', smsRes.status);
  
  if (smsRes.status === 200) {
    const smsData = await smsRes.json();
    console.log('✅ API 정상 작동');
    console.log('   승인된 발신번호 개수:', smsData.senders?.length || 0);
    
    if (smsData.senders && smsData.senders.length > 0) {
      console.log('\n   발신번호 목록:');
      smsData.senders.slice(0, 3).forEach(s => {
        console.log(`   - ${s.phone_number || s.phoneNumber} (${s.description || '설명 없음'})`);
      });
    } else {
      console.log('   ℹ️  등록된 발신번호 없음 (정상 상태)');
    }
  } else {
    const errorData = await smsRes.json();
    console.log('❌ API 오류:', errorData.error);
  }
  
  // 테스트 3: 학원 정보 및 포인트
  console.log('\n\n💰 테스트 3: 학원 정보 및 SMS 포인트');
  console.log('-' .repeat(60));
  
  const acadRes = await fetch(`${BASE_URL}/api/admin/academies?id=academy-1771479246368-5viyubmqk`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('API 상태:', acadRes.status);
  
  if (acadRes.status === 200) {
    const acadData = await acadRes.json();
    console.log('✅ 학원 정보 조회 성공');
    console.log('   학원명:', acadData.name);
    console.log('   SMS 포인트:', typeof acadData.smsPoints === 'number' ? `${acadData.smsPoints.toLocaleString()}원` : '❌ 없음');
    console.log('   등록된 발신번호:', acadData.senderNumber || '미등록');
    console.log('   발신번호 목록:', acadData.registeredSenderNumbers || '없음');
    
    if (typeof acadData.smsPoints === 'number') {
      console.log('\n   ✅ 포인트 시스템 정상');
    } else {
      console.log('\n   ❌ 포인트 필드 없음');
    }
  } else {
    console.log('❌ 학원 정보 조회 실패');
  }
  
  // 테스트 4: 포인트 충전 요청 목록
  console.log('\n\n💳 테스트 4: 포인트 충전 시스템');
  console.log('-' .repeat(60));
  
  const pointsRes = await fetch(`${BASE_URL}/api/admin/point-charge-requests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('API 상태:', pointsRes.status);
  
  if (pointsRes.status === 200) {
    const pointsData = await pointsRes.json();
    console.log('✅ 포인트 요청 시스템 정상');
    console.log('   총 요청:', pointsData.requests?.length || 0);
    console.log('   승인 대기:', pointsData.stats?.pending || 0);
    console.log('   승인 완료:', pointsData.stats?.approved || 0);
    console.log('   총 수익:', pointsData.stats?.totalRevenue?.toLocaleString() || 0);
    
    if (pointsData.requests && pointsData.requests.length > 0) {
      const recent = pointsData.requests[0];
      console.log('\n   최근 요청:');
      console.log('   - 상태:', recent.status);
      console.log('   - 포인트:', recent.requestedPoints?.toLocaleString() || recent.amount?.toLocaleString() || '알 수 없음');
      console.log('   - 요청일:', new Date(recent.createdAt).toLocaleString('ko-KR'));
    }
  } else {
    console.log('❌ 포인트 시스템 오류');
  }
  
  // 최종 요약
  console.log('\n\n' + '=' .repeat(60));
  console.log('📋 최종 검증 결과');
  console.log('=' .repeat(60));
  
  const results = {
    '구독 및 사용량': subData.hasSubscription && subData.subscription?.usage ? '✅ 정상' : '❌ 오류',
    'SMS 발신번호 API': smsRes.status === 200 ? '✅ 정상' : '❌ 오류',
    '학원 포인트 시스템': acadRes.status === 200 && typeof (await acadRes.json()).smsPoints !== 'undefined' ? '✅ 정상' : '❌ 오류',
    '포인트 충전 시스템': pointsRes.status === 200 ? '✅ 정상' : '❌ 오류'
  };
  
  // 다시 학원 정보 가져오기 (위에서 이미 읽었으므로)
  const acadRes2 = await fetch(`${BASE_URL}/api/admin/academies?id=academy-1771479246368-5viyubmqk`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const acadData2 = await acadRes2.json();
  
  console.log('1. 구독 및 사용량:', subData.hasSubscription && subData.subscription?.usage ? '✅ 정상' : '❌ 오류');
  console.log('2. SMS 발신번호 API:', smsRes.status === 200 ? '✅ 정상' : '❌ 오류');
  console.log('3. 학원 포인트 시스템:', typeof acadData2.smsPoints === 'number' ? '✅ 정상' : '❌ 오류');
  console.log('4. 포인트 충전 시스템:', pointsRes.status === 200 ? '✅ 정상' : '❌ 오류');
  
  console.log('\n' + '=' .repeat(60));
  
  // 모든 테스트 통과 여부
  const allPassed = 
    subData.hasSubscription && subData.subscription?.usage &&
    smsRes.status === 200 &&
    typeof acadData2.smsPoints === 'number' &&
    pointsRes.status === 200;
  
  if (allPassed) {
    console.log('🎉 모든 시스템 정상 작동 중!');
  } else {
    console.log('⚠️  일부 시스템에 문제가 있습니다.');
  }
  console.log('=' .repeat(60));
}

testAll().catch(err => {
  console.error('\n❌ 테스트 실행 오류:', err.message);
  console.error(err.stack);
});
