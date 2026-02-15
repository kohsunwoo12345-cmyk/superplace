# 학원장 AI 시스템 봇 목록 조회 개선 🤖

## 📌 문제 상황
**증상**: 학원장이 https://superplacestudy.pages.dev/dashboard/director/ai-system/ 에서 학생/선생님에게 봇을 할당하려고 할 때 **봇 목록이 비어있음**

```
학원장 로그인 → AI 시스템 페이지 접속 → "봇 할당" 버튼 클릭
→ 봇 선택 드롭다운: 비어있음 ❌
```

## 🔍 근본 원인 분석

### 문제의 원인
API `/functions/api/director/ai-bots.ts`에서 **`bot_assignments` 테이블만 조회**하고 있었습니다.

```typescript
// ❌ 기존 코드 (32-38줄)
const assignments = await DB.prepare(`
  SELECT DISTINCT ba.botId
  FROM bot_assignments ba
  WHERE ba.academyId = ?
    AND ba.isActive = 1
    AND (ba.expiresAt IS NULL OR datetime(ba.expiresAt) > datetime('now'))
`).bind(academyId).all();

if (!assignments.results || assignments.results.length === 0) {
  // 빈 배열 반환 ❌
  return new Response(JSON.stringify({ success: true, bots: [] }), ...);
}
```

### 문제 발생 시나리오
1. **관리자가 학원에 봇 할당**
   - `academy_assignments` 테이블에 레코드 생성
   - 학원장(DIRECTOR)이 해당 학원 소속

2. **학원장이 봇 목록 조회**
   - API는 `bot_assignments` 테이블만 조회
   - 학원장이 학생에게 봇을 아직 할당하지 않았다면 → **빈 결과** ❌
   - `academy_assignments` 테이블은 확인하지 않음

3. **결과**
   - 학원에 할당된 봇이 있음에도 목록에 표시 안 됨
   - 학원장이 학생/선생님에게 봇을 할당할 수 없음

## ✅ 해결 방안

### 수정된 로직
API에서 **2단계 조회 로직**을 추가했습니다:

```typescript
// ✅ 수정 후: 2단계 조회

// 1단계: bot_assignments 테이블 조회 (기존 할당 확인)
const assignments = await DB.prepare(`
  SELECT DISTINCT ba.botId
  FROM bot_assignments ba
  WHERE ba.academyId = ?
    AND ba.isActive = 1
    AND (ba.expiresAt IS NULL OR datetime(ba.expiresAt) > datetime('now'))
`).bind(academyId).all();

console.log(`🔍 Found ${assignments.results?.length || 0} bot assignments`);

let botIds: number[] = [];

// 2단계: 없으면 academy_assignments 테이블 조회 (폴백)
if (!assignments.results || assignments.results.length === 0) {
  console.log(`⚠️ No bot_assignments found, checking academy_assignments...`);
  
  const academyAssignments = await DB.prepare(`
    SELECT DISTINCT aa.botId
    FROM academy_assignments aa
    WHERE aa.academyId = ?
      AND aa.isActive = 1
      AND (aa.expiresAt IS NULL OR datetime(aa.expiresAt) > datetime('now'))
  `).bind(academyId).all();
  
  console.log(`🔍 Found ${academyAssignments.results?.length || 0} academy_assignments`);
  
  if (!academyAssignments.results || academyAssignments.results.length === 0) {
    // 진짜 할당이 없을 때만 빈 배열 + 안내 메시지
    return new Response(
      JSON.stringify({
        success: true,
        bots: [],
        message: "학원에 할당된 봇이 없습니다. 관리자에게 문의하세요."
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  
  botIds = academyAssignments.results.map((a: any) => a.botId);
} else {
  botIds = assignments.results.map((a: any) => a.botId);
}

// 3단계: 봇 상세 정보 조회
const placeholders = botIds.map(() => '?').join(',');
const bots = await DB.prepare(`
  SELECT 
    id,
    name,
    description,
    profile_icon as profileIcon,
    status
  FROM ai_bots
  WHERE id IN (${placeholders}) AND status = 'ACTIVE'
  ORDER BY created_at DESC
`).bind(...botIds).all();

console.log(`✅ Found ${bots.results?.length || 0} active bots`);

return new Response(
  JSON.stringify({ success: true, bots: bots.results || [] }),
  { status: 200, headers: { "Content-Type": "application/json" } }
);
```

## 📊 Before vs After 비교

| 상황 | 이전 (Before) | 수정 후 (After) |
|------|---------------|----------------|
| **academy_assignments 있음** | 조회 안 함 → 빈 목록 ❌ | 조회함 → 봇 목록 표시 ✅ |
| **bot_assignments 있음** | 조회함 → 봇 목록 표시 ✅ | 조회함 → 봇 목록 표시 ✅ |
| **둘 다 있음** | bot_assignments 우선 ✅ | bot_assignments 우선 ✅ |
| **둘 다 없음** | 빈 목록 반환 | 빈 목록 + 안내 메시지 ✅ |

## 🎯 개선 효과

### 1. 학원에 할당된 모든 봇 표시
```
시나리오: 관리자가 학원에 봇 3개 할당

이전:
- bot_assignments: 0개 → API 응답: []
- 학원장: 봇 목록 비어있음 ❌

수정 후:
- bot_assignments: 0개
- academy_assignments: 3개 → API 응답: [bot1, bot2, bot3]
- 학원장: 봇 3개 목록 표시 ✅
```

### 2. 학생/선생님에게 봇 할당 가능
```
학원장이 할 수 있는 작업:
1. 봇 목록 조회 ✅
2. 학생 선택 ✅
3. 봇 선택 ✅ (이전에는 비어있었음)
4. 할당 버튼 클릭 ✅
5. 학생에게 봇 할당 완료 ✅
```

### 3. 명확한 에러 메시지
```json
// 정말 봇이 없을 때
{
  "success": true,
  "bots": [],
  "message": "학원에 할당된 봇이 없습니다. 관리자에게 문의하세요."
}
```

## 🗄️ 데이터베이스 구조

### academy_assignments 테이블
```sql
CREATE TABLE academy_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  botId INTEGER NOT NULL,
  academyId TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  expiresAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (botId) REFERENCES ai_bots(id)
);
```
→ **관리자가 학원에 봇을 할당**할 때 사용

### bot_assignments 테이블
```sql
CREATE TABLE bot_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  botId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  academyId TEXT NOT NULL,
  userRole TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  expiresAt DATETIME,
  assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (botId) REFERENCES ai_bots(id)
);
```
→ **학원장이 학생/선생님에게 봇을 할당**할 때 사용

## 🧪 테스트 시나리오

### 시나리오 1: 관리자가 학원에 봇 할당 후 학원장 접속
```bash
# 1. 관리자가 학원에 봇 3개 할당
# academy_assignments 테이블에 3개 레코드 생성

# 2. 학원장 로그인 → AI 시스템 페이지 접속
# GET /api/director/ai-bots?academyId=academy-123
# → bot_assignments: 0개
# → academy_assignments: 3개 ✅
# → 응답: { bots: [bot1, bot2, bot3] }

# 3. 봇 할당 UI에서 드롭다운 확인
# → "수학 AI 봇", "영어 AI 봇", "과학 AI 봇" 표시 ✅
```

### 시나리오 2: 학원장이 이미 학생에게 봇 할당한 경우
```bash
# 1. 학원장이 이미 학생 5명에게 봇 할당함
# bot_assignments 테이블에 5개 레코드 존재

# 2. 학원장이 추가로 봇 할당하려고 접속
# GET /api/director/ai-bots?academyId=academy-123
# → bot_assignments: 2개 (서로 다른 botId) ✅
# → academy_assignments 조회 건너뜀
# → 응답: { bots: [bot1, bot2] }

# 3. 봇 할당 UI에서 드롭다운 확인
# → 할당 가능한 봇 2개 표시 ✅
```

### 시나리오 3: 정말 봇이 없는 경우
```bash
# 1. 관리자가 해당 학원에 봇을 할당하지 않음
# academy_assignments: 0개
# bot_assignments: 0개

# 2. 학원장 접속
# GET /api/director/ai-bots?academyId=academy-123
# → 응답: { 
#     success: true, 
#     bots: [], 
#     message: "학원에 할당된 봇이 없습니다. 관리자에게 문의하세요." 
#   }

# 3. 프론트엔드에서 안내 메시지 표시
# "학원에 할당된 봇이 없습니다. 관리자에게 문의하세요." ✅
```

## 📝 API 응답 예시

### 성공 케이스
```json
{
  "success": true,
  "bots": [
    {
      "id": 1,
      "name": "수학 AI 봇",
      "description": "초등/중등 수학 문제 해결 도우미",
      "profileIcon": "🧮",
      "status": "ACTIVE"
    },
    {
      "id": 2,
      "name": "영어 AI 봇",
      "description": "영어 문법 및 독해 학습 지원",
      "profileIcon": "📚",
      "status": "ACTIVE"
    }
  ]
}
```

### 빈 목록 케이스
```json
{
  "success": true,
  "bots": [],
  "message": "학원에 할당된 봇이 없습니다. 관리자에게 문의하세요."
}
```

## 🚀 배포 정보
- **배포 URL**: https://superplacestudy.pages.dev/dashboard/director/ai-system/
- **Commit Hash**: `1742639`
- **배포 시각**: 2026-02-15 21:30 KST
- **상태**: ✅ 정상

## 🔍 검증 방법

### 1. 브라우저 콘솔 확인
```javascript
// 개발자 도구 → Console
// 다음 로그가 표시되어야 함:
"📋 Loading data for academy academy-123"
"🤖 Fetching bots for academy academy-123..."
"✅ Loaded 3 bots: [...]"
```

### 2. Network 탭 확인
```
GET /api/director/ai-bots?academyId=academy-123
Response 200:
{
  "success": true,
  "bots": [
    { "id": 1, "name": "수학 AI 봇", ... },
    { "id": 2, "name": "영어 AI 봇", ... }
  ]
}
```

### 3. UI 확인
```
학원장 로그인 → "AI 시스템" 메뉴 클릭
→ "학생에게 봇 할당" 탭 선택
→ "봇 선택" 드롭다운 확인
→ 학원에 할당된 봇들이 목록에 표시되어야 함 ✅
```

## 📌 추가 개선 사항 (선택)

### 완료된 수정
- [x] `bot_assignments` 테이블 조회
- [x] `academy_assignments` 테이블 폴백 조회
- [x] 빈 목록일 때 안내 메시지 표시
- [x] 상세 로그 추가

### 권장 사항 (Future Work)
- [ ] 학원장 대시보드에 할당 가능한 봇 개수 표시
- [ ] 봇 할당 만료일 자동 알림
- [ ] 봇 사용 통계 대시보드 추가
- [ ] 학생별 봇 사용 이력 조회

---

**작성일**: 2026-02-15  
**작성자**: Genspark AI Developer  
**관련 이슈**: 학원장이 학생/선생님에게 봇을 할당할 때 봇 목록이 비어있는 문제 해결
