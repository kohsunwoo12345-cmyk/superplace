# 🔧 최종 검증 가이드

## 📅 작성일: 2026-03-15
## 🎯 최신 커밋: c5ff2b98

---

## ✅ 작업 완료 내역

### 1️⃣ 숙제 검사 결과 페이지
**상태**: ✅ 정상 작동 확인

**확인 결과**:
- `homework_submissions_v2`: 226건
- `homework_gradings_v2`: 104건
- 오늘(2026-03-15) 제출: 0건
- 최근 제출 샘플:
  - homework-1773499138168-0agw37oqz (graded, 2026-03-14 23:38:58)
  - homework-1773499120633-pd1i7d59q (processing, 2026-03-14 23:38:40)
  - homework-1773479385187-s7o7gh4ex (graded, 2026-03-14 18:09:45)

**API 동작**:
- 기본 조회 기간: 최근 6개월
- 날짜 범위 필터: 정상 작동
- 데이터 포맷팅: 정상
- 점수 계산: 정상

**페이지 접속**:
```
https://superplacestudy.pages.dev/dashboard/homework/results
```

### 2️⃣ 포인트 충전 시스템
**상태**: ⚠️ 승인은 되지만 SMS 페이지에서 0원 표시

**확인 결과**:
- 포인트 충전 요청: 11건 (모두 APPROVED)
- 학원 포인트 (DB): 1,400,000원
- SMS 페이지 표시: 0원 ❌

**문제 원인**:
- SMS stats API가 `academyId`를 찾지 못함
- 또는 Academy 테이블 조회 실패

---

## 🔍 포인트 문제 진단 방법

### 1단계: 브라우저 콘솔에서 확인

```javascript
// 1. SMS 페이지 접속 후 F12 → Console
// 2. 아래 스크립트 실행

async function checkPointIssue() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  console.log('👤 로그인 정보:');
  console.log('   이메일:', user.email);
  console.log('   역할:', user.role);
  console.log('   학원 ID:', user.academyId || user.academy_id);
  
  console.log('\n📊 SMS 통계 API 호출...');
  const res = await fetch('/api/admin/sms/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('응답 상태:', res.status);
  const data = await res.json();
  console.log('응답 데이터:', data);
  
  if (data.success) {
    console.log('\n💰 포인트 잔액:', data.stats.balance, 'P');
  } else {
    console.error('\n❌ 오류:', data.error);
  }
  
  // Cloudflare 로그 확인 안내
  console.log('\n📝 다음 정보를 확인하세요:');
  console.log('1. Cloudflare Pages 대시보드 → Functions → Logs');
  console.log('2. 위 API 호출 시각의 로그 찾기');
  console.log('3. 로그에 표시된 내용:');
  console.log('   - 🏫 Academy ID: ?');
  console.log('   - 👤 User role: ?');
  console.log('   - 📧 User email: ?');
  console.log('   - 🔍 Querying Academy table for: ?');
  console.log('   - 📦 Academy data: ?');
  console.log('   - 💰 SMS Points balance: ?');
}

checkPointIssue();
```

### 2단계: Cloudflare 로그 확인

1. **Cloudflare 대시보드 접속**
   - https://dash.cloudflare.com
   - Pages → superplacestudy
   - Functions → Logs

2. **로그 필터링**
   - 최근 로그에서 "SMS Stats request" 찾기
   - 아래 항목 확인:
     ```
     🏫 Academy ID: academy-xxx (또는 null)
     👤 User role: DIRECTOR (또는 다른 역할)
     📧 User email: user@example.com
     🔍 Querying Academy table for: academy-xxx
     📦 Academy data: {...}
     💰 SMS Points balance: 0 (또는 실제 값)
     ```

3. **문제 진단**
   - **Academy ID가 null** → 토큰에 academyId가 없음
   - **Academy not found** → 학원 데이터가 DB에 없음
   - **Academy data: null** → 쿼리 실패
   - **Balance: 0 but smsPoints > 0** → 응답 구조 문제

---

## 🛠️ 문제별 해결 방법

### Case 1: Academy ID가 null
**원인**: 토큰에 academyId가 포함되지 않음

**해결**:
1. 로그아웃 후 재로그인
2. 토큰 형식 확인:
```javascript
const token = localStorage.getItem('token');
console.log('Token:', token);
// 형식: userId|email|role|academyId|timestamp
```
3. academyId가 4번째 필드에 있어야 함

### Case 2: Academy not found
**원인**: 해당 academyId의 학원이 DB에 없음

**해결**:
```sql
-- Cloudflare D1 대시보드에서 실행
SELECT * FROM Academy WHERE id = 'academy-xxx';
```
- 결과가 없으면 → 학원 데이터 생성 필요
- 있으면 → ID가 일치하는지 확인

### Case 3: Academy 데이터는 있지만 balance가 0
**원인**: `smsPoints` 컬럼이 NULL 또는 0

**확인**:
```sql
SELECT id, name, smsPoints FROM Academy WHERE id = 'academy-xxx';
```

**수정**:
```sql
UPDATE Academy 
SET smsPoints = 1400000 
WHERE id = 'academy-xxx';
```

### Case 4: 로그에 정상 값이 나오지만 화면에 0원
**원인**: 프론트엔드 캐시 또는 API 응답 파싱 문제

**해결**:
1. 브라우저 캐시 삭제 (Ctrl + Shift + R)
2. 개발자 도구 → Network → SMS stats API 응답 확인
3. 응답이 `{ success: true, stats: { balance: 1400000 } }` 형식인지 확인

---

## 📊 숙제 결과 페이지 사용 방법

### 기본 사용
1. `/dashboard/homework/results` 접속
2. 자동으로 최근 6개월 데이터 조회
3. 날짜 범위 변경 가능

### 날짜 필터
- **단일 날짜**: 특정 날짜의 제출만 조회
- **날짜 범위**: 시작~종료 날짜 범위 조회
- 기본값: 최근 6개월

### 검색
- 학생 이름으로 검색
- 이메일로 검색
- 과목으로 검색

### 상세 보기
- 제출 항목 클릭 → 상세 정보 표시
- 이미지 보기
- 채점 결과 확인
- AI 피드백 확인

---

## 🧪 전체 시스템 테스트

### 숙제 시스템 테스트
```javascript
// 브라우저 콘솔에서 실행
async function testHomework() {
  const token = localStorage.getItem('token');
  
  // 최근 7일 데이터 조회
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
  
  const res = await fetch(`/api/homework/results?startDate=${start}&endDate=${end}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await res.json();
  
  if (data.success) {
    console.log('✅ 숙제 시스템 정상');
    console.log('총 제출:', data.results.length, '건');
    console.log('평균 점수:', data.statistics.averageScore, '점');
    console.table(data.results.slice(0, 5).map(r => ({
      학생: r.submission.userName,
      과목: r.grading?.subject || '-',
      점수: r.grading?.score || '-',
      제출일: r.submission.submittedAt.split('T')[0]
    })));
  } else {
    console.error('❌ 숙제 시스템 오류:', data.error);
  }
}

testHomework();
```

### 포인트 시스템 테스트
```javascript
// 브라우저 콘솔에서 실행 (위의 checkPointIssue() 참조)
checkPointIssue();
```

---

## 🆘 긴급 복구

### 포인트가 계속 0원으로 표시되는 경우

1. **디버그 API로 실제 데이터 확인**
```bash
curl https://superplacestudy.pages.dev/api/debug/point-requests
```

2. **학원 포인트 직접 확인**
```sql
-- Cloudflare D1
SELECT id, name, smsPoints FROM Academy;
```

3. **수동 포인트 동기화**
```sql
-- 승인된 요청 합계 계산
SELECT 
  academyId,
  SUM(requestedPoints) as total
FROM PointChargeRequest
WHERE status = 'APPROVED'
GROUP BY academyId;

-- Academy 테이블 업데이트
UPDATE Academy
SET smsPoints = (
  SELECT COALESCE(SUM(requestedPoints), 0)
  FROM PointChargeRequest
  WHERE PointChargeRequest.academyId = Academy.id
    AND PointChargeRequest.status = 'APPROVED'
)
WHERE id IN (
  SELECT DISTINCT academyId 
  FROM PointChargeRequest
);
```

---

## 📞 지원 정보

**배포 URL**: https://superplacestudy.pages.dev  
**최신 커밋**: c5ff2b98  
**배포 시각**: 2026-03-15 15:30 (KST)  

**주요 API**:
- 숙제 결과: `/api/homework/results`
- SMS 통계: `/api/admin/sms/stats`
- 숙제 디버그: `/api/debug/homework-data`
- 포인트 디버그: `/api/debug/point-requests`

**디버그 페이지**:
- 포인트 승인: `/debug.html`

---

## 🎯 확인 체크리스트

### 숙제 시스템
- [x] API 정상 작동 (200 OK)
- [x] 데이터베이스에 226건 존재
- [x] 날짜 필터 작동
- [x] 최근 6개월 조회 기본 설정
- [ ] 프론트엔드에서 데이터 표시 확인 필요

### 포인트 시스템
- [x] 승인 API 정상 작동
- [x] 데이터베이스에 1,400,000원 저장
- [ ] SMS 페이지에서 포인트 표시 확인 필요
- [ ] Cloudflare 로그에서 원인 확인 필요

---

## 📝 다음 단계

1. **사용자가 직접 확인**:
   - 숙제 결과 페이지 접속
   - SMS 페이지에서 포인트 확인
   - 브라우저 콘솔에서 위의 스크립트 실행

2. **Cloudflare 로그 확인**:
   - SMS stats API 호출 시 로그 확인
   - Academy ID, Academy data 확인

3. **문제 보고**:
   - 브라우저 콘솔 로그 캡처
   - Cloudflare 로그 캡처
   - 정확한 문제 설명

**현재 상태**: 숙제는 정상, 포인트는 Cloudflare 로그 확인 필요
