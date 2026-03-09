# 🚨 Vectorize 인덱스 차원 문제 해결

## 문제 상황

```
VECTOR_INSERT_ERROR (code = 40012): 
invalid vector for id="test.txt-chunk-0", 
expected 768 dimensions, and got 1024 dimensions
```

## 원인

- **@cf/baai/bge-m3 모델**: 1024차원 벡터 생성 ✅
- **Vectorize 인덱스 (knowledge-base-embeddings)**: 768차원으로 설정됨 ❌

## 해결 방법

### Option 1: Vectorize 인덱스 재생성 (권장)

Cloudflare 대시보드에서:

1. **기존 인덱스 삭제** (또는 새 이름 사용)
   ```bash
   wrangler vectorize delete knowledge-base-embeddings
   ```

2. **1024차원 인덱스 생성**
   ```bash
   wrangler vectorize create knowledge-base-embeddings \
     --dimensions=1024 \
     --metric=cosine
   ```

3. **배포**
   - Cloudflare Pages가 자동으로 재배포됨
   - 또는 수동 배포: `npm run deploy`

### Option 2: wrangler CLI 사용

```bash
cd /home/user/webapp

# 기존 인덱스 삭제
wrangler vectorize delete knowledge-base-embeddings

# 새 인덱스 생성 (1024 dimensions)
wrangler vectorize create knowledge-base-embeddings \
  --dimensions=1024 \
  --metric=cosine

# 테스트
./test-rag-production.sh
```

## @cf/baai/bge-m3 모델 정보

- **차원**: 1024
- **언어**: 다국어 지원 (한국어, 영어 등)
- **최대 입력**: 8192 토큰
- **용도**: 임베딩 생성

## 검증

인덱스가 올바르게 생성되었는지 확인:

```bash
wrangler vectorize get knowledge-base-embeddings
```

출력 예시:
```json
{
  "name": "knowledge-base-embeddings",
  "dimensions": 1024,
  "metric": "cosine",
  "description": "",
  "created_on": "2024-01-01T00:00:00.000Z"
}
```

## 다음 단계

1. ✅ Vectorize 인덱스 재생성 (1024 dimensions)
2. ⏳ 테스트 실행
3. ✅ RAG 시스템 동작 확인
