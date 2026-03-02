# 🏫 학원 목록 동기화 문제 해결

## 📅 작성일: 2026-03-02

## 🐛 문제 설명

### 증상
1. **Users 페이지** (학원장 목록): https://superplacestudy.pages.dev/dashboard/admin/users/
2. **Academies 페이지** (학원 목록): https://superplacestudy.pages.dev/dashboard/admin/academies/
3. **Bot Management 페이지**: https://superplacestudy.pages.dev/dashboard/admin/bot-management/

위 3개 페이지에서 표시되는 학원 수가 서로 다름.

### 원인
- **기존 로직**: 학원장(DIRECTOR) 역할의 사용자를 조회하여 학원 목록 구성
- **문제점**: 
  - 학원장이 없는 학원은 표시되지 않음
  - `academies` 테이블에는 학원 데이터가 있지만 학원장이 미배정된 경우 누락
  - 신규 학원 생성 시 학원장 배정 전까지 목록에 표시 안됨

---

## ✅ 해결 방법

### 새로운 로직
```typescript
// 1단계: academies 테이블에서 모든 학원 조회 (우선순위)
const academiesFromTable = await DB.query('SELECT * FROM academies');

// 2단계: 각 학원에 대한 추가 정보 매칭
for (const academy of academiesFromTable) {
  // 학원장 찾기
  const director = directors.find(d => d.academy_id === academy.id);
  
  // 학생 수, 교사 수 조회
  const studentCount = await getStudentCount(academy.id);
  const teacherCount = await getTeacherCount(academy.id);
  
  // 구독 정보 조회
  const subscription = await getSubscription(academy.id);
  
  // 학원 정보 구성
  return {
    id: academy.id,
    name: academy.name,
    directorName: director?.name || '학원장 미배정', // ✅ 학원장 없어도 OK
    studentCount,
    teacherCount,
    ...
  };
}

// 3단계: academies 테이블이 없으면 학원장 기준으로 fallback
if (academiesFromTable.length === 0) {
  // 기존 로직 (학원장 기준)
}
```

### 주요 변경사항

#### 1. academies 테이블 우선 조회
```typescript
// 🔥 신규: academies 테이블에서 직접 조회
let academyTable = null;
if (allTables.includes('academies')) academyTable = 'academies';
else if (allTables.includes('Academy')) academyTable = 'Academy';

if (academyTable) {
  const academyQuery = `SELECT * FROM ${academyTable} ORDER BY created_at DESC`;
  const academyResult = await env.DB.prepare(academyQuery).all();
  academiesFromTable = academyResult.results || [];
  console.log(`✅ Found ${academiesFromTable.length} academies from ${academyTable} table`);
}
```

#### 2. 학원장 정보 매칭
```typescript
// 학원장 찾기 (없을 수도 있음)
const director = directors.find(d => d.academy_id?.toString() === academyId);

// 학원장이 없으면 '학원장 미배정'으로 표시
directorName: director?.name || '학원장 미배정',
directorEmail: director?.email || '',
directorPhone: director?.phone || '',
directorCount: director ? 1 : 0,
```

#### 3. 학생/교사 수 조회
```typescript
// User 테이블과 users 테이블 모두 조회
let totalStudentCount = 0;

if (allTables.includes('User')) {
  const userStudents = await DB.query('SELECT COUNT(*) FROM User WHERE academy_id = ? AND role = ?', [academyId, 'STUDENT']);
  totalStudentCount += userStudents.count;
}

const students = await DB.query('SELECT COUNT(*) FROM users WHERE academy_id = ? AND role = ?', [academyId, 'STUDENT']);
totalStudentCount += students.count;
```

#### 4. Fallback 로직
```typescript
// academies 테이블이 없거나 비어있으면 학원장 기준으로 조회
if (academiesFromTable.length === 0 && directors.length > 0) {
  console.log('⚠️ No academies table found, using directors as fallback');
  // 기존 로직 실행
}
```

---

## 📊 데이터 흐름

### Before (기존)
```
Users 페이지
  └─> DIRECTOR 역할 사용자 조회
       └─> 학원장의 academy_id로 학원 정보 구성
            └─> Bot Management에 전달

❌ 문제: 학원장이 없는 학원은 표시 안됨
```

### After (개선)
```
Academies 테이블
  └─> 모든 학원 조회 ✅
       ├─> 학원장 매칭 (없으면 '학원장 미배정')
       ├─> 학생 수 조회
       ├─> 교사 수 조회
       └─> 구독 정보 조회
            └─> Bot Management에 전달 ✅

✅ 해결: 모든 학원이 표시됨
```

---

## 🔧 API 응답 변화

### Before
```json
{
  "success": true,
  "academies": [
    {
      "id": "1",
      "name": "강남학원",
      "directorName": "김원장",
      "studentCount": 15,
      "teacherCount": 3
    }
    // 학원장이 없는 학원은 누락
  ],
  "total": 1,
  "source": "directors"
}
```

### After
```json
{
  "success": true,
  "academies": [
    {
      "id": "1",
      "name": "강남학원",
      "directorName": "김원장",
      "studentCount": 15,
      "teacherCount": 3
    },
    {
      "id": "2",
      "name": "서초학원",
      "directorName": "학원장 미배정", // ✅ 학원장 없어도 표시
      "studentCount": 0,
      "teacherCount": 0
    }
  ],
  "total": 2,
  "source": "academies_table" // ✅ 소스 변경
}
```

---

## 📋 테스트 방법

### 1. Academies 페이지에서 학원 수 확인
```
https://superplacestudy.pages.dev/dashboard/admin/academies/
```
- 모든 등록된 학원이 표시되어야 함
- 학원장이 없는 학원도 "학원장 미배정"으로 표시

### 2. Bot Management 페이지에서 학원 선택
```
https://superplacestudy.pages.dev/dashboard/admin/bot-management/
```
1. "개별 할당" 버튼 클릭
2. "학원 선택" 드롭다운 확인
3. **기대 결과**: Academies 페이지와 동일한 학원 목록 표시

### 3. F12 Console 로그 확인
```javascript
// 기대되는 로그:
✅ Found 5 academies from academies table
📍 Processing academy: 강남학원 (ID: 1)
  └─ 강남학원: 15 학생, 3 교사, 학원장: 김원장
📍 Processing academy: 서초학원 (ID: 2)
  └─ 서초학원: 0 학생, 0 교사, 학원장: 없음
🎉 Built 5 academies from academies table
```

### 4. API 직접 호출 테스트
```bash
# 토큰 가져오기
TOKEN=$(node -e "console.log(localStorage.getItem('token'))")

# API 호출
curl -H "Authorization: Bearer $TOKEN" \
  https://superplacestudy.pages.dev/api/admin/academies | jq '.academies[] | {id, name, directorName}'
```

예상 결과:
```json
{
  "id": "1",
  "name": "강남학원",
  "directorName": "김원장"
}
{
  "id": "2",
  "name": "서초학원",
  "directorName": "학원장 미배정"
}
```

---

## 🚨 문제 발생 시 체크리스트

### 1. 학원 목록이 여전히 적게 표시될 때

#### A. academies 테이블 존재 확인
```sql
-- Cloudflare D1 콘솔에서 실행
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%academ%';
```

#### B. academies 테이블 데이터 확인
```sql
SELECT id, name, created_at FROM academies ORDER BY created_at DESC;
```

#### C. Console 로그 확인
```
F12 > Console
찾아볼 로그:
- "📊 Academy table found: academies"
- "✅ Found X academies from academies table"
```

### 2. 특정 학원이 누락될 때

#### A. 해당 학원이 academies 테이블에 있는지 확인
```sql
SELECT * FROM academies WHERE id = 'X';
```

#### B. 학원 ID가 올바른지 확인
```sql
-- users 테이블의 academy_id와 academies 테이블의 id 일치 여부
SELECT DISTINCT u.academy_id, a.id 
FROM users u 
LEFT JOIN academies a ON u.academy_id = a.id 
WHERE u.role = 'DIRECTOR';
```

### 3. "학원장 미배정" 학원이 너무 많을 때
- users 테이블에 DIRECTOR 역할 사용자 추가 필요
- Users 페이지에서 학원장 등록: https://superplacestudy.pages.dev/dashboard/admin/users/

---

## 📝 관련 코드 변경

### 파일: `functions/api/admin/academies.ts`

#### 변경 1: academies 테이블 조회 추가
```typescript
// Line 341~360
let academyTable = null;
if (allTables.includes('academies')) academyTable = 'academies';
else if (allTables.includes('Academy')) academyTable = 'Academy';
else if (allTables.includes('ACADEMY')) academyTable = 'ACADEMY';

console.log('📊 Academy table found:', academyTable);

let academiesFromTable = [];

if (academyTable) {
  try {
    const academyQuery = `SELECT * FROM ${academyTable} ORDER BY created_at DESC`;
    const academyResult = await env.DB.prepare(academyQuery).all();
    academiesFromTable = academyResult.results || [];
    console.log(`✅ Found ${academiesFromTable.length} academies from ${academyTable} table`);
  } catch (err) {
    console.error('❌ Error querying academies table:', err.message);
  }
}
```

#### 변경 2: academies 기준 학원 목록 구성
```typescript
// Line 380~530
if (academiesFromTable.length > 0) {
  console.log('📊 Building academies from academies table...');
  
  finalAcademies = await Promise.all(academiesFromTable.map(async (academy) => {
    const academyId = academy.id?.toString();
    const director = directors.find(d => d.academy_id?.toString() === academyId);
    
    // 학생 수, 교사 수, 구독 정보 조회
    // ...
    
    return {
      id: academyId,
      name: academy.name,
      directorName: director?.name || '학원장 미배정', // ✅
      // ...
    };
  }));
}
```

#### 변경 3: 응답 변경
```typescript
// Line 715~733
return new Response(JSON.stringify({
  success: true,
  academies: finalAcademies,
  total: finalAcademies.length,
  source: academiesFromTable.length > 0 ? 'academies_table' : 'directors', // ✅
  message: finalAcademies.length === 0 ? '등록된 학원이 없습니다.' : null
}), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
```

---

## 🔗 GitHub 커밋

- **커밋 ID**: `d04f3bb`
- **URL**: https://github.com/kohsunwoo12345-cmyk/superplace/commit/d04f3bb
- **변경 파일**: `functions/api/admin/academies.ts`
- **추가 라인**: +465
- **삭제 라인**: -18

---

## ⏰ 배포 정보

- **커밋 시간**: 2026-03-02 07:25 UTC
- **배포 플랫폼**: Cloudflare Pages
- **예상 배포 완료**: 2026-03-02 07:28 UTC (약 3분)
- **배포 URL**: https://superplacestudy.pages.dev

---

## ✅ 기대 효과

### 1. 데이터 일관성
- ✅ Users 페이지, Academies 페이지, Bot Management 페이지 모두 동일한 학원 목록 표시
- ✅ 신규 학원 생성 시 즉시 모든 페이지에 반영

### 2. 학원장 미배정 학원 관리
- ✅ 학원장이 없는 학원도 목록에 표시
- ✅ 학원장 배정 전에도 봇 할당 가능
- ✅ "학원장 미배정" 라벨로 명확히 표시

### 3. 확장성
- ✅ academies 테이블이 없으면 자동으로 학원장 기준으로 fallback
- ✅ 다양한 테이블명 지원 (academies, Academy, ACADEMY)
- ✅ User/users 테이블 모두 지원

---

## 📚 추가 참고자료

### 관련 페이지
- Users 관리: https://superplacestudy.pages.dev/dashboard/admin/users/
- Academies 관리: https://superplacestudy.pages.dev/dashboard/admin/academies/
- Bot Management: https://superplacestudy.pages.dev/dashboard/admin/bot-management/

### 관련 API
- `/api/admin/academies` (GET): 학원 목록 조회
- `/api/admin/users` (GET): 사용자 목록 조회
- `/api/admin/bot-assignments` (GET, POST): 봇 할당 관리

---

**작성자**: AI Assistant  
**최종 업데이트**: 2026-03-02 07:25 UTC  
**상태**: ✅ 수정 완료, 배포 대기 중
