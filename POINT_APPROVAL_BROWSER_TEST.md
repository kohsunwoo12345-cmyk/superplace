# 포인트 승인 즉시 반영 테스트 가이드

## 🔥 빠른 테스트 (브라우저 콘솔)

### 1단계: 관리자 로그인
https://superplacestudy.pages.dev 에 관리자 계정으로 로그인

### 2단계: 브라우저 콘솔 열기
F12 키 → Console 탭

### 3단계: 아래 코드 복사 & 실행

```javascript
// ========== 포인트 승인 실시간 테스트 ==========

async function testPointApproval() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log('❌ 로그인이 필요합니다!');
    return;
  }

  console.log('🚀 포인트 승인 테스트 시작...\n');

  try {
    // Step 1: 요청 목록 조회
    console.log('📋 Step 1: 포인트 충전 요청 목록 조회...');
    const requestsRes = await fetch('/api/admin/point-charge-requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!requestsRes.ok) {
      console.log('❌ 요청 목록 조회 실패:', requestsRes.status);
      return;
    }
    
    const requestsData = await requestsRes.json();
    const requests = requestsData.requests || [];
    const pending = requests.filter(r => r.status === 'PENDING');
    
    console.log(`✅ 총 요청: ${requests.length}개, PENDING: ${pending.length}개\n`);
    
    if (pending.length === 0) {
      console.log('⚠️ 승인할 PENDING 요청이 없습니다.');
      console.log('원장이 먼저 포인트 충전을 신청해야 합니다.\n');
      return;
    }
    
    const target = pending[0];
    console.log('🎯 승인할 요청:');
    console.log(`   ID: ${target.id}`);
    console.log(`   사용자: ${target.userName}`);
    console.log(`   학원: ${target.academyName}`);
    console.log(`   요청 포인트: ${(target.requestedPoints || target.amount)?.toLocaleString()}P\n`);

    // Step 2: 승인 전 포인트 확인
    console.log('📋 Step 2: 승인 전 포인트 확인...');
    const beforeRes = await fetch('/api/admin/sms/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const beforeData = await beforeRes.json();
    const beforeBalance = beforeData?.stats?.balance || 0;
    console.log(`💰 승인 전: ${beforeBalance.toLocaleString()}P\n`);

    // Step 3: 승인 실행
    console.log('📋 Step 3: 포인트 승인 실행...');
    const approveRes = await fetch('/api/admin/point-charge-requests/approve', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requestId: target.id })
    });
    
    if (!approveRes.ok) {
      console.log('❌ 승인 실패!', approveRes.status);
      const errorData = await approveRes.json();
      console.log('에러:', errorData);
      return;
    }
    
    const approveData = await approveRes.json();
    console.log('✅ 승인 성공!');
    console.log('응답:', approveData, '\n');

    // Step 4: 승인 후 포인트 확인 (2초 대기)
    console.log('📋 Step 4: 승인 후 포인트 확인 (2초 대기)...');
    await new Promise(r => setTimeout(r, 2000));
    
    const afterRes = await fetch('/api/admin/sms/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const afterData = await afterRes.json();
    const afterBalance = afterData?.stats?.balance || 0;
    console.log(`💰 승인 후: ${afterBalance.toLocaleString()}P\n`);

    // Step 5: 검증
    const expectedIncrease = target.requestedPoints || target.amount;
    const actualIncrease = afterBalance - beforeBalance;
    
    console.log('========== 검증 결과 ==========');
    console.log(`승인 전: ${beforeBalance.toLocaleString()}P`);
    console.log(`승인 후: ${afterBalance.toLocaleString()}P`);
    console.log(`예상 증가: ${expectedIncrease?.toLocaleString()}P`);
    console.log(`실제 증가: ${actualIncrease.toLocaleString()}P`);
    
    if (actualIncrease === expectedIncrease) {
      console.log('\n🎉 성공! 포인트가 즉시 증가했습니다!\n');
    } else if (actualIncrease === 0) {
      console.log('\n❌ 실패! 포인트가 0원으로 유지됩니다!\n');
      console.log('🔍 원인 분석 필요:');
      console.log('1. Academy 테이블 업데이트 확인');
      console.log('2. SMS stats API academyId 확인');
      console.log('3. 데이터베이스 로그 확인\n');
    } else {
      console.log('\n⚠️ 증가량이 예상과 다릅니다!\n');
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

// 실행
testPointApproval();
```

---

## 📊 예상 결과

### ✅ 정상 동작 시:
```
🚀 포인트 승인 테스트 시작...

📋 Step 1: 포인트 충전 요청 목록 조회...
✅ 총 요청: 5개, PENDING: 1개

🎯 승인할 요청:
   ID: req_xxx
   사용자: 홍길동
   학원: 슈퍼플레이스 학원
   요청 포인트: 1,000,000P

📋 Step 2: 승인 전 포인트 확인...
💰 승인 전: 400,000P

📋 Step 3: 포인트 승인 실행...
✅ 승인 성공!

📋 Step 4: 승인 후 포인트 확인 (2초 대기)...
💰 승인 후: 1,400,000P

========== 검증 결과 ==========
승인 전: 400,000P
승인 후: 1,400,000P
예상 증가: 1,000,000P
실제 증가: 1,000,000P

🎉 성공! 포인트가 즉시 증가했습니다!
```

### ❌ 문제 발생 시:
```
💰 승인 전: 400,000P
💰 승인 후: 0P

❌ 실패! 포인트가 0원으로 유지됩니다!
```

---

## 🔧 문제 해결

### Case 1: 포인트가 0원으로 표시
**원인**: SMS stats API가 잘못된 academyId를 조회하거나, 토큰에 academyId가 없음

**해결**:
```javascript
// 토큰 확인
const token = localStorage.getItem('token');
const parts = token.split('|');
console.log('토큰 구조:', {
  id: parts[0],
  email: parts[1],
  role: parts[2],
  academyId: parts[3] || '(없음)'
});

// academyId가 없으면 User 테이블 조회 필요
```

### Case 2: 승인은 성공하지만 포인트 미반영
**원인**: Academy.smsPoints 업데이트가 되지 않음

**해결**: 서버 로그 확인 필요

```javascript
// 승인 API 응답 확인
console.log('승인 응답:', approveData);
// beforePoints, afterPoints, addedPoints 확인
```

### Case 3: SMS stats API가 다른 학원 조회
**원인**: 관리자가 여러 학원에 속해 있을 때 잘못된 academyId 사용

**해결**: SMS stats API에서 요청한 academyId 로그 확인

---

## 🎯 다음 단계

1. 위 스크립트를 브라우저 콘솔에서 실행
2. 결과 확인
3. 문제 발생 시 전체 콘솔 로그 복사
4. 스크린샷과 함께 제공

---

## 💡 추가 테스트

### 학원 포인트 직접 확인
```javascript
async function checkAcademyPoints(academyId) {
  const token = localStorage.getItem('token');
  
  // 디버그 API 호출 (있다면)
  const res = await fetch(`/api/debug/academy/${academyId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await res.json();
  console.log('학원 정보:', data);
}

// 사용 예시
checkAcademyPoints('academy_xxx');
```

### 포인트 트랜잭션 로그 확인
```javascript
async function checkTransactions() {
  const token = localStorage.getItem('token');
  
  const res = await fetch('/api/admin/point-transactions', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await res.json();
  console.table(data.transactions);
}

checkTransactions();
```

---

## 📞 문의

문제가 지속되면:
1. 브라우저 콘솔 전체 로그 스크린샷
2. Network 탭에서 `/api/admin/sms/stats` 응답 확인
3. `/api/admin/point-charge-requests/approve` 응답 확인
