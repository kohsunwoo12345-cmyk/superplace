# 🎯 Vercel에서 Production으로 승격하는 방법 (초보자용)

## 📱 단계별 가이드

---

## 1단계: Vercel 웹사이트 접속

1. **브라우저를 열어주세요** (Chrome, Edge, Safari 등)

2. **이 주소를 주소창에 입력하고 Enter**:
   ```
   https://vercel.com/dashboard
   ```

3. **로그인이 안 되어 있다면**:
   - 이메일/비밀번호로 로그인
   - 또는 GitHub 계정으로 로그인

---

## 2단계: superplace 프로젝트 찾기

로그인하면 **프로젝트 목록**이 보입니다.

1. **"superplace"** 또는 **"superplace-study"** 프로젝트를 찾으세요
   - 프로젝트 카드에 프로젝트 이름이 적혀 있습니다
   - URL: `superplace-study.vercel.app`가 보일 것입니다

2. **프로젝트 카드를 클릭**하세요
   - 마우스를 올리면 전체가 강조됩니다
   - 어디든 클릭하면 됩니다

---

## 3단계: Deployments 탭으로 이동

프로젝트 페이지가 열리면:

1. **상단 메뉴**를 보세요:
   ```
   [Overview] [Deployments] [Analytics] [Settings] ...
   ```

2. **"Deployments"** 탭을 클릭하세요
   - 두 번째 탭입니다

---

## 4단계: 최신 배포 찾기

Deployments 페이지에서:

1. **배포 목록**이 보입니다 (최신이 위에 있음)

2. **첫 번째 (가장 위) 배포**를 찾으세요:
   ```
   🟡 Preview   또는   🟢 Production
   ├─ deploy: Force deployment 2026-02-02-094123
   ├─ genspark_ai_developer 브랜치
   └─ 몇 분 전 / 몇 시간 전
   ```

3. **배포 상태 확인**:
   - 🟡 **Preview** = Production으로 승격 필요 ← 이거면 다음 단계로!
   - 🟢 **Production** = 이미 Production임 ← 5단계 B로!

---

## 5단계 A: Preview를 Production으로 승격 (상태가 Preview인 경우)

### 방법 1: 점 3개 메뉴 사용

1. **배포 항목 오른쪽**을 보세요:
   ```
   [...] ← 점 3개 버튼
   ```

2. **점 3개 버튼을 클릭**하세요
   - 메뉴가 펼쳐집니다

3. **"Promote to Production"** 클릭
   - 또는 "Assign Domain to Production"
   - 또는 비슷한 이름의 메뉴

4. **확인 창이 뜨면 "Promote" 또는 "Confirm" 클릭**

### 방법 2: 배포 상세 페이지에서

1. **배포 항목 자체를 클릭** (아무 곳이나)
   - 상세 페이지가 열립니다

2. **상단 오른쪽**에 버튼이 있습니다:
   ```
   [Visit] [Promote to Production]
   ```

3. **"Promote to Production" 버튼 클릭**

4. **확인 창이 뜨면 "Promote" 클릭**

---

## 5단계 B: 이미 Production인 경우 (상태가 🟢 Production)

만약 최신 배포가 **이미 Production**이라면:

### Redeploy로 캐시 강제 갱신

1. **배포 항목 오른쪽 점 3개 [...] 클릭**

2. **"Redeploy" 선택**

3. **"Use existing Build Cache" 체크 해제** (중요!)
   - 이렇게 하면 새로 빌드합니다

4. **"Redeploy" 버튼 클릭**

---

## 6단계: 배포 진행 확인

1. **배포가 시작되면**:
   ```
   🟡 Building...
   ```
   - 진행 상황이 표시됩니다

2. **완료되면**:
   ```
   🟢 Ready
   ```
   - 보통 **1-2분** 소요

3. **완료 알림**:
   - "Deployment ready" 또는 비슷한 메시지

---

## 7단계: 사이트에서 확인

배포가 완료되면 (**2-3분 후**):

1. **브라우저 새 탭**을 열어주세요

2. **시크릿/인코그니토 모드**로 여세요:
   - Windows/Linux: `Ctrl + Shift + N` (Chrome) 또는 `Ctrl + Shift + P` (Edge/Firefox)
   - Mac: `Cmd + Shift + N`

3. **사이트 주소 입력**:
   ```
   https://superplace-study.vercel.app/dashboard
   ```

4. **로그인**:
   - 이메일: `admin@superplace.com`
   - 비밀번호: (기존 비밀번호)

5. **"최근 가입 사용자" 섹션이 보이면 성공!** 🎉

---

## 🔍 각 화면 설명

### Vercel Dashboard 화면 구조:
```
┌─────────────────────────────────────────┐
│  [Vercel 로고]              [프로필]     │
├─────────────────────────────────────────┤
│                                         │
│  프로젝트 목록:                          │
│                                         │
│  ┌─────────────────────────┐           │
│  │ superplace-study        │ ← 클릭!   │
│  │ superplace-study.ver... │           │
│  │ Updated 2h ago          │           │
│  └─────────────────────────┘           │
│                                         │
└─────────────────────────────────────────┘
```

### Deployments 페이지:
```
┌─────────────────────────────────────────────────┐
│ [Overview] [Deployments] [Analytics] [Settings] │ ← Deployments 클릭
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ 🟡 Preview                          [...] │ ← 점 3개 클릭
│ │ deploy: Force deployment             ⬆️   │
│ │ genspark_ai_developer                     │
│ │ 5 minutes ago                             │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ 🟢 Production (current)             [...] │  │
│ │ chore: force deployment                   │
│ │ main                                      │
│ │ 20 hours ago                              │
│ └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 점 3개 메뉴:
```
┌──────────────────────────┐
│ Visit                    │
│ Promote to Production  ← │ 이거 클릭!
│ Redeploy                 │
│ Delete                   │
└──────────────────────────┘
```

---

## ❓ 문제 해결

### Q1: "Promote to Production" 버튼이 안 보여요
→ **이미 Production일 가능성**이 있습니다. "Redeploy"를 대신 클릭하세요.

### Q2: 여러 개의 Preview 배포가 있어요
→ **가장 위에 있는 (최신) 배포**를 승격하세요.

### Q3: 승격했는데도 안 보여요
→ 
1. **2-3분** 더 기다려주세요
2. **브라우저 캐시 지우기**: `Ctrl + Shift + R`
3. **시크릿 모드**로 다시 접속

### Q4: Vercel 로그인 정보를 모르겠어요
→ **GitHub 계정으로 로그인**을 시도해보세요 ("Continue with GitHub")

---

## 📸 스크린샷이 필요하시면

더 자세한 설명이 필요하시면 말씀해주세요!
- "1단계에서 막혔어요"
- "Deployments 탭이 안 보여요"
- "점 3개 메뉴에 Promote가 없어요"

제가 더 상세하게 도와드리겠습니다! 😊

---

## ✅ 완료 확인

다음이 보이면 성공입니다:
- ✅ Deployment 상태가 🟢 Production
- ✅ 사이트에서 "최근 가입 사용자" 섹션 표시
- ✅ 최근 7일 가입자 목록 표시

**완료하시면 "완료했습니다"라고 말씀해주세요!** 🎉
