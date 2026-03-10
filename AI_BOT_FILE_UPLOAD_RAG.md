# AI 봇 파일 업로드 Vectorize RAG 구현 완료

## ✅ 구현 완료 사항

### 1️⃣ **Pages API: 파일 업로드 및 Vectorize 저장**
- **엔드포인트**: `/api/admin/ai-bots/upload-knowledge`
- **기능**:
  - 파일 내용을 1000자 단위로 청크 분할
  - 각 청크에 대해 Gemini Embedding 생성 (768차원)
  - Worker를 통해 Vectorize에 업로드
  - DB에 파일 정보 저장

### 2️⃣ **Worker: Vectorize 업로드 엔드포인트**
- **엔드포인트**: `/vectorize-upload`
- **기능**:
  - 벡터 배열을 받아 Vectorize에 삽입
  - 메타데이터 포함 (botId, fileName, chunkIndex, text)

### 3️⃣ **테스트 스크립트**
- 전체 RAG 흐름 테스트
- Embedding 생성 테스트
- Vectorize 업로드 테스트
- RAG 검색 테스트

---

## 🔧 Cloudflare Vectorize 설정 (필수)

### ⚠️ 중요: Vectorize 인덱스 수동 생성 필요

Cloudflare Dashboard에서 Vectorize 인덱스를 생성해야 합니다.

### 1단계: Vectorize 인덱스 생성

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com/
   - Account: `117379ce5c9d9af026b16c9cf21b10d5`

2. **Workers & Pages → Vectorize 탭으로 이동**

3. **"Create Index" 클릭**

4. **인덱스 설정**:
   - **Index Name**: `ai-chatbot-knowledge`
   - **Dimensions**: `768` (Gemini text-embedding-004)
   - **Metric**: `Cosine`

5. **"Create" 클릭**

### 2단계: Worker에 Vectorize 바인딩

#### Option A: Dashboard에서 설정 (권장)

1. **Workers & Pages → physonsuperplacestudy → Settings → Variables**

2. **"Add Variable" 클릭**

3. **Vectorize Binding 추가**:
   - Type: `Vectorize Index`
   - Variable name: `VECTORIZE`
   - Index: `ai-chatbot-knowledge`

4. **"Save and Deploy" 클릭**

#### Option B: wrangler.toml 사용 (이미 설정됨)

```toml
# python-worker/wrangler.toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "ai-chatbot-knowledge"
```

그 다음:
```bash
cd python-worker
npx wrangler deploy
```

---

## 📡 API 사용법

### 1️⃣ AI 봇 생성

```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/ai-bots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "수학 선생님",
    "description": "이차방정식 전문가",
    "systemPrompt": "당신은 수학을 가르치는 선생님입니다.",
    "model": "gemini-2.0-flash-exp",
    "welcomeMessage": "안녕하세요! 무엇을 도와드릴까요?"
  }'
```

**Response**:
```json
{
  "success": true,
  "botId": "bot-1773176000-abc123",
  "message": "AI bot created successfully"
}
```

### 2️⃣ 지식 베이스 파일 업로드

```bash
# 파일 읽기
FILE_CONTENT=$(cat knowledge.txt)

# API 호출
curl -X POST https://superplacestudy.pages.dev/api/admin/ai-bots/upload-knowledge \
  -H "Content-Type: application/json" \
  -d "{
    \"botId\": \"bot-1773176000-abc123\",
    \"fileName\": \"knowledge.txt\",
    \"fileContent\": $(echo "$FILE_CONTENT" | jq -Rs .)
  }"
```

**Response**:
```json
{
  "success": true,
  "message": "파일 \"knowledge.txt\"이 성공적으로 업로드되었습니다",
  "chunks": 5,
  "vectors": 5
}
```

### 3️⃣ RAG 검색 및 대화

```bash
curl -X POST https://superplacestudy.pages.dev/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "이차방정식 푸는 방법을 알려주세요",
    "botId": "bot-1773176000-abc123",
    "conversationHistory": []
  }'
```

**Response**:
```json
{
  "success": true,
  "response": "이차방정식을 푸는 방법은 크게 3가지가 있습니다...",
  "workerRAGUsed": true,
  "ragContextCount": 3
}
```

---

## 🧪 테스트 방법

### 전체 RAG 흐름 테스트

```bash
cd /home/user/webapp

# 1. 테스트 지식 베이스 확인
cat /tmp/test-knowledge.txt

# 2. 전체 테스트 실행
bash test-rag-full.sh
```

### 개별 컴포넌트 테스트

#### 1) Worker Vectorize 업로드
```bash
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/vectorize-upload \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -d '{
    "vectors": [
      {
        "id": "test-001",
        "values": [0.1, 0.2, ..., 0.768],
        "metadata": {
          "botId": "bot-test-123",
          "fileName": "test.txt",
          "text": "테스트 내용"
        }
      }
    ]
  }'
```

#### 2) Worker RAG 검색
```bash
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -d '{
    "message": "이차방정식이 뭐야?",
    "botId": "bot-test-123",
    "enableRAG": true
  }'
```

---

## 🔄 전체 RAG 흐름

```
사용자가 AI 봇 생성 + 파일 업로드
    ↓
1️⃣ Pages API (/api/admin/ai-bots/upload-knowledge)
    ├─ 파일 내용을 청크로 분할 (1000자)
    ├─ 각 청크에 Gemini Embedding 생성 (768차원)
    └─ Worker /vectorize-upload 호출
        ↓
2️⃣ Worker Vectorize 업로드
    └─ VECTORIZE.insert(vectors)
        ↓
3️⃣ 학생이 질문
    ↓
4️⃣ Pages API (/api/ai-chat)
    └─ Worker /chat 호출
        ↓
5️⃣ Worker RAG 검색
    ├─ Cloudflare AI로 한글 → 영어 번역
    ├─ Gemini Embedding 생성
    ├─ VECTORIZE.query(embedding, filter: {botId})
    └─ Gemini LLM으로 최종 응답
        ↓
6️⃣ 사용자에게 답변 반환
```

---

## 📊 데이터 구조

### Vectorize 벡터 구조

```json
{
  "id": "bot-123-knowledge.txt-chunk-0",
  "values": [0.123, 0.456, ..., 768개],
  "metadata": {
    "botId": "bot-123",
    "fileName": "knowledge.txt",
    "chunkIndex": 0,
    "text": "실제 청크 텍스트 내용 (최대 1000자)",
    "totalChunks": 5
  }
}
```

### DB knowledgeBase 필드

```json
[
  {
    "fileName": "knowledge.txt",
    "uploadedAt": "2026-03-10T21:00:00.000Z",
    "chunks": 5
  },
  {
    "fileName": "advanced.txt",
    "uploadedAt": "2026-03-10T21:05:00.000Z",
    "chunks": 3
  }
]
```

---

## 🐛 트러블슈팅

### 1. VECTORIZE is not defined

**증상**:
```
ReferenceError: VECTORIZE is not defined
```

**해결**:
1. Cloudflare Dashboard에서 `ai-chatbot-knowledge` 인덱스 생성 확인
2. Worker Settings → Variables에서 VECTORIZE 바인딩 확인
3. Worker 재배포

### 2. Embedding API 오류

**증상**:
```
API key not valid. Please pass a valid API key.
```

**해결**:
1. Cloudflare Dashboard → Workers → physonsuperplacestudy
2. Settings → Variables → Environment Variables
3. `GEMINI_API_KEY` 설정 확인

### 3. 파일 업로드 실패

**증상**:
```
Vectorize 업로드 실패: 500
```

**해결**:
1. 파일 크기 확인 (너무 크면 청크 수가 많아짐)
2. Worker 로그 확인 (Dashboard → Workers → Logs)
3. GEMINI_API_KEY 할당량 확인

---

## 🚀 다음 단계

### 1. Vectorize 인덱스 생성 (필수)
- Cloudflare Dashboard에서 수동 생성
- 인덱스 이름: `ai-chatbot-knowledge`
- 차원: 768
- 메트릭: Cosine

### 2. Worker 바인딩 설정
- Dashboard 또는 wrangler로 VECTORIZE 바인딩
- Worker 재배포

### 3. 실제 데이터로 테스트
- AI 봇 생성
- 실제 지식 베이스 파일 업로드
- 학생 질문으로 RAG 정확도 검증

### 4. 프론트엔드 통합
- 관리자 페이지에 파일 업로드 UI 추가
- 진행 상황 표시
- 업로드 결과 확인

---

## 📝 파일 목록

| 파일 | 설명 |
|------|------|
| `functions/api/admin/ai-bots/upload-knowledge.ts` | 파일 업로드 API |
| `python-worker/worker.js` | Worker (Vectorize 업로드 + RAG 검색) |
| `python-worker/wrangler.toml` | Worker 설정 (Vectorize 바인딩) |
| `test-rag-full.sh` | 전체 RAG 테스트 스크립트 |
| `/tmp/test-knowledge.txt` | 테스트용 지식 베이스 |

---

**중요**: Vectorize 인덱스를 Cloudflare Dashboard에서 수동으로 생성한 후 테스트를 진행하세요!
