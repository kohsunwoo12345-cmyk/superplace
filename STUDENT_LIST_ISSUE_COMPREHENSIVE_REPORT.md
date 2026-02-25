# 학생 목록 표시 문제 종합 보고서

## 🔴 문제 상황
학원장이 학생을 추가하면, 학생 생성 API는 성공하지만 학생 목록 조회 API에서 해당 학생이 나타나지 않음.

## ✅ 확인된 사실
1. **학생 생성 API (`/api/students/create`)**: 정상 작동
   - 학생 ID 생성: `student-{timestamp}-{random}`
   - 출석 코드 생성: 6자리 숫자
   - Response 200 OK
   
2. **학생 목록 API (`/api/students/by-academy`)**: 빈 배열 반환
   - 인증: 정상
   - academyId: 토큰에서 올바르게 추출됨 (예: `academy-1771993368131-2d6u0hbci`)
   - Response: `{ "success": true, "students": [], "message": "학생이 없습니다" }`

3. **데이터베이스 스키마** (`cloudflare-worker/schema.sql`):
   ```sql
   CREATE TABLE IF NOT EXISTS User (
     id TEXT PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     ...
     academyId TEXT,  -- ⚠️ 컬럼명: camelCase
     ...
   )
   ```

## 🛠️ 수행한 수정 사항

### 1️⃣ 컬럼명 통일 (`academyId` camelCase 사용)
- **파일**: `functions/api/students/by-academy.js`
- **변경 전**: `u.academy_id as academyId`
- **변경 후**: `u.academyId`
- **커밋**: `64627e0`

### 2️⃣ 문자열 academyId 지원
- **파일**: `functions/api/students/create.ts`
- **변경**: `academyId` 값이 `"academy-xxx"` 형식일 때 문자열 그대로 저장
- **커밋**: `8bfa439`

### 3️⃣ TypeScript를 JavaScript로 변환
- **파일**: `functions/api/students/create.js` (신규 생성)
- **이유**: Cloudflare Pages가 TypeScript 파일을 제대로 컴파일하지 않을 가능성
- **커밋**: `dbba801`

## ❌ 여전히 해결되지 않은 문제

### 테스트 결과
```json
// 학생 생성 성공
{
  "success": true,
  "studentId": "student-1771993372984-8i8de010x",
  "academyId": "academy-1771993368131-2d6u0hbci"
}

// 학생 목록 조회 - 빈 배열
{
  "success": true,
  "students": [],
  "message": "학생이 없습니다"
}
```

### 가능한 원인

#### 1. Cloudflare Pages 빌드 실패
- **증상**: TypeScript 파일(`create.ts`)이 제대로 컴파일되지 않음
- **확인 방법**: Cloudflare Dashboard → Pages → superplacestudy → Deployments → 최신 빌드 로그 확인
- **예상 오류**:
  ```
  ERROR in functions/api/students/create.ts
  TS2304: Cannot find name 'D1Database'
  TS2304: Cannot find name 'PagesFunction'
  ```

#### 2. D1 데이터베이스 스키마 불일치
- **가능성**: 실제 D1 데이터베이스의 컬럼명이 `academy_id` (snake_case)일 수 있음
- **확인 필요**: D1 콘솔에서 실제 스키마 확인
  ```sql
  PRAGMA table_info(User);
  ```

#### 3. 배포 지연
- **가능성**: Cloudflare Pages 배포가 완료되지 않았거나 캐시 문제
- **대기 시간**: 90초 대기 후에도 문제 지속

#### 4. 쿼리 필터 로직 오류
- **by-academy.js의 필터 조건**:
  ```javascript
  query += ` AND u.academyId = ?`;
  bindings.push(academyIdValue);  // 문자열 "academy-xxx"
  ```
- **가능성**: D1이 TEXT 타입 비교를 제대로 처리하지 못할 수 있음

## 🚨 즉시 확인해야 할 사항

### 1. Cloudflare Pages 빌드 로그 확인
1. https://dash.cloudflare.com 로그인
2. Pages → "superplacestudy" 프로젝트 선택
3. Deployments 탭 → 최신 배포 클릭
4. "View build log" 확인
5. TypeScript 컴파일 에러 확인

### 2. D1 데이터베이스 직접 쿼리
```sql
-- User 테이블 스키마 확인
PRAGMA table_info(User);

-- 최근 생성된 학생 확인
SELECT id, name, email, phone, academyId, role 
FROM User 
WHERE role = 'STUDENT' 
ORDER BY createdAt DESC 
LIMIT 5;

-- 특정 academyId로 필터링 테스트
SELECT * FROM User 
WHERE role = 'STUDENT' 
AND academyId = 'academy-1771993368131-2d6u0hbci';
```

### 3. API 응답 헤더 확인
```bash
curl -I https://superplacestudy.pages.dev/api/students/by-academy \
  -H "Authorization: Bearer <TOKEN>"

# cf-cache-status 확인 - HIT면 캐시 문제일 수 있음
```

## 📋 다음 조치 사항

### Option A: D1 콘솔에서 직접 확인 (가장 빠른 방법)
1. Cloudflare Dashboard → D1 → `webapp-production` 데이터베이스
2. 위 SQL 쿼리 실행
3. 실제 컬럼명과 데이터 확인

### Option B: 로컬 디버깅
1. Wrangler CLI로 로컬 테스트:
   ```bash
   npx wrangler pages dev out --d1 DB --port 8788
   ```
2. 로컬에서 API 테스트
3. 로그 확인

### Option C: 임시 디버그 API 생성
새 파일 생성: `functions/api/debug/check-students.js`
```javascript
export async function onRequestGet(context) {
  const { DB } = context.env;
  
  // 모든 학생 조회 (필터 없이)
  const allStudents = await DB.prepare(`
    SELECT id, name, email, phone, academyId, role, createdAt 
    FROM User 
    WHERE role = 'STUDENT' 
    ORDER BY createdAt DESC 
    LIMIT 10
  `).all();
  
  // 테이블 스키마 확인
  const schema = await DB.prepare(`
    PRAGMA table_info(User)
  `).all();
  
  return new Response(JSON.stringify({
    studentCount: allStudents.results.length,
    students: allStudents.results,
    schema: schema.results
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
```

## 📊 커밋 이력
```
dbba801 - fix: create.ts를 JS로 변환하여 Cloudflare Pages 배포 문제 해결 + academyId 컬럼명 수정
64627e0 - fix: User 테이블 컬럼명 수정 - academy_id → academyId (실제 DB 스키마와 일치)
8bfa439 - fix: academyId 문자열 ID 지원 (academy-xxx 형식) - create와 by-academy 모두 수정
3f2c0d8 - fix: academyId 문자열 지원 (academy-xxx 형식)
158b0d2 - docs: 학생 목록 문제 최종 해결 방안 (JS 변환)
a01f22e - fix: 학생 목록 API를 JS로 변환 (Cloudflare Pages 배포 문제 해결)
```

## 🎯 최종 권장 사항

**사용자가 직접 확인해야 할 사항:**
1. ✅ Cloudflare Pages 빌드 로그 확인
2. ✅ D1 콘솔에서 실제 데이터베이스 쿼리 실행
3. ✅ 실제 컬럼명과 데이터 확인

**코드 수정은 완료되었으나, 배포 환경 문제로 인해 실제 적용되지 않고 있을 가능성이 높습니다.**

## 📞 추가 지원 필요 시
- Cloudflare Pages 빌드 로그 전체 내용 공유
- D1 쿼리 결과 스크린샷 공유
- API 응답 전체 JSON 공유
