# 🔧 Vercel 배포 문제 해결 가이드

**작성일**: 2026-01-22  
**문제**: 404 DEPLOYMENT_NOT_FOUND

---

## 🚨 문제 진단 결과

### 발견된 문제

1. **Vercel 프로젝트 연결 안됨**
   - `.vercel/` 디렉토리 없음
   - GitHub 저장소와 Vercel 프로젝트가 연결되지 않음

2. **GitHub 기본 브랜치**
   - 현재: `genspark_ai_developer` ❌
   - 필요: `main` ✅

3. **배포 상태**
   - HTTP 404: DEPLOYMENT_NOT_FOUND
   - Vercel에 배포가 전혀 없음

---

## ✅ 해결 방법

### 🎯 방법 1: Vercel Dashboard에서 프로젝트 Import (권장)

#### 1단계: Vercel 접속
```
https://vercel.com/new
```

#### 2단계: GitHub 저장소 Import
1. "Add New..." → "Project" 클릭
2. "Import Git Repository" 섹션에서
3. `kohsunwoo12345-cmyk/superplace` 검색
4. **Import** 클릭

#### 3단계: 프로젝트 설정
- **Project Name**: `superplace` (자동)
- **Framework Preset**: Next.js (자동 감지)
- **Root Directory**: `./` (기본값)
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next` (자동)
- **Install Command**: `npm install` (자동)

#### 4단계: 환경 변수 설정
"Environment Variables" 섹션에서 추가:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXTAUTH_URL` | `https://superplacestudy.vercel.app` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | `ywacrB6bMHibXwkK9mnF5LeCb6VlYm6A03GWposU074=` | Production, Preview, Development |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_YvDcNzWU3KR7@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production, Preview, Development |
| `GOOGLE_GEMINI_API_KEY` | `새로_발급받은_API_키` | Production, Preview, Development |

#### 5단계: Deploy 클릭
- "Deploy" 버튼 클릭
- 약 2-3분 대기

#### 6단계: Production Branch 설정
배포 완료 후:
1. Project Settings → Git
2. "Production Branch" 찾기
3. `main`으로 변경
4. Save

---

### 🔄 방법 2: GitHub 기본 브랜치 변경

#### GitHub 설정:
1. 저장소 접속:
   ```
   https://github.com/kohsunwoo12345-cmyk/superplace
   ```

2. Settings → Branches

3. Default branch 변경:
   - 현재: `genspark_ai_developer` → `main`으로 변경

4. Vercel에서 다시 Import

---

### 🛠️ 방법 3: Vercel CLI로 연결 (고급)

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
cd /home/user/webapp
vercel link

# 환경 변수 설정
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
vercel env add GOOGLE_GEMINI_API_KEY production

# 배포
vercel --prod
```

---

## 📋 배포 후 확인 사항

### 1. 배포 상태 확인
```
https://vercel.com/kohsunwoo12345-cmyk/superplace
```

### 2. 사이트 접속 테스트
```
https://superplacestudy.vercel.app
```

### 3. AI Gems 테스트
```
https://superplacestudy.vercel.app/dashboard/ai-gems
```

---

## 🔑 환경 변수 체크리스트

배포 전 반드시 확인:

- [ ] `NEXTAUTH_URL` 설정됨
- [ ] `NEXTAUTH_SECRET` 설정됨
- [ ] `DATABASE_URL` 설정됨
- [ ] `GOOGLE_GEMINI_API_KEY` 설정됨 (새 키)
- [ ] 모든 변수가 Production, Preview, Development에 적용됨

---

## 🎯 권장 순서

1. **Vercel Dashboard에서 GitHub 저장소 Import** (가장 쉬움)
2. 환경 변수 4개 설정
3. Deploy 클릭
4. Production Branch를 `main`으로 설정
5. 배포 완료 대기 (2-3분)
6. 테스트

---

## 📞 추가 도움말

### Vercel Support
- Dashboard: https://vercel.com/kohsunwoo12345-cmyk/superplace
- Docs: https://vercel.com/docs

### 문서 참조
- `DEPLOYMENT_COMPLETED.md`
- `SECURITY_API_KEY_GUIDE.md`
- `VERCEL_ENV_CHECKLIST.md`

---

**다음 단계**: Vercel Dashboard에서 프로젝트를 Import하세요! 🚀
