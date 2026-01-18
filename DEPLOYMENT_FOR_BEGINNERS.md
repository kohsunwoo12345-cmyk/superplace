# 🎓 비개발자를 위한 Cloudflare Pages 배포 가이드

> 코딩을 모르는 분도 따라할 수 있도록 하나하나 자세히 설명합니다!

---

## 📌 시작하기 전에

### 필요한 것들
- ✅ 이미 준비됨: GitHub 계정 (kohsunwoo12345-cmyk)
- ✅ 이미 준비됨: 프로젝트 코드 (GitHub에 업로드됨)
- 🆕 필요함: Cloudflare 계정 (무료)
- 🆕 필요함: 이메일 주소 (Cloudflare 가입용)

---

## 1단계: Cloudflare 계정 만들기 (5분)

### 1-1. Cloudflare 웹사이트 방문
1. 웹브라우저를 열고 주소창에 입력하세요:
   ```
   https://dash.cloudflare.com/sign-up
   ```

2. 화면에 보이는 것:
   - 📧 Email (이메일)
   - 🔒 Password (비밀번호)
   - "Create Account" 버튼

### 1-2. 회원가입
1. **이메일 주소** 입력
   - 예: `yourname@gmail.com`

2. **비밀번호** 입력
   - 8자 이상, 영문+숫자 조합
   - 예: `MyPass2024!`
   - ⚠️ 잘 기억해두세요!

3. **"Create Account"** 버튼 클릭

4. 이메일 확인
   - 입력한 이메일로 확인 메일이 옵니다
   - 메일을 열고 "Verify Email" 버튼 클릭

---

## 2단계: GitHub 계정과 연결하기 (3분)

### 2-1. Cloudflare Pages 시작
1. Cloudflare에 로그인한 상태에서
2. 왼쪽 메뉴에서 **"Workers & Pages"** 클릭
3. 오른쪽 위의 파란색 **"Create application"** 버튼 클릭
4. **"Pages"** 탭 선택 (위쪽에 있음)
5. **"Connect to Git"** 버튼 클릭

### 2-2. GitHub 연결
1. **"GitHub"** 로고가 보이는 버튼 클릭
2. 새 창이 열리면 GitHub 로그인
   - 이메일: `kohsunwoo12345-cmyk` 관련 계정
   - 비밀번호: GitHub 비밀번호 입력

3. 권한 승인 화면
   - "Authorize Cloudflare Pages" 버튼 클릭
   - 초록색 체크 표시가 나타나면 성공!

---

## 3단계: 프로젝트 선택하기 (2분)

### 3-1. 저장소 찾기
1. 화면에 GitHub 저장소 목록이 보입니다
2. **"superplace"** 저장소를 찾으세요
   - 검색창에 `superplace` 입력하면 쉽게 찾을 수 있어요

3. **"superplace"** 옆의 **"Select"** 버튼 클릭

### 3-2. 브랜치 선택
1. "Branch to deploy" (배포할 브랜치) 항목이 보입니다
2. 드롭다운 메뉴 클릭
3. **"main"** 또는 **"genspark_ai_developer"** 선택
   - 권장: `main` 선택

---

## 4단계: 배포 설정하기 (5분) ⭐ 중요!

이 단계가 가장 중요합니다! 정확히 입력해주세요.

### 4-1. 기본 정보 입력

**1) Project name (프로젝트 이름)**
```
superplace_study
```
- ⚠️ 띄어쓰기 없이 정확히 입력!
- 언더바(_)도 그대로 입력

**2) Production branch (프로덕션 브랜치)**
```
main
```
- 드롭다운에서 `main` 선택

### 4-2. 빌드 설정 입력

**"Framework preset" (프레임워크)**
- 드롭다운 메뉴 클릭
- **"Next.js"** 선택

**"Build command" (빌드 명령)**
```
npm run build
```
- 정확히 이대로 입력!
- 띄어쓰기 주의: `npm` (공백) `run` (공백) `build`

**"Build output directory" (빌드 출력 디렉토리)**
```
.next
```
- 점(.)과 next 사이에 공백 없음!
- `.next` 정확히 입력

**"Root directory" (루트 디렉토리)**
```
/
```
- 슬래시(/) 하나만 입력
- 또는 비워두셔도 됩니다

### 4-3. 배포 시작!
1. 모든 항목을 확인했다면
2. 화면 아래 파란색 **"Save and Deploy"** 버튼 클릭
3. 로딩 화면이 나타납니다 (약 2-5분 소요)

---

## 5단계: 환경 변수 설정하기 (10분) ⭐ 필수!

배포가 완료되면 환경 변수를 설정해야 합니다.

### 5-1. 환경 변수 페이지 이동
1. 배포 완료 화면에서 프로젝트 이름 클릭
2. 위쪽 메뉴에서 **"Settings"** 클릭
3. 왼쪽 메뉴에서 **"Environment variables"** 클릭

### 5-2. NEXTAUTH_SECRET 생성하기

먼저 비밀 키를 만들어야 합니다.

**방법 1: 온라인 생성기 사용 (추천)**
1. 새 탭에서 이 주소를 엽니다:
   ```
   https://generate-secret.vercel.app/32
   ```
2. 화면에 긴 문자열이 나타납니다
   - 예: `abc123XYZ789...` (실제로는 더 김)
3. **전체를 복사**합니다 (Ctrl+C 또는 우클릭 > 복사)
4. 메모장에 임시로 붙여넣어 두세요

**방법 2: 직접 만들기**
- 32자 이상의 랜덤 문자열
- 영문 대소문자 + 숫자 + 특수문자 섞어서
- 예: `MySecretKey123!@#SuperSecure456$`

### 5-3. 환경 변수 추가

이제 Cloudflare 환경 변수 페이지로 돌아갑니다.

**첫 번째 변수: DATABASE_URL**
1. **"Add variable"** 버튼 클릭
2. Variable name (변수 이름):
   ```
   DATABASE_URL
   ```
3. Value (값):
   ```
   file:./prisma/dev.db
   ```
4. **"Save"** 버튼 클릭

**두 번째 변수: NEXTAUTH_URL**
1. 다시 **"Add variable"** 버튼 클릭
2. Variable name:
   ```
   NEXTAUTH_URL
   ```
3. Value:
   ```
   https://superplace-study.pages.dev
   ```
   - ⚠️ 주의: `superplace_study`가 아니라 `superplace-study` (하이픈)
4. **"Save"** 버튼 클릭

**세 번째 변수: NEXTAUTH_SECRET**
1. 다시 **"Add variable"** 버튼 클릭
2. Variable name:
   ```
   NEXTAUTH_SECRET
   ```
3. Value:
   - 아까 복사한 긴 문자열 붙여넣기 (Ctrl+V)
4. **"Save"** 버튼 클릭

### 5-4. 재배포하기
환경 변수를 추가한 후에는 재배포가 필요합니다.

1. 위쪽 메뉴에서 **"Deployments"** 클릭
2. 가장 최근 배포 항목 찾기
3. 오른쪽의 **"···"** (점 세개) 클릭
4. **"Retry deployment"** 또는 **"Redeploy"** 클릭
5. 확인 버튼 클릭
6. 약 2-3분 기다리기

---

## 6단계: 완료! 웹사이트 확인하기 (1분)

### 6-1. 배포 URL 찾기
1. Cloudflare Pages 프로젝트 페이지에서
2. 위쪽에 **"Visit site"** 버튼이 보입니다
3. 또는 아래 주소로 직접 접속:
   ```
   https://superplace-study.pages.dev
   ```

### 6-2. 웹사이트 테스트
다음을 확인해보세요:
- ✅ 메인 페이지가 보이나요?
- ✅ "Smart Academy" 로고가 보이나요?
- ✅ "로그인" 버튼을 클릭하면 로그인 페이지로 이동하나요?

---

## 🎉 축하합니다!

배포가 완료되었습니다! 이제 누구나 이 주소로 접속할 수 있습니다:
```
https://superplace-study.pages.dev
```

---

## 📱 추가 설정 (선택사항)

### 커스텀 도메인 연결하기
자신의 도메인을 가지고 있다면 연결할 수 있습니다.

1. Cloudflare Pages 프로젝트 설정
2. **"Custom domains"** 클릭
3. **"Set up a custom domain"** 버튼
4. 도메인 입력 (예: `www.mystudy.com`)
5. DNS 설정 안내에 따라 설정

---

## ❓ 문제가 생겼나요?

### 배포가 실패했어요 (빨간색 표시)
1. **"Deployments"** 페이지로 이동
2. 실패한 배포 클릭
3. 로그 확인 (에러 메시지가 보입니다)
4. 대부분의 경우:
   - 빌드 명령 오타 확인
   - 출력 디렉토리 확인 (`.next`)

### 웹사이트가 하얗게 나와요
1. 환경 변수가 올바르게 설정되었는지 확인
2. 환경 변수 추가 후 재배포 했는지 확인

### 로그인이 안 돼요
1. `NEXTAUTH_SECRET`이 설정되었는지 확인
2. `NEXTAUTH_URL`이 올바른지 확인
   - `https://superplace-study.pages.dev` (하이픈 주의)

---

## 📞 도움이 필요하면

스크린샷을 찍어서 문의하세요:
1. 어떤 단계에서 막혔는지
2. 화면에 보이는 에러 메시지
3. 입력한 설정값들

---

## 🔄 자동 배포 설정

한 번 설정하면, 앞으로는:
1. GitHub에 코드를 올리면 (Push)
2. 자동으로 Cloudflare Pages가 감지
3. 자동으로 새 버전을 배포합니다!

수동으로 할 일이 없어요! 😊

---

## ✅ 완료 체크리스트

배포를 완료했다면 체크해보세요:

- [ ] Cloudflare 계정 생성 완료
- [ ] GitHub 연결 완료
- [ ] 프로젝트 이름: `superplace_study` 입력
- [ ] 빌드 명령: `npm run build` 입력
- [ ] 출력 디렉토리: `.next` 입력
- [ ] 환경 변수 3개 추가 완료
  - [ ] DATABASE_URL
  - [ ] NEXTAUTH_URL
  - [ ] NEXTAUTH_SECRET
- [ ] 재배포 완료
- [ ] 웹사이트 접속 확인

모두 체크되었다면 완료입니다! 🎊

---

**작성일**: 2024년 1월 18일  
**난이도**: ⭐ 초급 (비개발자용)  
**소요 시간**: 약 30분

궁금한 점이 있으면 언제든 물어보세요! 😊
