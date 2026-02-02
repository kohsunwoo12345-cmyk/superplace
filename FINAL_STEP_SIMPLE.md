# 🚀 마지막 단계 - GitHub에서 workflow 파일 만들기

## 1분이면 완료됩니다! 아래 단계를 따라하세요.

---

## 📝 1단계: GitHub 웹사이트에서 파일 만들기

1. **브라우저에서 이 링크를 열어주세요:**
   ```
   https://github.com/kohsunwoo12345-cmyk/superplace
   ```

2. **"Add file" 버튼을 클릭하세요** (오른쪽 상단 초록색 "Code" 버튼 근처)

3. **"Create new file"을 선택하세요**

---

## 📂 2단계: 파일 이름 입력

파일 이름 입력란에 아래 내용을 **정확히** 복사해서 붙여넣으세요:

```
.github/workflows/deploy.yml
```

> ⚠️ 주의: 슬래시(/)를 포함해서 정확히 입력해야 합니다!

---

## 💻 3단계: 파일 내용 입력

파일 내용 입력란에 아래 코드를 **전체** 복사해서 붙여넣으세요:

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
    name: Deploy to Vercel
    steps:
      - name: Trigger Vercel Deployment
        run: |
          echo "🚀 Triggering Vercel deployment..."
          curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK_URL }}"
          echo "✅ Deployment triggered successfully!"
          
      - name: Wait for deployment
        run: |
          echo "⏳ Waiting 30 seconds for deployment to start..."
          sleep 30
          
      - name: Deployment Status
        run: |
          echo "✅ Deployment initiated!"
          echo "📊 Check status at: https://vercel.com/dashboard"
          echo "🌐 Site URL: https://superplace-study.vercel.app"
```

---

## ✅ 4단계: 파일 저장

1. **페이지 아래로 스크롤하세요**

2. **"Commit message" 란에 이렇게 입력하세요:**
   ```
   feat: Add automatic deployment workflow
   ```

3. **"Commit directly to the main branch" 라디오 버튼이 선택되어 있는지 확인하세요**

4. **초록색 "Commit new file" 버튼을 클릭하세요**

---

## 🎉 완료!

파일을 저장하면 **자동으로 배포가 시작됩니다!**

### 배포 확인하기:

1. **GitHub Actions 확인:**
   - https://github.com/kohsunwoo12345-cmyk/superplace/actions
   - 노란색 원(진행 중) → 초록색 체크(성공) 확인

2. **Vercel 대시보드 확인:**
   - https://vercel.com/dashboard
   - "Deployments" 탭에서 새로운 배포 확인

3. **사이트에서 확인 (2-3분 후):**
   - https://superplace-study.vercel.app/dashboard
   - admin@superplace.com으로 로그인
   - **"최근 가입 사용자"** 섹션 확인!

---

## ❓ 문제가 있나요?

- GitHub Actions가 실패하면: Secret이 올바르게 설정되었는지 확인
- 배포가 안 보이면: 2-3분 더 기다려주세요
- 여전히 안 보이면: 브라우저 시크릿 모드로 다시 확인

---

## 📋 요약

✅ 해야 할 일:
1. GitHub에서 `.github/workflows/deploy.yml` 파일 만들기
2. 위의 코드 복사해서 붙여넣기
3. "Commit new file" 클릭
4. 2-3분 기다리기
5. 사이트 확인!

**지금 바로 시작하세요!** 🚀
