# 🔍 실제 학원 데이터 즉시 진단 가이드

## ⚠️ 현재 문제
- 학원 목록 페이지에 실제 학원만 나와야 함
- 실제 학원에서 등록한 학생 수가 표시되어야 함
- 현재 학생 수가 0으로 표시되거나 잘못된 데이터 표시

---

## 🔍 즉시 진단 방법

### 1단계: 브라우저 콘솔에서 API 테스트

https://superplacestudy.pages.dev/dashboard/admin/academies/ 페이지에서
**F12 → Console 탭**을 열고 다음 스크립트를 실행하세요:

```javascript
// ============================================================
// 실제 학원 데이터 진단 스크립트
// ============================================================
(async () => {
  console.log('🔍 실제 학원 데이터 진단 시작...\n');
  
  // 1. 토큰 확인
  const token = localStorage.getItem('token');
  console.log('1️⃣ 토큰 확인:', token ? '✅ 있음' : '❌ 없음');
  
  if (!token) {
    console.error('❌ 토큰이 없습니다. 로그인이 필요합니다.');
    return;
  }
  
  console.log('   토큰:', token.substring(0, 30) + '...\n');
  
  // 2. 학원 목록 API 호출
  console.log('2️⃣ 학원 목록 API 호출...');
  const res = await fetch('/api/admin/academies', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('   Status:', res.status);
  console.log('   OK:', res.ok);
  
  const data = await res.json();
  console.log('   Response:', data);
  console.log('');
  
  // 3. 결과 분석
  console.log('3️⃣ 결과 분석:');
  console.log('   Success:', data.success);
  console.log('   Total:', data.total);
  console.log('   Academies Count:', data.academies?.length || 0);
  console.log('');
  
  if (data.error) {
    console.error('   ❌ Error:', data.error);
    console.error('   ❌ Message:', data.message);
    console.error('   ❌ Debug Info:', data.debugInfo);
  }
  
  // 4. 각 학원 상세 정보
  if (data.academies && data.academies.length > 0) {
    console.log('4️⃣ 학원 상세 정보:\n');
    data.academies.forEach((academy, index) => {
      console.log(`   [${index + 1}] 학원 ID: ${academy.id}`);
      console.log(`       학원명: ${academy.name}`);
      console.log(`       학원장: ${academy.directorName} (${academy.directorEmail})`);
      console.log(`       👨‍🎓 학생 수: ${academy.studentCount}명`);
      console.log(`       👨‍🏫 교사 수: ${academy.teacherCount}명`);
      console.log(`       활성: ${academy.isActive ? '✅' : '❌'}`);
      console.log(`       생성일: ${academy.createdAt}`);
      console.log('');
    });
  } else {
    console.warn('   ⚠️ 학원 데이터가 없습니다!');
    console.log('');
  }
  
  // 5. 문제 진단
  console.log('5️⃣ 문제 진단:');
  
  if (data.total === 0) {
    console.error('   ❌ 학원이 0개입니다!');
    console.log('   💡 해결: D1 Console에서 DIRECTOR 역할의 사용자를 확인하세요.');
    console.log('      SELECT * FROM users WHERE role = \'DIRECTOR\';');
  } else {
    const zeroStudents = data.academies.filter(a => a.studentCount === 0);
    if (zeroStudents.length > 0) {
      console.warn(`   ⚠️ 학생 수가 0인 학원: ${zeroStudents.length}개`);
      zeroStudents.forEach(academy => {
        console.log(`      - ${academy.name} (ID: ${academy.id})`);
      });
      console.log('   💡 해결: academy_id를 확인하세요.');
      console.log('      학원장 academy_id:', data.academies[0]?.id);
      console.log('      D1 Console에서 실행:');
      console.log(`      SELECT * FROM users WHERE academy_id = '${data.academies[0]?.id}' AND role = 'STUDENT';`);
    } else {
      console.log('   ✅ 모든 학원에 학생이 있습니다!');
    }
  }
  
  console.log('\n✅ 진단 완료!');
  console.log('📋 위 결과를 복사해서 공유해주세요.');
})();
```

---

## 🗄️ 2단계: D1 Console에서 데이터베이스 확인

**Cloudflare Dashboard → D1 Database → Console**에서 `DIAGNOSE_REAL_DATA.sql` 파일 내용 실행

또는 빠른 확인:

```sql
-- 1. 학원장이 있는가?
SELECT COUNT(*) as director_count FROM users WHERE role = 'DIRECTOR';

-- 2. 학원장의 정보와 academy_id
SELECT id, name, email, academy_id FROM users WHERE role = 'DIRECTOR';

-- 3. 학생이 있는가?
SELECT COUNT(*) as student_count FROM users WHERE role = 'STUDENT';

-- 4. 학생들의 academy_id 분포
SELECT 
  COALESCE(academy_id, 'NULL') as academy_id,
  COUNT(*) as count
FROM users 
WHERE role = 'STUDENT'
GROUP BY academy_id;

-- 5. 학원장 academy_id와 학생 academy_id가 일치하는가?
SELECT 
  d.academy_id as director_academy_id,
  d.name as director_name,
  COUNT(s.id) as student_count
FROM users d
LEFT JOIN users s ON s.academy_id = d.academy_id AND s.role = 'STUDENT'
WHERE d.role = 'DIRECTOR'
GROUP BY d.academy_id, d.name;
```

---

## 🔧 일반적인 문제 및 해결책

### 문제 1: 학원이 0개로 표시
**원인**: DIRECTOR 역할의 사용자가 없음

**확인**:
```sql
SELECT * FROM users WHERE role = 'DIRECTOR';
```

**해결**: 학원장 계정의 역할을 DIRECTOR로 변경
```sql
-- 예시: admin@example.com을 학원장으로 변경
UPDATE users 
SET role = 'DIRECTOR', academy_id = 'academy-001' 
WHERE email = 'admin@example.com';
```

---

### 문제 2: 학생 수가 0으로 표시
**원인**: 학생의 `academy_id`가 학원장의 `academy_id`와 다름

**확인**:
```sql
-- 학원장의 academy_id 확인
SELECT name, academy_id FROM users WHERE role = 'DIRECTOR';
-- 결과 예: 'academy-001'

-- 학생들의 academy_id 확인
SELECT id, name, academy_id FROM users WHERE role = 'STUDENT' LIMIT 10;
-- 결과: NULL 또는 다른 값
```

**해결**: 모든 학생의 academy_id를 학원장과 동일하게 설정
```sql
-- 학원장의 academy_id가 'academy-001'인 경우
UPDATE users 
SET academy_id = 'academy-001' 
WHERE role = 'STUDENT';
```

---

### 문제 3: 특정 학원장의 학생만 연결하고 싶을 때
**원인**: 여러 학원장이 있고 각자의 학생을 분리하고 싶음

**해결**:
```sql
-- 1. 학원장별 고유 academy_id 설정
UPDATE users 
SET academy_id = 'academy-kim' 
WHERE email = 'kim@director.com' AND role = 'DIRECTOR';

UPDATE users 
SET academy_id = 'academy-lee' 
WHERE email = 'lee@director.com' AND role = 'DIRECTOR';

-- 2. 학생을 각 학원에 할당
-- 김학원의 학생
UPDATE users 
SET academy_id = 'academy-kim' 
WHERE email IN ('student1@test.com', 'student2@test.com') 
  AND role = 'STUDENT';

-- 이학원의 학생
UPDATE users 
SET academy_id = 'academy-lee' 
WHERE email IN ('student3@test.com', 'student4@test.com') 
  AND role = 'STUDENT';
```

---

### 문제 4: academy_id가 NULL인 사용자들
**원인**: 회원가입 시 academy_id가 설정되지 않음

**확인**:
```sql
SELECT id, name, email, role, academy_id 
FROM users 
WHERE academy_id IS NULL;
```

**해결**: 기본 academy_id 설정
```sql
-- 모든 NULL academy_id를 기본값으로 설정
UPDATE users 
SET academy_id = 'academy-default' 
WHERE academy_id IS NULL AND role IN ('STUDENT', 'TEACHER');
```

---

## 📊 예상 데이터 구조

### 올바른 데이터 구조
```
users 테이블:
┌─────┬─────────┬──────────────────┬──────────┬──────────────┐
│ id  │ name    │ email            │ role     │ academy_id   │
├─────┼─────────┼──────────────────┼──────────┼──────────────┤
│ 1   │ 김학원   │ kim@director.com │ DIRECTOR │ academy-001  │ ← 학원장
│ 2   │ 이학생   │ lee@student.com  │ STUDENT  │ academy-001  │ ← 같은 academy_id!
│ 3   │ 박학생   │ park@student.com │ STUDENT  │ academy-001  │ ← 같은 academy_id!
│ 4   │ 최선생   │ choi@teacher.com │ TEACHER  │ academy-001  │ ← 같은 academy_id!
└─────┴─────────┴──────────────────┴──────────┴──────────────┘
```

### 잘못된 데이터 구조
```
users 테이블:
┌─────┬─────────┬──────────────────┬──────────┬──────────────┐
│ id  │ name    │ email            │ role     │ academy_id   │
├─────┼─────────┼──────────────────┼──────────┼──────────────┤
│ 1   │ 김학원   │ kim@director.com │ DIRECTOR │ academy-001  │ ← 학원장
│ 2   │ 이학생   │ lee@student.com  │ STUDENT  │ NULL         │ ← ❌ NULL!
│ 3   │ 박학생   │ park@student.com │ STUDENT  │ academy-002  │ ← ❌ 다른 ID!
│ 4   │ 최선생   │ choi@teacher.com │ TEACHER  │ NULL         │ ← ❌ NULL!
└─────┴─────────┴──────────────────┴──────────┴──────────────┘
```

---

## 🎯 체크리스트

### 필수 확인 사항
- [ ] DIRECTOR 역할의 사용자가 1명 이상 있음
- [ ] 학원장에게 `academy_id` 값이 있음 (NULL 아님)
- [ ] 학생들에게 `academy_id` 값이 있음 (NULL 아님)
- [ ] 학생의 `academy_id` = 학원장의 `academy_id`
- [ ] 교사의 `academy_id` = 학원장의 `academy_id`

---

## 📞 다음 단계

1. **즉시**: 브라우저 콘솔 스크립트 실행
2. **결과 복사**: 콘솔 로그 전체 복사
3. **D1 확인**: `DIAGNOSE_REAL_DATA.sql` 실행
4. **결과 공유**: 위 2가지 결과를 함께 알려주세요

그러면 정확한 원인을 파악하고 즉시 해결하겠습니다!
