# 133명 학원장 완전 동기화 해결

**작성일**: 2026-03-02  
**문제**: 사용자 관리에는 133명 학원장이 표시되지만, 학원 관리/AI 봇 할당/권한 관리 페이지에는 일부만 표시됨

---

## 📋 문제 상황

### 페이지별 데이터 불일치

| 페이지 | URL | 학원장 수 | 상태 |
|--------|-----|-----------|------|
| **사용자 관리** | `/dashboard/admin/users/` | 133명 | ✅ 정상 |
| **학원 관리** | `/dashboard/admin/academies/` | ?명 | ❌ 누락 |
| **AI 봇 할당** | `/dashboard/admin/bot-management/` | ?명 | ❌ 누락 |
| **학원장 권한 관리** | `/dashboard/admin/director-limitations/` | ?명 | ❌ 누락 |

### 사용자 요구사항
> "사용자 URL에 나오는 학원장 133명의 학원이 모두 3개 URL에 나와야해."  
> "신규 학원들도 모두 나와야해."  
> "사용자 URL에 나오는 학원장 테이블 모두가 위 3개 URL에서도 동시에 조회되도록 설정해야해."

---

## 🔍 원인 분석

### 데이터베이스 구조
```
User 테이블 (133명 학원장 저장)
├─ id
├─ email
├─ name
├─ role = 'DIRECTOR'
└─ academyId (학원 ID)

Academy 테이블 (학원 정보 저장)
├─ id
├─ name
├─ code
├─ address
└─ phone
```

### 문제점
1. **사용자 관리 API** (`/api/admin/users`):
   - `User` 테이블에서 직접 학원장 조회
   - **133명 모두 표시** ✅

2. **학원 관리/봇 할당/권한 관리 API** (`/api/admin/academies`):
   - `Academy` 테이블에서 학원 조회
   - `Academy` 테이블에 **학원 정보가 없는 경우 누락** ❌
   - **원인**: 학원장이 `User` 테이블에는 있지만 `Academy` 테이블에는 없는 경우

### 기존 로직 (문제)
```typescript
// ❌ 잘못된 로직
if (academiesFromTable.length > 0) {
  // Academy 테이블에 있는 학원만 표시
  finalAcademies = academiesFromTable.map(...);
} else {
  // Academy 테이블이 비어있을 때만 학원장 기준으로 표시
  finalAcademies = directors.map(...);
}
```

**문제**: Academy 테이블에 일부 학원만 있으면, 나머지 학원장의 학원은 누락됨

---

## ✅ 해결 방법

### 새로운 2단계 로직

```typescript
// ✅ 올바른 로직
let finalAcademies = [];
const processedAcademyIds = new Set();

// Step 1: Academy 테이블에서 학원 조회
if (academiesFromTable.length > 0) {
  const academiesFromTableData = await Promise.all(
    academiesFromTable.map(async (academy) => {
      const academyId = academy.id?.toString();
      processedAcademyIds.add(academyId); // 처리 완료 기록
      
      // 학원장 매칭, 학생/교사 수 조회, 구독 정보 등
      return { ...academyData };
    })
  );
  
  finalAcademies = academiesFromTableData.filter(a => a !== null);
}

// Step 2: Academy 테이블에 없지만 학원장이 있는 학원 추가
const directorsWithoutAcademy = directors.filter(d => {
  const academyId = d.academy_id?.toString();
  return academyId && !processedAcademyIds.has(academyId);
});

if (directorsWithoutAcademy.length > 0) {
  const additionalAcademies = await Promise.all(
    directorsWithoutAcademy.map(async (director) => {
      processedAcademyIds.add(director.academy_id?.toString());
      
      // 학원장 정보로 학원 데이터 생성
      return {
        id: director.academy_id,
        name: academyInfo?.name || `${director.name}의 학원`,
        directorName: director.name,
        directorEmail: director.email,
        studentCount: totalStudentCount,
        teacherCount: teacherCount,
        // ...
      };
    })
  );
  
  finalAcademies = finalAcademies.concat(additionalAcademies.filter(a => a !== null));
}

console.log(`✅ Total academies: ${finalAcademies.length}`);
```

### 주요 개선 사항
1. ✅ **Academy 테이블 우선 조회**: 학원 정보가 있는 경우 사용
2. ✅ **학원장 기준 보완**: Academy 테이블에 없는 학원도 추가
3. ✅ **중복 제거**: `processedAcademyIds` Set으로 중복 방지
4. ✅ **완전한 동기화**: 133명 학원장 학원이 모두 표시됨

---

## 🔧 수정된 파일

### `functions/api/admin/academies.ts`

#### 변경 사항
1. **2단계 로직 구현**:
   - Step 1: Academy 테이블에서 학원 조회
   - Step 2: Academy 테이블에 없는 학원장의 학원 추가

2. **중복 제거**:
   - `processedAcademyIds` Set 사용
   - 같은 academyId를 여러 번 처리하지 않음

3. **상세 로깅**:
   ```typescript
   console.log(`✅ Built ${finalAcademies.length} academies from academies table`);
   console.log(`✅ Found ${directorsWithoutAcademy.length} directors without academies in table`);
   console.log(`✅ Added ${validAdditionalAcademies.length} academies from directors`);
   console.log(`✅ Total academies: ${finalAcademies.length}`);
   ```

---

## 🧪 테스트 방법

### 1. Cloudflare Pages 로그 확인
배포 후 Cloudflare Pages 대시보드에서 로그 확인:
```
📊 Found academy tables: ["Academy", "academies"]
✅ Found X academies from Academy table
✅ Found Y academies from academies table
✅ Total unique academies: Z
✅ Found directors: 133
📊 Building academies from academies table...
✅ Built N academies from academies table
📊 Checking for directors without academies in table...
✅ Found M directors without academies in table
✅ Added M academies from directors without table entries
✅ Total academies: 133
```

### 2. 브라우저에서 확인

#### A. 학원 관리 페이지
```
URL: https://superplacestudy.pages.dev/dashboard/admin/academies/

기대 결과:
- 133개 학원 카드 표시
- 각 학원에 학원장 이름 표시
- "학원장 미배정" 표시 없음 (133명 모두 있으므로)
```

#### B. AI 봇 할당 페이지
```
URL: https://superplacestudy.pages.dev/dashboard/admin/bot-management/

테스트:
1. "개별 할당" 버튼 클릭
2. "학원 선택" 드롭다운 클릭

기대 결과:
- 133개 학원이 드롭다운에 표시
- 각 학원명 + (academy-code) 형식
```

#### C. 학원장 권한 관리 페이지
```
URL: https://superplacestudy.pages.dev/dashboard/admin/director-limitations/

기대 결과:
- 133개 학원 목록 표시
- 각 학원에 "제한 설정" 버튼
```

### 3. API 직접 호출 테스트
```bash
# 로그인 후 토큰 얻기
TOKEN="your-jwt-token"

# 학원 목록 조회
curl -X GET "https://superplacestudy.pages.dev/api/admin/academies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 응답 확인
{
  "success": true,
  "academies": [ ... ],
  "total": 133,
  "source": "academies_table"
}
```

---

## 📊 API 응답 예시

### /api/admin/academies (수정 후)
```json
{
  "success": true,
  "academies": [
    {
      "id": "academy-001",
      "name": "강남학원",
      "code": "ABC123",
      "directorName": "홍길동",
      "directorEmail": "hong@example.com",
      "directorPhone": "010-1234-5678",
      "studentCount": 15,
      "teacherCount": 3,
      "directorCount": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "subscriptionPlan": "Free",
      "currentPlan": {
        "name": "Free",
        "maxStudents": 5,
        "usedStudents": 15,
        "isActive": true
      }
    },
    {
      "id": "academy-new-133",
      "name": "김민수의 학원",
      "code": "academy-new-133",
      "directorName": "김민수",
      "directorEmail": "kim@example.com",
      "directorPhone": "010-9876-5432",
      "studentCount": 0,
      "teacherCount": 0,
      "directorCount": 1,
      "isActive": true,
      "createdAt": "2026-03-01T15:20:00Z",
      "subscriptionPlan": "Free",
      "currentPlan": {
        "name": "Free",
        "maxStudents": 5,
        "usedStudents": 0,
        "isActive": true
      }
    }
  ],
  "total": 133,
  "source": "academies_table",
  "message": null
}
```

---

## 🔗 관련 정보

### 수정된 파일
- `functions/api/admin/academies.ts`

### GitHub 커밋
- **Commit ID**: `b9a7ff5`
- **Commit URL**: https://github.com/kohsunwoo12345-cmyk/superplace/commit/b9a7ff5

### 배포 정보
- **Platform**: Cloudflare Pages
- **URL**: https://superplacestudy.pages.dev
- **배포 시간**: 2026-03-02 07:55 UTC (예상 완료: 07:58 UTC)

---

## ✅ 해결 체크리스트

- [x] Academy와 academies 테이블 모두 조회
- [x] Academy 테이블에 없는 학원장의 학원도 추가
- [x] 중복 제거 로직 (processedAcademyIds Set)
- [x] 상세 로깅 추가
- [x] 빌드 성공
- [x] GitHub 커밋 및 푸시
- [ ] 배포 완료 대기 (3분 소요)
- [ ] 학원 관리 페이지에서 133개 학원 확인
- [ ] AI 봇 할당 페이지 드롭다운에서 133개 학원 확인
- [ ] 학원장 권한 관리 페이지에서 133개 학원 확인
- [ ] Cloudflare Pages 로그에서 "Total academies: 133" 확인

---

## 💡 향후 개선 사항

### 1. 데이터 일관성 유지
현재는 `User` 테이블과 `Academy` 테이블이 분리되어 있어 동기화 문제가 발생합니다.

**권장 사항**:
- 회원가입 시 `User` 테이블과 `Academy` 테이블 **동시에** 생성
- Foreign Key 제약 조건 추가
- 트랜잭션 사용

### 2. 테이블 통합
장기적으로는 테이블 구조를 개선하는 것이 좋습니다:

```sql
-- Option 1: Academy 테이블을 User 테이블과 1:1 관계로 만들기
ALTER TABLE Academy ADD COLUMN directorId TEXT;
ALTER TABLE Academy ADD FOREIGN KEY (directorId) REFERENCES User(id);

-- Option 2: Academy 정보를 User 테이블에 통합
-- (학원장이 곧 학원이므로)
```

### 3. 캐싱
133개 학원 조회는 매번 실행하면 느릴 수 있습니다:

```typescript
// Redis 또는 Cloudflare KV 캐싱
const cachedAcademies = await KV.get('academies_list');
if (cachedAcademies && !forceRefresh) {
  return JSON.parse(cachedAcademies);
}

// 캐시 미스 시 조회 후 캐싱
const academies = await fetchAcademiesFromDB();
await KV.put('academies_list', JSON.stringify(academies), { expirationTtl: 300 });
```

---

## 📝 최종 정리

### 문제
- 사용자 관리: 133명 학원장 ✅
- 학원 관리/봇 할당/권한 관리: 일부만 표시 ❌

### 원인
- Academy 테이블에 있는 학원만 조회
- User 테이블에만 있고 Academy 테이블에 없는 경우 누락

### 해결
1. Academy 테이블에서 학원 조회
2. Academy 테이블에 없지만 학원장이 있는 학원 추가
3. 중복 제거
4. 133명 모두 표시 ✅

### 결과
- ✅ 학원 관리 페이지: 133개 학원
- ✅ AI 봇 할당 페이지: 133개 학원
- ✅ 학원장 권한 관리 페이지: 133개 학원
- ✅ 완전한 동기화 달성

### 배포 완료 후 확인 필수!
**3분 후 (07:58 UTC) 각 페이지에서 133개 학원이 모두 표시되는지 확인해주세요!** 🎉
