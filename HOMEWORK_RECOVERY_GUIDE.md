# 🎓 숙제 검사 결과 복구 가이드

## 📅 작성일: 2026-03-15
## 🚨 문제: 숙제 검사 결과가 표시되지 않음

---

## 🔍 즉시 확인 방법 (브라우저 콘솔)

### 1단계: 관리자/교사 로그인 후 개발자 도구 열기
- F12 키 → Console 탭
- https://superplacestudy.pages.dev 로그인

### 2단계: 아래 스크립트 복사 & 실행

```javascript
// 숙제 데이터 확인 스크립트
async function checkHomeworkData() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ 로그인이 필요합니다');
    return;
  }

  console.log('🔍 숙제 데이터 확인 시작\n');

  // 1. 디버그 API로 테이블 상태 확인
  console.log('1️⃣ 데이터베이스 테이블 상태 확인...');
  try {
    const debugRes = await fetch('/api/debug/homework-data');
    const debugData = await debugRes.json();
    
    if (debugData.success) {
      const tables = debugData.data.tables;
      
      // homework_submissions_v2
      if (tables.homework_submissions_v2?.exists) {
        console.log(`✅ homework_submissions_v2: ${tables.homework_submissions_v2.totalCount}건`);
        if (tables.homework_submissions_v2.recentRecords?.length > 0) {
          console.log('   최근 제출:');
          tables.homework_submissions_v2.recentRecords.forEach((r, i) => {
            console.log(`   ${i+1}. ${r.id} - 제출: ${r.submittedAt}, 상태: ${r.status}`);
          });
        }
      } else {
        console.log('❌ homework_submissions_v2 테이블이 없거나 접근 불가');
      }
      
      // homework_gradings_v2
      if (tables.homework_gradings_v2?.exists) {
        console.log(`✅ homework_gradings_v2: ${tables.homework_gradings_v2.totalCount}건`);
      } else {
        console.log('❌ homework_gradings_v2 테이블이 없거나 접근 불가');
      }
      
      // 오늘 제출
      if (debugData.data.todaySubmissions) {
        console.log(`📅 오늘(${debugData.data.todaySubmissions.date}) 제출: ${debugData.data.todaySubmissions.count}건`);
      }
    }
  } catch (e) {
    console.warn('⚠️ 디버그 API 호출 실패 (아직 배포 안됨 가능성):', e.message);
  }
  
  console.log('\n');

  // 2. 실제 숙제 결과 API 호출
  console.log('2️⃣ 숙제 결과 API 호출...');
  
  // 오늘 기준
  const todayRes = await fetch('/api/homework/results', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`   오늘 결과 API 상태: ${todayRes.status}`);
  
  if (todayRes.ok) {
    const todayData = await todayRes.json();
    if (todayData.success) {
      console.log(`   ✅ 오늘 제출: ${todayData.data.submissions?.length || 0}건`);
      console.log(`   통계:`, todayData.data.stats);
      
      if (todayData.data.submissions?.length > 0) {
        console.log('   제출 목록:');
        console.table(todayData.data.submissions.map(s => ({
          ID: s.submissionId,
          학생: s.userName,
          과목: s.subject || '-',
          점수: s.score || '-',
          상태: s.status,
          제출시각: s.submittedAt
        })));
      } else {
        console.log('   ℹ️ 오늘 제출된 숙제가 없습니다.');
      }
    }
  } else {
    const errorData = await todayRes.json();
    console.error('   ❌ API 오류:', errorData);
  }
  
  console.log('\n');

  // 3. 최근 7일 데이터 조회
  console.log('3️⃣ 최근 7일 데이터 조회...');
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const weekRes = await fetch(`/api/homework/results?startDate=${startDate}&endDate=${endDate}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`   최근 7일 API 상태: ${weekRes.status}`);
  
  if (weekRes.ok) {
    const weekData = await weekRes.json();
    if (weekData.success) {
      console.log(`   ✅ 최근 7일 제출: ${weekData.data.submissions?.length || 0}건`);
      
      if (weekData.data.submissions?.length > 0) {
        // 날짜별 집계
        const byDate = {};
        weekData.data.submissions.forEach(s => {
          const date = s.submittedAt.split('T')[0];
          byDate[date] = (byDate[date] || 0) + 1;
        });
        console.log('   날짜별 제출 건수:');
        Object.entries(byDate).sort().forEach(([date, count]) => {
          console.log(`      ${date}: ${count}건`);
        });
      }
    }
  } else {
    const errorData = await weekRes.json();
    console.error('   ❌ API 오류:', errorData);
  }
  
  console.log('\n');

  // 4. 진단 결과
  console.log('🔍 진단 결과:\n');
  
  // API가 정상 작동하면
  if (todayRes.status === 200 || weekRes.status === 200) {
    console.log('✅ API는 정상 작동 중입니다.');
    
    // 데이터가 없으면
    const todayData = todayRes.ok ? await todayRes.json() : null;
    const weekData = weekRes.ok ? await weekRes.json() : null;
    
    const todayCount = todayData?.data?.submissions?.length || 0;
    const weekCount = weekData?.data?.submissions?.length || 0;
    
    if (weekCount === 0) {
      console.log('\n⚠️ 최근 7일간 제출된 숙제가 없습니다.');
      console.log('   → 학생이 숙제를 제출해야 합니다.');
      console.log('   → 학생 앱: https://superplacestudy.pages.dev/dashboard/homework/student');
    } else {
      console.log(`\n✅ 최근 7일간 ${weekCount}건의 숙제가 제출되었습니다.`);
      
      if (todayCount === 0) {
        console.log('   ℹ️ 오늘은 제출이 없습니다.');
        console.log('   → 날짜 범위를 변경해서 조회하세요.');
      }
    }
  } else {
    console.log('❌ API 호출에 실패했습니다.');
    console.log('   → 로그인 상태를 확인하세요.');
    console.log('   → 권한이 있는 계정인지 확인하세요.');
  }
}

// 실행
checkHomeworkData();
```

---

## 🛠️ 문제별 해결 방법

### Case 1: "최근 7일간 제출된 숙제가 없습니다"
**원인**: 데이터베이스에 숙제 제출 데이터가 없음

**해결**:
1. 학생이 숙제를 제출해야 함
2. 학생 앱 접속: https://superplacestudy.pages.dev/dashboard/homework/student
3. 숙제 이미지 업로드 후 제출

### Case 2: "API 호출에 실패했습니다" (401 Unauthorized)
**원인**: 인증 토큰 문제

**해결**:
1. 로그아웃 후 다시 로그인
2. 로컬스토리지 확인: `localStorage.getItem('token')`
3. 토큰이 없으면 재로그인

### Case 3: "API 호출에 실패했습니다" (403 Forbidden)
**원인**: 권한 부족

**해결**:
1. 계정 역할 확인 필요
2. DIRECTOR, TEACHER, ADMIN, SUPER_ADMIN 역할만 조회 가능
3. 관리자에게 권한 변경 요청

### Case 4: 데이터는 있는데 화면에 표시 안됨
**원인**: 프론트엔드 필터링 문제 또는 날짜 범위 문제

**해결**:
1. 브라우저 캐시 삭제 (Ctrl + Shift + R)
2. 날짜 범위 확장해서 조회
3. 검색 필터 초기화

### Case 5: homework_submissions_v2 테이블이 없음
**원인**: 테이블이 생성되지 않음

**해결**:
1. 학생이 처음 숙제를 제출하면 자동 생성됨
2. 또는 수동 생성:
```sql
-- Cloudflare D1 대시보드에서 실행
CREATE TABLE IF NOT EXISTS homework_submissions_v2 (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  code TEXT,
  imageUrl TEXT,
  imageCount INTEGER DEFAULT 1,
  submittedAt TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  gradingResult TEXT,
  gradedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);
```

---

## 📊 API 엔드포인트

| API | 설명 | 인증 |
|-----|------|------|
| `GET /api/homework/results` | 오늘 제출된 숙제 조회 | 필수 |
| `GET /api/homework/results?date=2026-03-15` | 특정 날짜 조회 | 필수 |
| `GET /api/homework/results?startDate=2026-03-01&endDate=2026-03-15` | 기간 조회 | 필수 |
| `GET /api/homework/results?userId=user123` | 특정 학생 조회 | 필수 |
| `GET /api/debug/homework-data` | 디버그 데이터 조회 | 없음 |

---

## 📱 학생 숙제 제출 방법

1. **학생 앱 로그인**
   - https://superplacestudy.pages.dev
   - 학생 계정으로 로그인

2. **숙제 페이지 접속**
   - 대시보드 → 숙제 제출
   - 또는 `/dashboard/homework/student` 직접 접속

3. **숙제 제출**
   - 숙제 코드 입력 (선택)
   - 숙제 이미지 업로드 (필수)
   - 제출 버튼 클릭

4. **제출 확인**
   - 제출 내역에서 상태 확인
   - `pending` → AI 채점 대기 중
   - `graded` → 채점 완료

---

## 🤖 AI 채점 프로세스

1. **자동 채점**: 제출 즉시 백그라운드에서 실행
2. **수동 채점**: 교사가 "채점하기" 버튼 클릭
3. **채점 결과**: 
   - 점수 (0-100)
   - 과목
   - 완성도
   - 노력도
   - 피드백
   - 약점 분석

---

## 🔧 테이블 구조

### homework_submissions_v2
```sql
CREATE TABLE homework_submissions_v2 (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  code TEXT,              -- 숙제 코드 (선택)
  imageUrl TEXT,          -- 첫 번째 이미지 URL
  imageCount INTEGER DEFAULT 1,
  submittedAt TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, graded, failed
  gradingResult TEXT,     -- JSON 형식 채점 결과
  gradedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);
```

### homework_gradings_v2
```sql
CREATE TABLE homework_gradings_v2 (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  score INTEGER,
  subject TEXT,
  totalQuestions INTEGER,
  correctAnswers INTEGER,
  overallFeedback TEXT,
  strengths TEXT,
  improvements TEXT,
  detailedResults TEXT,   -- JSON 형식
  gradedAt TEXT NOT NULL,
  FOREIGN KEY (submissionId) REFERENCES homework_submissions_v2(id)
);
```

### homework_images
```sql
CREATE TABLE homework_images (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  imageUrl TEXT NOT NULL,
  sequence INTEGER DEFAULT 1,
  uploadedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (submissionId) REFERENCES homework_submissions_v2(id)
);
```

---

## 🆘 긴급 복구 절차

### 1. 데이터 확인
```javascript
// 브라우저 콘솔에서 실행
const token = localStorage.getItem('token');
fetch('/api/debug/homework-data').then(r => r.json()).then(console.log);
```

### 2. API 테스트
```javascript
// 최근 7일 데이터 조회
const token = localStorage.getItem('token');
const start = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
const end = new Date().toISOString().split('T')[0];

fetch(`/api/homework/results?startDate=${start}&endDate=${end}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('결과:', data);
  if (data.success) {
    console.log(`총 ${data.data.submissions.length}건`);
    console.table(data.data.submissions);
  }
});
```

### 3. 샘플 숙제 생성 (테스트용)
```javascript
// 관리자만 실행 가능
// 학생 계정으로 로그인 후:
const token = localStorage.getItem('token');

// 이미지 파일을 직접 업로드해야 함
// /dashboard/homework/student 페이지에서 직접 제출
```

---

## 📞 지원 정보

**디버그 API**: https://superplacestudy.pages.dev/api/debug/homework-data  
**숙제 결과 페이지**: https://superplacestudy.pages.dev/dashboard/homework/results  
**학생 제출 페이지**: https://superplacestudy.pages.dev/dashboard/homework/student  

**배포 URL**: https://superplacestudy.pages.dev  
**최신 커밋**: 7d932638  
**상태**: ✅ API 정상 작동 중

---

## 🎯 핵심 체크리스트

- [ ] 학생이 숙제를 제출했는가?
- [ ] 제출한 날짜가 조회 범위에 포함되는가?
- [ ] 로그인한 계정에 조회 권한이 있는가?
- [ ] 브라우저 캐시를 삭제했는가?
- [ ] API가 200 OK를 반환하는가?
- [ ] 데이터베이스 테이블이 존재하는가?

**모든 항목이 ✅ 이면 데이터가 정상적으로 표시되어야 합니다.**
