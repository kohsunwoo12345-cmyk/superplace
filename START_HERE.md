# 🎯 딱 3가지만 하면 됩니다!

## 준비물
- ✅ Vercel 계정 (이미 있음)
- ✅ 5분의 시간
- ✅ 이 가이드

---

## 📍 1단계: Vercel에서 마법의 URL 만들기 (2분)

### 🌐 1. Vercel 웹사이트 열기
**아래 링크를 클릭하세요:**
👉 https://vercel.com/dashboard

### 🔐 2. 로그인 확인
- 로그인이 되어 있나요? ✅
- 안 되어 있다면 로그인하세요

### 📦 3. "superplace" 찾아서 클릭
- 화면에 보이는 프로젝트들 중 "superplace" 클릭

### ⚙️ 4. Settings 메뉴 클릭
- 왼쪽 메뉴에서 "Settings" 찾아서 클릭

### 🔗 5. "Git" 탭 클릭
- 화면 위쪽에 있는 "Git" 탭 클릭

### 📍 6. 아래로 스크롤
- 마우스 휠을 아래로 내려서 "Deploy Hooks" 찾기

### ✨ 7. 마법의 버튼 클릭!
1. **"Create Hook"** 버튼 클릭 (초록색 또는 파란색)
2. 이름 칸에 입력: `Auto Deploy`
3. Git Branch 선택: `genspark_ai_developer` 선택
4. **"Create Hook"** 버튼 다시 클릭

### 📋 8. 긴 URL 복사하기 ⭐⭐⭐ 매우 중요!
```
생성된 URL이 보일 겁니다:
https://api.vercel.com/v1/integrations/deploy/prj_어쩌구저쩌구/어쩌구저쩌구

이 전체를 복사하세요!
- 마우스로 드래그해서 전체 선택
- Ctrl + C (맥: Cmd + C) 눌러서 복사
- 메모장에 붙여넣어서 저장!
```

---

## 📍 2단계: GitHub에 URL 숨기기 (2분)

### 🌐 1. GitHub 저장소 열기
**아래 링크를 클릭하세요:**
👉 https://github.com/kohsunwoo12345-cmyk/superplace

### ⚙️ 2. Settings 클릭
- 저장소 상단 메뉴에서 "Settings" 클릭
- (프로필 Settings 아님! 저장소 Settings!)

### 🔐 3. "Secrets and variables" 찾기
**왼쪽 메뉴를 보세요:**
1. "Secrets and variables" 찾아서 클릭
2. 펼쳐지는 메뉴에서 "Actions" 클릭

### ➕ 4. Secret 추가하기
1. **"New repository secret"** 버튼 클릭 (초록색)

2. **Name 칸에 정확히 입력:**
   ```
   VERCEL_DEPLOY_HOOK_URL
   ```
   ⚠️ 띄어쓰기 없이, 대소문자 정확히!

3. **Secret 칸에 1단계에서 복사한 URL 붙여넣기**
   - Ctrl + V (맥: Cmd + V)

4. **"Add secret"** 버튼 클릭 (초록색)

---

## 📍 3단계: GitHub에 자동 실행 파일 만들기 (1분)

### 🌐 1. GitHub 저장소로 돌아가기
**아래 링크를 클릭하세요:**
👉 https://github.com/kohsunwoo12345-cmyk/superplace

### 📁 2. .github/workflows 폴더 만들기

#### 2-1. "Add file" 버튼 클릭
- 화면 오른쪽 위의 "Add file" 버튼 클릭

#### 2-2. "Create new file" 선택
- 드롭다운에서 "Create new file" 클릭

#### 2-3. 파일 이름 입력
```
.github/workflows/deploy.yml
```
**정확히 이렇게 입력하세요! (점 포함)**

### 📝 3. 코드 복사해서 붙여넣기

**아래 코드를 전체 복사하세요:**

```yaml
name: Auto Deploy to Vercel

on:
  push:
    branches:
      - main
      - genspark_ai_developer

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel
        run: curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK_URL }}"
```

**위 코드를 복사해서 GitHub 편집기에 붙여넣으세요!**

### ✅ 4. 저장하기
1. 아래로 스크롤
2. **"Commit changes"** 버튼 클릭 (초록색)
3. 팝업이 뜨면 다시 **"Commit changes"** 클릭

---

## 🎉 완료!

### ✅ 이제 자동으로 배포됩니다!

앞으로 코드를 GitHub에 올리면:
```
1. GitHub가 자동으로 감지
2. Vercel에게 "배포해!" 신호 전송
3. Vercel이 자동으로 배포
4. 2-3분 후 사이트 업데이트!
```

---

## 🔍 확인하기

### 1. GitHub Actions 확인
👉 https://github.com/kohsunwoo12345-cmyk/superplace/actions
- 녹색 체크 표시 ✅ = 성공!
- 빨간 X ❌ = 실패 (Secret 확인 필요)

### 2. Vercel 배포 확인
👉 https://vercel.com/dashboard
- superplace 클릭
- Deployments 탭 클릭
- 맨 위에 새로운 배포 보임 = 성공!

### 3. 사이트 확인 (중요!)
1. 배포 완료 후 (2-3분)
2. **브라우저 캐시 삭제:**
   - Ctrl + Shift + Delete 눌러서 캐시 삭제
3. 사이트 접속: https://superplace-study.vercel.app/dashboard
4. 로그인 후 "최근 가입 사용자" 섹션 확인!

---

## 🆘 문제가 생겼나요?

### Q: Deploy Hook URL을 못 찾겠어요
**A:** Vercel → Settings → Git → 아래로 스크롤 → Deploy Hooks

### Q: Secret 이름을 틀렸어요
**A:** GitHub → Settings → Secrets → Actions → 해당 Secret 삭제 후 다시 만들기

### Q: 배포가 안 돼요
**A:** 
1. GitHub Actions 확인 (에러 메시지 보기)
2. Vercel Dashboard에서 수동으로 "Redeploy" 클릭

### Q: 3단계가 어려워요
**A:** 
- 파일 이름: `.github/workflows/deploy.yml`
- 내용: 위에 있는 yaml 코드 전체 복사 붙여넣기
- Commit 버튼 클릭

---

## 📞 여전히 안 되나요?

**다음 정보를 알려주세요:**
1. 어느 단계에서 막혔는지
2. 화면에 보이는 에러 메시지
3. 스크린샷 (가능하면)

저에게 메시지를 보내주세요!

---

**시작하세요! 1단계부터 천천히 따라하시면 됩니다! 💪**

**예상 소요 시간: 5분**
