# ✅ 마지막 단계: GitHub에서 파일 만들기 (1분)

## 🎯 왜 이 단계가 필요한가요?

GitHub 보안상 자동화 파일(.github/workflows/)은 직접 웹사이트에서 만들어야 합니다.
**매우 쉽습니다! 복사 붙여넣기만 하면 됩니다.**

---

## 📝 단계별 가이드

### 1️⃣ GitHub 저장소 열기
**이 링크를 클릭하세요:**
👉 https://github.com/kohsunwoo12345-cmyk/superplace

---

### 2️⃣ 파일 만들기 시작
1. 화면 오른쪽 위의 **"Add file"** 버튼 클릭
2. **"Create new file"** 선택

---

### 3️⃣ 파일 이름 입력
파일 이름 입력 칸에 **정확히** 이렇게 입력하세요:
```
.github/workflows/deploy.yml
```

⚠️ **주의:**
- 맨 앞에 점(.) 포함!
- 띄어쓰기 없이!
- 슬래시(/) 포함!

---

### 4️⃣ 코드 복사 붙여넣기

아래 코드를 **전체 복사**하세요:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
      - genspark_ai_developer

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Trigger Vercel Deployment
        run: |
          echo "🚀 Triggering deployment..."
          curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK_URL }}"
          echo "✅ Deployment triggered!"
```

**복사한 코드를 GitHub 편집기에 붙여넣으세요!**

---

### 5️⃣ 저장하기
1. 아래로 스크롤
2. **"Commit changes"** 버튼 클릭 (초록색)
3. 팝업이 나타나면 다시 **"Commit changes"** 클릭

---

## 🎉 완료!

### ✅ 자동으로 배포가 시작됩니다!

파일을 저장하는 순간:
1. GitHub Actions가 자동 실행됨
2. Vercel Deploy Hook 호출
3. Vercel이 배포 시작
4. 2-3분 후 완료!

---

## 🔍 확인하기

### 1. GitHub Actions 확인 (30초 후)
👉 https://github.com/kohsunwoo12345-cmyk/superplace/actions

**보일 것:**
- "Deploy to Vercel" 워크플로우 실행 중
- 노란색 원 🟡 = 실행 중
- 녹색 체크 ✅ = 성공!
- 빨간 X ❌ = 실패 (Secret 확인 필요)

---

### 2. Vercel 배포 확인 (1분 후)
👉 https://vercel.com/dashboard

1. **superplace** 프로젝트 클릭
2. **Deployments** 탭 클릭
3. 맨 위에 새로운 배포가 보여야 함
4. 상태: Building → Ready

---

### 3. 사이트 확인 (3분 후)

**중요! 캐시 삭제 필수:**
1. **Ctrl + Shift + Delete** 눌러서 캐시 삭제
   - "쿠키 및 기타 사이트 데이터" 체크
   - "캐시된 이미지 및 파일" 체크
   - "데이터 삭제" 클릭

2. **시크릿 모드로 접속** (더 확실함)
   - Ctrl + Shift + N (Chrome)
   - Ctrl + Shift + P (Firefox)

3. **사이트 열기**
   👉 https://superplace-study.vercel.app/dashboard

4. **로그인**
   - admin@superplace.com
   - 비밀번호 입력

5. **확인**
   - "최근 가입 사용자" 섹션이 보이나요?
   - ✅ 보인다 = 배포 성공!
   - ❌ 안 보인다 = 아직 배포 중이거나 캐시 문제

---

## 🆘 문제 해결

### Q: GitHub Actions에 빨간 X가 보여요
**A:** Secret이 제대로 설정되지 않았습니다.

**해결:**
1. https://github.com/kohsunwoo12345-cmyk/superplace/settings/secrets/actions
2. `VERCEL_DEPLOY_HOOK_URL` 확인
3. 없으면 다시 추가:
   - Name: `VERCEL_DEPLOY_HOOK_URL`
   - Value: Vercel Deploy Hook URL

---

### Q: Vercel에 새 배포가 안 보여요
**A:** GitHub Actions가 실패했거나 Deploy Hook URL이 틀렸습니다.

**해결:**
1. GitHub Actions 탭에서 에러 로그 확인
2. Vercel Deploy Hook을 다시 만들기
3. GitHub Secret을 다시 설정

---

### Q: 사이트에 변경사항이 안 보여요
**A:** 브라우저 캐시 문제입니다.

**해결:**
1. **강력한 캐시 삭제:**
   - Ctrl + Shift + Delete
   - 모든 항목 삭제
   
2. **시크릿 모드 사용:**
   - Ctrl + Shift + N
   - 사이트 재접속

3. **다른 브라우저 사용:**
   - Chrome 안 되면 Firefox 시도
   - 모바일에서도 확인

---

## 🎬 다음 번에는?

이제 설정이 완료되었으므로:

**코드를 수정하고 푸시만 하면:**
```bash
git add .
git commit -m "변경사항"
git push origin main
```

**자동으로:**
1. GitHub Actions 실행
2. Vercel 배포
3. 2-3분 후 사이트 업데이트!

---

## 📞 여전히 안 되나요?

**다음 정보를 알려주세요:**
1. GitHub Actions 탭의 스크린샷
2. Vercel Deployments 탭의 스크린샷
3. 에러 메시지 (있다면)

**확인해야 할 것:**
- [ ] Vercel Deploy Hook URL 복사됨
- [ ] GitHub Secret 추가됨 (VERCEL_DEPLOY_HOOK_URL)
- [ ] .github/workflows/deploy.yml 파일 생성됨
- [ ] GitHub Actions 실행 중
- [ ] Vercel 배포 시작됨

---

**지금 위의 단계를 따라하세요!**
**5분이면 완료됩니다!** 🚀
