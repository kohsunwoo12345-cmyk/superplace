# 스토어 제품 하루 채팅 제한 기능 추가

## 📋 개요
스토어 제품에 **한 명당 하루 채팅 제한 (dailyChatLimit)** 필드를 추가하고, 구매한 봇을 사용하는 학원의 각 학생에게 개별적으로 일일 채팅 제한이 적용되도록 구현했습니다.

## 🎯 주요 기능

### 1. 관리자 기능
- **스토어 제품 생성 시 하루 채팅 제한 설정**
  - 위치: https://superplacestudy.pages.dev/dashboard/admin/store-management/create/
  - 필드명: "한 명당 하루 채팅 제한 (개)"
  - 기본값: 15개
  - 설명: 이 봇을 구매한 학원의 각 학생은 하루에 최대 이 개수만큼 채팅할 수 있습니다

### 2. 사용자별 개별 제한
- **학원의 각 학생마다 독립적인 일일 제한 적용**
  - 학생 A가 15개 사용해도 학생 B는 여전히 15개 사용 가능
  - 매일 자정(UTC) 기준으로 카운트 초기화
  - 제한 초과 시 429 에러와 함께 친절한 메시지 표시

### 3. 제한 우선순위
1. **StoreProducts.dailyChatLimit** (최우선) - 구매한 제품의 설정
2. **ai_bot_assignments.dailyUsageLimit** (차선) - 개별 할당 설정
3. **15** (기본값) - 설정이 없는 경우

## 📝 변경 사항

### 프론트엔드 (UI)
**파일**: `src/app/dashboard/admin/store-management/create/page.tsx`

```typescript
// formData에 dailyChatLimit 추가
dailyChatLimit: number | string;  // 하루 채팅 제한 (학생별)

// 초기값 설정
dailyChatLimit: "15",  // 기본 15개

// UI 추가
<label>한 명당 하루 채팅 제한 (개)</label>
<input 
  type="number" 
  name="dailyChatLimit"
  placeholder="15"
  min="1"
/>
```

### 백엔드 (API)

#### 1. Store Products API
**파일**: `functions/api/admin/store-products.ts`

```typescript
// 테이블 스키마에 dailyChatLimit 추가
CREATE TABLE IF NOT EXISTS StoreProducts (
  ...
  dailyChatLimit INTEGER DEFAULT 15,
  ...
)

// POST 요청 시 dailyChatLimit 저장
dailyChatLimit = 15,  // 기본값
```

#### 2. AI Chat API
**파일**: `functions/api/ai/chat.ts`

```typescript
// 스토어 제품에서 dailyChatLimit 가져오기
const storeProduct = await DB.prepare(
  `SELECT dailyChatLimit FROM StoreProducts WHERE id = ?`
).bind(botId).first();

// 우선순위 적용
const dailyUsageLimit = storeProduct?.dailyChatLimit 
  || assignment.dailyUsageLimit 
  || 15;

// 오늘 사용량 조회 및 제한 확인
const usageToday = await DB.prepare(`
  SELECT COALESCE(SUM(messageCount), 0) as totalUsed
  FROM bot_usage_logs
  WHERE assignmentId = ? AND userId = ? AND DATE(createdAt) = ?
`).bind(assignment.id, userId, today).first();

if (usedCount >= dailyUsageLimit) {
  return new Response(JSON.stringify({ 
    error: "Daily limit exceeded", 
    reason: `오늘의 사용 한도(${dailyUsageLimit}회)를 초과했습니다.`
  }), { status: 429 });
}
```

### 데이터베이스 마이그레이션
**파일**: `ADD_DAILY_CHAT_LIMIT_TO_STORE_PRODUCTS.sql`

```sql
-- 컬럼 추가
ALTER TABLE StoreProducts 
ADD COLUMN dailyChatLimit INTEGER DEFAULT 15;

-- 기존 제품 기본값 설정
UPDATE StoreProducts 
SET dailyChatLimit = 15 
WHERE dailyChatLimit IS NULL;
```

## 🚀 배포 정보

- **커밋**: 5a47e1b1
- **배포 URL**: https://superplacestudy.pages.dev/
- **배포 시각**: 2026-03-14 19:11 KST

## 📌 사용 방법

### 관리자
1. https://superplacestudy.pages.dev/dashboard/admin/store-management/create/ 접속
2. 스토어 제품 생성 폼에서 "한 명당 하루 채팅 제한" 입력
3. 예: 20 입력 시, 각 학생은 하루에 최대 20회 채팅 가능
4. 제품 저장

### 학생
- 할당된 봇에서 채팅 시작
- 일일 제한에 도달하면 자동으로 제한 메시지 표시
- 다음날 자정(UTC) 이후 카운트 초기화

## 🗄️ 데이터베이스 마이그레이션 필수

**⚠️ 중요**: Cloudflare D1 데이터베이스에 다음 SQL을 실행해야 합니다.

### Cloudflare Dashboard
1. Cloudflare 대시보드 → Workers & Pages → D1 Database 접속
2. Console 탭에서 SQL 실행:
```sql
ALTER TABLE StoreProducts ADD COLUMN dailyChatLimit INTEGER DEFAULT 15;
UPDATE StoreProducts SET dailyChatLimit = 15 WHERE dailyChatLimit IS NULL;
```

### CLI 사용
```bash
wrangler d1 execute YOUR_DB_NAME --file=ADD_DAILY_CHAT_LIMIT_TO_STORE_PRODUCTS.sql
```

## 📊 동작 예시

### 시나리오: 학원이 수학 봇을 구매 (dailyChatLimit: 20)
- **학생 A**: 오늘 15회 채팅 사용 → 아직 5회 남음
- **학생 B**: 오늘 20회 채팅 사용 → 제한 초과, 내일까지 대기
- **학생 C**: 오늘 5회 채팅 사용 → 아직 15회 남음

### 제한 초과 시 메시지
```json
{
  "error": "Daily limit exceeded",
  "reason": "오늘의 사용 한도(20회)를 초과했습니다.",
  "dailyUsageLimit": 20,
  "usedToday": 20,
  "remainingToday": 0
}
```

## 🔍 확인 방법

### 1. 제품 생성 확인
- https://superplacestudy.pages.dev/dashboard/admin/store-management/create/
- "한 명당 하루 채팅 제한" 필드가 표시되는지 확인
- 숫자 입력 후 저장 테스트

### 2. 제한 동작 확인
- 학생 계정으로 로그인
- 할당된 봇에서 채팅
- 브라우저 개발자 도구 → Network 탭에서 API 응답 확인
- 제한 초과 시 429 상태 코드 확인

### 3. 로그 확인
```
📊 일일 사용량: 15/20
🛒 제품 일일 제한: 20, 할당 제한: null, 최종: 20
✅ 봇 접근 권한 확인 완료: usage=15/20
❌ 일일 사용 한도 초과: 20/20
```

## 🎯 핵심 특징

1. **개별 제한**: 각 학생마다 독립적인 카운터
2. **자동 초기화**: 매일 자정(UTC) 기준으로 카운트 리셋
3. **유연한 설정**: 제품마다 다른 제한 값 설정 가능
4. **우선순위 시스템**: 제품 설정 → 개별 할당 → 기본값
5. **친절한 오류 메시지**: 현재 사용량과 제한 정보 명확히 표시

## 📚 관련 파일

- `src/app/dashboard/admin/store-management/create/page.tsx` - UI
- `functions/api/admin/store-products.ts` - 제품 API
- `functions/api/ai/chat.ts` - 채팅 제한 로직
- `ADD_DAILY_CHAT_LIMIT_TO_STORE_PRODUCTS.sql` - DB 마이그레이션

## ✅ 완료 사항

- [x] 스토어 제품 생성 페이지에 dailyChatLimit 필드 추가
- [x] StoreProducts 테이블에 dailyChatLimit 컬럼 추가
- [x] AI 챗 API에서 제품의 dailyChatLimit 사용
- [x] 사용자별 개별 제한 로직 구현
- [x] 데이터베이스 마이그레이션 SQL 작성
- [x] 코드 커밋 및 배포
- [x] 문서 작성

---

**작성일**: 2026-03-14  
**커밋**: 5a47e1b1  
**작성자**: GenSpark AI Developer
