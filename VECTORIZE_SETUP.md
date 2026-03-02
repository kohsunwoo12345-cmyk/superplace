# Vectorize Setup Guide

## 현재 상태
- ✅ RAG 코드 구현 완료 (임베딩 API + AI 챗봇 통합)
- ✅ PDF.js 통합 완료
- ❌ Vectorize 인덱스 미생성 (배포 차단)

## Vectorize 인덱스 생성 방법

### Option 1: Wrangler CLI (권장)

```bash
# 1. Wrangler 로그인
npx wrangler login

# 2. Vectorize 인덱스 생성
npx wrangler vectorize create knowledge-base-embeddings \
  --dimensions=768 \
  --metric=cosine

# 3. 생성 확인
npx wrangler vectorize list
```

### Option 2: Cloudflare Dashboard

1. Cloudflare Dashboard 접속
2. Workers & Pages → Vectorize 메뉴 선택
3. "Create Index" 버튼 클릭
4. 설정 입력:
   - **Name**: `knowledge-base-embeddings`
   - **Dimensions**: `768` (Gemini Embedding API 기본값)
   - **Metric**: `cosine`
5. Create 클릭

## 인덱스 생성 후

### 1. wrangler.toml 주석 해제

`wrangler.toml` 파일에서 Vectorize 바인딩 활성화:

```toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "knowledge-base-embeddings"
```

### 2. 재배포

```bash
git add wrangler.toml
git commit -m "feat(vectorize): Vectorize 바인딩 활성화"
git push origin main
```

### 3. 기존 봇 데이터 마이그레이션

```bash
# 모든 AI 봇의 Knowledge Base를 Vectorize에 임베딩
curl -X POST https://superplacestudy.pages.dev/api/admin/knowledge-base/embed \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "bot-123",
    "text": "Knowledge base content...",
    "fileName": "manual.pdf"
  }'
```

## RAG 동작 흐름

### 1. 지식 베이스 등록
```
PDF/텍스트 업로드 
→ PDF.js로 텍스트 추출 
→ 1000자 단위 청크 분할
→ Gemini Embedding API로 벡터화
→ Vectorize에 저장
→ D1 knowledge_base_chunks 테이블에 메타데이터 저장
```

### 2. AI 챗봇 질의
```
사용자 질문
→ 질문을 Gemini Embedding API로 벡터화
→ Vectorize에서 유사도 검색 (Top 5)
→ 관련 청크 추출
→ 시스템 프롬프트에 추가
→ Gemini API 호출
→ 응답 반환
```

## 로그 확인

Cloudflare Pages 배포 후:

```bash
# 배포 로그
npx wrangler pages deployment tail

# 실시간 로그
npx wrangler pages deployment tail --follow
```

## 테스트 시나리오

### 1. 임베딩 API 테스트
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/knowledge-base/embed \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "test-bot",
    "text": "테스트 지식 베이스입니다.",
    "fileName": "test.txt"
  }'
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Knowledge base embedded successfully",
  "chunksCreated": 1,
  "vectorsIndexed": 1
}
```

### 2. RAG 검색 테스트

AI 챗봇 페이지에서 질문 입력 후 Cloudflare 로그 확인:

```
🔍 RAG 검색 시작...
📚 5개 관련 청크 발견
✅ RAG 컨텍스트 추가 완료 (1234 chars)
```

### 3. PDF 업로드 테스트

1. Admin → AI 봇 생성/수정
2. Knowledge Base 섹션에서 PDF 파일 업로드
3. 로그 확인: `✅ PDF 파일 처리 완료: N 페이지`
4. 임베딩 API 자동 호출 확인

## 트러블슈팅

### 문제: "Vectorize binding 'VECTORIZE' references index 'knowledge-base-embeddings' which was not found"

**해결책**: 
1. Vectorize 인덱스를 먼저 생성
2. 이름이 정확히 `knowledge-base-embeddings`인지 확인
3. Wrangler로 확인: `npx wrangler vectorize list`

### 문제: 임베딩 API 호출 시 500 에러

**원인**: GOOGLE_GEMINI_API_KEY 미설정

**해결책**:
1. Cloudflare Dashboard → Pages → superplace → Settings → Environment variables
2. GOOGLE_GEMINI_API_KEY 추가
3. Production & Preview 환경 모두 설정

### 문제: RAG가 동작하지 않음

**확인사항**:
1. Vectorize 인덱스에 데이터가 있는지 확인
2. 봇의 `knowledgeBase` 필드가 비어있지 않은지 확인
3. 임베딩 API가 정상적으로 호출되었는지 로그 확인

## 성능 최적화

### 청크 크기 조정
`functions/api/admin/knowledge-base/embed.ts`:
```typescript
const CHUNK_SIZE = 1000; // 기본값, 조정 가능
const CHUNK_OVERLAP = 200; // 중첩 크기
```

### Top-K 조정
`functions/api/ai-chat.ts`:
```typescript
const topK = 5; // 반환할 관련 청크 수
```

## 비용 산정

### Gemini Embedding API
- 무료: 1,500 requests/day
- Free tier: 15,000,000 tokens/month
- 1000 chars ≈ 250 tokens

### Cloudflare Vectorize
- 무료: 5M queries/month
- 무료: 10M vectors stored
- 충분한 여유

## 다음 단계

1. ✅ Vectorize 인덱스 생성
2. ⏳ wrangler.toml 바인딩 활성화
3. ⏳ 기존 봇 데이터 마이그레이션
4. ⏳ RAG 동작 테스트
5. ⏳ 성능 모니터링 및 최적화
