# 🚀 Cloudflare Pages 배포 가이드 (비개발자용)

> **소요 시간:** 약 15분  
> **난이도:** ⭐⭐ (쉬움)

---

## ✅ Cloudflare Pages란?

- **무료**로 웹사이트를 배포할 수 있는 서비스
- Vercel보다 **훨씬 간단**
- GitHub에 푸시하면 **자동으로 배포**됨
- **수동 승격 필요 없음!** (Vercel의 "Promote to Production" 같은 거 없어요)

---

## 📋 준비물

1. ✅ GitHub 계정 (이미 있음: kohsunwoo12345-cmyk)
2. ✅ 이 저장소 (이미 있음: https://github.com/kohsunwoo12345-cmyk/superplace)
3. 🆕 Cloudflare 계정 (무료로 만들 예정)

---

## 🎯 배포 순서 (딱 5단계!)

### 📍 **1단계: Cloudflare 계정 만들기** (3분)

1. **https://dash.cloudflare.com/sign-up** 접속
2. **이메일 주소** 입력 (GitHub과 같은 이메일 추천)
3. **비밀번호** 설정
4. **"Create Account"** 클릭
5. 이메일 인증 (받은 메일에서 링크 클릭)

✅ **완료!** 이제 Cloudflare 대시보드가 보입니다.

---

### 📍 **2단계: GitHub 연결하기** (2분)

1. Cloudflare 대시보드에서 왼쪽 메뉴 **"Workers & Pages"** 클릭
2. 오른쪽 위 **"Create application"** 버튼 클릭
3. **"Pages"** 탭 선택
4. **"Connect to Git"** 클릭
5. **"GitHub"** 선택
6. 팝업이 뜨면 **"Authorize Cloudflare Workers"** 클릭
7. **"Install & Authorize"** 클릭

✅ **완료!** GitHub 연결됨.

---

### 📍 **3단계: 프로젝트 선택하기** (2분)

1. 저장소 목록에서 **"kohsunwoo12345-cmyk/superplace"** 찾기
2. 오른쪽 **"Begin setup"** 버튼 클릭
3. 다음 정보 입력:

#### 프로젝트 이름:
```
superplace
```

#### Production branch:
```
genspark_ai_developer
```
(또는 `main` - 원하는 브랜치 선택)

#### Build settings:
- **Framework preset:** Next.js
- **Build command:** `npm run build`
- **Build output directory:** `.next`

4. 아래로 스크롤해서 **"Save and Deploy"** 클릭

⚠️ **잠깐!** 아직 배포 안 됩니다. 환경 변수를 먼저 설정해야 해요.

---

### 📍 **4단계: 환경 변수 설정하기** (5분)

배포가 시작되면 **실패**할 거예요. 괜찮아요! 환경 변수를 설정하면 됩니다.

1. 프로젝트 페이지에서 **"Settings"** 탭 클릭
2. 왼쪽 메뉴에서 **"Environment variables"** 클릭
3. 아래 변수들을 **하나씩** 추가:

#### 필수 환경 변수 목록:

| 변수 이름 | 값 (예시) | 설명 |
|---------|---------|------|
| `DATABASE_URL` | `postgresql://user:password@host:5432/database` | 데이터베이스 주소 |
| `NEXTAUTH_URL` | `https://superplace.pages.dev` | 배포 후 받는 주소 |
| `NEXTAUTH_SECRET` | `your-secret-here` | 암호화 키 |
| `GOOGLE_GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API 키 |
| `GOOGLE_API_KEY` | `AIzaSy...` | Google API 키 |

#### 환경 변수 추가 방법:
1. **"Add variable"** 버튼 클릭
2. **Variable name** 입력 (예: `DATABASE_URL`)
3. **Value** 입력
4. **Environment:** `Production`, `Preview` 둘 다 체크
5. **"Save"** 클릭
6. 위 5개 변수 모두 반복

✅ **완료!** 환경 변수 설정됨.

---

### 📍 **5단계: 재배포하기** (3분)

1. 상단 **"Deployments"** 탭 클릭
2. 가장 최근 배포 (FAILED 상태) 클릭
3. 오른쪽 위 **"Retry deployment"** 버튼 클릭
4. **2-3분 대기** ☕

✅ **배포 완료!** 🎉

---

## 🌐 배포된 사이트 확인하기

배포가 성공하면 다음과 같은 주소를 받습니다:

```
https://superplace.pages.dev
```

또는 커스텀 도메인 설정 가능:
```
https://superplace-study.com
```

### 확인 방법:
1. **"Deployments"** 탭에서 최신 배포 상태가 **"Success"** 인지 확인
2. 배포된 사이트 링크 클릭
3. 로그인 테스트: `admin@superplace.com`

---

## 🔄 이제부터는 완전 자동!

앞으로는:

1. **코드 수정**
2. **`git push origin genspark_ai_developer`** (또는 main)
3. **끝!** 🎉

→ Cloudflare가 자동으로 감지해서 배포합니다.  
→ **2-3분 후** 사이트 자동 업데이트!  
→ **수동 승격 필요 없음!**

---

## ❓ 자주 묻는 질문

### Q1: Vercel 프로젝트는 어떻게 하나요?
**A:** 그냥 두면 됩니다. 삭제해도 되고, 그대로 두고 Cloudflare만 사용해도 됩니다.

### Q2: 도메인 연결은 어떻게 하나요?
**A:** Cloudflare Pages 프로젝트 → **"Custom domains"** → 도메인 추가

### Q3: 배포가 실패하면?
**A:** 
1. **"Deployments"** 탭 → 실패한 배포 클릭
2. **"View build logs"** 확인
3. 대부분 환경 변수 누락 문제

### Q4: 배포 시간은 얼마나 걸리나요?
**A:** 보통 2-3분. Vercel과 비슷합니다.

### Q5: 비용은 얼마인가요?
**A:** **무료입니다!** (월 500회 빌드까지 무료)

---

## 📊 Vercel vs Cloudflare Pages 비교

| 항목 | Vercel | Cloudflare Pages |
|------|--------|------------------|
| 가격 | 무료 (제한적) | 무료 (넉넉함) |
| 배포 속도 | 2-3분 | 2-3분 |
| 자동 배포 | ✅ (수동 승격 필요) | ✅ (완전 자동) |
| 설정 난이도 | 어려움 😰 | 쉬움 😊 |
| GitHub 연동 | 복잡 | 간단 |

---

## 🎉 완료!

이제 코드만 푸시하면 자동으로 배포됩니다!

**배포 주소:** https://superplace.pages.dev  
**Cloudflare 대시보드:** https://dash.cloudflare.com

---

## 📝 체크리스트

완료하셨으면 체크해보세요:

- [ ] 1단계: Cloudflare 계정 만들었나요?
- [ ] 2단계: GitHub 연결했나요?
- [ ] 3단계: 프로젝트 선택했나요?
- [ ] 4단계: 환경 변수 설정했나요? (5개 모두)
- [ ] 5단계: 재배포 성공했나요?
- [ ] 6단계: 사이트 접속 확인했나요?

---

**막히는 부분이 있으면 언제든 물어보세요!** 😊
