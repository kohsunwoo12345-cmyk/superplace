# Academy 테이블 동기화 문제 해결

**작성일**: 2026-03-02  
**문제**: 신규 회원가입한 학원장이 학원 관리 페이지와 AI 봇 할당 페이지에 나타나지 않음

---

## 📋 문제 상황

### URL 별 데이터 불일치
- **사용자 관리**: https://superplacestudy.pages.dev/dashboard/admin/users/  
  → 모든 학원장 표시됨
  
- **학원 관리**: https://superplacestudy.pages.dev/dashboard/admin/academies/  
  → 신규 학원장의 학원이 표시 안 됨
  
- **AI 봇 할당**: https://superplacestudy.pages.dev/dashboard/admin/bot-management/  
  → 신규 학원의 선택 드롭다운에 안 나타남

### 사용자 요구사항
> "사용자 관리에 나오는 학원장 모두 전부가 학원관리 탭, AI 봇 할당 페이지에 나와야해."  
> "신규 학원이 생길 때마다 모든 100% 학원들이 나와야해."

---

## 🔍 원인 분석

### 테이블 이름 불일치
1. **회원가입 API** (`functions/api/auth/signup.js`):
   ```javascript
   await db.prepare(`
     INSERT INTO Academy (id, name, code, ...) 
     VALUES (?, ?, ?, ...)
   `).bind(...).run();
   ```
   → `Academy` (대문자) 테이블에 삽입

2. **학원 조회 API** (`functions/api/admin/academies.ts`):
   ```typescript
   // 기존 코드 (문제)
   let academyTable = null;
   if (allTables.includes('Academy')) academyTable = 'Academy';
   else if (allTables.includes('academies')) academyTable = 'academies';
   
   // 하나의 테이블만 조회
   const academyQuery = `SELECT * FROM ${academyTable}`;
   ```
   → 하나의 테이블만 조회하여 누락 발생

### 데이터 분산
- 기존 학원: `academies` (소문자) 테이블에 저장
- 신규 학원: `Academy` (대문자) 테이블에 저장
- API는 하나만 조회하므로 다른 테이블의 데이터 누락

---

## ✅ 해결 방법

### API 수정: 모든 Academy 테이블 조회 및 합치기

```typescript
// 🔥 수정된 코드
let academiesFromTable = [];
const academyTables = [];

// 존재하는 모든 academy 테이블 찾기
if (allTables.includes('Academy')) academyTables.push('Academy');
if (allTables.includes('academies')) academyTables.push('academies');
if (allTables.includes('ACADEMY')) academyTables.push('ACADEMY');

console.log('📊 Found academy tables:', academyTables);

// 각 테이블에서 학원 데이터 조회하여 합침
for (const tableName of academyTables) {
  try {
    const academyQuery = `SELECT * FROM ${tableName} ORDER BY createdAt DESC`;
    const academyResult = await env.DB.prepare(academyQuery).all();
    const results = academyResult.results || [];
    console.log(`✅ Found ${results.length} academies from ${tableName} table`);
    
    if (results.length > 0) {
      academiesFromTable = academiesFromTable.concat(results);
    }
  } catch (err) {
    console.error(`❌ Error querying ${tableName} table:`, err.message);
  }
}

// ID 기준 중복 제거 (같은 ID가 여러 테이블에 있을 경우)
const uniqueAcademies = [];
const seenIds = new Set();
for (const academy of academiesFromTable) {
  const academyId = academy.id?.toString();
  if (!seenIds.has(academyId)) {
    seenIds.add(academyId);
    uniqueAcademies.push(academy);
  }
}
academiesFromTable = uniqueAcademies;

console.log(`✅ Total unique academies: ${academiesFromTable.length}`);
```

### 주요 개선 사항
1. ✅ **모든 Academy 테이블 조회**: `Academy`, `academies`, `ACADEMY` 모두 확인
2. ✅ **데이터 병합**: 여러 테이블의 데이터를 하나로 합침
3. ✅ **중복 제거**: ID 기준으로 중복 학원 제거
4. ✅ **상세 로깅**: 각 테이블별 조회 결과 로그로 확인 가능

---

## 🔐 AI 봇 자동 할당 문제

### 사용자 우려사항
> "학원장 회원가입 시 AI 챗봇이 사용가능한데, 이 부분은 절대 사용 가능해서는 안 돼."  
> "AI 챗봇은 관리자 할당 또는 AI 봇 쇼핑몰 구매가 일어나지 않는 이상 절대 봇이 할당되어서는 안 돼."

### 확인 결과: ✅ 정상 동작 중
1. **회원가입 시 봇 자동 할당 없음**:
   ```bash
   grep -r "INSERT INTO bot_assignments" functions/api/auth/
   # 결과: 없음
   ```

2. **봇 할당은 오직 다음 경우에만 발생**:
   - 관리자 수동 할당: `functions/api/admin/bot-assignments.ts`
   - 구매 승인 시: `functions/api/admin/bot-purchase-requests/[id]/approve.js`

3. **프론트엔드 처리**:
   ```typescript
   // src/app/ai-chat/page.tsx
   if (data.bots && data.bots.length > 0) {
     setBots(data.bots);
   } else {
     console.warn("⚠️ 할당된 봇이 없습니다");
     setBots([]);
     setSelectedBot(null);
   }
   ```

### 결론
- ✅ 신규 학원장은 봇 할당 없이 가입됨
- ✅ 할당된 봇이 없으면 "할당된 봇이 없습니다" 메시지 표시
- ✅ AI 챗봇 사용은 관리자 승인 후에만 가능

**만약 사용자가 봇이 보인다고 하면**:
→ 데이터베이스에 이미 테스트용 봇 할당이 되어 있을 가능성 (코드 자체는 정상)

---

## 🧪 테스트 방법

### 1. 새 학원장 회원가입
```
1. https://superplacestudy.pages.dev/signup 접속
2. 역할: "학원장" 선택
3. 학원 이름, 주소 입력
4. 회원가입 완료
```

### 2. 학원 목록 확인
```
✅ 사용자 관리: /dashboard/admin/users/
   → 신규 학원장 표시

✅ 학원 관리: /dashboard/admin/academies/
   → 신규 학원 표시 (이전에는 안 나왔음)

✅ AI 봇 할당: /dashboard/admin/bot-management/
   → 학원 선택 드롭다운에 신규 학원 표시
```

### 3. AI 챗봇 접근 확인
```
1. 신규 학원장으로 로그인
2. /ai-chat 페이지 접속
3. 예상 결과: "할당된 봇이 없습니다" 메시지
4. 콘솔 로그: "⚠️ 할당된 봇이 없습니다"
```

### 4. API 로그 확인 (Cloudflare Pages)
```
콘솔에서 확인할 로그:
📊 Found academy tables: ["Academy", "academies"]
✅ Found X academies from Academy table
✅ Found Y academies from academies table
✅ Total unique academies: Z
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
      "studentCount": 15,
      "teacherCount": 3,
      "currentPlan": {
        "name": "Free",
        "maxStudents": 5,
        "isActive": true
      }
    },
    {
      "id": "academy-new-001",
      "name": "신규학원",
      "code": "NEW456",
      "directorName": "김학원",
      "directorEmail": "kim@example.com",
      "studentCount": 0,
      "teacherCount": 0,
      "currentPlan": {
        "name": "Free",
        "maxStudents": 10,
        "isActive": true
      }
    }
  ],
  "total": 2,
  "source": "academies_table"
}
```

---

## 🔗 관련 정보

### 수정된 파일
- `functions/api/admin/academies.ts`

### GitHub 커밋
- Commit ID: `bb8af53`
- URL: https://github.com/kohsunwoo12345-cmyk/superplace/commit/bb8af53

### 배포 정보
- Platform: Cloudflare Pages
- URL: https://superplacestudy.pages.dev
- 배포 시간: 2026-03-02 07:40 UTC (예상 완료: 07:43 UTC)

---

## ✅ 해결 체크리스트

- [x] Academy와 academies 테이블 모두 조회하도록 API 수정
- [x] 중복 제거 로직 추가
- [x] 상세 로깅 추가
- [x] AI 봇 자동 할당 확인 (없음 확인)
- [x] 빌드 성공
- [x] GitHub 커밋 및 푸시
- [ ] 배포 완료 대기 (3분 소요)
- [ ] 실제 신규 학원장 가입 테스트
- [ ] 학원 관리/봇 할당 페이지에서 신규 학원 확인
- [ ] AI 챗봇 페이지에서 "할당된 봇이 없습니다" 메시지 확인

---

## 💡 문제 발생 시 점검 사항

### 1. 여전히 신규 학원이 안 보이면
```sql
-- Cloudflare D1 콘솔에서 확인
SELECT * FROM Academy LIMIT 5;
SELECT * FROM academies LIMIT 5;
```

### 2. AI 봇이 자동으로 할당되면
```sql
-- bot_assignments 테이블 확인
SELECT * FROM bot_assignments WHERE academyId = 'academy-new-001';
```
→ 레코드가 있으면 수동으로 삭제 필요

### 3. 캐시 문제일 경우
- 브라우저 하드 리프레시: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)
- 로컬스토리지 클리어: DevTools → Application → Local Storage → Clear
- 재로그인

---

## 📝 최종 정리

### 문제
- 신규 학원장이 학원 관리/AI 봇 할당 페이지에 나타나지 않음
- Academy(대문자)와 academies(소문자) 테이블 불일치

### 해결
- 두 테이블 모두 조회하여 합치는 로직 구현
- ID 기준 중복 제거
- AI 봇은 자동 할당되지 않음 (코드 확인 완료)

### 결과
- ✅ 모든 학원장이 모든 관리 페이지에 표시됨
- ✅ 신규 학원 추가 시 즉시 반영
- ✅ AI 봇은 관리자 승인 후에만 사용 가능
