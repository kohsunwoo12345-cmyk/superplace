# 📋 Cloudflare Pages 배포 양식 작성 가이드

> 복사해서 붙여넣기만 하면 됩니다!

---

## 🎯 Cloudflare Dashboard 양식 작성표

### Step 1: 프로젝트 선택 화면

**항목 1: Repository to deploy**
```
선택: superplace (kohsunwoo12345-cmyk/superplace)
```

**항목 2: Branch to deploy**
```
선택: main
```

---

### Step 2: 빌드 설정 화면

#### 📝 작성할 항목들

**Project name** (프로젝트 이름)
```
superplace_study
```
> ✅ 복사해서 붙여넣으세요
> ⚠️ 언더바(_) 그대로 입력하세요

---

**Production branch** (프로덕션 브랜치)
```
main
```
> 드롭다운에서 선택

---

**Framework preset** (프레임워크 프리셋)
```
Next.js
```
> 드롭다운에서 "Next.js" 선택

---

**Build command** (빌드 명령)
```
npm run build
```
> ✅ 정확히 복사해서 붙여넣으세요
> ⚠️ 띄어쓰기 주의!

---

**Build output directory** (빌드 출력 디렉토리)
```
.next
```
> ✅ 점(.)까지 포함해서 복사
> ⚠️ 공백 없이 `.next`

---

**Root directory (optional)** (루트 디렉토리 - 선택사항)
```
/
```
> 슬래시(/) 하나만 입력
> 또는 비워두셔도 됩니다

---

### Step 3: 환경 변수 설정 (배포 후)

#### 📝 3개의 환경 변수 추가

Settings > Environment variables > Add variable 클릭

---

**변수 1: DATABASE_URL**

Variable name (변수 이름):
```
DATABASE_URL
```

Value (값):
```
file:./prisma/dev.db
```
> ✅ 점(.)까지 포함해서 복사

Environment (적용 환경):
```
☑️ Production
☑️ Preview
```
> 두 개 모두 체크

---

**변수 2: NEXTAUTH_URL**

Variable name (변수 이름):
```
NEXTAUTH_URL
```

Value (값):
```
https://superplace-study.pages.dev
```
> ⚠️ 주의: 언더바(_)가 아니라 하이픈(-) 사용
> ⚠️ `superplace-study` (하이픈)

Environment (적용 환경):
```
☑️ Production
☑️ Preview
```

---

**변수 3: NEXTAUTH_SECRET**

Variable name (변수 이름):
```
NEXTAUTH_SECRET
```

Value (값):
```
[여기에 생성한 비밀 키 붙여넣기]
```

**비밀 키 생성 방법:**

**방법 1 - 온라인 생성기 (가장 쉬움)**
1. 이 사이트 방문: https://generate-secret.vercel.app/32
2. 화면에 나타난 문자열 전체 복사
3. 위의 Value에 붙여넣기

**방법 2 - 터미널 사용 (Mac/Linux)**
```bash
openssl rand -base64 32
```
출력된 문자열 복사해서 사용

**방법 3 - 직접 만들기**
- 최소 32자 이상
- 영문 대소문자 + 숫자 + 특수문자 조합
- 예: `MyVerySecretKey2024!@#$%SecurePassword`

Environment (적용 환경):
```
☑️ Production
☑️ Preview
```

---

## 🎯 입력 예시 (실제 화면)

### 화면 1: 빌드 설정

```
┌─────────────────────────────────────────────────┐
│ Project name                                    │
│ [superplace_study                            ]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Production branch                               │
│ [main                                        ▼] │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Framework preset                                │
│ [Next.js                                     ▼] │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Build command                                   │
│ [npm run build                               ]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Build output directory                          │
│ [.next                                       ]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Root directory (optional)                       │
│ [/                                           ]  │
└─────────────────────────────────────────────────┘

          [Cancel]  [Save and Deploy]
```

### 화면 2: 환경 변수 추가

```
┌─────────────────────────────────────────────────┐
│ Add environment variable                        │
├─────────────────────────────────────────────────┤
│ Variable name                                   │
│ [DATABASE_URL                                ]  │
│                                                 │
│ Value                                           │
│ [file:./prisma/dev.db                        ]  │
│                                                 │
│ Apply to:                                       │
│ ☑️ Production                                   │
│ ☑️ Preview                                      │
│                                                 │
│           [Cancel]  [Save]                      │
└─────────────────────────────────────────────────┘
```

---

## ✅ 작성 완료 체크리스트

배포하기 전에 확인하세요:

### 빌드 설정
- [ ] 프로젝트 이름: `superplace_study` ✓
- [ ] 브랜치: `main` ✓
- [ ] 프레임워크: `Next.js` ✓
- [ ] 빌드 명령: `npm run build` ✓
- [ ] 출력 디렉토리: `.next` ✓

### 환경 변수 (배포 후 추가)
- [ ] DATABASE_URL 추가됨 ✓
- [ ] NEXTAUTH_URL 추가됨 ✓
- [ ] NEXTAUTH_SECRET 추가됨 ✓
- [ ] 모든 변수에 Production, Preview 체크됨 ✓

### 최종 확인
- [ ] "Save and Deploy" 버튼 클릭함 ✓
- [ ] 빌드 로그에서 ✓ 표시 확인 ✓
- [ ] 환경 변수 추가 후 "Redeploy" 실행 ✓
- [ ] 웹사이트 접속 확인 ✓

---

## 🚨 자주 하는 실수

### ❌ 실수 1: 프로젝트 이름
```
잘못: superplace-study (하이픈)
올바름: superplace_study (언더바)
```

### ❌ 실수 2: 출력 디렉토리
```
잘못: next
잘못: /next
잘못: .Next
올바름: .next (점 + 소문자 next)
```

### ❌ 실수 3: 빌드 명령
```
잘못: npm build
잘못: npm-run-build
잘못: npmrunbuild
올바름: npm run build (띄어쓰기 주의)
```

### ❌ 실수 4: NEXTAUTH_URL
```
잘못: https://superplace_study.pages.dev (언더바)
올바름: https://superplace-study.pages.dev (하이픈)
```

---

## 💡 도움말

### 복사-붙여넣기 팁
1. 위의 코드 박스에서 값을 **드래그**
2. **Ctrl+C** (Mac은 Cmd+C) 로 복사
3. Cloudflare 입력창에 **Ctrl+V** (Mac은 Cmd+V) 로 붙여넣기

### 확인 방법
- 복사한 값을 메모장에 먼저 붙여넣어 보기
- 앞뒤 공백이 없는지 확인
- 특수문자가 제대로 복사되었는지 확인

---

**이 문서를 옆에 두고 하나씩 따라하세요!** ✨

문제가 생기면 어느 단계에서 막혔는지 알려주세요.
