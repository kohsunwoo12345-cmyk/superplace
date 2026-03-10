# 🔍 AI 모델 실제 API 호출 테스트 결과 및 해결 방법

## 📊 테스트 결과 요약 (2026-03-10 14:03)

### ✅ 정상 작동 모델 (3개 / 27.3%)
| 모델 | 상태 | 응답 시간 | RAG 지원 |
|------|------|----------|---------|
| Gemini 2.5 Flash | ✅ 완전 작동 | ~1.8초 | ❌ (데이터 없음) |
| Gemini 2.5 Flash Lite | ✅ 완전 작동 | ~1.0초 | ❌ (데이터 없음) |
| Gemini 2.5 Pro | ✅ 완전 작동 | ~3.5초 | ❌ (데이터 없음) |

### ❌ 오류 발생 모델 (8개 / 72.7%)
| 모델 | 에러 코드 | 원인 | 해결 방법 |
|------|----------|------|----------|
| Gemini 2.0 Flash | 404 | 모델 이름 오류 | 코드 수정 필요 |
| DeepSeek OCR-2 | 401 | 잘못된 API 키 | 올바른 ALL_AI_API_KEY 필요 |
| GPT-4o | 429 | 인증 실패/Rate Limit | 올바른 OPENAI_API_KEY 필요 |
| GPT-4o mini | 429 | 인증 실패/Rate Limit | 올바른 OPENAI_API_KEY 필요 |
| GPT-4.1 nano | 429 | 인증 실패/Rate Limit | 올바른 OPENAI_API_KEY 필요 |
| GPT-4.1 mini | 429 | 인증 실패/Rate Limit | 올바른 OPENAI_API_KEY 필요 |
| GPT-5 mini | 429 | 인증 실패/Rate Limit | 올바른 OPENAI_API_KEY 필요 |
| GPT-5.2 | 429 | 인증 실패/Rate Limit | 올바른 OPENAI_API_KEY 필요 |

---

## 🔴 발견된 중요 문제

### 1. RAG 기능 미작동 ⚠️
**현상:**
- 모든 모델에서 `enableRAG: true` 설정해도 `ragEnabled: false` 반환
- `knowledgeUsed: false` - 지식베이스를 활용하지 못함

**원인:**
```typescript
// functions/api/ai/chat.ts:308-324
if (enableRAG && botId && VECTORIZE && GOOGLE_GEMINI_API_KEY) {
  // Vectorize에서 지식 검색
  knowledgeContext = await searchKnowledge(VECTORIZE, queryEmbedding, botId, 3);
  
  if (knowledgeContext) {
    ragEnabled = true;  // ← 지식이 없으면 false로 유지됨
  }
}
```

**문제점:**
1. **Vectorize DB가 비어있음** - 지식베이스에 업로드된 데이터가 없음
2. **botId로 필터링** - 특정 봇에 연결된 지식만 검색
3. **테스트 봇에 지식이 없음** - 테스트용 임시 botId는 실제 DB에 없음

**해결 방법:**
- **Option 1 (권장)**: 웹 UI에서 AI 봇 생성 시 지식베이스 파일 업로드
  1. https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create
  2. 모델 선택 (예: Gemini 2.5 Flash)
  3. 지식베이스 파일 업로드 (PDF, TXT 등)
  4. 봇 생성 후 해당 botId로 테스트

- **Option 2**: RAG 테스트용 더미 데이터 삽입
  ```typescript
  // Vectorize에 테스트 데이터 삽입 필요
  ```

---

### 2. DeepSeek OCR-2 인증 실패 🔑
**에러 메시지:**
```json
{
  "error": {
    "message": "Authentication Fails, Your api key: ****HxXw is invalid",
    "type": "authentication_error"
  }
}
```

**원인:**
- Cloudflare 환경 변수 `ALL_AI_API_KEY`에 잘못된 키 설정됨
- 실제 DeepSeek API 키: `****HxXw` (유효하지 않음)

**해결 방법:**
1. DeepSeek 공식 사이트에서 올바른 API 키 발급
2. Cloudflare Dashboard 업데이트:
   ```
   Dashboard → superplace → Settings → Environment variables
   → ALL_AI_API_KEY 수정 → Redeploy
   ```

---

### 3. OpenAI GPT 모델 인증 실패 🔑
**에러 코드:** `429 (Too Many Requests)`

**가능한 원인:**
1. **잘못된 API 키** - OPENAI_API_KEY가 유효하지 않음
2. **Rate Limit** - 무료 계정 또는 할당량 초과
3. **모델 접근 권한 없음** - GPT-4.1, GPT-5 등은 베타/비공개 모델일 수 있음

**확인 방법:**
```bash
# OpenAI API 키 테스트
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY"
```

**해결 방법:**
1. OpenAI Dashboard에서 API 키 상태 확인
2. 유효한 모델 이름 확인 (GPT-4.1, GPT-5는 존재하지 않을 수 있음)
3. Cloudflare 환경 변수 업데이트

---

### 4. Gemini 2.0 Flash 404 에러 📛
**에러:** `gemini-2.0-flash API request failed` (404)

**원인:**
- Google AI Studio에서 `gemini-2.0-flash` 모델명이 정확하지 않음
- 올바른 모델명: `gemini-2.0-flash-exp` 또는 다른 버전

**해결 방법:**
코드 수정 필요:
```typescript
// functions/api/ai/chat.ts
// 변경 전
{ name: 'gemini-2.0-flash', ... }

// 변경 후 (Google AI Studio 공식 모델명 확인 필요)
{ name: 'gemini-2.0-flash-exp', ... }
// 또는
{ name: 'gemini-exp-1206', ... }
```

---

## 🛠️ 즉시 수정 가능한 항목

### 수정 1: Gemini 2.0 Flash 모델명 수정

현재 상태:
```typescript
// src/app/dashboard/admin/ai-bots/create/page.tsx
{ value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', ... }
```

권장 수정:
```typescript
// Option A: 제거 (404 에러가 계속되면)
// 모델 목록에서 삭제

// Option B: 올바른 모델명으로 변경
{ value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)', ... }
```

### 수정 2: OpenAI 모델명 검증

GPT-4.1, GPT-5 시리즈는 OpenAI 공식 모델이 아닐 가능성:
- ✅ 확인된 모델: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
- ❓ 미확인 모델: `gpt-4.1-nano`, `gpt-4.1-mini`, `gpt-5-mini`, `gpt-5.2`

**권장 사항:**
OpenAI 공식 모델 목록 확인:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY" | jq '.data[].id'
```

존재하지 않는 모델은 목록에서 제거 또는 비활성화

---

## ✅ 최종 수정 체크리스트

### 즉시 수정 (코드)
- [ ] Gemini 2.0 Flash 모델명 수정 또는 제거
- [ ] OpenAI 모델명 검증 (GPT-4.1, GPT-5 확인)
- [ ] 존재하지 않는 모델 제거 또는 주석 처리

### 환경 변수 설정 (Cloudflare Dashboard)
- [ ] `GOOGLE_GEMINI_API_KEY` 확인 (✅ 작동 중)
- [ ] `ALL_AI_API_KEY` 올바른 DeepSeek API 키로 교체
- [ ] `OPENAI_API_KEY` 올바른 OpenAI API 키로 설정
- [ ] 환경 변수 수정 후 **재배포 필수**

### RAG 기능 테스트
- [ ] 웹 UI에서 실제 AI 봇 생성
- [ ] 지식베이스 파일 업로드 (PDF/TXT)
- [ ] 생성된 botId로 RAG 테스트
- [ ] `ragEnabled: true`, `knowledgeUsed: true` 확인

### 프로덕션 검증
- [ ] 환경 변수 설정 완료 후 전체 모델 재테스트
- [ ] 각 모델 기본 채팅 기능 확인
- [ ] RAG 지식베이스 연동 확인
- [ ] 응답 품질 및 속도 확인

---

## 📞 다음 단계

### 1단계: 코드 수정 (권장)
```bash
# Gemini 2.0 Flash 제거 또는 수정
# OpenAI 모델명 검증
# 커밋 및 푸시
```

### 2단계: 환경 변수 설정
```
Cloudflare Dashboard → superplace → Settings → Environment variables

1. ALL_AI_API_KEY: [올바른 DeepSeek API 키]
2. OPENAI_API_KEY: [올바른 OpenAI API 키]
3. Save → Redeploy
```

### 3단계: RAG 기능 활성화
```
1. 웹 UI에서 AI 봇 생성
2. 지식베이스 파일 업로드
3. 생성된 botId로 테스트
```

### 4단계: 전체 재테스트
```bash
cd /home/user/webapp
node test-all-models-live.js
```

**예상 결과 (수정 후):**
- ✅ 완전 작동: 3-4개 (Gemini 모델들)
- ✅ DeepSeek OCR-2: 작동 (API 키 수정 시)
- ✅ OpenAI GPT 모델: 작동 (API 키 설정 & 모델명 검증 시)
- ✅ RAG 지원: 100% (지식베이스 업로드 시)

---

## 🎯 성공 기준

모든 수정 완료 후:
- ✅ 7-10개 모델 모두 정상 작동
- ✅ RAG 기능 `ragEnabled: true` 확인
- ✅ 실제 지식베이스 활용 확인
- ✅ 응답 시간 < 10초
- ✅ 에러율 0%

---

**리포트 작성:** 2026-03-10 14:03  
**테스트 환경:** Production (https://superplacestudy.pages.dev)  
**테스트 스크립트:** `test-all-models-live.js`  
**테스트 결과:** 3/11 모델 작동 (27.3%)  
**주요 이슈:** API 키 오류, 모델명 오류, RAG 데이터 없음
