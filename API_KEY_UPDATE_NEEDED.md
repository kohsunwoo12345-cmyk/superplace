# 🔑 API 키 업데이트 필요!

## 현재 상황
- ❌ 로컬 `.env` 파일에 **이전 API 키**(`AIzaSyAAu9...`)가 남아있음
- ✅ Vercel 프로덕션은 새 키로 업데이트 완료 (재배포됨)
- ⚠️ 로컬 테스트를 위해서는 `.env` 파일 업데이트 필요

---

## 📝 로컬 .env 파일 업데이트 방법

### 방법 1: 직접 편집
```bash
# .env 파일을 열어서 수정
nano /home/user/webapp/.env

# 또는
vim /home/user/webapp/.env
```

아래 라인을 찾아서:
```
GOOGLE_GEMINI_API_KEY="AIzaSyAAu9N0kySmg_AAQZ6huNqIuc-aCykYSaw"
```

새 API 키로 교체:
```
GOOGLE_GEMINI_API_KEY="새로_발급받은_API_키"
```

### 방법 2: 명령어로 업데이트
```bash
cd /home/user/webapp

# 기존 라인 제거 후 새 키 추가
sed -i '/GOOGLE_GEMINI_API_KEY/d' .env
echo 'GOOGLE_GEMINI_API_KEY="새로_발급받은_API_키"' >> .env

# 또는 덮어쓰기
cat > .env << 'EOF'
DATABASE_URL="postgresql://neondb_owner:...@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ywacrB6bMHibXwkK9mnF5LeCb6VlYm6A03GWposU074="
GOOGLE_GEMINI_API_KEY="새로_발급받은_API_키"
GEMINI_API_KEY="새로_발급받은_API_키"
EOF
```

---

## 🌐 프로덕션 URL (이미 작동 중)

새 API 키로 재배포를 완료하셨으니, **프로덕션 URL**에서는 이미 작동하고 있을 것입니다!

### 📱 프로덕션 테스트 링크

**메인 대시보드:**
https://superplacestudy.vercel.app/dashboard

**AI Gems 선택 페이지:**
https://superplacestudy.vercel.app/dashboard/ai-gems

**개별 Gem 테스트:**
- 📚 학습 도우미: https://superplacestudy.vercel.app/dashboard/ai-gems/study-helper
- ✍️ 글쓰기 코치: https://superplacestudy.vercel.app/dashboard/ai-gems/writing-coach
- 🔢 수학 튜터: https://superplacestudy.vercel.app/dashboard/ai-gems/math-tutor
- 🌍 영어 회화: https://superplacestudy.vercel.app/dashboard/ai-gems/english-partner
- 🔬 과학 실험실: https://superplacestudy.vercel.app/dashboard/ai-gems/science-lab
- 🎨 창의력 메이커: https://superplacestudy.vercel.app/dashboard/ai-gems/creative-maker
- 💼 진로 상담사: https://superplacestudy.vercel.app/dashboard/ai-gems/career-counselor
- 💝 멘탈 코치: https://superplacestudy.vercel.app/dashboard/ai-gems/mental-coach

**기본 AI 챗봇:**
https://superplacestudy.vercel.app/dashboard/ai-chatbot

### 🔑 로그인 정보
- 이메일: `admin@superplace.com`
- 비밀번호: `admin123!@#`

---

## 🧪 로컬 환경에서 테스트하려면

1. `.env` 파일에 새 API 키 적용
2. 개발 서버 재시작:
   ```bash
   cd /home/user/webapp
   npm run dev
   ```
3. 브라우저에서 http://localhost:3000 접속

---

## ✅ 다음 단계

1. **프로덕션에서 테스트** (권장)
   - 위 프로덕션 URL로 바로 테스트 가능
   - 이미 새 API 키로 재배포 완료

2. **로컬에서 테스트** (선택)
   - .env 파일 업데이트 필요
   - 개발 서버 재시작 필요

---

**프로덕션 URL로 먼저 테스트해보시는 것을 추천드립니다!** 🚀
