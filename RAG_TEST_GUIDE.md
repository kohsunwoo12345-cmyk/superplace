# 🧪 RAG 테스트 가이드 (업로드 무한 로딩 문제 해결)

## 🐛 수정된 문제
- **증상**: PDF 업로드 시 "업로드 중..." 무한 대기
- **원인**: Cloudflare Workers 타임아웃 + 순차 임베딩의 느린 속도
- **해결**: 백그라운드 업로드 + 최대 20개 청크 제한

---

## ✅ 테스트 절차 (배포 후 5분 뒤)

### 1단계: AI Gem 생성 + PDF 업로드

**URL**: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create/

**테스트 시나리오:**

1. **기본 정보 입력**
   ```
   Gem 이름: 수학 테스트 봇
   설명: 수학 교재 기반 답변 테스트
   프로필 아이콘: 📚
   ```

2. **시스템 프롬프트**
   ```
   당신은 수학 전문 AI 선생님입니다.
   제공된 교재 내용을 바탕으로 정확하게 답변하세요.
   ```

3. **📄 PDF 파일 업로드**
   - "파일 업로드" 버튼 클릭
   - 테스트용 PDF 선택 (수학 교재, 10페이지 이하 권장)
   - 파싱 완료 확인

4. **"✨ AI Gem 생성" 클릭**

5. **✨ 변경된 동작 확인:**
   ```
   이전: "업로드 중..." 무한 대기 ❌
   
   현재: 즉시 성공 메시지 표시 ✅
   "✨ AI Gem이 생성되었습니다!
   
   📚 지식 베이스를 백그라운드에서 업로드 중입니다...
   (약 10-30초 소요)"
   ```

6. **자동 리다이렉트**
   - 즉시 봇 목록 페이지로 이동
   - 업로드는 백그라운드에서 계속 진행

---

### 2단계: 업로드 진행 상황 확인

**방법 1: 브라우저 개발자 도구 (F12) → Console**

봇 목록 페이지로 이동해도 **Console 탭은 그대로 유지**되므로 확인 가능:

```javascript
// 예상 로그:
📚 Knowledge Base 업로드 시작...
  └─ Knowledge base length: 15432 characters
  └─ Split into 18 chunks
  └─ Chunk 1/18 embedded ✅
  └─ Chunk 2/18 embedded ✅
  └─ Chunk 3/18 embedded ✅
  ...
  └─ Chunk 18/18 embedded ✅
✅ Successfully uploaded 18 vectors to Vectorize
✅ Vectorize 업로드 성공: 18개 벡터
```

**방법 2: Cloudflare Pages Logs**

1. https://dash.cloudflare.com/
2. Workers & Pages → superplace → View details
3. Functions → Real-time logs
4. `/api/admin/upload-knowledge` 로그 확인

---

### 3단계: Vectorize 저장 확인

**Cloudflare Dashboard:**

1. https://dash.cloudflare.com/ 접속
2. Workers & Pages → superplace
3. 왼쪽 메뉴에서 **Vectorize indexes** 클릭
4. `knowledge-base-embeddings` 인덱스 선택
5. **Vector count 확인** (예: 18 vectors)

**예상 결과:**
```
Index name: knowledge-base-embeddings
Dimensions: 768
Metric: cosine
Vectors: 18 (또는 업로드한 청크 수)
```

---

### 4단계: AI 채팅 테스트 (RAG 적용)

**URL**: https://superplacestudy.pages.dev/ai-chat

**테스트 질문:**

1. **PDF 내용과 관련된 질문**
   ```
   예시:
   - "2차 방정식의 근의 공식은 뭐야?"
   - "삼각함수 덧셈정리 설명해줘"
   - "미적분의 기본정리가 뭐야?"
   ```

2. **F12 → Console 확인**
   ```javascript
   🔍 RAG 검색 시작: "2차 방정식의 근의 공식..."
   ✅ 질문 임베딩 생성 완료 (768차원)
   📚 3개 관련 청크 발견
   ✅ RAG 컨텍스트 생성 완료 (1234자)
   
   [관련 지식 1] (파일: math.pdf, 유사도: 0.923)
   2차 방정식은 ax² + bx + c = 0 형태...
   ```

3. **답변 확인**
   - AI가 PDF 내용을 참고하여 정확하게 답변
   - 업로드한 교재의 내용이 답변에 포함되어야 함

4. **PDF 외 질문 테스트**
   ```
   질문: "오늘 날씨 어때?"
   
   예상 결과:
   📭 관련 지식 베이스 없음
   → 일반 지식으로 답변
   ```

---

## 🔍 트러블슈팅

### 문제 1: 여전히 업로드가 느리거나 실패

**증상:**
- Console에서 `❌ Failed to embed chunk` 반복
- 또는 `❌ Vectorize 업로드 오류`

**원인:**
- Gemini API 키 문제
- API 할당량 초과
- 네트워크 오류

**해결:**
1. **API 키 확인**
   - Cloudflare Pages → Settings → Environment variables
   - `GOOGLE_GEMINI_API_KEY` 존재 확인
   - API 키 유효성 확인: https://makersuite.google.com/app/apikey

2. **API 할당량 확인**
   - Gemini API Console에서 일일 할당량 확인
   - 무료 플랜: 분당 60회 요청

3. **재시도**
   - 잠시 후(1-2분) 다시 시도

---

### 문제 2: Vectorize에 벡터가 저장되지 않음

**증상:**
- Cloudflare Dashboard → Vectorize → Vector count: 0

**원인:**
- Vectorize 바인딩 설정 문제
- 인덱스 미생성

**해결:**
1. **wrangler.toml 확인**
   ```toml
   [[vectorize]]
   binding = "VECTORIZE"
   index_name = "knowledge-base-embeddings"
   ```

2. **Vectorize 인덱스 확인**
   - Dashboard에서 `knowledge-base-embeddings` 존재 확인
   - 없으면 생성: Create Index
     - Name: `knowledge-base-embeddings`
     - Dimensions: `768`
     - Metric: `cosine`

3. **재배포 필요**
   - wrangler.toml 수정 후 Git push
   - Cloudflare Pages 자동 재배포 대기

---

### 문제 3: RAG 검색 결과 없음

**증상:**
```javascript
📭 관련 지식 베이스 없음
```

**원인:**
- Vectorize에 해당 botId로 저장된 벡터 없음
- 질문과 PDF 내용의 유사도 너무 낮음

**해결:**
1. **Vectorize 저장 확인**
   - Console 로그에서 `✅ Successfully uploaded N vectors` 확인
   - Dashboard에서 Vector count > 0 확인

2. **질문 변경**
   - PDF 내용과 직접 관련된 질문으로 재시도
   - 예: PDF에 "피타고라스 정리" 있으면 → "피타고라스 정리가 뭐야?"

3. **봇 재생성**
   - 문제가 계속되면 AI Gem 삭제 후 재생성
   - PDF 다시 업로드

---

## 📊 성능 제한 사항

### 현재 제한:
- **최대 청크 수**: 20개 (약 20,000자)
- **청크 크기**: 1000자
- **처리 시간**: 10-20초

### PDF 크기 권장:
- **최적**: 10페이지 이하, 10,000자 이하
- **허용**: 20페이지 이하, 20,000자 이하
- **초과 시**: 앞부분 20개 청크만 처리됨

### 대용량 PDF 처리:
20페이지 초과 PDF의 경우:
1. PDF를 여러 파일로 분할
2. 각 파일마다 별도 AI Gem 생성
3. 또는 중요한 부분만 선택하여 텍스트로 직접 입력

---

## 🎯 테스트 체크리스트

배포 후 (5분 뒤) 순서대로 체크:

### AI Gem 생성
- [ ] https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create/ 접속
- [ ] 기본 정보 + 시스템 프롬프트 입력
- [ ] PDF 파일 업로드 (10페이지 이하)
- [ ] "✨ AI Gem 생성" 클릭
- [ ] **"백그라운드에서 업로드 중..." 메시지 즉시 표시** ✅
- [ ] **무한 로딩 없이 즉시 봇 목록으로 리다이렉트** ✅
- [ ] F12 Console에서 업로드 진행 상황 확인

### Vectorize 확인
- [ ] Cloudflare Dashboard → Vectorize indexes
- [ ] `knowledge-base-embeddings` Vector count > 0 확인
- [ ] 업로드한 청크 수와 일치하는지 확인

### AI 채팅 테스트
- [ ] https://superplacestudy.pages.dev/ai-chat 접속
- [ ] 생성한 AI Gem 선택
- [ ] PDF 관련 질문 입력
- [ ] F12 Console에서 RAG 검색 로그 확인
- [ ] AI 답변이 PDF 내용 기반인지 확인
- [ ] PDF 외 질문 시 일반 답변 확인

---

## ✅ 최종 배포 상태

**Git Commit**: `f42f706` - fix(RAG): 업로드 무한 로딩 문제 해결 + 타임아웃 방지 최적화

**주요 변경사항:**
1. ✅ 백그라운드 업로드 (UX 개선)
2. ✅ 최대 20개 청크 제한 (타임아웃 방지)
3. ✅ 에러 핸들링 강화
4. ✅ 상세 로그 추가

**배포 URL**: https://superplacestudy.pages.dev

**예상 배포 완료**: 약 5분 후

---

## 🚀 다음 단계 (선택)

업로드가 정상 작동하면, 추가 최적화 가능:

1. **대용량 PDF 지원**
   - 청크 수 제한 제거 또는 증가
   - Batch 임베딩 API 사용

2. **실시간 진행 상황 표시**
   - WebSocket으로 업로드 진행률 실시간 표시
   - 프로그레스 바 추가

3. **다중 파일 업로드**
   - 여러 PDF 동시 업로드
   - 병렬 처리

현재는 **안정성과 UX 개선**에 집중했습니다! 🎉
