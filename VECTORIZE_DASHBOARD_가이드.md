# 🎯 Vectorize 인덱스 생성 - 가장 간단한 방법

## ⚡ 방법: Cloudflare Pages Dashboard 사용

### Step 1: Cloudflare Pages 프로젝트 설정 접속
1. https://dash.cloudflare.com/ 접속
2. **Workers & Pages** 클릭
3. **superplace** 프로젝트 클릭
4. **Settings** 탭 클릭
5. 좌측 메뉴에서 **Functions** 클릭

### Step 2: Vectorize 바인딩 추가
1. **Vectorize indexes** 섹션 찾기
2. **Add binding** 버튼 클릭
3. 다음 정보 입력:
   ```
   Variable name: VECTORIZE
   Vectorize index: (새로 만들기)
   ```
4. **"Create a new Vectorize index"** 클릭

### Step 3: 인덱스 생성
1. Index 생성 대화상자에서:
   ```
   Index Name: knowledge-base-embeddings
   Dimensions: 768
   Metric: cosine
   ```
2. **Create** 버튼 클릭
3. 다시 바인딩 화면으로 돌아가서 방금 생성한 `knowledge-base-embeddings` 선택
4. **Save** 버튼 클릭

### Step 4: 배포 확인
바인딩이 추가되면 자동으로 재배포됩니다 (3-5분 소요).

---

## 🧪 테스트

배포가 완료되면:
1. **PDF 업로드**: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create
2. **AI 챗봇**: https://superplacestudy.pages.dev/ai-chat

---

## ❓ 문제 해결

### "Vectorize indexes" 섹션이 보이지 않음
- Functions 탭이 아니라 Settings → Functions 에서 확인하세요
- Cloudflare 계정에 Vectorize 권한이 있는지 확인하세요

### 인덱스 생성 실패
- Index Name을 정확히 `knowledge-base-embeddings`로 입력하세요
- Dimensions는 반드시 `768`이어야 합니다
- Metric은 반드시 `cosine`이어야 합니다

---

## 📌 이미 wrangler.toml에 설정이 완료되어 있습니다!

```toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "knowledge-base-embeddings"
```

Dashboard에서 인덱스만 생성하면 자동으로 연결됩니다!

---

**완료 시간**: 약 5분  
**난이도**: ⭐ (매우 쉬움)
