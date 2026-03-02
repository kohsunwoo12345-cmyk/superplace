# 🎯 Vectorize 인덱스 생성 가이드 (비개발자용)

## 📌 개요
RAG (질문-답변 AI) 기능을 활성화하려면 Cloudflare Vectorize 인덱스를 생성해야 합니다.
**5분이면 완료**할 수 있습니다!

---

## ✅ 방법 1: Cloudflare 대시보드 (추천) ⭐

### 1단계: Cloudflare 대시보드 접속
1. 브라우저에서 https://dash.cloudflare.com/ 접속
2. Cloudflare 계정으로 로그인

### 2단계: Vectorize 메뉴로 이동
1. 왼쪽 사이드바에서 **"Workers & Pages"** 클릭
2. 상단 탭에서 **"Vectorize"** 클릭
3. **"Create Index"** 버튼 클릭

### 3단계: 인덱스 정보 입력
다음 정보를 **정확히** 입력하세요:

```
Index Name (인덱스 이름):
  knowledge-base-embeddings

Dimensions (차원):
  768

Metric (메트릭):
  cosine
```

### 4단계: 인덱스 생성
1. **"Create"** 버튼 클릭
2. Status가 **"Active"**로 표시될 때까지 기다림 (약 10-30초)

### 5단계: 배포하기
인덱스가 생성되면 자동으로 배포됩니다!

---

## 🎉 완료!

### 테스트 방법
1. **PDF 업로드**: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create
2. **AI 챗봇 사용**: https://superplacestudy.pages.dev/ai-chat

---

## ❓ 자주 묻는 질문

### Q1: Index Name을 다르게 입력했어요!
**A:** 반드시 `knowledge-base-embeddings`로 입력해야 합니다. 다른 이름으로 생성했다면 삭제하고 다시 만드세요.

### Q2: Dimensions를 다른 숫자로 입력했어요!
**A:** 반드시 `768`이어야 합니다. 다른 숫자로 생성했다면 삭제하고 다시 만드세요.

### Q3: Metric을 다른 것으로 선택했어요!
**A:** 반드시 `cosine`이어야 합니다. 다른 것으로 생성했다면 삭제하고 다시 만드세요.

### Q4: 인덱스를 삭제하려면?
**A:** Vectorize 페이지에서 인덱스 오른쪽의 **"Delete"** 버튼을 클릭하세요.

### Q5: 배포는 어떻게 확인하나요?
**A:** Cloudflare Pages → superplace 프로젝트 → Deployments 탭에서 확인할 수 있습니다.

---

## 📞 문제가 생겼나요?
스크린샷을 찍어서 개발팀에게 보내주세요:
- 어떤 단계에서 문제가 발생했는지
- 어떤 오류 메시지가 나왔는지

---

## 📚 추가 정보
- Cloudflare Vectorize 공식 문서: https://developers.cloudflare.com/vectorize/
- 프로젝트 GitHub: https://github.com/kohsunwoo12345-cmyk/superplace
