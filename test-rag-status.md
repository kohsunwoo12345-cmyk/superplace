# RAG 작동 확인 가이드

## 📋 현재 상태 (2026-03-18 10:50 UTC)

### ✅ RAG 코드 구조 확인 완료

#### 1. Worker RAG 호출 흐름
```
봇에 knowledgeBase 있음 
  ↓
Worker RAG 호출 (line 226)
  ↓
https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat
  ↓
성공 시: aiResponse = workerResult.response
  ↓
실패 시: Fallback → Gemini 직접 호출 (지식베이스 포함)
```

#### 2. RAG 활성화 조건
- `bot.knowledgeBase`가 존재
- `knowledgeBase.trim().length > 0` (공백이 아님)
- Line 222-243에서 처리

#### 3. RAG 응답 구조
```json
{
  "success": true,
  "response": "AI 답변 내용",
  "workerRAGUsed": true,  // ← RAG 사용 여부
  "ragContextCount": 5     // ← 사용된 컨텍스트 개수
}
```

---

## 🧪 RAG 작동 테스트 방법

### 방법 1: 브라우저 콘솔 확인 (권장)

1. https://suplacestudy.com/ai-chat/ 접속
2. 로그인 후 **지식베이스가 있는 봇** 선택
3. F12 → Network 탭 열기
4. 메시지 전송 (예: "안녕하세요")
5. `ai-chat` 요청 클릭 → Response 탭 확인

**예상 응답 (RAG 작동 중)**:
```json
{
  "success": true,
  "response": "안녕하세요! ...",
  "workerRAGUsed": true,     // ← true면 RAG 작동
  "ragContextCount": 3        // ← 0이 아니면 RAG 작동
}
```

**예상 응답 (RAG 미작동)**:
```json
{
  "success": true,
  "response": "안녕하세요! ...",
  "workerRAGUsed": false,    // ← false면 RAG 미작동
  "ragContextCount": 0        // ← 0이면 RAG 미작동
}
```

### 방법 2: Cloudflare Functions 로그 확인

1. https://dash.cloudflare.com/ 접속
2. Pages → superplace → Functions → Logs
3. 최신 로그에서 다음 항목 확인:

**RAG 작동 시 로그**:
```
🤖 AI 챗봇 요청 - botId: xxx
✅ 봇 발견: [봇 이름]
📊 모델: gemini-2.5-flash-lite
📚 지식베이스: 있음              ← 확인 포인트 1
🚀 Worker RAG 모드 활성화        ← 확인 포인트 2
🚀 Worker RAG 호출: https://...
✅ Worker RAG 완료: 5개 컨텍스트 사용  ← 확인 포인트 3
```

**RAG 미작동 시 로그**:
```
🤖 AI 챗봇 요청 - botId: xxx
✅ 봇 발견: [봇 이름]
📊 모델: gemini-2.5-flash-lite
📚 지식베이스: 없음              ← knowledgeBase 없음
📚 Gemini 직접 호출 모드         ← Worker RAG 건너뜀
```

---

## 🔍 RAG 문제 진단

### Case 1: `workerRAGUsed: false`이고 `ragContextCount: 0`인 경우
**원인**: 봇에 knowledgeBase가 없거나 비어있음
**해결**: 봇 관리 페이지에서 지식베이스 추가

### Case 2: Worker RAG 오류가 발생하는 경우
**증상**: 로그에 `⚠️ Worker RAG 실패, Fallback 모드` 출현
**원인**: 
- Worker URL 접근 실패
- Worker API 키 오류
- Vectorize 인덱스 문제

**확인 방법**:
```bash
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -d '{
    "message": "테스트",
    "botId": "test-bot-id",
    "enableRAG": true,
    "topK": 5
  }'
```

---

## ✅ 체크리스트

- [ ] 봇에 `knowledgeBase`가 설정되어 있는가?
- [ ] F12 Network 탭에서 `workerRAGUsed: true` 확인
- [ ] F12 Network 탭에서 `ragContextCount > 0` 확인
- [ ] Cloudflare Functions 로그에서 `🚀 Worker RAG 모드 활성화` 확인
- [ ] Cloudflare Functions 로그에서 `✅ Worker RAG 완료` 확인

---

## 📊 테스트 결과 보고 양식

테스트 후 다음 정보를 복사해주세요:

1. **선택한 봇 이름**: _________
2. **F12 Network 응답**:
   - `workerRAGUsed`: true / false
   - `ragContextCount`: _____
3. **Cloudflare 로그 (선택사항)**:
   - 지식베이스 있음/없음
   - Worker RAG 활성화 여부
   - 에러 메시지 (있는 경우)

---

**마지막 업데이트**: 2026-03-18 10:50 UTC  
**커밋**: 17055668  
**파일 경로**: `/home/user/webapp/functions/api/ai-chat.ts`
