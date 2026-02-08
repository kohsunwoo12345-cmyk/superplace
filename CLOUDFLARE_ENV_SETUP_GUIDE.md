# 🔧 Cloudflare Pages 환경 변수 설정 가이드 (비개발자용)

## 📌 목표
Preview 환경에 `GOOGLE_GEMINI_API_KEY` 환경 변수를 추가하기

---

## 🎯 단계별 가이드

### 1️⃣ Cloudflare 대시보드 접속
1. 웹브라우저를 열고 https://dash.cloudflare.com/ 접속
2. 로그인 (이메일과 비밀번호 입력)

---

### 2️⃣ Workers & Pages 메뉴로 이동
1. 왼쪽 사이드바에서 **"Workers & Pages"** 클릭
   - 또는 상단 메뉴에서 찾기

![Workers & Pages 메뉴 위치]
```
┌─────────────────────────┐
│ 🏠 Home                 │
│ 🌐 Websites             │
│ ⚡ Workers & Pages  ← 여기! │
│ 📧 Email                │
│ ...                     │
└─────────────────────────┘
```

---

### 3️⃣ 프로젝트 선택
1. **"superplace"** 프로젝트를 찾아서 클릭
   - 프로젝트 목록에서 보임

```
프로젝트 목록:
┌──────────────────────────────┐
│ 📄 superplace            ← 클릭 │
│ 📄 다른 프로젝트들...         │
└──────────────────────────────┘
```

---

### 4️⃣ Settings 탭으로 이동
1. 프로젝트 페이지 상단의 탭들 중 **"Settings"** 클릭

```
┌─────────────────────────────────────┐
│ Overview  Deployments  Settings ← 클릭 │
└─────────────────────────────────────┘
```

---

### 5️⃣ Environment variables 섹션 찾기
1. Settings 페이지에서 아래로 스크롤
2. **"Environment variables"** 섹션 찾기
   - "Variables and Secrets" 또는 "환경 변수" 라고도 표시될 수 있음

```
Settings 페이지:
├── General
├── Builds & deployments
├── Environment variables  ← 여기!
├── Functions
└── ...
```

---

### 6️⃣ Preview 탭 선택 (⭐ 가장 중요!)
1. Environment variables 섹션 내부에 **2개의 탭**이 있음:
   - **Production** (프로덕션)
   - **Preview** (미리보기)

2. **"Preview"** 탭을 클릭
   - ⚠️ 주의: Production이 아닌 Preview를 선택해야 함!

```
Environment variables
┌─────────────────────────┐
│ Production │ Preview ← 클릭 │
└─────────────────────────┘
```

---

### 7️⃣ 환경 변수 추가하기
1. **"Add variable"** 또는 **"변수 추가"** 버튼 클릭

2. 다음 정보 입력:
   ```
   Variable name (변수 이름):
   GOOGLE_GEMINI_API_KEY
   
   Value (값):
   [여기에 Google Gemini API 키를 붙여넣기]
   ```

3. **⚠️ 정확히 입력하세요:**
   - 변수 이름: `GOOGLE_GEMINI_API_KEY` (대소문자, 언더스코어 정확히)
   - 띄어쓰기 없음
   - 앞뒤 공백 없음

---

### 8️⃣ 저장하기
1. **"Save"** 또는 **"저장"** 버튼 클릭
2. 확인 메시지가 나타나면 다시 한번 확인

---

### 9️⃣ 배포 트리거 (선택사항)
환경 변수는 **다음 배포부터 적용**됩니다.

**방법 A: 자동 배포 대기**
- 다음 코드 푸시 시 자동으로 적용됨

**방법 B: 즉시 적용하기**
1. Deployments 탭으로 이동
2. 가장 최근 배포 찾기
3. 우측의 **"..." 메뉴** 클릭
4. **"Retry deployment"** 또는 **"재배포"** 클릭

---

## ✅ 확인 방법

### 설정이 제대로 되었는지 확인:

1. 웹브라우저에서 다음 URL 접속:
   ```
   https://genspark-ai-developer.superplacestudy.pages.dev/api/test-env
   ```

2. 화면에 다음과 같이 표시되면 **성공**:
   ```json
   {
     "hasKey": true,
     "keyLength": 39,
     "keyPrefix": "AIzaSyBxxx"
   }
   ```

3. 만약 이렇게 나오면 **아직 미적용**:
   ```json
   {
     "hasKey": false,
     "keyLength": 0,
     "keyPrefix": "undefined"
   }
   ```
   → 다시 한번 Preview 탭에 설정했는지 확인하고 재배포

---

## 🔍 자주 하는 실수

### ❌ 실수 1: Production 탭에만 설정
- Preview 환경은 별도로 설정해야 함
- **Preview 탭**을 꼭 선택하세요!

### ❌ 실수 2: 변수 이름 오타
- 정확히: `GOOGLE_GEMINI_API_KEY`
- 대소문자 구분됨
- 언더스코어(_) 2개

### ❌ 실수 3: 값에 공백 포함
- API 키 앞뒤에 공백이 들어가면 안 됨
- 복사-붙여넣기 시 주의

### ❌ 실수 4: 배포 안함
- 환경 변수 설정 후 배포가 필요함
- Retry deployment로 즉시 적용 가능

---

## 📸 스크린샷 위치 참고

각 단계에서 찾아야 할 위치:

```
1. Cloudflare 대시보드 홈
   └─> Workers & Pages 클릭

2. Workers & Pages 페이지
   └─> superplace 프로젝트 클릭

3. superplace 프로젝트 페이지
   └─> Settings 탭 클릭

4. Settings 페이지
   └─> Environment variables 섹션으로 스크롤

5. Environment variables 섹션
   └─> Preview 탭 클릭 (⭐ 중요!)

6. Preview 탭 내부
   └─> Add variable 버튼 클릭

7. 변수 추가 폼
   ├─> Variable name: GOOGLE_GEMINI_API_KEY
   ├─> Value: [API 키]
   └─> Save 클릭
```

---

## 🆘 도움이 필요하면

1. 어느 단계에서 막혔는지 말씀해주세요
2. 현재 보이는 화면 스크린샷을 공유해주세요
3. 어떤 버튼이나 메뉴가 안 보이는지 알려주세요

---

## 📝 요약 체크리스트

설정 전 확인:
- [ ] Cloudflare 대시보드 로그인
- [ ] Google Gemini API 키 준비
- [ ] 프로젝트 이름 확인: superplace

설정 순서:
- [ ] Workers & Pages 메뉴
- [ ] superplace 프로젝트 선택
- [ ] Settings 탭
- [ ] Environment variables 섹션
- [ ] **Preview 탭 선택** ⭐
- [ ] Add variable 클릭
- [ ] GOOGLE_GEMINI_API_KEY 입력
- [ ] API 키 값 입력
- [ ] Save 클릭
- [ ] (선택) Retry deployment

확인:
- [ ] test-env API로 확인
- [ ] hasKey: true 인지 체크

---

**💡 팁**: 가장 중요한 것은 **Preview 탭**을 선택하는 것입니다! Production이 아닌 Preview에 설정해야 genspark-ai-developer 브랜치에서 작동합니다.
