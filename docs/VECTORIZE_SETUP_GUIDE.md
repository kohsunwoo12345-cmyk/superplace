# 🔧 Vectorize 인덱스 차원 수정 가이드

## ⚠️ 현재 문제

RAG 시스템이 다음 오류로 동작하지 않습니다:

```
VECTOR_INSERT_ERROR (code = 40012): 
invalid vector for id="test.txt-chunk-0", 
expected 768 dimensions, and got 1024 dimensions
```

**원인**: `@cf/baai/bge-m3` 모델은 **1024차원** 벡터를 생성하지만, Vectorize 인덱스는 **768차원**으로 설정되어 있습니다.

---

## 🛠️ 해결 방법: Cloudflare 대시보드에서 수정

### 1️⃣ Cloudflare 대시보드 접속

1. https://dash.cloudflare.com 접속
2. 계정 선택
3. 왼쪽 사이드바에서 **Workers & Pages** 클릭

### 2️⃣ Vectorize 인덱스 관리

1. 상단 탭에서 **Vectorize** 클릭
2. 기존 인덱스 **knowledge-base-embeddings** 찾기

### 3️⃣ 인덱스 재생성

#### 옵션 A: 기존 인덱스 삭제 후 재생성

1. **knowledge-base-embeddings** 클릭
2. 오른쪽 상단 **Delete** 버튼 클릭
3. 삭제 확인

4. **Create index** 버튼 클릭
5. 다음 정보 입력:
   - **Name**: `knowledge-base-embeddings`
   - **Dimensions**: `1024` ⚠️ **중요!**
   - **Metric**: `cosine`
   - **Description**: (선택) RAG knowledge base for @cf/baai/bge-m3

6. **Create** 클릭

#### 옵션 B: 새 이름으로 인덱스 생성 (기존 데이터 보존)

1. **Create index** 버튼 클릭
2. 다음 정보 입력:
   - **Name**: `knowledge-base-embeddings-v2`
   - **Dimensions**: `1024` ⚠️ **중요!**
   - **Metric**: `cosine`
   
3. `wrangler.toml` 파일 수정:
   ```toml
   [[vectorize]]
   binding = "VECTORIZE"
   index_name = "knowledge-base-embeddings-v2"  # 변경
   ```

4. 커밋 및 푸시

---

### 4️⃣ 검증

인덱스가 올바르게 생성되었는지 확인:

1. Vectorize 대시보드에서 `knowledge-base-embeddings` 클릭
2. **Dimensions** 필드가 `1024`인지 확인 ✅

---

### 5️⃣ 테스트

배포가 완료되면 (약 2-3분 소요):

```bash
cd /home/user/webapp
./test-rag-production.sh
```

예상 결과:
```
✅ Upload Success!
   - File: test-knowledge.txt
   - Chunks processed: 2
   - Vectors inserted: 2

✅ Chat Success!
   - Query: 슈퍼플레이스의 주요 기능은 무엇인가요?
   - Sources used: 3
   
🤖 Gemini Answer:
   슈퍼플레이스는 선생님과 학생을 위한 혁신적인 교육 플랫폼입니다...
```

---

## 📊 @cf/baai/bge-m3 모델 스펙

| 항목 | 값 |
|------|-----|
| 모델명 | @cf/baai/bge-m3 |
| 차원 (Dimensions) | **1024** |
| 최대 입력 | 8192 토큰 |
| 언어 지원 | 다국어 (한국어, 영어, 중국어 등) |
| 용도 | 텍스트 임베딩 (semantic search) |

---

## ⚡ 빠른 해결 체크리스트

- [ ] Cloudflare 대시보드 접속
- [ ] Vectorize 섹션으로 이동
- [ ] 기존 인덱스 삭제 (또는 새 이름 사용)
- [ ] 새 인덱스 생성 (1024 dimensions, cosine metric)
- [ ] 인덱스 이름 확인 (knowledge-base-embeddings)
- [ ] 배포 대기 (2-3분)
- [ ] 테스트 실행 (`./test-rag-production.sh`)
- [ ] ✅ 성공!

---

## 🆘 문제가 계속되면?

1. **캐시 클리어**: 브라우저 시크릿 모드에서 테스트
2. **배포 확인**: Cloudflare Pages에서 최신 배포 상태 확인
3. **로그 확인**: Functions 로그에서 에러 메시지 확인
4. **재배포**: `git commit --allow-empty -m "redeploy" && git push`

---

## 📝 참고 자료

- [Cloudflare Vectorize 문서](https://developers.cloudflare.com/vectorize/)
- [Workers AI 모델 카탈로그](https://developers.cloudflare.com/workers-ai/models/)
- [@cf/baai/bge-m3 모델 상세](https://developers.cloudflare.com/workers-ai/models/bge-m3/)
