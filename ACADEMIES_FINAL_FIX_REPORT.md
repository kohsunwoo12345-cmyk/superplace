# 학원 관리 동기화 최종 수정 보고서

## 문제 상황
- SQL 쿼리: 132명의 학원장(DIRECTOR) 존재
- UI 표시: 학원 관리, AI 봇 할당, 학원장 제한 설정 페이지에서 **3개 학원만 표시**
- 원인: 대부분의 학원장이 유효한 `academyId`를 가지고 있지 않음

## 근본 원인 분석

### 데이터베이스 상태
- User 테이블: 132명의 DIRECTOR 역할 사용자 존재
- Academy 테이블: 3개의 학원 레코드만 존재 (ID: 1, 107, 208)
- 문제: 나머지 129명의 학원장은 `academyId` 컬럼이 NULL

### 왜 academyId가 NULL인가?
1. **회원가입 로직 확인** (`functions/api/auth/signup.js`):
   - DIRECTOR 회원가입 시 `academyName` **필수**
   - `academyId` 자동 생성 (`generateId('academy')`)
   - Academy 테이블에 INSERT 후 User 테이블 INSERT
   - **이론적으로는** 모든 DIRECTOR가 academyId를 가져야 함

2. **실제 데이터 불일치 가능성**:
   - Academy 테이블 INSERT 실패했지만 User INSERT는 성공
   - 데이터 마이그레이션 중 Academy 레코드 누락
   - 테스트/개발 중 직접 DB 조작으로 User만 INSERT
   - Academy 테이블 truncate/delete 실행 이력

## 해결 방안

### 접근 방식
**모든 학원장을 표시하되, academyId가 없는 경우 임시 ID 생성**

```typescript
// Before (문제)
for (const director of directors) {
  const academyId = director.academy_id?.toString();
  if (academyId && !processedAcademyIds.has(academyId)) {
    // academyId가 NULL이면 skip됨 ❌
  }
}

// After (해결)
for (const director of directors) {
  // academyId가 없으면 director ID 기반 임시 ID 생성
  const academyId = (director.academy_id || `dir-${director.id}`)?.toString();
  
  if (!processedAcademyIds.has(academyId)) {
    academyIdToDirector.set(academyId, director);
    // 모든 학원장 포함 ✅
  }
}
```

### 주요 변경 사항

#### 1. academyId Fallback 로직
```typescript
const directorAcademyId = director.academy_id || `dir-${director.id}`;
const hasRealAcademyId = !!director.academy_id;
```

#### 2. 조건부 데이터 조회
- `hasRealAcademyId === true`: 학생/교사 수 조회
- `hasRealAcademyId === false`: 0명으로 처리 (성능 최적화)

```typescript
if (hasRealAcademyId) {
  // 학생 수 조회 SQL 실행
  // 교사 수 조회 SQL 실행
} else {
  // skip (academyId가 fake이므로 조회 불가)
}
```

#### 3. 학원 정보 폴백
```typescript
const academyName = academyInfo?.name || `${director.name}의 학원`;
const academyAddress = academyInfo?.address || '';
const academyPhone = academyInfo?.phone || director.phone || '';
const academyEmail = academyInfo?.email || director.email || '';
```

#### 4. 상세 로깅 추가
```typescript
console.log(`📊 Directors with academyId: ${directorsWithAcademyId.length}`);
console.log(`⚠️ Directors without academyId: ${directorsWithoutAcademyId.length}`);
console.log(`🎯 Unique academy IDs from directors: ${uniqueAcademyIds.size}`);
console.log(`   - ${withValid.length} with valid academyId`);
console.log(`   - ${withoutValid.length} without academyId (using director ID)`);
```

## 배포 정보

### Git 커밋
- **Commit**: `1a871b6`
- **Message**: `fix(academies): 모든 학원장 표시 - academyId 없는 경우 director ID 사용`
- **파일 변경**: 2 files changed, 72 insertions(+), 40 deletions(-)
- **GitHub URL**: https://github.com/kohsunwoo12345-cmyk/superplace/commit/1a871b6

### 배포 시간
- **Push 완료**: 2026-03-02 08:55 UTC
- **예상 배포 완료**: 2026-03-02 09:00 UTC (~5분 후)

### 배포 URL
- **Production**: https://superplacestudy.pages.dev
- **확인 페이지**:
  - https://superplacestudy.pages.dev/dashboard/admin/academies/
  - https://superplacestudy.pages.dev/dashboard/admin/bot-management/
  - https://superplacestudy.pages.dev/dashboard/admin/director-limitations/

## 테스트 시나리오

### 1. 학원 수 확인
```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://superplacestudy.pages.dev/api/admin/academies" | \
  jq '.total'

# Expected: 132 (또는 unique academyId 수)
# Before: 3
```

### 2. academyId 분포 확인
Cloudflare Pages 로그에서 확인:
```
📊 Directors with academyId: X
⚠️ Directors without academyId: Y
🎯 Unique academy IDs from directors: 132
   - 3 with valid academyId
   - 129 without academyId (using director ID)
```

### 3. UI 확인
각 페이지에서 학원 목록 개수 확인:
- **학원 관리**: 132개 카드 표시
- **AI 봇 할당**: 드롭다운에 132개 옵션
- **학원장 제한 설정**: 테이블에 132행 표시

## 예상 결과

### 학원 목록 구성
- **3개 학원**: Academy 테이블에 실제 존재 (ID: 1, 107, 208)
  - 학원명, 주소, 연락처 등 정확한 정보
  - 학생/교사 수 정확한 카운트
  - 구독 정보 조회 가능

- **129개 학원**: academyId 없는 학원장 기반 생성 (ID: `dir-19`, `dir-45`, ...)
  - 학원명: `"고희준의 학원"` (학원장 이름 기반)
  - 학생/교사 수: 0명 (실제 academyId 없어서 조회 불가)
  - 주소/연락처: 학원장 정보 사용
  - 구독 정보: Free 플랜 기본값

### 사용자 경험
- ✅ 모든 학원장이 관리 페이지에 표시됨
- ✅ 학원장별로 권한 설정 가능
- ✅ AI 봇 할당 가능
- ⚠️ 일부 학원은 "가짜" 학원 (학생/교사 없음)

## 장기 해결 방안

### 데이터 정리 필요
129명의 학원장에게 올바른 Academy 레코드 생성:

```sql
-- 1. academyId가 NULL인 학원장 찾기
SELECT id, name, email, academyId 
FROM User 
WHERE role = 'DIRECTOR' AND (academyId IS NULL OR academyId NOT IN (
  SELECT id FROM Academy
));

-- 2. 각 학원장에 대해 Academy 레코드 생성
INSERT INTO Academy (id, name, code, address, phone, email, subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt)
VALUES 
  ('academy-new-1', '학원명', 'CODE123', '주소', '전화번호', 'email@example.com', 'FREE', 10, 2, 1, datetime('now'), datetime('now'));

-- 3. User 테이블 academyId 업데이트
UPDATE User 
SET academyId = 'academy-new-1' 
WHERE id = 학원장ID;
```

### 회원가입 로직 강화
`functions/api/auth/signup.js`:
```javascript
// Academy INSERT 실패 시 User INSERT도 롤백
try {
  await db.prepare('INSERT INTO Academy ...').run();
  await db.prepare('INSERT INTO User ...').run();
} catch (error) {
  // 트랜잭션 롤백 또는 명시적 삭제
  console.error('Signup failed, rolling back');
  throw error;
}
```

## 모니터링

### Cloudflare Pages 로그 확인
```bash
# 실시간 로그
npx wrangler pages deployment tail --follow

# 특정 배포 로그
npx wrangler pages deployment list
npx wrangler pages deployment tail --deployment=DEPLOYMENT_ID
```

### 로그 키워드
- `✅ Found directors:` - 총 학원장 수
- `📊 Directors with academyId:` - 유효한 academyId 보유 수
- `⚠️ Directors without academyId:` - NULL academyId 수
- `🎯 Unique academy IDs from directors:` - 고유 학원 수

## 다음 작업: RAG 구현

Vectorize 인덱스 생성 후:
1. `wrangler.toml`에서 Vectorize 바인딩 활성화
2. 재배포
3. 기존 봇 데이터 임베딩 마이그레이션
4. RAG 기능 테스트

상세 가이드: `/home/user/webapp/VECTORIZE_SETUP.md`
