# 🚀 Vectorize 인덱스 생성 가이드

## ⚠️ 중요 알림

CLI로 직접 인덱스를 생성할 수 없습니다 (API 토큰 필요).
**Cloudflare Dashboard를 사용해야 합니다.**

---

## 📋 빠른 시작 (5분)

### 자동화 스크립트 사용

```bash
cd /home/user/webapp
bash create-and-activate-vectorize.sh
```

이 스크립트는:
1. ✅ 단계별 가이드 제공
2. ✅ 인덱스 생성 확인
3. ✅ wrangler.toml 자동 수정
4. ✅ Git 커밋 및 푸시
5. ✅ Cloudflare Pages 자동 배포

---

## 🎯 수동 생성 방법

### Step 1: Dashboard 접속
```
https://dash.cloudflare.com/
```

### Step 2: Vectorize 메뉴
1. 좌측: **Workers & Pages** 클릭
2. 상단: **Vectorize** 탭 클릭

### Step 3: 인덱스 생성
1. **Create Index** 버튼 클릭
2. 정보 입력:
   - **Index Name**: `knowledge-base-embeddings`
   - **Dimensions**: `768`
   - **Metric**: `cosine`
3. **Create** 클릭
4. Status: `Active` 확인

### Step 4: 활성화 스크립트 실행
```bash
cd /home/user/webapp
bash activate-vectorize.sh
```

---

## ✅ 생성 확인 방법

### CLI로 확인 (API 토큰 필요)
```bash
npx wrangler vectorize list
```

### Dashboard에서 확인
```
https://dash.cloudflare.com/
→ Workers & Pages → Vectorize
→ 'knowledge-base-embeddings' 존재 확인
```

---

## 🎉 생성 후 작업

### 자동 (스크립트 사용 시)
스크립트가 자동으로 처리합니다.

### 수동 (직접 생성 시)
```bash
cd /home/user/webapp
bash activate-vectorize.sh
```

이 명령은:
1. wrangler.toml 수정
2. Git 커밋 및 푸시
3. Cloudflare Pages 배포

---

## 📊 배포 완료 후 테스트

### 1. PDF 업로드
```
https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create
```

### 2. AI 챗봇 질문
```
https://superplacestudy.pages.dev/ai-chat
```

### 3. Cloudflare Logs
로그에서 확인:
- `🔍 RAG 검색 시작`
- `📚 5개 관련 청크 발견`
- `✅ RAG 컨텍스트 추가 완료`

---

## 🐛 문제 해결

### "Index not found" 에러
- 인덱스 이름이 정확한지 확인
- Dashboard에서 Status: Active 확인
- 5분 대기 후 재시도

### 빌드 실패
- wrangler.toml에서 Vectorize 바인딩 주석 처리
- 인덱스 생성 후 다시 활성화

### RAG 작동 안 함
- 인덱스 생성 완료 확인
- 배포 완료 확인 (3-5분)
- 브라우저 캐시 클리어

---

## 📞 추가 도움

- **상세 가이드**: `/home/user/webapp/RAG_ACTIVATION_GUIDE.md`
- **자동화 스크립트**: `/home/user/webapp/create-and-activate-vectorize.sh`
- **활성화 스크립트**: `/home/user/webapp/activate-vectorize.sh`

---

## 🎊 완료 후

✅ 학원장 100% 표시 완료
✅ RAG 활성화 완료
✅ PDF 기반 AI 챗봇 완성

**모든 기능이 정상 작동합니다!** 🚀
