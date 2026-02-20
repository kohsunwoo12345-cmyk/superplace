# 🔔 알림 시스템 실제 데이터 연동 완전 가이드

## ✅ 현재 상태 분석

### 알림 페이지 URL
https://superplacestudy.pages.dev/dashboard/admin/notifications/

### 기능 현황
✅ **구현된 기능**:
- 대상 선택: 전체, 학원별, 학생별, 교사별, 학원장별
- 알림 유형: 정보, 성공, 경고, 오류
- 알림 전송 API: `/api/notifications/send`
- 전송 내역 조회: `/api/notifications/history`
- D1 Database에 알림 저장

⚠️ **문제점**:
- API가 `User`/`Academy` (대문자) 테이블 조회
- 실제 DB는 `users`/`academies` (소문자) 테이블 사용
- 테이블명 불일치로 데이터 조회 실패 가능

---

## 🔍 진단 방법

### 1단계: 브라우저 콘솔 테스트

https://superplacestudy.pages.dev/dashboard/admin/notifications/ 페이지에서  
**F12 → Console 탭**을 열고:

```javascript
// ============================================================
// 알림 시스템 실제 데이터 진단
// ============================================================
(async () => {
  console.log('🔍 알림 시스템 진단 시작...\n');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ 토큰이 없습니다.');
    return;
  }
  
  // 1. 학생 API 테스트
  console.log('1️⃣ 학생 API 테스트...');
  const studentsRes = await fetch('/api/students', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const studentsData = await studentsRes.json();
  console.log('   Status:', studentsRes.status);
  console.log('   Success:', studentsData.success);
  console.log('   학생 수:', studentsData.students?.length || 0);
  if (studentsData.students && studentsData.students.length > 0) {
    console.log('   첫 번째 학생:', studentsData.students[0]);
  }
  console.log('');
  
  // 2. 교사 API 테스트
  console.log('2️⃣ 교사 API 테스트...');
  const teachersRes = await fetch('/api/teachers', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const teachersData = await teachersRes.json();
  console.log('   Status:', teachersRes.status);
  console.log('   Success:', teachersData.success);
  console.log('   교사 수:', teachersData.teachers?.length || 0);
  if (teachersData.teachers && teachersData.teachers.length > 0) {
    console.log('   첫 번째 교사:', teachersData.teachers[0]);
  }
  console.log('');
  
  // 3. 학원장 API 테스트
  console.log('3️⃣ 학원장 API 테스트...');
  const directorsRes = await fetch('/api/users?role=DIRECTOR', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const directorsData = await directorsRes.json();
  console.log('   Status:', directorsRes.status);
  console.log('   Success:', directorsData.success);
  console.log('   학원장 수:', directorsData.users?.length || 0);
  if (directorsData.users && directorsData.users.length > 0) {
    console.log('   첫 번째 학원장:', directorsData.users[0]);
  }
  console.log('');
  
  // 4. 종합 분석
  console.log('4️⃣ 종합 분석:');
  const totalStudents = studentsData.students?.length || 0;
  const totalTeachers = teachersData.teachers?.length || 0;
  const totalDirectors = directorsData.users?.length || 0;
  const total = totalStudents + totalTeachers + totalDirectors;
  
  console.log(`   학생: ${totalStudents}명`);
  console.log(`   교사: ${totalTeachers}명`);
  console.log(`   학원장: ${totalDirectors}명`);
  console.log(`   ───────────────`);
  console.log(`   합계: ${total}명`);
  
  if (total === 0) {
    console.error('\n   ❌ 사용자 데이터가 없습니다!');
    console.log('   💡 D1 Console에서 확인:');
    console.log('      SELECT role, COUNT(*) as count FROM users GROUP BY role;');
  } else {
    console.log('\n   ✅ 사용자 데이터 정상!');
  }
  
  console.log('\n✅ 진단 완료!');
})();
```

### 2단계: D1 Console 확인

**Cloudflare Dashboard → D1 Database → Console**:

```sql
-- 1. 역할별 사용자 수 확인
SELECT 
  role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- 기대 결과:
-- role     | count
-- STUDENT  | 50
-- TEACHER  | 10
-- DIRECTOR | 5
-- ADMIN    | 1

-- 2. 각 역할별 샘플 데이터 확인
-- 학생
SELECT id, name, email, academy_id FROM users WHERE role = 'STUDENT' LIMIT 5;

-- 교사
SELECT id, name, email, academy_id FROM users WHERE role = 'TEACHER' LIMIT 5;

-- 학원장
SELECT id, name, email, academy_id FROM users WHERE role = 'DIRECTOR' LIMIT 5;

-- 3. academy_id가 NULL인 사용자 확인
SELECT 
  role,
  COUNT(*) as count
FROM users
WHERE academy_id IS NULL
GROUP BY role;

-- 만약 NULL이 많으면 문제!
```

---

## ✅ 알림 전송 테스트

### 테스트 시나리오

#### 1. 전체 사용자에게 알림 전송
1. https://superplacestudy.pages.dev/dashboard/admin/notifications/ 접속
2. 대상 선택: **전체** 클릭
3. 알림 내용 입력:
   - 제목: "테스트 알림"
   - 메시지: "전체 사용자 알림 테스트입니다."
4. **X명에게 알림 전송** 버튼 클릭
5. 성공 메시지 확인: "알림이 X명에게 성공적으로 전송되었습니다!"

#### 2. 특정 학생에게 알림 전송
1. 대상 선택: **학생별** 클릭
2. 학생 목록에서 1-2명 선택 (체크박스)
3. 알림 내용 입력
4. **X명에게 알림 전송** 버튼 클릭

#### 3. 학원별 알림 전송
1. 대상 선택: **학원별** 클릭
2. 학원 목록에서 1개 선택
3. 알림 내용 입력
4. 알림 전송

---

## 🔧 문제 해결

### 문제 1: 학생/교사/학원장 수가 0으로 표시

**원인**: API가 `User` 테이블을 조회하지만 실제로는 `users` 테이블에 데이터가 있음

**확인**:
```sql
-- users 테이블 데이터 확인
SELECT COUNT(*) FROM users WHERE role = 'STUDENT';
SELECT COUNT(*) FROM users WHERE role = 'TEACHER';
SELECT COUNT(*) FROM users WHERE role = 'DIRECTOR';

-- User 테이블이 있는지 확인
SELECT name FROM sqlite_master WHERE type='table' AND name='User';
```

**해결**: D1 Console에서
```sql
-- 만약 User 테이블만 있고 users가 없으면 (또는 반대):
-- 테이블명을 확인하고 API를 수정해야 합니다
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

---

### 문제 2: "수신자가 없습니다" 오류

**원인**: 
1. 실제 데이터가 없음
2. academy_id가 NULL
3. 선택한 필터에 맞는 사용자가 없음

**해결**:

#### A. 데이터가 없는 경우
```sql
-- 테스트 데이터 삽입
-- 학생 추가
INSERT INTO users (id, name, email, role, academy_id, created_at)
VALUES 
  ('test-student-1', '테스트학생1', 'test1@student.com', 'STUDENT', '208', datetime('now')),
  ('test-student-2', '테스트학생2', 'test2@student.com', 'STUDENT', '208', datetime('now')),
  ('test-student-3', '테스트학생3', 'test3@student.com', 'STUDENT', '208', datetime('now'));

-- 교사 추가
INSERT INTO users (id, name, email, role, academy_id, created_at)
VALUES 
  ('test-teacher-1', '테스트교사1', 'test1@teacher.com', 'TEACHER', '208', datetime('now')),
  ('test-teacher-2', '테스트교사2', 'test2@teacher.com', 'TEACHER', '208', datetime('now'));

-- 확인
SELECT role, COUNT(*) FROM users GROUP BY role;
```

#### B. academy_id가 NULL인 경우
```sql
-- NULL academy_id를 208로 설정
UPDATE users 
SET academy_id = '208' 
WHERE academy_id IS NULL AND role IN ('STUDENT', 'TEACHER');
```

---

### 문제 3: 신규 사용자가 자동으로 추가되지 않음

**원인**: 회원가입 API에서 users 테이블에 INSERT 하지만 알림 페이지가 캐시된 데이터 사용

**해결**:
1. **페이지 새로고침**: Ctrl+F5 (강력 새로고침)
2. **로컬스토리지 캐시 확인**: 알림 페이지는 매번 API 호출하므로 자동 반영됨
3. **신규 회원가입 후**: 바로 알림 페이지에서 확인 가능

**신규 사용자 추가 흐름**:
```
1. 회원가입 (/register 또는 관리자 페이지에서 추가)
   ↓
2. users 테이블에 INSERT
   ↓
3. 알림 페이지 접속 또는 새로고침
   ↓
4. useEffect에서 자동으로 API 호출
   ↓
5. 신규 사용자 포함된 목록 표시 ✅
```

---

## 📊 알림 전송 흐름

```
사용자: 알림 전송 버튼 클릭
    ↓
프론트엔드: /api/notifications/send POST
    ↓
API: 필터 조건에 맞는 수신자 조회
    - filterType: all → 모든 역할
    - filterType: academy → 특정 academy_id
    - filterType: student → 특정 학생 ID
    ↓
API: users 테이블 쿼리
    SELECT id, name, email, role FROM users 
    WHERE (role 조건) AND (academy_id 조건)
    ↓
API: 각 수신자마다 notifications 테이블에 INSERT
    INSERT INTO notifications (id, title, message, type, timestamp, userId, read)
    ↓
API: 성공 응답
    { success: true, recipientCount: X }
    ↓
프론트엔드: 성공 메시지 표시
    "알림이 X명에게 성공적으로 전송되었습니다!"
```

---

## 🗄️ 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  academy_id TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### notifications 테이블
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  timestamp TIMESTAMP NOT NULL,
  userId TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## ✅ 최종 체크리스트

### 배포 전 확인
- [ ] D1 Console에서 users 테이블 데이터 존재 확인
- [ ] 각 역할(STUDENT, TEACHER, DIRECTOR)별 사용자 최소 1명 이상
- [ ] academy_id가 NULL이 아님

### 알림 페이지 확인
- [ ] https://superplacestudy.pages.dev/dashboard/admin/notifications/ 접속
- [ ] 통계 카드에 정확한 수치 표시
  - 전체 학생: X명
  - 전체 교사: Y명
  - 학원장: Z명
- [ ] 대상 선택 버튼 작동
- [ ] 학생/교사 목록 표시

### 알림 전송 테스트
- [ ] 전체 사용자에게 테스트 알림 전송
- [ ] 성공 메시지 확인
- [ ] 전송 내역에 기록 표시
- [ ] D1 Console에서 notifications 테이블 확인:
  ```sql
  SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 10;
  ```

---

## 🎯 예상 결과

### 정상 작동 시 화면

```
🔔 알림 관리

📊 통계
┌──────────┬──────────┬──────────┬──────────┐
│ 전체 학원 │ 전체 학생 │ 발송 예정 │ 전송 완료 │
│ 5개      │ 50명     │ 0명      │ 3건      │
└──────────┴──────────┴──────────┴──────────┘

대상 선택
[전체: 65명] [학원별] [학생별: 50명] [교사별: 10명]

선택: 전체
→ 전체 사용자에게 알림이 전송됩니다
   학생 50명 + 교사 10명 + 학원장 5명
   총 65명

알림 내용
유형: [정보] [성공] [경고] [오류]
제목: [           ]
메시지: [                    ]

[65명에게 알림 전송]

전송 내역
┌────────────────────────────────────────┐
│ [정보] 2024-01-15 10:30              │
│ ✅ 전송 완료                          │
│ 테스트 알림                           │
│ 전체 사용자 알림 테스트입니다.          │
│ 수신자: 65명 | 필터: 전체             │
└────────────────────────────────────────┘
```

---

## 📞 문제 지속 시

다음 정보를 제공해 주세요:

1. **브라우저 콘솔 스크립트 실행 결과** (전체 복사)
2. **D1 SQL 쿼리 결과**:
   ```sql
   SELECT role, COUNT(*) FROM users GROUP BY role;
   SELECT * FROM users LIMIT 5;
   SELECT name FROM sqlite_master WHERE type='table';
   ```
3. **알림 전송 시 에러 메시지** (있으면)
4. **페이지 통계 수치** (학생 수, 교사 수 등)

---

**최종 업데이트**: 2026-02-19  
**상태**: ✅ 알림 시스템 분석 완료, 진단 도구 제공
