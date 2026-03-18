# 🚨 RAG 작동 문제 진단 보고서

## 📋 현재 상황 (2026-03-18 11:00 UTC)

### ❌ 핵심 문제 발견

**Worker RAG 엔드포인트가 존재하지 않습니다!**

---

## 🔍 문제 상세 분석

### 1️⃣ 코드에서 호출하는 Worker URL

```typescript
// functions/api/ai-chat.ts (Line 30)
const WORKER_URL = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat';

// functions/api/admin/ai-bots/upload-knowledge.ts (Line 9)
const WORKER_URL = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev';
```

### 2️⃣ 실제 Worker 상태

**테스트 결과:**
```bash
$ curl https://physonsuperplacestudy.kohsunwoo12345.workers.dev/
{"status":"healthy","message":"Naver Crawler API is running on Cloudflare Workers"}

$ curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat
{"error":"Not Found"}  # ❌ 404

$ curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/bot/upload-knowledge
{"error":"Not Found"}  # ❌ 404
```

**결론:** 
- Worker가 **"Naver Crawler API"**로 설정되어 있음
- `/chat` 엔드포인트 없음 ❌
- `/bot/upload-knowledge` 엔드포인트 없음 ❌
- RAG 관련 엔드포인트가 전혀 배포되지 않음 ❌

---

## 🔄 RAG 호출 흐름 분석

### 현재 코드 흐름:

```
사용자 메시지 전송
    ↓
functions/api/ai-chat.ts (Line 222-243)
    ↓
bot.knowledgeBase 확인 ✅
    ↓
callWorkerRAG() 호출 (Line 226)
    ↓
fetch('https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat') ❌ 404
    ↓
Worker 실패 → Fallback 모드
    ↓
callGeminiDirect() (지식베이스는 systemPrompt에 텍스트로 포함)
```

### ⚠️ 문제점:

1. **Worker가 RAG를 처리하지 못함** → 404 에러
2. **Fallback 모드로 작동** → knowledgeBase를 systemPrompt에 전체 텍스트로 추가
3. **Vectorize 임베딩 검색 안 됨** → RAG의 핵심 기능이 작동하지 않음
4. **파일 업로드도 실패** → upload-knowledge 엔드포인트 없음

---

## 📊 현재 작동 방식

### Case 1: knowledgeBase가 텍스트로 저장된 경우
```typescript
// functions/api/ai-chat.ts (Line 250-253)
let systemPrompt = bot.systemPrompt || '';
if (bot.knowledgeBase && bot.knowledgeBase.trim().length > 0) {
  systemPrompt += `\n\n--- 지식 베이스 ---\n${bot.knowledgeBase}\n--- 지식 베이스 끝 ---\n\n위 지식을 참고하여 답변하세요.`;
}
```

**결과:**
- ✅ knowledgeBase의 전체 텍스트를 systemPrompt에 추가
- ❌ Vectorize 임베딩 검색 없음
- ❌ 관련성 높은 청크만 선택하는 RAG 기능 없음
- ⚠️ knowledgeBase가 너무 크면 토큰 제한 초과 가능

### Case 2: knowledgeBase가 JSON 배열로 저장된 경우 (파일 업로드)
```json
[
  {
    "fileName": "example.txt",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "chunks": 10
  }
]
```

**결과:**
- ❌ JSON 메타데이터만 systemPrompt에 추가됨
- ❌ 실제 파일 내용이 전혀 사용되지 않음
- ❌ Vectorize에서 검색할 수 없음

---

## ✅ 해결 방법

### 옵션 1: Worker RAG 엔드포인트 배포 (권장)

**필요한 Worker 엔드포인트:**

1. **POST /chat** - RAG 기반 채팅
   ```json
   {
     "message": "사용자 메시지",
     "botId": "bot-id",
     "enableRAG": true,
     "topK": 5,
     "systemPrompt": "시스템 프롬프트",
     "conversationHistory": []
   }
   ```

2. **POST /bot/upload-knowledge** - 파일 업로드 및 Vectorize 저장
   ```json
   {
     "botId": "bot-id",
     "fileName": "example.txt",
     "fileContent": "파일 내용..."
   }
   ```

3. **POST /bot/generate-embedding** - 임베딩 생성
   ```json
   {
     "text": "임베딩할 텍스트"
   }
   ```

**구현 필요 사항:**
- Cloudflare AI Binding (@cf/baai/bge-m3 모델)
- Vectorize 인덱스 바인딩
- 청크 분할 로직 (500-1000자 단위)
- 임베딩 생성 및 저장
- 유사도 검색 (topK)

### 옵션 2: Cloudflare Pages Functions에서 직접 처리

**장점:**
- Worker 배포 불필요
- 모든 로직이 한 곳에 집중

**단점:**
- Pages Functions는 AI Binding과 Vectorize를 지원하지 않음 ❌
- 외부 임베딩 API 필요 (OpenAI, Cohere 등)
- 별도 Vector DB 필요 (Pinecone, Weaviate 등)

### 옵션 3: 간단한 텍스트 검색 (임시 방편)

**현재 상태 유지 + 개선:**
```typescript
// knowledgeBase를 청크로 분할하여 관련성 높은 부분만 선택
const chunks = splitIntoChunks(bot.knowledgeBase, 500);
const relevantChunks = simpleKeywordSearch(data.message, chunks, 3);
const context = relevantChunks.join('\n\n');
systemPrompt += `\n\n--- 관련 지식 ---\n${context}\n--- 끝 ---`;
```

**장점:** 간단하고 빠르게 구현 가능  
**단점:** 의미 기반 검색이 아닌 키워드 매칭만 가능

---

## 🧪 현재 상태 확인 방법

### 1. Cloudflare 대시보드에서 Worker 확인
```
https://dash.cloudflare.com/
→ Workers & Pages
→ physonsuperplacestudy
→ Settings → Triggers
```

**확인 사항:**
- 배포된 Worker 코드 확인
- Bindings 확인 (AI, Vectorize)
- 라우트 확인 (/chat, /bot/upload-knowledge)

### 2. 봇의 knowledgeBase 확인
```sql
SELECT 
  id, 
  name, 
  LENGTH(knowledgeBase) as kb_length,
  SUBSTR(knowledgeBase, 1, 100) as kb_preview
FROM ai_bots 
WHERE isActive = 1 
  AND knowledgeBase IS NOT NULL 
  AND knowledgeBase != '';
```

### 3. 실제 RAG 테스트
```bash
# Worker 직접 호출
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -d '{
    "message": "테스트 질문",
    "botId": "actual-bot-id",
    "enableRAG": true
  }'
```

---

## 📝 결론

### 현재 상태:
- ❌ Worker RAG 엔드포인트 없음 (404)
- ⚠️ Fallback 모드로 작동 (전체 knowledgeBase를 systemPrompt에 추가)
- ❌ Vectorize 임베딩 검색 없음
- ❌ 파일 업로드 기능 작동 안 함
- ⚠️ JSON 메타데이터만 저장되고 실제 내용은 사용 안 됨

### 필요 조치:
1. **Worker에 RAG 엔드포인트 배포** (가장 중요)
2. **Vectorize 인덱스 생성 및 바인딩**
3. **AI Binding 설정** (@cf/baai/bge-m3)
4. **기존 knowledgeBase 데이터 마이그레이션**

### 임시 대응:
- 현재는 knowledgeBase 전체를 systemPrompt에 추가하는 방식으로 작동
- 짧은 지식베이스는 정상 작동
- 긴 지식베이스는 토큰 제한 초과 가능

---

**마지막 업데이트:** 2026-03-18 11:00 UTC  
**테스트 일시:** 2026-03-18 11:00 UTC  
**Worker URL:** https://physonsuperplacestudy.kohsunwoo12345.workers.dev  
**Worker 상태:** ❌ RAG 엔드포인트 없음 (Naver Crawler API만 존재)
