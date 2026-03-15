# 🔧 포인트 승인 디버그 가이드

## 문제 상황
관리자가 포인트 승인을 했는데도 SMS 포인트가 0원으로 표시됨

## 즉시 확인 방법 (브라우저 콘솔)

### 1단계: 로그인 후 브라우저 콘솔 열기
- F12 키 → Console 탭
- https://superplacestudy.pages.dev 에 관리자 로그인

### 2단계: 아래 스크립트 복사 & 실행

```javascript
// 포인트 충전 요청 및 학원 포인트 확인
async function checkPointStatus() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ 로그인이 필요합니다');
    return;
  }

  console.log('🔍 포인트 충전 요청 조회 중...\n');

  // 1. 모든 포인트 충전 요청 조회
  const reqResponse = await fetch('/api/admin/point-charge-requests?status=ALL', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const reqData = await reqResponse.json();

  if (!reqData.success) {
    console.error('❌ 요청 조회 실패:', reqData);
    return;
  }

  const requests = reqData.data.requests;
  console.log(`📋 총 ${requests.length}개의 충전 요청\n`);

  // 승인된 요청만 표시
  const approved = requests.filter(r => r.status === 'APPROVED');
  console.log(`✅ 승인된 요청: ${approved.length}개\n`);

  approved.forEach((req, idx) => {
    console.log(`[${idx + 1}] ${req.academyName}`);
    console.log(`   요청 금액: ${(req.amount || req.requestedPoints).toLocaleString()}P`);
    console.log(`   승인 시각: ${req.approvedAt}`);
    console.log(`   요청 ID: ${req.id}\n`);
  });

  // 2. 각 학원의 실제 SMS 포인트 조회
  console.log('🏫 학원별 SMS 포인트 현황\n');
  const academyIds = [...new Set(requests.map(r => r.academyId).filter(Boolean))];

  for (const academyId of academyIds) {
    const acadResponse = await fetch(`/api/admin/academies/${academyId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const acadData = await acadResponse.json();

    if (acadData.success) {
      const academy = acadData.data;
      const approvedSum = requests
        .filter(r => r.academyId === academyId && r.status === 'APPROVED')
        .reduce((sum, r) => sum + (r.amount || r.requestedPoints || 0), 0);

      console.log(`학원: ${academy.name}`);
      console.log(`   현재 SMS 포인트: ${(academy.smsPoints || 0).toLocaleString()}P`);
      console.log(`   승인된 요청 합계: ${approvedSum.toLocaleString()}P`);
      
      const diff = (academy.smsPoints || 0) - approvedSum;
      if (diff !== 0) {
        console.log(`   ⚠️ 차이: ${diff.toLocaleString()}P`);
      } else {
        console.log(`   ✅ 일치`);
      }
      console.log('');
    }
  }

  // 3. SMS 통계 API 확인
  console.log('📊 SMS 통계 API 응답\n');
  const statsResponse = await fetch('/api/admin/sms/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statsData = await statsResponse.json();
  
  if (statsData.success) {
    console.log('SMS 포인트 잔액:', statsData.data.stats.balance.toLocaleString() + 'P');
  } else {
    console.error('❌ SMS 통계 조회 실패:', statsData);
  }
}

// 실행
checkPointStatus();
```

### 3단계: 결과 확인
- "✅ 일치" → 정상 (SMS 페이지 캐시 문제)
- "⚠️ 차이" → DB 업데이트 실패 (로그 확인 필요)

## 해결 방법

### Case 1: 차이가 0 (일치) → 캐시 문제
```
해결: 브라우저 강제 새로고침 (Ctrl + Shift + R)
```

### Case 2: 차이가 있음 → DB 업데이트 실패
```
1. Cloudflare Pages 대시보드 → Functions 로그 확인
2. 승인 API 오류 메시지 찾기
3. 해당 오류 보고
```

## 테스트용 승인 스크립트 (관리자만)

```javascript
async function testApproval(requestId) {
  const token = localStorage.getItem('token');
  
  console.log(`🔄 요청 ${requestId} 승인 시도...\n`);
  
  const response = await fetch('/api/admin/point-charge-requests/approve', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requestId })
  });
  
  const data = await response.json();
  console.log('응답 상태:', response.status);
  console.log('응답 데이터:', data);
  
  if (data.success) {
    console.log('✅ 승인 성공!');
    console.log(`   추가 포인트: ${data.data.addedPoints}P`);
    console.log(`   업데이트 전: ${data.data.beforePoints}P`);
    console.log(`   업데이트 후: ${data.data.afterPoints}P`);
  } else {
    console.error('❌ 승인 실패:', data.error || data.message);
  }
}

// 사용법: testApproval('요청ID')
```

## 디버그 정보 수집 방법

1. **브라우저 Network 탭**
   - F12 → Network
   - 승인 버튼 클릭
   - `approve` 요청 찾기
   - Response 탭에서 전체 응답 확인

2. **Cloudflare 로그**
   - https://dash.cloudflare.com
   - Pages → superplacestudy
   - Functions → Logs
   - 승인 시각 기준으로 로그 확인

## 주요 확인 포인트

| 항목 | 정상 | 비정상 |
|------|------|--------|
| 승인 API 응답 | 200 OK, success: true | 4xx/5xx 오류 |
| addedPoints | 요청 금액과 동일 | null 또는 0 |
| beforePoints vs afterPoints | 차이 = addedPoints | 차이 없음 |
| Academy.smsPoints | 승인 합계와 일치 | 0 또는 불일치 |
| SMS stats API balance | Academy.smsPoints와 일치 | 0 또는 null |

## 배포 정보
- **URL**: https://superplacestudy.pages.dev
- **최신 커밋**: a56fb121
- **수정 파일**:
  - `functions/api/admin/point-charge-requests/approve.ts`
  - `functions/api/admin/sms/stats.js`
  - `functions/api/admin/point-charge-requests/index.ts`

---
**작성일**: 2026-03-15  
**문제**: 포인트 승인 후 0원 표시  
**우선순위**: 🔴 긴급
