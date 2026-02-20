# 🏫 학원 목록 실제 데이터 표시 완전 가이드

## 📋 현재 상황
- **문제**: 학원 목록 페이지에 임의 데이터(서울 수학 학원 등)가 표시되거나 0개로 표시됨
- **요구사항**: https://superplacestudy.pages.dev/dashboard/admin/users/에 등록된 **실제 학원장**의 학원 데이터가 표시되어야 함

## 🎯 올바른 데이터 구조

### 학원장(DIRECTOR) = 학원(Academy)
```
학원장 계정
├── 기본 정보 (이름, 이메일, 전화번호)
├── academy_id (소속 학원 ID)
└── 학원 데이터
    ├── 등록된 학생 수 (academy_id 기준)
    ├── 등록된 교사 수 (academy_id 기준)
    ├── 사용 중인 요금제
    └── AI 사용량 통계
```

## 🔧 해결 방법

### 1단계: 데이터베이스 진단
Cloudflare D1 Console에서 `FIND_REAL_ACADEMIES.sql` 실행:
```bash
# 파일 위치: /home/user/webapp/FIND_REAL_ACADEMIES.sql
```

#### 주요 확인 사항
```sql
-- 1. 학원장이 있는가?
SELECT COUNT(*) FROM users WHERE role = 'DIRECTOR';

-- 2. 학원장에게 academy_id가 있는가?
SELECT id, name, email, academy_id 
FROM users 
WHERE role = 'DIRECTOR';

-- 3. 학원장의 academy_id로 학생/교사를 찾을 수 있는가?
SELECT 
  academy_id,
  COUNT(*) as count
FROM users 
WHERE role IN ('STUDENT', 'TEACHER')
GROUP BY academy_id;
```

### 2단계: API 로직
새로운 `/api/admin/academies` API는:
1. **User 테이블에서 role='DIRECTOR' 조회**
2. **각 학원장의 academy_id 기준으로:**
   - 같은 academy_id를 가진 학생 수 집계
   - 같은 academy_id를 가진 교사 수 집계
3. **Academy 테이블이 있으면** 추가 정보 가져오기 (학원명, 주소 등)
4. **없으면** `{학원장 이름}의 학원` 형태로 표시

### 3단계: 동적 컬럼 매핑
API는 다양한 컬럼명 변형을 자동 감지:
- `academy_id` / `academyId` / `ACADEMY_ID`
- `created_at` / `createdAt` / `CREATED_AT`
- `phone_number` / `phoneNumber` / `phone`

## 📊 API 응답 예시

### 성공 시
```json
{
  "success": true,
  "total": 3,
  "source": "directors",
  "academies": [
    {
      "id": "academy-001",
      "name": "김학원의 학원",
      "address": "서울시 강남구",
      "phone": "02-1234-5678",
      "email": "kim@academy.com",
      "directorName": "김학원",
      "directorEmail": "kim@academy.com",
      "directorPhone": "010-1234-5678",
      "studentCount": 25,
      "teacherCount": 3,
      "directorCount": 1,
      "isActive": true,
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ]
}
```

### 학원장 없음
```json
{
  "success": true,
  "total": 0,
  "source": "directors",
  "academies": [],
  "message": "등록된 학원장이 없습니다. https://superplacestudy.pages.dev/dashboard/admin/users/에서 학원장을 먼저 등록하세요."
}
```

## 🐛 디버깅 방법

### 브라우저 콘솔 스크립트
```javascript
(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ 토큰이 없습니다');
    return;
  }
  
  console.log('🔑 토큰:', token.substring(0, 20) + '...');
  
  const res = await fetch('/api/admin/academies', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('📡 Status:', res.status);
  
  const data = await res.json();
  console.log('📦 Response:', data);
  console.log('✅ Success:', data.success);
  console.log('📊 Total:', data.total);
  console.log('👥 Academies count:', data.academies?.length || 0);
  
  if (data.message) {
    console.warn('⚠️ Message:', data.message);
  }
  
  if (data.error) {
    console.error('❌ Error:', data.error);
  }
  
  if (data.availableTables) {
    console.log('📋 Available tables:', data.availableTables);
  }
  
  if (data.academies && data.academies.length > 0) {
    console.log('🏫 First academy:', data.academies[0]);
  }
})();
```

### Cloudflare Pages 로그 확인
1. Cloudflare Dashboard → Workers & Pages
2. `superplacestudy` 프로젝트 선택
3. **Logs** 탭 클릭
4. 다음 로그 확인:
   - `📋 All tables: [...]`
   - `👥 Using User table: users`
   - `✅ Found directors: X`
   - `📋 First director: {...}`
   - `🎉 Success! Returning X academies`

## 📝 체크리스트

### 데이터베이스 체크
- [ ] `users` 또는 `User` 테이블 존재
- [ ] `role = 'DIRECTOR'` 사용자 1명 이상 존재
- [ ] 학원장에게 `academy_id` 값이 있음 (NULL이 아님)
- [ ] 같은 `academy_id`를 가진 `STUDENT` 또는 `TEACHER` 존재

### API 체크
- [ ] `/api/admin/academies` 호출 시 `status: 200`
- [ ] `success: true` 응답
- [ ] `total > 0` 및 `academies` 배열에 데이터 있음
- [ ] Cloudflare Logs에 `✅ Found directors` 로그 있음

### 프론트엔드 체크
- [ ] 페이지 로드 시 에러 팝업 없음
- [ ] 학원 카드가 표시됨
- [ ] 각 카드에 학생 수, 교사 수 표시
- [ ] 학원장 이름이 정확히 표시됨

## 🚨 문제 해결

### Case 1: "등록된 학원장이 없습니다"
**원인**: User 테이블에 `role = 'DIRECTOR'` 데이터 없음

**해결**:
1. https://superplacestudy.pages.dev/dashboard/admin/users/ 접속
2. 학원장 계정 생성
3. 역할을 **DIRECTOR**로 설정
4. `academy_id` 값 입력 (예: "academy-001")

### Case 2: 학원은 있지만 학생/교사 수가 0
**원인**: 학생/교사의 `academy_id`가 학원장의 `academy_id`와 일치하지 않음

**해결**:
```sql
-- D1 Console에서 실행
-- 1. 학원장의 academy_id 확인
SELECT id, name, academy_id FROM users WHERE role = 'DIRECTOR';

-- 2. 학생들의 academy_id 확인
SELECT id, name, academy_id FROM users WHERE role = 'STUDENT' LIMIT 10;

-- 3. 불일치하면 수정
UPDATE users 
SET academy_id = 'academy-001' 
WHERE role = 'STUDENT' AND academy_id IS NULL;
```

### Case 3: D1_ERROR: no such column
**원인**: 컬럼명이 예상과 다름 (snake_case vs camelCase)

**해결**: API가 자동으로 감지하므로 Cloudflare Logs 확인
- 로그에서 `📋 User table columns: [...]` 확인
- `🔧 Column mapping: {...}` 확인

### Case 4: 테이블 자체가 없음
**원인**: 데이터베이스 마이그레이션 필요

**해결**: Schema 파일 실행 필요 (별도 요청)

## 🎯 최종 목표 검증

### 정상 작동 확인
1. **페이지 접속**: https://superplacestudy.pages.dev/dashboard/admin/academies/
2. **에러 없음**: 팝업 또는 콘솔 에러 없음
3. **실제 데이터**: 학원장 이름이 "김학원", "이원장" 등 실제 등록된 이름
4. **정확한 통계**: 각 학원의 학생 수, 교사 수가 정확히 표시
5. **학원장 연결**: https://superplacestudy.pages.dev/dashboard/admin/users/의 학원장과 일치

## 📚 관련 파일
- **API**: `functions/api/admin/academies.ts`
- **프론트엔드**: `src/app/dashboard/admin/academies/page.tsx`
- **진단 SQL**: `FIND_REAL_ACADEMIES.sql`
- **체크 SQL**: `CHECK_REAL_DIRECTORS.sql`

## 🔄 다음 단계
1. **즉시**: `FIND_REAL_ACADEMIES.sql` 실행하여 결과 확인
2. **배포 후**: 5분 대기 후 페이지 새로고침
3. **문제 지속**: SQL 실행 결과와 Cloudflare Logs 복사해서 제공
