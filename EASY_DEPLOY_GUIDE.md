# 🎯 비개발자를 위한 3단계 배포 가이드

## 📋 필요한 것
- Vercel 계정 로그인 정보
- GitHub 계정 로그인 정보
- 5분의 시간

---

## 1단계: Vercel Deploy Hook 만들기 (2분)

### 1-1. Vercel 웹사이트 열기
```
브라우저에서 이 주소를 엽니다:
https://vercel.com/dashboard
```

### 1-2. 로그인
- 로그인이 안 되어 있다면 로그인하세요

### 1-3. superplace 프로젝트 클릭
- 화면에 보이는 "superplace" 프로젝트를 클릭하세요

### 1-4. Settings 들어가기
- 왼쪽 메뉴에서 "Settings" 클릭

### 1-5. Git 탭 클릭
- 상단 메뉴에서 "Git" 클릭

### 1-6. Deploy Hooks 찾기
- 아래로 스크롤하여 "Deploy Hooks" 섹션 찾기

### 1-7. Hook 만들기
1. "Create Hook" 버튼 클릭
2. 이름 입력: `Auto Deploy`
3. Git Branch 선택: `genspark_ai_developer`
4. "Create Hook" 버튼 클릭

### 1-8. URL 복사 ⭐ **중요!**
- 생성된 긴 URL을 복사하세요
- 예시: `https://api.vercel.com/v1/integrations/deploy/prj_xxxxx/yyyyy`
- **이 URL을 메모장에 저장해두세요!**

---

## 2단계: GitHub에 URL 저장하기 (2분)

### 2-1. GitHub 저장소 열기
```
브라우저에서 이 주소를 엽니다:
https://github.com/kohsunwoo12345-cmyk/superplace
```

### 2-2. Settings 클릭
- 저장소 상단 메뉴에서 "Settings" 클릭

### 2-3. Secrets and variables 클릭
- 왼쪽 메뉴에서:
  1. "Secrets and variables" 클릭
  2. 펼쳐지는 메뉴에서 "Actions" 클릭

### 2-4. Secret 추가
1. 녹색 "New repository secret" 버튼 클릭
2. Name 입력: `VERCEL_DEPLOY_HOOK_URL`
   - **정확히 이대로 입력하세요! (대소문자 구분)**
3. Secret 입력: 1단계에서 복사한 Vercel URL 붙여넣기
4. 녹색 "Add secret" 버튼 클릭

---

## 3단계: 자동 배포 활성화 (1분)

### 저는 이미 설정 파일을 만들어놨습니다!

이제 파일만 GitHub에 올리면 됩니다.

```bash
# 제가 이미 실행할 명령어:
cd /home/user/webapp
git add .github/workflows/vercel-auto-deploy.yml
git commit -m "feat: Enable automatic Vercel deployment"
git push origin main
git push origin genspark_ai_developer
```

---

## ✅ 확인하기

### 1. GitHub Actions 확인
```
1. https://github.com/kohsunwoo12345-cmyk/superplace/actions
2. 녹색 체크 표시가 있으면 성공!
```

### 2. Vercel 배포 확인
```
1. https://vercel.com/dashboard
2. superplace 클릭
3. "Deployments" 탭 클릭
4. 맨 위에 새로운 배포가 있으면 성공!
```

### 3. 사이트 확인
```
1. 배포 완료 후 (2-3분)
2. 브라우저에서 Ctrl + Shift + Delete 눌러 캐시 삭제
3. https://superplace-study.vercel.app/dashboard 접속
4. 로그인 후 "최근 가입 사용자" 섹션 확인
```

---

## 🎉 완료 후

### 앞으로는 자동으로 배포됩니다!

이제 코드를 GitHub에 올리기만 하면:
1. GitHub Actions가 자동 실행
2. Vercel Deploy Hook 호출
3. Vercel이 자동으로 배포
4. 2-3분 후 사이트 업데이트 완료!

---

## 🆘 문제 발생 시

### Deploy Hook URL을 못 찾겠어요
→ Vercel → Settings → Git → Deploy Hooks 섹션
→ 없으면 "Create Hook" 버튼으로 새로 만들기

### Secret 추가가 안 돼요
→ 이름이 정확한지 확인: `VERCEL_DEPLOY_HOOK_URL`
→ 저장소 Settings → Secrets and variables → Actions

### 배포가 안 돼요
→ GitHub Actions 탭에서 에러 메시지 확인
→ Vercel Dashboard에서 수동으로 "Redeploy" 클릭

---

## 📞 연락처

문제가 계속되면 저에게 다음 정보를 알려주세요:
1. 어느 단계에서 막혔는지
2. 에러 메시지 (있다면)
3. 스크린샷 (가능하면)

---

**다음 단계: 1단계부터 천천히 따라하세요! 💪**
