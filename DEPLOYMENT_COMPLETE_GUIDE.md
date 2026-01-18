# 🚀 처음부터 끝까지 - Cloudflare Pages 배포 완전 가이드

> 웹사이트 접속부터 배포 완료까지 모든 단계를 화면별로 설명합니다!

---

## 📌 준비물 확인

시작하기 전에 필요한 것들:
- ✅ 컴퓨터 (Windows, Mac 모두 가능)
- ✅ 인터넷 연결
- ✅ 이메일 주소
- ✅ GitHub 계정 (kohsunwoo12345-cmyk)
- ✅ GitHub에 업로드된 프로젝트 (superplace)

---

# 1단계: Cloudflare 웹사이트 접속 (1분)

## 1-1. 웹브라우저 열기

1. **Chrome, Safari, Edge** 중 아무거나 실행
2. 주소창에 입력:
   ```
   https://dash.cloudflare.com
   ```
3. **Enter** 키 누르기

---

## 1-2. 화면에 보이는 것

```
┌────────────────────────────────────────┐
│  Cloudflare                            │
├────────────────────────────────────────┤
│                                        │
│  Welcome to Cloudflare                 │
│                                        │
│  [Log in]  [Sign Up]                   │
│                                        │
└────────────────────────────────────────┘
```

**처음 방문이라면:**
- **"Sign Up"** 버튼 클릭 → 2단계로

**이미 계정이 있다면:**
- **"Log in"** 버튼 클릭 → 3단계로

---

# 2단계: 회원가입 하기 (5분)

## 2-1. Sign Up 화면

```
┌────────────────────────────────────────┐
│  Create your Cloudflare account        │
├────────────────────────────────────────┤
│  Email                                 │
│  [                                  ]  │
│                                        │
│  Password                              │
│  [                                  ]  │
│                                        │
│  ☐ I agree to the terms...            │
│                                        │
│  [Create Account]                      │
└────────────────────────────────────────┘
```

### 입력하기:

**1) Email (이메일)**
- 자주 사용하는 이메일 입력
- 예: `myemail@gmail.com`

**2) Password (비밀번호)**
- 8자 이상
- 영문 + 숫자 조합
- 예: `MyPass2024!`
- ⚠️ **잘 기억해두세요!**

**3) 체크박스**
- "I agree to the terms..." 체크 ✓

**4) 버튼 클릭**
- **"Create Account"** 버튼 클릭

---

## 2-2. 이메일 인증

### 화면 변화:
```
┌────────────────────────────────────────┐
│  Verify your email                     │
├────────────────────────────────────────┤
│  We sent an email to:                  │
│  myemail@gmail.com                     │
│                                        │
│  Please check your inbox and           │
│  click the verification link           │
└────────────────────────────────────────┘
```

### 할 일:
1. **이메일 확인하기**
   - Gmail, Naver 등 이메일 앱 열기
   - "Cloudflare" 발신 메일 찾기
   - 스팸함도 확인!

2. **인증 링크 클릭**
   - 메일 내용 중 "Verify Email" 버튼 클릭
   - 또는 긴 링크 클릭

3. **자동으로 브라우저가 열림**
   - ✓ "Email verified!" 메시지 확인

---

# 3단계: Cloudflare 로그인 (1분)

이미 계정이 있거나 인증이 완료되면:

```
┌────────────────────────────────────────┐
│  Log in to Cloudflare                  │
├────────────────────────────────────────┤
│  Email                                 │
│  [myemail@gmail.com                 ]  │
│                                        │
│  Password                              │
│  [••••••••••                        ]  │
│                                        │
│  [Log in]                              │
└────────────────────────────────────────┘
```

**입력:**
1. 이메일 입력
2. 비밀번호 입력
3. **"Log in"** 버튼 클릭

---

# 4단계: Cloudflare Dashboard 진입 (1분)

## 4-1. 대시보드 화면

로그인 성공하면 이런 화면이 보입니다:

```
┌────────────────────────────────────────────────┐
│  Cloudflare                           [프로필]  │
├────────────────────────────────────────────────┤
│  Websites │ Workers & Pages │ ...             │
├────────────────────────────────────────────────┤
│                                                │
│  Welcome to Cloudflare!                        │
│                                                │
│  [Add a site]  [Create an application]         │
│                                                │
└────────────────────────────────────────────────┘
```

### 찾아야 할 메뉴:

왼쪽 사이드바 또는 상단 탭에서:
```
☐ Websites
☐ Workers & Pages  ← 이걸 찾으세요!
☐ R2
☐ Stream
```

**클릭:** **"Workers & Pages"**

---

# 5단계: Workers & Pages 페이지 (1분)

## 5-1. Workers & Pages 화면

```
┌────────────────────────────────────────────────┐
│  Workers & Pages                               │
├────────────────────────────────────────────────┤
│                                                │
│  Create an application                         │
│  [Create application]                          │
│                                                │
│  or                                            │
│                                                │
│  No Workers or Pages yet                       │
│                                                │
└────────────────────────────────────────────────┘
```

**클릭:** 파란색 **"Create application"** 버튼

---

## 5-2. Pages vs Workers 선택

```
┌────────────────────────────────────────┐
│  Create an application                 │
├────────────────────────────────────────┤
│                                        │
│  [Pages]        [Workers]              │
│   ↑                                    │
│  이걸 클릭!                             │
│                                        │
└────────────────────────────────────────┘
```

**클릭:** **"Pages"** 탭

⚠️ **중요:** Workers가 아니라 **Pages**를 선택하세요!

---

# 6단계: GitHub 연결하기 (3분)

## 6-1. Connect to Git 화면

```
┌────────────────────────────────────────┐
│  Create a project                      │
├────────────────────────────────────────┤
│                                        │
│  [Connect to Git]                      │
│                                        │
│  Connect your Git provider to          │
│  deploy from your repository           │
│                                        │
│  or                                    │
│                                        │
│  [Direct Upload]                       │
│                                        │
└────────────────────────────────────────┘
```

**클릭:** **"Connect to Git"** 버튼

---

## 6-2. Git Provider 선택

```
┌────────────────────────────────────────┐
│  Select your Git provider              │
├────────────────────────────────────────┤
│                                        │
│  [GitHub]                              │
│   ↑                                    │
│  이걸 클릭!                             │
│                                        │
│  [GitLab]                              │
│                                        │
│  [Bitbucket]                           │
│                                        │
└────────────────────────────────────────┘
```

**클릭:** **"GitHub"** 버튼

---

## 6-3. GitHub 인증

새 창이 열립니다:

```
┌────────────────────────────────────────┐
│  GitHub                        [×]     │
├────────────────────────────────────────┤
│  Sign in to GitHub                     │
│                                        │
│  Username or email                     │
│  [kohsunwoo12345-cmyk              ]   │
│                                        │
│  Password                              │
│  [••••••••••                       ]   │
│                                        │
│  [Sign in]                             │
└────────────────────────────────────────┘
```

**입력:**
1. GitHub 사용자 이름 또는 이메일
2. GitHub 비밀번호
3. **"Sign in"** 클릭

**2단계 인증이 있다면:**
- 휴대폰에서 인증 코드 확인
- 6자리 숫자 입력

---

## 6-4. Cloudflare 권한 승인

```
┌────────────────────────────────────────────┐
│  Authorize Cloudflare Pages               │
├────────────────────────────────────────────┤
│  Cloudflare Pages would like              │
│  permission to:                           │
│                                           │
│  ✓ Read access to code                   │
│  ✓ Read and write access to deployments │
│                                           │
│  [Authorize Cloudflare Pages]            │
│   ↑                                       │
│  이 버튼 클릭!                             │
└────────────────────────────────────────────┘
```

**클릭:** 초록색 **"Authorize Cloudflare Pages"** 버튼

---

# 7단계: 저장소 선택하기 (2분)

## 7-1. 저장소 목록

GitHub 연결 성공하면:

```
┌────────────────────────────────────────────┐
│  Select a repository                      │
├────────────────────────────────────────────┤
│  🔍 [Search repositories...           ]   │
│                                           │
│  📁 kohsunwoo12345-cmyk/project1          │
│     [Select]                              │
│                                           │
│  📁 kohsunwoo12345-cmyk/superplace        │
│     [Select]  ← 이걸 찾으세요!            │
│                                           │
│  📁 kohsunwoo12345-cmyk/project3          │
│     [Select]                              │
│                                           │
└────────────────────────────────────────────┘
```

**찾기:**
1. 검색창에 `superplace` 입력
2. **"superplace"** 저장소 찾기
3. 옆의 **"Select"** 버튼 클릭

---

# 8단계: 빌드 설정하기 (5분) ⭐ 가장 중요!

## 8-1. 설정 화면

```
┌──────────────────────────────────────────────────┐
│  Set up builds and deployments                   │
├──────────────────────────────────────────────────┤
│  Project name                                    │
│  [superplace-study                           ]   │
│  ↑ 자동으로 채워져 있을 수 있음                    │
│                                                  │
│  Production branch                               │
│  [main                                       ▼]  │
│                                                  │
│  Framework preset                                │
│  [None                                       ▼]  │
│  ↑ 이걸 Next.js로 변경!                          │
│                                                  │
│  Build command                                   │
│  [                                           ]   │
│  ↑ 여기에 입력 필요!                              │
│                                                  │
│  Build output directory                          │
│  [                                           ]   │
│  ↑ 여기에 입력 필요!                              │
│                                                  │
│  Root directory (optional)                       │
│  [                                           ]   │
│                                                  │
│         [Cancel]  [Save and Deploy]              │
└──────────────────────────────────────────────────┘
```

---

## 8-2. 입력하기 (복사-붙여넣기)

### 1) Project name

**현재 값:**
```
superplace-study
```

**변경할 값:** (언더바로!)
```
superplace_study
```

**입력 방법:**
1. 기존 텍스트 전체 선택 (Ctrl+A 또는 더블클릭)
2. 삭제
3. 아래 복사해서 붙여넣기:
   ```
   superplace_study
   ```

---

### 2) Production branch

**드롭다운 클릭:**
```
┌──────────────┐
│ main         │ ← 선택
│ genspark_ai_developer
└──────────────┘
```

**선택:** `main`

---

### 3) Framework preset

**드롭다운 클릭:**
```
┌──────────────┐
│ None         │
│ Next.js      │ ← 선택
│ React        │
│ Vue          │
│ Angular      │
└──────────────┘
```

**선택:** `Next.js`

---

### 4) Build command

**클릭:** 입력창 클릭

**입력:** 아래 복사해서 붙여넣기
```
npm run build
```

⚠️ **주의:** 
- 띄어쓰기 정확히!
- `npm` (공백) `run` (공백) `build`

---

### 5) Build output directory

**클릭:** 입력창 클릭

**입력:** 아래 복사해서 붙여넣기
```
.next
```

⚠️ **주의:** 
- 점(.) 포함!
- `.next` (소문자)

---

### 6) Root directory (선택사항)

**입력:** (선택 1)
```
/
```

또는

**비워둠** (선택 2)
```
(아무것도 입력 안 함)
```

---

## 8-3. 최종 확인

입력 완료 후 화면:

```
┌──────────────────────────────────────────────────┐
│  Project name                                    │
│  [superplace_study                           ]   │
│                                                  │
│  Production branch                               │
│  [main                                       ▼]  │
│                                                  │
│  Framework preset                                │
│  [Next.js                                    ▼]  │
│                                                  │
│  Build command                                   │
│  [npm run build                              ]   │
│                                                  │
│  Build output directory                          │
│  [.next                                      ]   │
│                                                  │
│  Root directory (optional)                       │
│  [/                                          ]   │
└──────────────────────────────────────────────────┘
```

**모두 확인했다면:**

**클릭:** 파란색 **"Save and Deploy"** 버튼!

---

# 9단계: 빌드 진행 중 (2-5분)

## 9-1. 빌드 화면

```
┌────────────────────────────────────────┐
│  Building your project...              │
├────────────────────────────────────────┤
│  ●●●●●●○○○○ 60%                      │
│                                        │
│  Initializing build environment        │
│  ✓ Cloning repository                  │
│  ✓ Installing dependencies             │
│  ● Building application...             │
│                                        │
└────────────────────────────────────────┘
```

**할 일:** 
- 기다리기! ☕
- 2-5분 소요됩니다

**진행 단계:**
1. ✓ Cloning repository (저장소 복사)
2. ✓ Installing dependencies (패키지 설치)
3. ● Building application (앱 빌드 중...)
4. ✓ Deploying to Cloudflare's global network

---

## 9-2. 빌드 성공!

```
┌────────────────────────────────────────┐
│  ✓ Success! Your site is live!         │
├────────────────────────────────────────┤
│  🎉 Deployed successfully              │
│                                        │
│  https://superplace-study.pages.dev    │
│                                        │
│  [Visit site]  [Continue to project]   │
└────────────────────────────────────────┘
```

**🎉 축하합니다! 배포 성공!**

**하지만 아직 끝이 아닙니다!**
→ 환경 변수를 추가해야 웹사이트가 제대로 작동합니다!

**클릭:** **"Continue to project"** 버튼

---

# 10단계: 환경 변수 추가하기 (10분) ⭐ 필수!

## 10-1. 프로젝트 페이지

```
┌────────────────────────────────────────────┐
│  superplace-study                          │
├────────────────────────────────────────────┤
│  [Deployments] [Settings] [Analytics]      │
│      ↑               ↑                     │
│    지금 여기      Settings 클릭!            │
└────────────────────────────────────────────┘
```

**클릭:** **"Settings"** 탭

---

## 10-2. Settings 메뉴

왼쪽 메뉴에서:

```
┌────────────────────────┐
│ Settings               │
├────────────────────────┤
│ General                │
│ Functions              │
│ Environment variables  │ ← 클릭!
│ Builds & deployments   │
│ Redirects & Headers    │
└────────────────────────┘
```

**클릭:** **"Environment variables"**

---

## 10-3. 환경 변수 화면

```
┌──────────────────────────────────────────┐
│  Environment variables                   │
├──────────────────────────────────────────┤
│  [Add variable]                          │
│   ↑                                      │
│  이 버튼 클릭!                            │
│                                          │
│  No environment variables yet            │
│                                          │
└──────────────────────────────────────────┘
```

**클릭:** **"Add variable"** 버튼

---

## 10-4. 첫 번째 변수: DATABASE_URL

```
┌──────────────────────────────────────────┐
│  Add environment variable                │
├──────────────────────────────────────────┤
│  Variable name                           │
│  [                                    ]  │
│  ↑ 여기에 입력                            │
│                                          │
│  Value                                   │
│  [                                    ]  │
│  ↑ 여기에 입력                            │
│                                          │
│  Environment                             │
│  ☐ Production                            │
│  ☐ Preview                               │
│  ↑ 두 개 모두 체크!                       │
│                                          │
│         [Cancel]  [Save]                 │
└──────────────────────────────────────────┘
```

### 입력:

**Variable name:** (복사-붙여넣기)
```
DATABASE_URL
```

**Value:** (복사-붙여넣기)
```
file:./prisma/dev.db
```

**Environment:**
- ✅ **Production** 체크
- ✅ **Preview** 체크

**클릭:** **"Save"** 버튼

---

## 10-5. 두 번째 변수: NEXTAUTH_URL

다시 **"Add variable"** 클릭

### 입력:

**Variable name:** (복사-붙여넣기)
```
NEXTAUTH_URL
```

**Value:** (복사-붙여넣기)
```
https://superplace-study.pages.dev
```

⚠️ **주의:** 
- `superplace-study` (하이픈 `-`)
- `superplace_study` (언더바 `_`) 아님!

**Environment:**
- ✅ **Production** 체크
- ✅ **Preview** 체크

**클릭:** **"Save"** 버튼

---

## 10-6. 세 번째 변수: NEXTAUTH_SECRET

### 먼저 비밀 키 생성하기!

**새 탭 열기:** (Ctrl+T 또는 Cmd+T)

**주소 입력:**
```
https://generate-secret.vercel.app/32
```

**화면에 보이는 것:**
```
┌──────────────────────────────────────────┐
│  Random Secret Generator                 │
├──────────────────────────────────────────┤
│                                          │
│  abc123XYZ789qwertyASDFGH456789zxcv     │
│  ↑                                       │
│  이런 긴 문자열이 보임                     │
│                                          │
│  [Copy]                                  │
└──────────────────────────────────────────┘
```

**할 일:**
1. 전체 문자열 선택 (마우스로 드래그)
2. 복사 (Ctrl+C 또는 Cmd+C)
3. 메모장에 임시로 붙여넣기 (안전하게 보관)

---

### Cloudflare로 돌아가기

다시 **"Add variable"** 클릭

### 입력:

**Variable name:** (복사-붙여넣기)
```
NEXTAUTH_SECRET
```

**Value:** (아까 복사한 긴 문자열 붙여넣기)
```
abc123XYZ789qwertyASDFGH456789zxcv
```
(예시입니다. 여러분이 생성한 값을 붙여넣으세요!)

**Environment:**
- ✅ **Production** 체크
- ✅ **Preview** 체크

**클릭:** **"Save"** 버튼

---

## 10-7. 환경 변수 확인

이제 3개의 변수가 보여야 합니다:

```
┌──────────────────────────────────────────┐
│  Environment variables                   │
├──────────────────────────────────────────┤
│  [Add variable]                          │
│                                          │
│  DATABASE_URL                            │
│  file:./prisma/dev.db                    │
│  Production, Preview                     │
│                                          │
│  NEXTAUTH_URL                            │
│  https://superplace-study.pages.dev      │
│  Production, Preview                     │
│                                          │
│  NEXTAUTH_SECRET                         │
│  ••••••••••••••••••••••••••             │
│  Production, Preview                     │
│                                          │
└──────────────────────────────────────────┘
```

**✓ 모두 확인되었습니다!**

---

# 11단계: 재배포하기 (2분) ⭐ 필수!

환경 변수를 추가한 후에는 꼭 재배포해야 합니다!

## 11-1. Deployments 탭으로 이동

상단 탭에서:

```
┌────────────────────────────────────────┐
│ [Deployments] [Settings] [Analytics]   │
│     ↑                                  │
│   클릭!                                 │
└────────────────────────────────────────┘
```

**클릭:** **"Deployments"** 탭

---

## 11-2. 최신 배포 찾기

```
┌──────────────────────────────────────────┐
│  Latest deployments                      │
├──────────────────────────────────────────┤
│  ✓ Production                            │
│    main@abc123                           │
│    5 minutes ago                         │
│    [···]  ← 여기 클릭!                   │
│                                          │
└──────────────────────────────────────────┘
```

**클릭:** 가장 위의 배포 항목 옆 **"···"** (점 세개)

---

## 11-3. 재배포 실행

메뉴가 나타납니다:

```
┌──────────────────────┐
│ View deployment      │
│ Retry deployment     │ ← 클릭!
│ Delete deployment    │
└──────────────────────┘
```

**클릭:** **"Retry deployment"** 또는 **"Redeploy"**

---

## 11-4. 확인 창

```
┌──────────────────────────────────────────┐
│  Retry deployment?                       │
├──────────────────────────────────────────┤
│  This will redeploy your application     │
│  with the current settings               │
│                                          │
│         [Cancel]  [Retry]                │
└──────────────────────────────────────────┘
```

**클릭:** **"Retry"** 또는 **"Redeploy"** 버튼

---

## 11-5. 재배포 진행 중

```
┌────────────────────────────────────────┐
│  Building...                           │
├────────────────────────────────────────┤
│  ●●●●○○○○○○ 40%                      │
│                                        │
│  ● Building application...             │
└────────────────────────────────────────┘
```

**기다리기:** 2-3분

---

## 11-6. 재배포 완료!

```
┌────────────────────────────────────────┐
│  ✓ Deployment successful               │
├────────────────────────────────────────┤
│  Latest deployment                     │
│  ✓ Production                          │
│    just now                            │
└────────────────────────────────────────┘
```

**🎉 이제 진짜 완료!**

---

# 12단계: 웹사이트 확인하기 (1분)

## 12-1. Visit Site 버튼

프로젝트 페이지 상단에:

```
┌────────────────────────────────────────┐
│  superplace-study                      │
│                                        │
│  [Visit site]  ← 클릭!                 │
│   ↑                                    │
│  이 버튼 클릭!                          │
└────────────────────────────────────────┘
```

**클릭:** **"Visit site"** 버튼

또는 직접 주소 입력:
```
https://superplace-study.pages.dev
```

---

## 12-2. 웹사이트 확인

브라우저에 다음이 보여야 합니다:

```
┌────────────────────────────────────────────┐
│  🎓 Smart Academy                          │
├────────────────────────────────────────────┤
│  체계적인 학습 관리로                       │
│  성적 향상을 실현하세요                     │
│                                            │
│  [학습 시작하기]  [학원장 로그인]           │
│                                            │
│  100+          500+         95%          │
│  학습 자료      재원생      학습 만족도     │
└────────────────────────────────────────────┘
```

---

## 12-3. 기능 테스트

### 1) 메인 페이지
- ✅ Smart Academy 로고 보임
- ✅ 예쁜 그라데이션 디자인
- ✅ 통계 숫자들 보임

### 2) 로그인 페이지
- **"로그인"** 버튼 클릭
- ✅ 로그인 폼 보임
- ✅ 이메일, 비밀번호 입력창 있음

### 3) 회원가입 페이지
- **"회원가입"** 버튼 클릭
- ✅ 회원가입 폼 보임
- ✅ 입력 항목들 정상 작동

---

# 🎉 완료! 축하합니다!

배포가 완전히 끝났습니다!

---

## ✅ 완료 체크리스트

모두 체크되었나요?

### Cloudflare 설정
- [x] Cloudflare 회원가입
- [x] GitHub 연결
- [x] superplace 저장소 선택
- [x] 프로젝트 이름: `superplace_study`
- [x] 빌드 명령: `npm run build`
- [x] 출력 디렉토리: `.next`
- [x] "Save and Deploy" 클릭

### 환경 변수
- [x] DATABASE_URL 추가
- [x] NEXTAUTH_URL 추가
- [x] NEXTAUTH_SECRET 추가
- [x] 재배포 실행

### 최종 확인
- [x] 웹사이트 접속 성공
- [x] 메인 페이지 정상 표시
- [x] 로그인 페이지 작동

---

## 🌐 배포된 URL

**프로덕션:**
```
https://superplace-study.pages.dev
```

**이제 누구나 이 주소로 접속할 수 있습니다!**

---

## 🔄 자동 배포 설정 완료

앞으로는:

1. **GitHub에 코드 푸시**
   ```bash
   git push origin main
   ```

2. **자동으로 Cloudflare가 감지**
   - 새 배포 자동 시작

3. **2-3분 후 자동 업데이트**
   - 수동으로 할 일 없음!

---

## 📱 다음 단계 (선택사항)

### 커스텀 도메인 추가
자신의 도메인(예: www.mystudy.com)이 있다면:

1. Settings > Custom domains
2. "Set up a custom domain" 클릭
3. 도메인 입력
4. DNS 설정 (안내에 따라)

---

## 🆘 문제가 생겼다면?

### 빌드 실패
- Deployments 탭에서 로그 확인
- 빌드 명령 다시 확인: `npm run build`
- 출력 디렉토리 확인: `.next`

### 하얀 화면
- 환경 변수 3개 모두 추가했는지 확인
- 재배포 했는지 확인

### 로그인 안 됨
- NEXTAUTH_SECRET 설정 확인
- NEXTAUTH_URL 확인 (하이픈!)

---

## 📞 도움이 필요하면

다음 정보와 함께 문의:
1. 어느 단계에서 막혔는지
2. 스크린샷
3. 에러 메시지

---

## 🎊 성공을 축하합니다!

**당신의 학원 학습 관리 시스템이 전 세계에 공개되었습니다!**

```
🌏 https://superplace-study.pages.dev
```

**이제 학생들이 언제 어디서나 접속해서 학습할 수 있습니다!**

---

**소요 시간:** 약 30분  
**난이도:** ⭐⭐ 중급  
**완료 날짜:** 2024-01-18

**수고하셨습니다!** 🎉
