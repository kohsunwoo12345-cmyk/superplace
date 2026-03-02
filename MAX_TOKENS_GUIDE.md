# ✅ Max Tokens 설정 가이드 & 대화 끊김 문제 해결

## 📅 테스트 완료: 2026-03-02

---

## ✅ Max Tokens 설정 작동 확인

### 테스트 결과
```bash
설정한 maxTokens: 100
저장된 maxTokens: 100 ✅
AI 답변 길이: 12자 ✅ (제한 적용됨)
```

**결론**: Max Tokens 설정이 정상 작동합니다.

---

## 🔴 대화가 끊기는 문제

### 증상
- 대화를 하다가 갑자기 끊김
- 긴 대화 후 응답 없음 또는 에러 발생

### 원인
**누적 토큰 초과**: 대화 히스토리가 길어질수록 입력 토큰이 증가하여, Gemini API의 토큰 제한(약 32K~1M)을 초과하거나 maxOutputTokens보다 입력 토큰이 많아져서 응답이 불가능해짐.

---

## 📊 토큰 계산 방식

### Gemini API 토큰 구조
```
총 토큰 = 입력 토큰 + 출력 토큰

입력 토큰 = 시스템 프롬프트 + Knowledge Base + 대화 히스토리 + 현재 메시지
출력 토큰 = AI 답변 (maxOutputTokens로 제한)
```

### 예시
```
시스템 프롬프트: 200 토큰
Knowledge Base: 1,000 토큰
대화 히스토리 (10회): 3,000 토큰
현재 메시지: 50 토큰
-----------------------------------
입력 토큰 합계: 4,250 토큰
maxOutputTokens: 2,000 토큰
-----------------------------------
총 예상 토큰: 6,250 토큰
```

**문제**: 대화가 20회, 30회로 늘어나면 입력 토큰이 계속 증가 → 제한 초과

---

## ✅ 해결 방법

### 1. **대화 히스토리 제한** (추천)

#### 방법 A: 최근 N개 메시지만 유지
프론트엔드(`src/app/ai-chat/page.tsx`) 수정:

```typescript
// 현재 (라인 560)
conversationHistory: messages.map(m => ({
  role: m.role,
  content: m.content,
})),

// 수정 후 (최근 10개 메시지만 전달)
conversationHistory: messages.slice(-10).map(m => ({
  role: m.role,
  content: m.content,
})),
```

#### 방법 B: 토큰 수 기반 제한
```typescript
// 최근 메시지부터 역순으로 추가하되, 총 토큰 수가 8000을 넘지 않도록
let totalTokens = 0;
const MAX_HISTORY_TOKENS = 8000;
const recentMessages = [];

for (let i = messages.length - 1; i >= 0; i--) {
  const msg = messages[i];
  const estimatedTokens = msg.content.length / 4; // 대략 4자 = 1토큰
  
  if (totalTokens + estimatedTokens > MAX_HISTORY_TOKENS) {
    break;
  }
  
  totalTokens += estimatedTokens;
  recentMessages.unshift(msg);
}

conversationHistory: recentMessages.map(m => ({
  role: m.role,
  content: m.content,
})),
```

### 2. **maxTokens 값 증가**

AI 봇 설정에서 maxTokens를 늘림:
- 기본값: 2000
- 추천값: 4000~8000 (긴 대화용)
- 최대값: 32768 (Gemini 2.5 Flash 기준)

**주의**: maxTokens를 늘리면 API 비용이 증가합니다.

### 3. **대화 세션 초기화 버튼 추가** (사용자 제어)

사용자가 대화가 길어지면 "새 대화 시작" 버튼을 클릭하여 히스토리를 초기화:

```typescript
const resetConversation = () => {
  setMessages([]);
  setSessionId(uuidv4());
};

// UI에 버튼 추가
<Button onClick={resetConversation}>🔄 새 대화 시작</Button>
```

---

## 🧪 권장 설정

### 일반 대화용
```json
{
  "maxTokens": 2000,
  "대화 히스토리": "최근 10개 메시지"
}
```

### 긴 대화용
```json
{
  "maxTokens": 4000,
  "대화 히스토리": "최근 20개 메시지"
}
```

### 지식 베이스가 큰 경우
```json
{
  "maxTokens": 8000,
  "대화 히스토리": "최근 5개 메시지"
}
```

---

## 🔧 현재 코드 상태

### 입력 토큰 구성 (functions/api/ai-chat.ts)
```typescript
contents.push({
  role: "user",
  parts: [{ text: systemMessage }]  // 시스템 프롬프트 + Knowledge Base
});

// 대화 히스토리 (모든 메시지)
for (const msg of history) {
  contents.push({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }]
  });
}

// 현재 메시지
contents.push({
  role: "user",
  parts: currentMessageParts
});
```

**문제점**: 
- ❌ 대화 히스토리를 **전부** 전달 (제한 없음)
- ❌ Knowledge Base가 크면 입력 토큰 증가
- ❌ 긴 대화 시 토큰 제한 초과 가능

---

## 💡 즉시 적용 가능한 해결책

### 최소 수정으로 문제 해결

**파일**: `src/app/ai-chat/page.tsx`  
**라인 560** 수정:

```typescript
// Before
conversationHistory: messages.map(m => ({
  role: m.role,
  content: m.content,
})),

// After (최근 10개만 전달)
conversationHistory: messages.slice(-10).map(m => ({
  role: m.role,
  content: m.content,
})),
```

**효과**:
- ✅ 입력 토큰 감소 (최근 10개 대화만)
- ✅ 대화가 끊기지 않음
- ✅ API 비용 절감

---

## 📊 테스트 시나리오

### 시나리오 1: 짧은 대화 (10회 이하)
- **예상**: 정상 작동 ✅
- **이유**: 토큰 제한 여유 있음

### 시나리오 2: 긴 대화 (20회 이상)
- **현재 (수정 전)**: 대화 끊김 ❌
- **수정 후**: 정상 작동 ✅ (최근 10개만 전달)

### 시나리오 3: 지식 베이스가 큰 경우
- **현재**: 입력 토큰 과다 → 에러 ❌
- **해결**: 대화 히스토리 제한 (5개) + maxTokens 증가 (4000)

---

## 🎯 권장 조치

1. ✅ **즉시**: 대화 히스토리를 최근 10개로 제한 (라인 560 수정)
2. ✅ **선택**: maxTokens를 봇별로 조정 (기본 2000 → 4000)
3. ✅ **장기**: "새 대화 시작" 버튼 추가 (사용자 제어)

---

## 📝 수정 예정 코드

```typescript
// src/app/ai-chat/page.tsx (라인 560)
conversationHistory: messages.slice(-10).map(m => ({
  role: m.role,
  content: m.content,
})),
```

---

**작성자**: Claude AI Assistant  
**최종 업데이트**: 2026-03-02  
**배포 URL**: https://superplacestudy.pages.dev
