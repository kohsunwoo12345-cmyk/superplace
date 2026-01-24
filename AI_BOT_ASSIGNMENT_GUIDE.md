# AI 봇 할당 시스템 가이드

## 개요
관리자가 제작한 AI 봇을 학원장에게 할당하면, 학원장은 https://superplace-study.vercel.app/dashboard/ai-gems 에서 봇을 사용할 수 있습니다.

## 시스템 작동 방식

### 1. AI 봇 제작 (관리자)
- 관리자가 `/dashboard/admin/ai-bots-management`에서 AI 봇 제작
- 봇 정보가 `AIBot` 테이블에 저장됨
- 필드:
  - `botId`: 봇의 고유 식별자 (예: "math-tutor")
  - `name`: 한글 이름
  - `nameEn`: 영문 이름
  - `description`: 설명
  - `icon`: 아이콘 이모지
  - `systemPrompt`: AI에게 주는 지침

### 2. AI 봇 할당 (관리자)
- 관리자가 `/dashboard/admin/bot-assignment`에서 학원장에게 봇 할당
- 학원 검색 기능으로 특정 학원 찾기
- "할당" 버튼 클릭
- `BotAssignment` 테이블에 기록:
  - `userId`: 학원장 ID
  - `botId`: 봇의 식별자 (AIBot.botId와 일치)
  - `isActive`: true (활성화 상태)

### 3. AI 봇 사용 (학원장)
- 학원장이 `/dashboard/ai-gems`에 접속
- API `/api/director/available-bots` 호출
- 할당받은 봇만 표시됨
- 봇 클릭 시 채팅 페이지로 이동

## 데이터 흐름

```
AIBot 테이블
├─ id: cmkqg61c90001unexjluei2pn (DB 레코드 ID)
├─ botId: "ㅁㄴ" (봇 식별자)
├─ name: "ㅁㄴㅇ"
└─ ...

BotAssignment 테이블
├─ userId: "cmXXXX" (학원장 ID)
├─ botId: "ㅁㄴ" (AIBot.botId와 매칭)
└─ isActive: true

API 응답 (/api/director/available-bots)
├─ id: "ㅁㄴ" (botId 사용)
├─ name: "ㅁㄴㅇ"
└─ ...
```

## 주의사항

### botId vs id
- **데이터베이스 레코드 ID** (`id`): `cmkqg61c90001unexjluei2pn` (자동 생성)
- **봇 식별자** (`botId`): `"ㅁㄴ"` (사용자 지정)
- ⚠️ **BotAssignment 테이블**은 `botId`를 사용합니다
- ⚠️ **API 응답**에서도 `id` 필드에 `botId` 값을 사용합니다

### 할당 상태
- `isActive: true`: 학원장이 볼 수 있음
- `isActive: false`: 할당 취소됨, 학원장이 볼 수 없음

### API 권한
- **관리자 (SUPER_ADMIN)**: `/api/ai-bots` → 모든 봇 조회
- **학원장 (DIRECTOR)**: `/api/director/available-bots` → 할당된 봇만 조회
- **학생 (STUDENT)**: `/api/ai-bots` → 모든 봇 조회 (학원장이 학생에게 부여할 수 있음)

## 트러블슈팅

### 학원장이 봇을 볼 수 없는 경우

1. **할당 확인**
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 특정 학원장의 할당 조회
const assignments = await prisma.botAssignment.findMany({
  where: {
    userId: "학원장_ID",
    isActive: true,
  },
  include: {
    user: { select: { name: true } },
  },
});

console.log(assignments);
```

2. **봇 정보 확인**
```javascript
// botId로 봇 조회
const bot = await prisma.aIBot.findFirst({
  where: {
    botId: "봇_ID",
    isActive: true,
  },
});

console.log(bot);
```

3. **할당 활성화**
```javascript
// 할당이 있지만 isActive: false인 경우
await prisma.botAssignment.updateMany({
  where: {
    userId: "학원장_ID",
    botId: "봇_ID",
  },
  data: {
    isActive: true,
  },
});
```

## 현재 상태 (2026-01-24)

### 데이터베이스
- 봇: "ㅁㄴㅇ" (botId: "ㅁㄴ") ✅
- 할당: 꾸메땅 학원장에게 할당됨 ✅
- 상태: isActive: true ✅

### 배포
- 코드 변경사항 커밋됨 ✅
- PR 생성됨: #2 ✅
- 배포 대기 중 ⏳

학원장이 https://superplace-study.vercel.app/dashboard/ai-gems 에 접속하면 할당받은 봇을 볼 수 있습니다.
